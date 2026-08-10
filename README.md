# Star Frontiers Game System for Foundry VTT

A complete game system implementation for playing Star Frontiers in Foundry Virtual Tabletop.

## Features

- **Character & NPC Sheets**: Redesigned sheets styled after the classic Alpha Dawn character record — paired ability score cards (STR/STA, DEX/RS, INT/LOG, PER/LDR), always-visible vitals bar (Current/Max STA, Initiative Modifier, Defense), and tabbed Skills / Gear / Biography sections.
- **Ability Scores**: The six tracked abilities (STR, DEX, INT, PER, LDR, LOG) plus paired STA and RS. Effective scores drive every roll; RS derives IM, and STR/DEX drive Max STA.
- **Races (drag & drop)**: Race is a first-class item type, à la dnd5e. Drag a race onto a character to fill its race slot (one race per character, auto-replacing). Ships with a **Races compendium** preloaded with the four core races (Human, Dralasite, Vrusk, Yazirian) including lore and special abilities.
- **Racial Ability Modifiers**: Each race can modify ability scores. The modifier changes the **effective** score, so it feeds ability checks, skill checks, RS/IM, and Max STA. Modified abilities show a badge and effective total on the sheet.
- **Combat**: Weapon attacks resolve to-hit (`d100 ≤ effective ability + weapon skill×10`; ranged uses DEX, melee uses STR), roll damage, spend ammo, subtract the target's equipped-armor defense, and apply the result to the target's Current STA. A chat card summarises the attack with Apply-damage buttons.
- **Range Modifiers**: Ranged attacks measure the distance to each target and apply a to-hit modifier by range band (Point Blank / Short / Medium / Long / Extreme, out-of-range beyond that). Bands are multiples of the weapon's Range and are configurable in `CONFIG.STARFRONTIERS.rangeBrackets`.
- **Initiative**: The combat tracker rolls `1d10 + IM` (Initiative Modifier = RS ÷ 10) for each combatant.
- **Armor & Defense**: Armor can be equipped/unequipped; equipped armor sums into a Defense value that reduces incoming damage.
- **Item Types**: Weapons, armor, equipment, skills, and races.
- **Dice Rolling**: Ability checks (roll-under), skill checks, and full weapon attacks.
- **Stamina Tracking**: Max STA derived from effective STR/DEX; Current STA tracks damage and is used as the token bar.

## Installation

### Method 1: Manifest URL
1. Open Foundry VTT
2. Go to "Game Systems" tab
3. Click "Install System"
4. Paste the manifest URL: `https://github.com/gmgerstner/starfrontiers/releases/latest/download/system.json`
5. Click "Install"

### Method 2: Manual Installation
1. Download the latest release
2. Extract to `FoundryVTT/Data/systems/starfrontiers`
3. Restart Foundry VTT
4. Create a new world using the "Star Frontiers" system

## File Structure

```
starfrontiers/
├── module/
│   ├── documents/
│   │   ├── actor.mjs          # Actor document: effective scores, racial mods, totalDefense, applyDamage
│   │   └── item.mjs           # Item document: weapon attacks, skill checks, attack chat card
│   ├── sheets/
│   │   ├── actor-sheet.mjs    # Actor sheet: race drop, item create, equip toggle, stat rolling
│   │   └── item-sheet.mjs     # Item sheet class
│   └── starfrontiers.mjs      # Init, Handlebars helpers, apply-damage chat hook
├── templates/
│   ├── actor/
│   │   ├── actor-character-sheet.hbs
│   │   └── actor-npc-sheet.hbs
│   └── item/
│       ├── item-weapon-sheet.hbs
│       ├── item-armor-sheet.hbs
│       ├── item-equipment-sheet.hbs
│       ├── item-skill-sheet.hbs
│       └── item-race-sheet.hbs
├── packs/
│   ├── _source/races/         # Editable JSON source for the Races compendium
│   └── races/                 # Compiled LevelDB pack (built via npm run build:packs)
├── scripts/
│   └── build-packs.mjs        # Compiles packs/_source/* into LevelDB packs
├── styles/
│   └── starfrontiers.css      # System styling + attack chat card
├── lang/
│   └── en.json                # English localization
├── package.json               # Build tooling (Foundry CLI) and scripts
├── system.json                # System manifest (registers the races compendium)
├── template.json              # Data model templates
└── README.md
```

