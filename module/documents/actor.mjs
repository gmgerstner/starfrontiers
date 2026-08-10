export class StarFrontiersActor extends Actor {
  
  prepareData() {
    super.prepareData();
  }

  prepareBaseData() {
    // Data modifications in this step occur before processing derived data
  }

  /** Ability score objects tracked on the actor. */
  static ABILITY_KEYS = ['str', 'dex', 'int', 'per', 'ldr', 'log'];

  /** Clamp a Star Frontiers percentile score into the legal 1-100 range. */
  static clampScore(n) {
    const v = Math.round(Number(n));
    if (Number.isNaN(v)) return 1;
    return Math.min(100, Math.max(1, v));
  }

  prepareDerivedData() {
    const actorData = this;

    // Apply racial ability-score modifiers, then compute effective totals and
    // all derived stats from those totals. This runs for characters and NPCs.
    this._applyAbilities(actorData);
    this._prepareNpcData(actorData);
  }

  /**
   * Compute each ability's effective total (base score + racial modifier) and
   * derive every stat that depends on it (STA max, RS default, IM). The effective
   * `total` is what all rolls, tokens, and derived numbers use; `value` remains the
   * player-set base score.
   */
  _applyAbilities(actorData) {
    const sys = actorData.system;
    if (!sys) return;

    // Racial modifiers come from the actor's equipped race item (if any).
    const race = actorData.items?.find(i => i.type === 'race') ?? null;
    const mods = (race && race.system && race.system.abilityMods) || {};

    for (const key of StarFrontiersActor.ABILITY_KEYS) {
      const ability = sys[key];
      if (!ability) continue;

      let base = parseInt(String(ability.value ?? '').replace(/,/g, ''), 10);
      if (Number.isNaN(base)) base = 45;
      base = StarFrontiersActor.clampScore(base);
      ability.value = base;

      const racial = Number(mods[key]) || 0;
      ability.racial = racial;
      ability.total = StarFrontiersActor.clampScore(base + racial);
      ability.modifier = Math.floor((ability.total - 50) / 10);
    }

    // Max Stamina is derived from the effective STR/DEX totals, but a custom
    // stored Max STA (stamina.value) is preserved once set.
    if (sys.str && sys.dex && sys.stamina) {
      sys.stamina.max = Math.floor((sys.str.total + sys.dex.total) / 2);
      if (sys.stamina.value === undefined || sys.stamina.value === null || sys.stamina.value === '') {
        sys.stamina.value = sys.stamina.max;
      }
      if (typeof sys.stamina.current !== 'undefined' && sys.stamina.current !== null
          && sys.stamina.current > sys.stamina.value) {
        sys.stamina.current = sys.stamina.value;
      }
    }

    // Reaction Speed defaults to the effective DEX total; IM derives from RS.
    let rs = parseInt(String(sys.rs ?? '').replace(/,/g, ''), 10);
    if (Number.isNaN(rs)) rs = sys.dex ? sys.dex.total : 0;
    sys.rs = StarFrontiersActor.clampScore(rs);
    sys.im = Math.floor(sys.rs / 10);
  }

  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // NPC specific calculations
  }

  async rollAbilityCheck(abilityId) {
    const ability = this.system[abilityId];
    // Roll under the effective score (base + racial modifier).
    const target = ability?.total ?? ability?.value ?? 50;
    const roll = new Roll("1d100");
    await roll.evaluate();

    const success = roll.total <= target;

    roll.toMessage({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      flavor: `${game.i18n.localize(`STARFRONTIERS.Ability${abilityId.toUpperCase()}`)} Check`,
      content: `Result: ${roll.total} vs ${target} - ${success ? 'Success!' : 'Failure'}`
    });

    return roll;
  }
}