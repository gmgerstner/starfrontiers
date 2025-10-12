# Star Frontiers Game System for Foundry VTT

A complete game system implementation for playing Star Frontiers in Foundry Virtual Tabletop.

## Features

- **Character & NPC Sheets**: Fully functional character and NPC actor sheets with Star Frontiers ability scores (STR, DEX, INT, PER, LDR, LOG)
- **Item Types**: Weapons, armor, equipment, and skills
- **Dice Rolling**: Integrated ability checks and weapon damage rolls
- **Skill System**: Skills with level progression and ability modifiers
- **Stamina Tracking**: Automatic stamina calculation based on STR/DEX

## Installation

### Method 1: Manifest URL (Recommended when published)
1. Open Foundry VTT
2. Go to "Game Systems" tab
3. Click "Install System"
4. Paste the manifest URL: `https://github.com/yourusername/starfrontiers-foundry/releases/latest/download/system.json`
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
│   │   ├── actor.mjs          # Actor document class
│   │   └── item.mjs           # Item document class
│   ├── sheets/
│   │   ├── actor-sheet.mjs    # Actor sheet class
│   │   └── item-sheet.mjs     # Item sheet class
│   └── starfrontiers.mjs      # Main system initialization
├── templates/
│   ├── actor/
│   │   ├── actor-character-sheet.hbs
│   │   ├── actor-npc-sheet.hbs
│   │   └── parts/
│   └── item/
│       ├── item-weapon-sheet.hbs
│       ├── item-armor-sheet.hbs
│       ├── item-equipment-sheet.hbs
│       └── item-skill-sheet.hbs
├── styles/
│   └── starfrontiers.css      # System styling
├── lang/
│   └── en.json                # English localization
├── system.json                # System manifest
├── template.json              # Data model templates
└── README.md
```

## Usage

### Creating Characters
1. Create a new Actor and select "Character" type
2. Set ability scores (STR, DEX, INT, PER, LDR, LOG)
3. Add items (weapons, armor, equipment, skills) from the Items tab
4. Stamina is automatically calculated from STR and DEX

### Rolling Dice
- Click ability names to roll ability checks (d100 vs ability score)
- Click weapon/skill icons to roll damage or skill checks
- Results show success/failure based on Star Frontiers rules

### Skills
- Skills add +10 per level to the related ability score
- Roll 1d100 attempting to get under (Ability + Skill Bonus)

## Customization

The system uses a dark sci-fi theme with cyan accents. To customize:
- Edit `styles/starfrontiers.css` for visual changes
- Modify templates in `templates/` folder
- Adjust data models in `template.json`

## Development

To modify this system:
1. Edit source files in their respective directories
2. Reload Foundry to see changes
3. Use browser dev tools for debugging

## License

This system is provided as-is for use with Foundry VTT. Star Frontiers is a trademark of Wizards of the Coast.

## Credits

Created for the Star Frontiers community. Based on the classic TSR game system.

## Support

For issues or feature requests, please visit the GitHub repository.