## Usage

### Creating Characters
1. Create a new Actor and select "Character" type.
2. Set ability scores manually, or click **Roll Initial Stats** to roll them (then **Lock Stats** to prevent accidental edits).
3. Drag a **race** from the Races compendium onto the sheet to apply its special abilities and ability modifiers.
4. Add skills, weapons, armor, and equipment with the **+** buttons on the Skills / Gear tabs.
5. Max STA is calculated automatically from effective STR/DEX; track damage in **Current STA**.

### Combat
- Click the **⌖ attack** icon on a weapon to roll an attack.
- Target one or more tokens first (Foundry's targeting tool) to auto-resolve damage against them.
- To-hit = `d100 ≤ effective ability + (weapon skill level × 10)` (ranged → DEX, melee → STR).
- **Range**: for ranged attacks, the distance from the attacker's token to each target applies a band modifier (Point Blank +10 / Short 0 / Medium −10 / Long −20 / Extreme −40, then out of range). Bands are multiples of the weapon's **Range**; place both tokens on the scene for this to apply.
- Damage is reduced by the target's equipped-armor **Defense**, then applied to their **Current STA**.
- Ranged weapons consume ammo (set **Ammo Max** to 0 for weapons that don't track ammo).
- The chat card shows per-target HIT/MISS (they can differ by range), and **Apply** buttons for manual application.

### Initiative
- Add combatants to the Combat Tracker and roll initiative; the formula is `1d10 + IM` (IM = RS ÷ 10, so a faster Reaction Speed goes earlier).

### Races & Racial Modifiers
- Open **Compendium Packs → Races** and drag a race onto a character.
- Edit a race's **Ability Score Modifiers** on its item sheet (Attributes tab); positive or negative values.
- The character's affected ability cards show the racial delta and effective total.

### Dice Rolling
- Ability checks: roll 1d100 under the effective ability score.
- Skill checks: roll 1d100 under `effective ability + (skill level × 10)`.

## Development

### Editing the Races compendium
The compendium is a compiled LevelDB pack. To change it:
1. Edit the JSON under `packs/_source/races/`.
2. Close Foundry (it locks the pack while running).
3. Run `npm install` once, then `npm run build:packs`.

### General
1. Edit source files in their respective directories.
2. Reload Foundry (or relaunch after code/manifest changes) to see changes.
3. Use browser dev tools for debugging.

## Customization

The system uses a dark sci-fi theme with cyan accents. To customize:
- Edit `styles/starfrontiers.css` for visual changes.
- Modify templates in the `templates/` folder.
- Adjust data models in `template.json`.

## Notes on Rules Accuracy

Some mechanics are pragmatic simplifications of the tabletop rules:
- **Racial ability modifiers** are a Zebulon's-Guide-style option (Alpha Dawn has no flat racial stat modifiers). The shipped values are editable starter values, not the verified ZG table.
- **To-hit** uses an `ability + skill×10` roll-under model rather than the Alpha Dawn per-weapon range tables.
- **Range bands** are derived as multiples of a single Range value with a starter modifier table, rather than each weapon's individual range chart. Adjust in `CONFIG.STARFRONTIERS.rangeBrackets`.
- **Initiative** is per-combatant `1d10 + IM` rather than the side-based initiative of Alpha Dawn.
- **Armor** applies a single Defense value rather than separate defenses vs beam/projectile/gyrojet.

## License

This system is provided as-is for use with Foundry VTT. Star Frontiers is a trademark of Wizards of the Coast.

## Credits

Created for the Star Frontiers community. Based on the classic TSR game system.

## Support

For issues or feature requests, please visit the GitHub repository.
