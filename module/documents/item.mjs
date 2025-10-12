export class StarFrontiersItem extends Item {
  
  prepareData() {
    super.prepareData();
  }

  prepareBaseData() {
    // Data modifications in this step occur before processing derived data
  }

  prepareDerivedData() {
    const itemData = this;
    const systemData = itemData.system;
    const flags = itemData.flags.starfrontiers || {};
  }

  async roll() {
    const item = this;

    // Basic template context
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    // Weapon roll
    if (item.type === 'weapon') {
      const rollFormula = item.system.damage || '1d10';
      const roll = new Roll(rollFormula, this.actor.getRollData());
      await roll.evaluate();

      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });

      return roll;
    }

    // Skill check
    if (item.type === 'skill') {
      const abilityValue = this.actor.system[item.system.ability]?.value || 50;
      const skillBonus = item.system.level * 10;
      const targetNumber = abilityValue + skillBonus;

      const roll = new Roll("1d100");
      await roll.evaluate();

      const success = roll.total <= targetNumber;

      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: `${label} Check`,
        content: `Result: ${roll.total} vs ${targetNumber} - ${success ? 'Success!' : 'Failure'}`
      });

      return roll;
    }
  }
}