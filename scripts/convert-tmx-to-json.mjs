#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { XMLParser } from 'fast-xml-parser';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const input = process.argv[2] || 'src/app/topdown/game/map.tmx';
const output = process.argv[3] || 'public/topdown/game/map.json';

const ensureDir = (p) => {
    const dir = path.dirname(p);
    fs.mkdirSync(dir, { recursive: true });
};

const parseCsv = (csv, width, height) => {
    const nums = csv.trim().split(/\s*,\s*|\s*\n\s*/).filter(Boolean).map((n) => Number.parseInt(n, 10) || 0);
    // Tiled JSON expects array length width*height
    return nums.length === width * height ? nums : nums.slice(0, width * height);
};

try {
    const absInput = path.resolve(__dirname, '..', input.startsWith('/') ? path.relative('/', input) : input);
    const absOutput = path.resolve(__dirname, '..', output.startsWith('/') ? path.relative('/', output) : output);

    const xml = fs.readFileSync(absInput, 'utf8');
    const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '', allowBooleanAttributes: true, isArray: (name, jpath, isLeafNode, isAttribute) => {
        return ['map.layer', 'map.objectgroup', 'map.tileset', 'layer.data'].includes(jpath);
    }});
    const doc = parser.parse(xml);
    const map = doc.map;
    const width = Number.parseInt(map.width, 10);
    const height = Number.parseInt(map.height, 10);
    const tilewidth = Number.parseInt(map.tilewidth, 10);
    const tileheight = Number.parseInt(map.tileheight, 10);

    const layers = [];
    const layerArray = Array.isArray(map.layer) ? map.layer : (map.layer ? [map.layer] : []);
    for (const layer of layerArray) {
        const dataNode = layer.data;
        let dataCsv = '';
        if (Array.isArray(dataNode)) {
            // fast-xml-parser array quirk: take first
            dataCsv = dataNode[0]['#text'] || '';
        } else if (dataNode) {
            dataCsv = dataNode['#text'] || '';
        }
        layers.push({
            data: parseCsv(dataCsv, width, height),
            height,
            id: Number.parseInt(layer.id, 10) || undefined,
            name: layer.name,
            opacity: layer.opacity !== undefined ? Number(layer.opacity) : 1,
            type: 'tilelayer',
            visible: layer.visible === undefined ? true : layer.visible !== '0',
            width,
            x: Number.parseInt(layer.x || '0', 10),
            y: Number.parseInt(layer.y || '0', 10),
        });
    }

    const objectgroups = Array.isArray(map.objectgroup) ? map.objectgroup : (map.objectgroup ? [map.objectgroup] : []);
    for (const og of objectgroups) {
        const objects = [];
        const arr = Array.isArray(og.object) ? og.object : (og.object ? [og.object] : []);
        for (const obj of arr) {
            const propsArray = obj.properties && (Array.isArray(obj.properties.property) ? obj.properties.property : (obj.properties.property ? [obj.properties.property] : []));
            const properties = propsArray ? propsArray.map((p) => ({ name: p.name, type: p.type || 'string', value: p.value ?? p.default })) : undefined;
            objects.push({
                gid: obj.gid ? Number.parseInt(obj.gid, 10) : undefined,
                height: Number.parseFloat(obj.height || '0'),
                id: Number.parseInt(obj.id, 10) || undefined,
                name: obj.name || '',
                properties,
                rotation: Number.parseFloat(obj.rotation || '0'),
                type: obj.type || '',
                visible: obj.visible === undefined ? true : obj.visible !== '0',
                width: Number.parseFloat(obj.width || '0'),
                x: Number.parseFloat(obj.x || '0'),
                y: Number.parseFloat(obj.y || '0'),
            });
        }
        layers.push({
            draworder: og.draworder || 'topdown',
            id: Number.parseInt(og.id, 10) || undefined,
            name: og.name,
            objects,
            opacity: og.opacity !== undefined ? Number(og.opacity) : 1,
            type: 'objectgroup',
            visible: og.visible === undefined ? true : og.visible !== '0',
            x: Number.parseInt(og.x || '0', 10),
            y: Number.parseInt(og.y || '0', 10),
        });
    }

    const tilesets = [];
    const tsArray = Array.isArray(map.tileset) ? map.tileset : (map.tileset ? [map.tileset] : []);
    for (const ts of tsArray) {
        if (ts.source) {
            // parse external TSX to pick up image and name
            let tsxPath = path.resolve(path.dirname(absInput), ts.source);
            if (!fs.existsSync(tsxPath)) {
                // fallback to public/topdown/game for moved tilesets
                const alt = path.resolve(__dirname, '..', 'public', 'topdown', 'game', ts.source);
                if (fs.existsSync(alt)) tsxPath = alt;
            }
            const tsxXml = fs.readFileSync(tsxPath, 'utf8');
            const tsxDoc = parser.parse(tsxXml);
            const t = tsxDoc.tileset;
            tilesets.push({
                columns: Number.parseInt(t.columns, 10),
                firstgid: Number.parseInt(ts.firstgid, 10),
                image: t.image?.source || '',
                imageheight: Number.parseInt(t.image?.height || '0', 10),
                imagewidth: Number.parseInt(t.image?.width || '0', 10),
                margin: Number.parseInt(t.margin || '0', 10),
                name: t.name,
                spacing: Number.parseInt(t.spacing || '0', 10),
                tilecount: Number.parseInt(t.tilecount, 10),
                tileheight: Number.parseInt(t.tileheight, 10),
                tilewidth: Number.parseInt(t.tilewidth, 10),
            });
        }
    }

    const json = {
        compressionlevel: -1,
        height,
        infinite: false,
        layers,
        orientation: 'orthogonal',
        renderorder: 'right-down',
        tiledversion: map.tiledversion || map.version || '1.x',
        tileheight,
        tilesets,
        tilewidth,
        width,
        nextobjectid: Number.parseInt(map.nextobjectid || '1', 10),
    };

    ensureDir(absOutput);
    fs.writeFileSync(absOutput, JSON.stringify(json, null, 2), 'utf8');
    console.log(`Converted TMX -> JSON:\n  input:  ${absInput}\n  output: ${absOutput}`);
} catch (e) {
    console.error('Failed to convert TMX to JSON:', e?.message || e);
    process.exit(1);
}

