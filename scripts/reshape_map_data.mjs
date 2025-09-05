#!/usr/bin/env node
/**
 * Reshape Tiled JSON tilelayer data arrays into 2D matrices [height][width].
 * - Preserves tile order (row-major).
 * - Only transforms layers with type === "tilelayer" and Array data.
 * - Writes a backup alongside the original before saving changes.
 */

import fs from 'node:fs';
import path from 'node:path';

function detectIndent(sampleText, defaultSpaces = 2) {
  // Simple heuristic: find the first indented line and count leading spaces
  const lines = sampleText.split(/\r?\n/);
  for (const line of lines) {
    const m = line.match(/^(\s+)\S/);
    if (m) {
      const ws = m[1];
      if (ws.includes('\t')) return '\t';
      return ' '.repeat(Math.min(ws.length, 8));
    }
  }
  return ' '.repeat(defaultSpaces);
}

function chunkArray(array, chunkSize) {
  const result = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    result.push(array.slice(i, i + chunkSize));
  }
  return result;
}

function reshapeMap(filePath) {
  const absPath = path.resolve(filePath);
  const originalText = fs.readFileSync(absPath, 'utf8');

  // Keep indentation style similar to original (spaces vs tabs, width)
  const indentStr = detectIndent(originalText, 2);
  const spaceIndent = indentStr === '\t' ? '\t' : ' '.repeat(indentStr.length || 2);

  const json = JSON.parse(originalText);

  const layers = Array.isArray(json.layers) ? json.layers : [];

  let topWidth = Number(json.width);
  let topHeight = Number(json.height);

  let transformedCount = 0;
  for (const layer of layers) {
    if (layer && layer.type === 'tilelayer' && Array.isArray(layer.data)) {
      const width = Number(layer.width || topWidth);
      const height = Number(layer.height || topHeight);

      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
        throw new Error(`Invalid dimensions for layer ${layer.name || layer.id}: width=${layer.width}, height=${layer.height}`);
      }

      const data = layer.data;
      if (data.length !== width * height) {
        throw new Error(
          `Data length mismatch in layer ${layer.name || layer.id}: data.length=${data.length}, expected=${width * height} (width=${width}, height=${height})`
        );
      }

      // Convert to 2D [height][width]
      const matrix = chunkArray(data, width);
      if (matrix.length !== height) {
        throw new Error(
          `Row count mismatch when chunking for layer ${layer.name || layer.id}: rows=${matrix.length}, expected=${height}`
        );
      }
      layer.data = matrix;
      transformedCount += 1;
    }
  }

  // Backup
  const backupPath = absPath.replace(/\.json$/i, `.backup.${Date.now()}.json`);
  fs.writeFileSync(backupPath, originalText, 'utf8');

  // Serialize with space indentation to avoid converting to tabs unexpectedly
  const output = JSON.stringify(json, null, spaceIndent.length);
  fs.writeFileSync(absPath, output + (output.endsWith('\n') ? '' : '\n'), 'utf8');

  return { transformedCount, backupPath };
}

function main() {
  const target = process.argv[2] || 'public/topdown/game/map.json';
  const { transformedCount, backupPath } = reshapeMap(target);
  // eslint-disable-next-line no-console
  console.log(`Transformed ${transformedCount} tile layers. Backup saved at: ${backupPath}`);
}

main();

