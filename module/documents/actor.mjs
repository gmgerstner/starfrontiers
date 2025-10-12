export class StarFrontiersActor extends Actor {
  
  prepareData() {
    super.prepareData();
  }

  prepareBaseData() {
    // Data modifications in this step occur before processing derived data
  }

  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.starfrontiers || {};

    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') return;

    const systemData = actorData.system;

    // Calculate ability modifiers
    for (let [key, ability] of Object.entries(systemData)) {
      if (ability.value !== undefined && ['str', 'dex', 'int', 'per', 'ldr', 'log'].includes(key)) {
        ability.modifier = Math.floor((ability.value - 50) / 10);
      }
    }

    // Calculate stamina based on STR/DEX average
    if (systemData.str && systemData.dex) {
      systemData.stamina.max = Math.floor((systemData.str.value + systemData.dex.value) / 2);
      if (systemData.stamina.value > systemData.stamina.max) {
        systemData.stamina.value = systemData.stamina.max;
      }
    }
  }

  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;
    
    // NPC specific calculations
  }

  async rollAbilityCheck(abilityId) {
    const ability = this.system[abilityId];
    const roll = new Roll("1d100");
    await roll.evaluate();
    
    const success = roll.total <= ability.value;
    
    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${game.i18n.localize(`STARFRONTIERS.Ability${abilityId.toUpperCase()}`)} Check`,
      content: `Result: ${roll.total} vs ${ability.value} - ${success ? 'Success!' : 'Failure'}`
    });
    
    return roll;
  }
}