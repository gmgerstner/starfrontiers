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

    // Weapon attack (to-hit, damage, armor, ammo)
    if (item.type === 'weapon') {
      return this._rollWeaponAttack({ speaker, rollMode });
    }

    // Skill check
    if (item.type === 'skill') {
      const ability = this.actor.system[item.system.ability];
      // Use the effective ability total (base + racial modifier) as the base target.
      const abilityValue = ability?.total ?? ability?.value ?? 50;
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

  /**
   * Resolve a weapon attack: roll to-hit against the attacker's effective ability
   * plus weapon skill, roll damage, spend ammo, and apply armor-adjusted damage to
   * any targeted tokens the attacker can modify. Posts a chat card summarising it.
   */
  async _rollWeaponAttack({ speaker, rollMode }) {
    const item = this;
    const actor = this.actor;
    const sys = item.system;

    // Unowned weapon (rolled from the sidebar): just roll damage to chat.
    if (!actor) {
      const roll = new Roll(sys.damage || '1d10');
      await roll.evaluate();
      await roll.toMessage({ speaker, rollMode, flavor: `[weapon] ${item.name} damage` });
      return roll;
    }

    const isRanged = sys.weaponType === 'ranged';
    const tracksAmmo = isRanged && Number(sys.ammoMax) > 0;

    // Ammo check.
    if (tracksAmmo && Number(sys.ammo) <= 0) {
      ui.notifications?.warn(`${item.name} is out of ammo.`);
      return null;
    }

    // To-hit target: effective ability score + weapon skill bonus (10% per level).
    // Skill level comes from the character's linked skill item when set, otherwise
    // from the weapon's manual skillLevel field.
    const abilityKey = isRanged ? 'dex' : 'str';
    const ability = actor.system?.[abilityKey];
    const abilityScore = ability?.total ?? ability?.value ?? 50;
    const skillLevel = this._resolveSkillLevel();
    const toHitTarget = Math.min(100, Math.max(1, abilityScore + (skillLevel * 10)));

    const attackRoll = new Roll('1d100');
    await attackRoll.evaluate();

    const damageRoll = new Roll(sys.damage || '1d10', actor.getRollData?.() ?? {});
    await damageRoll.evaluate();

    // Spend ammo.
    let ammoText = '';
    if (tracksAmmo) {
      const remaining = Math.max(0, Number(sys.ammo) - 1);
      await item.update({ 'system.ammo': remaining });
      ammoText = `Ammo: ${remaining} / ${sys.ammoMax}`;
    }

    // Attacker token, used to measure range to each target.
    const activeTokens = actor.getActiveTokens?.() ?? [];
    const attackerToken = activeTokens.find(t => t.controlled) ?? activeTokens[0] ?? null;
    const weaponRange = Number(sys.range) || 0;

    // Resolve targeted tokens. Range modifiers are applied per-target (ranged only),
    // so a single attack roll can hit some targets and miss others by distance.
    const targets = Array.from(game.user?.targets ?? []);
    const results = [];
    for (const t of targets) {
      const tActor = t.actor;
      if (!tActor) continue;

      let rangeMod = 0;
      let rangeLabel = '';
      let outOfRange = false;
      if (isRanged && weaponRange > 0 && attackerToken) {
        const band = StarFrontiersItem._rangeBand(attackerToken, t, weaponRange);
        rangeMod = band.mod;
        outOfRange = band.outOfRange;
        const dist = Math.round(band.distance);
        rangeLabel = outOfRange
          ? `${band.label} (${dist} m)`
          : `${band.label} ${band.mod >= 0 ? '+' : ''}${band.mod} (${dist} m)`;
      }

      const effectiveTarget = Math.min(100, Math.max(1, toHitTarget + rangeMod));
      const tHit = !outOfRange && attackRoll.total <= effectiveTarget;
      const defense = tActor.totalDefense ?? 0;
      const net = Math.max(0, damageRoll.total - defense);
      let applied = null;
      if (tHit && tActor.isOwner) applied = await tActor.applyDamage(net);
      results.push({ name: t.name ?? tActor.name, tokenId: t.id, defense, net, applied, hit: tHit, outOfRange, rangeLabel, effectiveTarget });
    }

    // Fallback result when nothing is targeted (no range data available).
    const baseHit = attackRoll.total <= toHitTarget;

    const content = this._attackCardHTML({ baseHit, toHitTarget, attackRoll, damageRoll, ammoText, results });
    await ChatMessage.create({
      speaker,
      rollMode,
      content,
      rolls: [attackRoll, damageRoll],
      sound: CONFIG.sounds?.dice
    });

    return { attackRoll, damageRoll, hit: baseHit, results };
  }

  /**
   * Determine the range band (and to-hit modifier) between two tokens for a weapon
   * whose Short/normal range is `weaponRange` metres. Distance is Euclidean in scene units.
   */
  static _rangeBand(attackerToken, targetToken, weaponRange) {
    const a = attackerToken.center;
    const b = targetToken.center;
    const px = Math.hypot(b.x - a.x, b.y - a.y);
    const dim = canvas?.dimensions;
    const distance = (dim && dim.size) ? (px / dim.size) * dim.distance : px;

    const bands = CONFIG.STARFRONTIERS?.rangeBrackets ?? [];
    for (const band of bands) {
      if (distance <= weaponRange * band.maxMult) {
        return { label: band.label, mod: band.mod, distance, outOfRange: false };
      }
    }
    return { label: 'Out of range', mod: 0, distance, outOfRange: true };
  }

  /**
   * Resolve the skill level for this weapon's to-hit: prefer the character's owned
   * skill item matching the weapon's linked skill name; fall back to the weapon's
   * manual skillLevel field.
   * @returns {number}
   */
  _resolveSkillLevel() {
    const sys = this.system;
    const linked = String(sys.skill ?? '').trim();
    if (linked && this.actor) {
      const match = this.actor.items.find(
        i => i.type === 'skill' && i.name.toLowerCase() === linked.toLowerCase());
      if (match) return Number(match.system?.level) || 0;
    }
    return Number(sys.skillLevel) || 0;
  }

  /** Build the HTML chat card for a weapon attack. */
  _attackCardHTML({ baseHit, toHitTarget, attackRoll, damageRoll, ammoText, results }) {
    const item = this;
    let headerBadge = '';
    let rows = '';

    if (results.length) {
      rows = results.map(r => {
        const landed = r.hit && !r.outOfRange;
        const badge = `<span class="sf-badge ${landed ? 'sf-hit' : 'sf-miss'}">${landed ? 'HIT' : 'MISS'}</span>`;
        let status;
        if (r.outOfRange) status = '<span class="sf-miss-tag">out of range</span>';
        else if (!r.hit) status = '<span class="sf-miss-tag">missed</span>';
        else if (r.applied !== null) status = `<span class="sf-applied">-${r.applied} STA</span>`;
        else status = `<button type="button" class="sf-apply-damage" data-token-id="${r.tokenId}" data-net="${r.net}">Apply ${r.net}</button>`;
        const rangeInfo = r.rangeLabel ? `<span class="sf-range">${r.rangeLabel}</span>` : '';
        return `<div class="sf-target-row"><span class="sf-target-name">${r.name}</span>${rangeInfo}<span class="sf-target-def">DEF ${r.defense}</span><span class="sf-target-net">${r.net} dmg</span>${badge}${status}</div>`;
      }).join('');
    } else {
      headerBadge = `<span class="sf-badge ${baseHit ? 'sf-hit' : 'sf-miss'}">${baseHit ? 'HIT' : 'MISS'}</span>`;
      if (baseHit) {
        rows = `<div class="sf-target-row"><button type="button" class="sf-apply-damage" data-damage="${damageRoll.total}">Apply ${damageRoll.total} to selected token(s)</button></div>`;
      }
    }

    return `
    <div class="sf-attack-card">
      <div class="sf-attack-header">
        <img src="${item.img}" width="28" height="28"/>
        <span class="sf-weapon-name">${item.name}</span>
        ${headerBadge}
      </div>
      <div class="sf-attack-line">To-hit: <b>${attackRoll.total}</b> vs ${toHitTarget}${results.length ? ' <span class="sf-formula">(before range)</span>' : ''}</div>
      <div class="sf-attack-line">Damage: <b>${damageRoll.total}</b> <span class="sf-formula">(${damageRoll.formula})</span></div>
      ${ammoText ? `<div class="sf-attack-line sf-ammo">${ammoText}</div>` : ''}
      ${rows ? `<div class="sf-targets">${rows}</div>` : ''}
    </div>`;
  }
}