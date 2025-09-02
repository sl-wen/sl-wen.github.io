const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Input/Output paths
const CAT_DIR = path.resolve(process.cwd(), 'public/assets/farm-assets/cat');
const OUT_DIR = path.resolve(process.cwd(), 'public/game/assets/sprites/atlas');
const OUT_PNG = path.join(OUT_DIR, 'hero.png');
const OUT_JSON = path.join(OUT_DIR, 'hero.json');

// Frame size (pixels)
const FRAME_SIZE = 32;

// Mapping from output hero frame names -> source cat image filenames
// Walking uses 2 frames per direction; Attack frames are aliased to idle to satisfy animation lookups
const frameMap = [
	// Idle (1 frame each)
	{ name: 'hero_idle_down_01', src: 'cat_idle_down.png' },
	{ name: 'hero_idle_up_01', src: 'cat_idle_up.png' },
	{ name: 'hero_idle_left_01', src: 'cat_idle_left.png' },
	{ name: 'hero_idle_right_01', src: 'cat_idle_right.png' },

	// Walking (2 frames each)
	{ name: 'hero_walking_down_01', src: 'cat_walk_down_1.png' },
	{ name: 'hero_walking_down_02', src: 'cat_walk_down_2.png' },
	{ name: 'hero_walking_up_01', src: 'cat_walk_up_1.png' },
	{ name: 'hero_walking_up_02', src: 'cat_walk_up_2.png' },
	{ name: 'hero_walking_left_01', src: 'cat_walk_left_1.png' },
	{ name: 'hero_walking_left_02', src: 'cat_walk_left_2.png' },
	{ name: 'hero_walking_right_01', src: 'cat_walk_right_1.png' },
	{ name: 'hero_walking_right_02', src: 'cat_walk_right_2.png' },

	// Attack frames (fallback to idle so animations don't break)
	{ name: 'hero_attack_down_01', src: 'cat_idle_down.png' },
	{ name: 'hero_attack_down_02', src: 'cat_idle_down.png' },
	{ name: 'hero_attack_down_03', src: 'cat_idle_down.png' },
	{ name: 'hero_attack_down_04', src: 'cat_idle_down.png' },
	{ name: 'hero_attack_up_01', src: 'cat_idle_up.png' },
	{ name: 'hero_attack_up_02', src: 'cat_idle_up.png' },
	{ name: 'hero_attack_up_03', src: 'cat_idle_up.png' },
	{ name: 'hero_attack_up_04', src: 'cat_idle_up.png' },
	{ name: 'hero_attack_left_01', src: 'cat_idle_left.png' },
	{ name: 'hero_attack_left_02', src: 'cat_idle_left.png' },
	{ name: 'hero_attack_left_03', src: 'cat_idle_left.png' },
	{ name: 'hero_attack_left_04', src: 'cat_idle_left.png' },
	{ name: 'hero_attack_right_01', src: 'cat_idle_right.png' },
	{ name: 'hero_attack_right_02', src: 'cat_idle_right.png' },
	{ name: 'hero_attack_right_03', src: 'cat_idle_right.png' },
	{ name: 'hero_attack_right_04', src: 'cat_idle_right.png' },
];

async function ensureOutDir() {
	await fs.promises.mkdir(OUT_DIR, { recursive: true });
}

async function loadFrameBuffers() {
	// Validate source files and return buffers with fallback placeholder if missing
	const buffers = [];
	for (const { name, src } of frameMap) {
		const srcPath = path.join(CAT_DIR, src);
		let inputBuffer;
		try {
			inputBuffer = await fs.promises.readFile(srcPath);
		} catch (e) {
			// Create a placeholder tile (magenta) if missing
			inputBuffer = await sharp({
				create: {
					width: FRAME_SIZE,
					height: FRAME_SIZE,
					channels: 4,
					background: { r: 255, g: 0, b: 255, alpha: 1 },
				},
			})
				.png()
				.toBuffer();
			console.warn(`Missing source for ${name} -> ${src}. Using placeholder.`);
		}

		// Normalize to FRAME_SIZE x FRAME_SIZE with transparent padding if needed
		const norm = await sharp(inputBuffer)
			.resize(FRAME_SIZE, FRAME_SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
			.png()
			.toBuffer();
		buffers.push({ name, buffer: norm });
	}
	return buffers;
}

function buildAtlasJson(totalFrames) {
	// TexturePacker-like JSON used by existing atlases
	const json = {
		textures: [
			{
				image: 'hero.png',
				format: 'RGBA8888',
				size: { w: FRAME_SIZE, h: FRAME_SIZE * totalFrames },
				scale: 1,
				frames: [],
			},
		],
	};
	return json;
}

async function buildAtlas() {
	await ensureOutDir();
	const frames = await loadFrameBuffers();

	// Create a tall spritesheet: 1 column x N rows
	const sheet = sharp({
		create: {
			width: FRAME_SIZE,
			height: FRAME_SIZE * frames.length,
			channels: 4,
			background: { r: 0, g: 0, b: 0, alpha: 0 },
		},
	});

	const composites = frames.map((f, index) => ({
		input: f.buffer,
		top: FRAME_SIZE * index,
		left: 0,
	}));

	const composed = await sheet.composite(composites).png().toBuffer();
	await fs.promises.writeFile(OUT_PNG, composed);

	// Build JSON frames
	const atlas = buildAtlasJson(frames.length);
	frames.forEach((f, index) => {
		atlas.textures[0].frames.push({
			filename: f.name,
			rotated: false,
			trimmed: false,
			sourceSize: { w: FRAME_SIZE, h: FRAME_SIZE },
			spriteSourceSize: { x: 0, y: 0, w: FRAME_SIZE, h: FRAME_SIZE },
			frame: { x: 0, y: FRAME_SIZE * index, w: FRAME_SIZE, h: FRAME_SIZE },
		});
	});

	await fs.promises.writeFile(OUT_JSON, JSON.stringify(atlas, null, 4));

	console.log(`Generated atlas:\n - ${OUT_PNG}\n - ${OUT_JSON}`);
}

buildAtlas()
	.catch((err) => {
		console.error('Failed to build cat hero atlas:', err);
		process.exit(1);
	});