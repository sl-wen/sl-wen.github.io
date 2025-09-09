## Topdown Farm Game — Development Todo & Status

Last updated: <!-- AUTO-UPDATE-DATE -->

### Legend
- [ ] Planned
- [~] In progress
- [x] Done

---

### 0. Project Setup
- [x] Phaser 3 + GridEngine + Arcade configured (App, plugins, physics)
- [x] Scene skeletons: `BootScene`, `MainMenuScene`, `GameScene`, `GameOverScene`
- [x] Tiled integration: tilesets, layers, collisions, object layers
- [x] React UI bridge: event bus (dialogs, HUD, inventory, save)

### 1. Core Gameplay Loop
- [x] Grid-based movement with animations (4-dir mapped from 8-dir)
- [x] Camera follow + bounds + pixel rounding
- [x] Interaction targeting (NPC, objects, farm tiles)
- [x] Action system: plant, water, harvest, pickup
- [x] Items: coins, sword demo, overlap pickup

### 2. Farming System
- [x] `FarmManager` model (crops, inventory, seeds/water/fruits)
- [x] `Crop` growth stages (1–5), watering timer, harvest yield
- [x] Save/restore farm state; sync to UI via `inventory-update`
- [x] Register farmable tiles from Tiled `Farmable` layer
- [x] Seed selection flow (`open-seed-select` → `seed-selected`/cancel)
- [~] Soil states (moisture/fertility values, visuals)

### 3. Time & Weather
- [~] Day-night cycle with adjustable time speeds
- [ ] Weather system (rain/sun/windy) affecting moisture/mood
- [ ] HUD indicators for time, weather, season hooks

### 4. UI/UX (PC & Mobile)
- [x] Responsive HUD bar (avatar, settings)
- [x] Cat coins HUD (top-right)
- [x] Dialogs and menu overlay (start/exit)
- [x] Virtual joystick + action button (mobile only when started)
- [ ] Quickbar + radial menus for tools/seeds

### 5. Systems & Content
- [ ] Crafting (two-step recipes, workstations)
- [ ] Building placement (grid snap, rotate, align, theme sets)
- [ ] Decoration themes with set bonuses, beauty scoring
- [ ] Livestock (mood impacts yields)
- [ ] Helpers (NPC/pets) job system via GridEngine
- [ ] Order board + selling/economy loop
- [ ] Automation: sprinklers, spreaders, movers, warehouse
- [ ] Assistant routing for collection/delivery

### 6. Events & Meta
- [ ] Daily/weekly task board with rewards
- [ ] Seasonal events framework + mini-game hooks
- [ ] Photo mode + seasonal album

### 7. Tech & Ops
- [x] Save/load + autosave + cloud-ready abstraction (Supabase profile)
- [ ] Optimization: atlases, pooling, culling, LOD
- [ ] Accessibility: colorblind palettes, haptics toggle
- [ ] Audio layering: music/SFX/ambience mix
- [ ] Playtest pipeline + privacy/telemetry toggles
- [ ] Balance: growth times, rewards, pacing
- [ ] Beta builds (PC & mobile)

---

### Milestones
- M1: Core movement + farming loop + UI bridge — [x]
- M2: Time/weather + soil states + quickbar/radial — [~]
- M3: Crafting/placement/decor — [ ]
- M4: Livestock/helpers/automation — [ ]
- M5: Events/album/task board — [ ]
- M6: Optimization/accessibility/audio — [ ]
- M7: Balance/playtest/beta builds — [ ]

---

### Notes / Decisions
- Collisions: prefer Phaser tile collisions; GridEngine handles movement.
- Farmable tiles sourced from Tiled `Farmable` layer (tile presence ⇒ plantable).
- Autosave throttled at React layer; scene emits `autosave-request`.

---

### Next Up (Active Sprint)
1) Day-night cycle with speed controls
2) Weather impacts on soil moisture
3) Soil visuals (moisture/fertility) and simple numbers

