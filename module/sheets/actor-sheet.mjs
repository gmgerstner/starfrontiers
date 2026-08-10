export class StarFrontiersActorSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["starfrontiers", "sheet", "actor"],
      width: 720,
      height: 680,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "skills" }]
    });
  }

  get template() {
    return `systems/starfrontiers/templates/actor/actor-${this.actor.type}-sheet.hbs`;
  }

  getData() {
    const context = super.getData();
    const actorData = this.actor.toObject(false);
    context.system = actorData.system;
    context.flags = actorData.flags;

    if (actorData.type == 'character') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    if (actorData.type == 'npc') {
      this._prepareItems(context);
      this._prepareCharacterData(context);
    }

    context.rollData = context.actor.getRollData();

    return context;
  }

  _prepareCharacterData(context) {
    // Ensure numeric ability/stamina values are integers and default blank abilities to 45
    const sys = context.system || {};

    // Racial ability-score modifiers from the equipped race (set by _prepareItems).
    const abilityMods = (context.race && context.race.system && context.race.system.abilityMods) || {};

    for (const [key, val] of Object.entries(sys)) {
      if (val && typeof val === 'object') {
        // Abilities are objects with a value and modifier
        if (Object.prototype.hasOwnProperty.call(val, 'modifier') && Object.prototype.hasOwnProperty.call(val, 'value')) {
          // Normalize value: remove any commas, coerce to integer; default to 45 if blank/invalid
          const raw = val.value;
          if (raw === null || raw === undefined || raw === '') {
            val.value = 45;
          } else {
            const parsed = parseInt(String(raw).replace(/,/g, ''), 10);
            val.value = Number.isNaN(parsed) ? 45 : parsed;
          }

          // Apply the racial modifier to get the effective total, then derive the
          // ability modifier from that total: (total - 50) / 10, rounded down.
          const racial = Number(abilityMods[key]) || 0;
          val.racial = racial;
          val.total = Math.min(100, Math.max(1, val.value + racial));
          val.modifier = Math.floor((val.total - 50) / 10);
        }

        // Stamina has value/max fields — normalize them as integers too
        if (key === 'stamina') {
          // Ensure value (max STA) is an integer and default to 45
          // Ensure value (max STA) is an integer and default to 45
          if (val.value === null || val.value === undefined || val.value === '') {
            val.value = 45;
          } else {
            const p = parseInt(String(val.value).replace(/,/g, ''), 10);
            val.value = Number.isNaN(p) ? 45 : Math.min(100, Math.max(1, p));
          }

          // Ensure current STA exists (track damage) and is an integer; default to value
          if (val.current === null || val.current === undefined || val.current === '') {
            val.current = val.value;
          } else {
            const pc = parseInt(String(val.current).replace(/,/g, ''), 10);
            val.current = Number.isNaN(pc) ? val.value : Math.min(100, Math.max(1, pc));
          }

          // Keep max for backward compatibility but map it to value if absent
          if (val.max === null || val.max === undefined || val.max === '') {
            val.max = val.value;
          } else {
            const p2 = parseInt(String(val.max).replace(/,/g, ''), 10);
            val.max = Number.isNaN(p2) ? val.value : Math.min(100, Math.max(1, p2));
          }
        }
      }
    }
    
      // Compute derived stats for display only
      // RS is editable: use existing system.rs when present (sanitized), otherwise default to DEX
      try {
        // Default RS from the effective DEX total so a racial DEX modifier flows into RS/IM.
        const dex = (sys.dex && typeof sys.dex.total !== 'undefined') ? Number(sys.dex.total)
          : (sys.dex && typeof sys.dex.value !== 'undefined') ? Number(sys.dex.value) : 0;
        let rsVal = 0;
        if (typeof sys.rs !== 'undefined' && sys.rs !== null && sys.rs !== '') {
          const parsed = parseInt(String(sys.rs).replace(/,/g, ''), 10);
          rsVal = Number.isNaN(parsed) ? dex : parsed;
        } else {
          rsVal = Number.isNaN(Number(dex)) ? 0 : Number(dex);
        }

        sys.rs = rsVal;
        sys.im = Math.floor(sys.rs / 10);
      }
      catch (err) {
        sys.rs = 0;
        sys.im = 0;
      }
  }

    /**
     * Intercept sheet form submissions to normalize numeric fields before updating the actor.
     */
    async _updateObject(event, formData) {
      // formData is nested (system.{...}) — sanitize numeric fields
      if (formData && formData.system) {
        const sys = formData.system;

        // Normalize stamina
        if (sys.stamina) {
          // Normalize value (max STA)
          if (sys.stamina.value === '' || sys.stamina.value === null || typeof sys.stamina.value === 'undefined') {
            sys.stamina.value = 45;
          } else {
            const p = parseInt(String(sys.stamina.value).replace(/,/g, ''), 10);
            sys.stamina.value = Number.isNaN(p) ? 45 : Math.min(100, Math.max(1, p));
          }

          // Normalize current stamina (track damage); default to value
          if (typeof sys.stamina.current === 'undefined' || sys.stamina.current === '' || sys.stamina.current === null) {
            sys.stamina.current = sys.stamina.value;
          } else {
            const pc = parseInt(String(sys.stamina.current).replace(/,/g, ''), 10);
            sys.stamina.current = Number.isNaN(pc) ? sys.stamina.value : Math.min(100, Math.max(1, pc));
          }

          // Keep max for backward compatibility
          if (sys.stamina.max === '' || sys.stamina.max === null || typeof sys.stamina.max === 'undefined') {
            sys.stamina.max = sys.stamina.value;
          } else {
            const p2 = parseInt(String(sys.stamina.max).replace(/,/g, ''), 10);
            sys.stamina.max = Number.isNaN(p2) ? sys.stamina.value : Math.min(100, Math.max(1, p2));
          }
        }

        // Normalize ability values and modifiers
        const abilityKeys = ["str","dex","int","per","ldr","log"];
        for (const k of abilityKeys) {
          if (sys[k]) {
            if (sys[k].value === '' || sys[k].value === null || typeof sys[k].value === 'undefined') {
              sys[k].value = 45;
            } else {
              const p = parseInt(String(sys[k].value).replace(/,/g, ''), 10);
              sys[k].value = Number.isNaN(p) ? 45 : Math.min(100, Math.max(1, p));
            }

            if (typeof sys[k].modifier !== 'undefined') {
              const pm = parseInt(String(sys[k].modifier).replace(/,/g, ''), 10);
              sys[k].modifier = Number.isNaN(pm) ? 0 : pm;
            }
          }
        }

        // Normalize rs if present (editable RS)
        if (typeof sys.rs !== 'undefined') {
          if (sys.rs === '' || sys.rs === null) {
            // fallback to dex
            const dexVal = sys.dex && sys.dex.value ? parseInt(String(sys.dex.value).replace(/,/g, ''), 10) : 0;
            const dv = Number.isNaN(dexVal) ? 0 : dexVal;
            sys.rs = Math.min(100, Math.max(1, dv));
          } else {
            const prs = parseInt(String(sys.rs).replace(/,/g, ''), 10);
            sys.rs = Number.isNaN(prs) ? 0 : Math.min(100, Math.max(1, prs));
          }
        }
      }

      // Call the base update to persist the sanitized data
      return this.actor.update(formData);
    }

  _prepareItems(context) {
    const weapons = [];
    const armor = [];
    const equipment = [];
    const skills = [];
    let race = null;

    for (let i of context.items) {
      i.img = i.img || Item.DEFAULT_ICON;
      if (i.type === 'weapon') {
        weapons.push(i);
      }
      else if (i.type === 'armor') {
        armor.push(i);
      }
      else if (i.type === 'equipment') {
        equipment.push(i);
      }
      else if (i.type === 'skill') {
        skills.push(i);
      }
      else if (i.type === 'race') {
        // A character has a single race; keep the first if duplicates exist.
        if (!race) race = i;
      }
    }

    context.weapons = weapons;
    context.armor = armor;
    context.equipment = equipment;
    context.skills = skills;
    context.race = race;

    // Group skills by Primary Skill Area for display.
    const psaKeys = ['military', 'technological', 'biosocial'];
    const buckets = { military: [], technological: [], biosocial: [], other: [] };
    for (const s of skills) {
      const key = psaKeys.includes(s.system?.psa) ? s.system.psa : 'other';
      buckets[key].push(s);
    }
    context.skillGroups = [
      { key: 'military', label: 'Military', skills: buckets.military },
      { key: 'technological', label: 'Technological', skills: buckets.technological },
      { key: 'biosocial', label: 'Biosocial', skills: buckets.biosocial }
    ];
    if (buckets.other.length) {
      context.skillGroups.push({ key: '', label: 'Other', skills: buckets.other });
    }

    // Total defense from equipped armor (for the vitals display).
    context.totalDefense = armor.reduce(
      (sum, i) => sum + (i.system && i.system.equipped ? (Number(i.system.defense) || 0) : 0), 0);
  }

  /**
   * Enforce a single Race item per actor (dnd5e-style): dropping a new race
   * replaces any existing one, and the actor's system.race text is kept in sync.
   */
  async _onDropItemCreate(itemData, event) {
    const incoming = Array.isArray(itemData) ? itemData : [itemData];
    const droppedRace = [...incoming].reverse().find(d => d.type === 'race');

    if (droppedRace) {
      const existing = this.actor.items.filter(i => i.type === 'race').map(i => i.id);
      if (existing.length) await this.actor.deleteEmbeddedDocuments('Item', existing);
      await this.actor.update({ 'system.race': droppedRace.name });
    }

    return super._onDropItemCreate(itemData, event);
  }

  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) return;

    html.find('.item-create').click(this._onItemCreate.bind(this));

    html.find('.armor-equip-toggle').click(async ev => {
      ev.preventDefault();
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      if (!item) return;
      await item.update({ 'system.equipped': !item.system.equipped });
    });

    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    html.find('.item-delete').click(async ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      if (!item) return;
      // Removing the race also clears the synced race name.
      if (item.type === 'race') await this.actor.update({ 'system.race': '' });
      await item.delete();
      li.slideUp(200, () => this.render(false));
    });

    html.find('.ability-roll').click(this._onAbilityRoll.bind(this));
    html.find('.item-roll').click(this._onItemRoll.bind(this));
  html.find('.roll-initial-stats').click(this._onRollInitialStats.bind(this));
  html.find('.toggle-stats-lock').click(this._onToggleStatsLock.bind(this));

    // Live-update IM display when RS changes
    const updateIM = (input) => {
      const $input = $(input);
      const val = parseInt(String($input.val()).replace(/,/g, ''), 10);
      const rs = Number.isNaN(val) ? 0 : val;
      const im = Math.floor(rs / 10);
      // find the nearest .im-display in the same sheet section
      const imDisplay = $input.closest('.ability-block').find('.im-display');
      imDisplay.val(im);
      // keep the inline "IM" label next to the RS input in sync too
      $input.closest('.score').find('.score-mod').text('IM ' + im);
    };

    // Initialize displays
    html.find('.rs-input').each((i, el) => updateIM(el));

    // Update as user types
    html.find('.rs-input').on('input', (ev) => updateIM(ev.currentTarget));

    // Apply a locked class for styling when locked
    if (this.actor && this.actor.getFlag) {
      const locked = this.actor.getFlag('starfrontiers', 'statsLocked');
      if (locked) html.addClass('locked'); else html.removeClass('locked');
    }
  }

  /**
   * Roll initial stats for the actor using the provided table mapping d100 ranges to base scores.
   */
  async _onRollInitialStats(event) {
    event.preventDefault();
    if (!this.actor) return;
    // Prevent rolling if stats are locked
    if (this.actor.getFlag && this.actor.getFlag('starfrontiers', 'statsLocked')) {
      return ui.notifications?.warn('Stats are locked. Unlock to roll.');
    }

    // mapping table as array of {max: n, score, desc}
    const table = [
      { max: 10, score: 30, desc: 'Feeble' },
      { max: 20, score: 35, desc: 'Poor' },
      { max: 35, score: 40, desc: 'Below Average' },
      { max: 55, score: 45, desc: 'Average' },
      { max: 70, score: 50, desc: 'Above Average' },
      { max: 80, score: 55, desc: 'Good' },
      { max: 90, score: 60, desc: 'Excellent' },
      { max: 95, score: 65, desc: 'Remarkable' },
      { max: 100, score: 70, desc: 'Incredible' }
    ];

    const pairs = [
      { primary: 'str', secondary: 'stamina', label: 'STR/STA' },
      { primary: 'dex', secondary: 'rs', label: 'DEX/RS' },
      { primary: 'int', secondary: 'log', label: 'INT/LOG' },
      { primary: 'per', secondary: 'ldr', label: 'PER/LDR' }
    ];
    const updates = {};
    const rolls = [];

    for (const p of pairs) {
      const r = new Roll('1d100');
      await r.evaluate({async: true});
      const value = r.total === 0 ? 100 : r.total; // treat 0 as 100
      const entry = table.find(t => value <= t.max);
      const score = entry ? entry.score : 45;

      // Primary ability
      updates[`system.${p.primary}.value`] = score;
      updates[`system.${p.primary}.modifier`] = 0;

      // Secondary target: stamina (special), rs (single field), or an ability
      if (p.secondary === 'stamina') {
        updates['system.stamina.value'] = score;
        updates['system.stamina.current'] = score;
      }
      else if (p.secondary === 'rs') {
        updates['system.rs'] = score;
      }
      else {
        updates[`system.${p.secondary}.value`] = score;
        updates[`system.${p.secondary}.modifier`] = 0;
      }

      rolls.push({ability: p.label, roll: value, score, desc: entry ? entry.desc : ''});
    }

    await this.actor.update(updates);

    // Build chat message
    const lines = rolls.map(r => `${r.ability}: d100=${r.roll} → ${r.score} (${r.desc})`).join('\n');
    const content = `<h3>Initial Stats for ${this.actor.name}</h3><pre>${lines}</pre>`;
    ChatMessage.create({content, speaker: ChatMessage.getSpeaker({actor: this.actor})});
  }

  async _onToggleStatsLock(event) {
    event.preventDefault();
    if (!this.actor) return;
    // Only allow toggling if the current user is an owner of the actor or is a GM
    const isOwner = this.actor.isOwner;
    const isGM = game.user?.isGM;
    if (!isOwner && !isGM) {
      return ui.notifications?.warn('Only the actor owner or a GM may lock or unlock stats.');
    }

    const locked = !!this.actor.getFlag('starfrontiers', 'statsLocked');
    await this.actor.setFlag('starfrontiers', 'statsLocked', !locked);
    this.render(false);
  }

  /**
   * Create a new embedded Item of the given type on this actor.
   */
  async _onItemCreate(event) {
    event.preventDefault();
    const dataset = event.currentTarget.dataset;
    const type = dataset.type;
    if (!type) return;
    const label = type.charAt(0).toUpperCase() + type.slice(1);
    const system = {};
    // Seed the PSA when creating a skill from a specific Primary Skill Area group.
    if (type === 'skill' && dataset.psa) system.psa = dataset.psa;
    const itemData = { name: `New ${label}`, type, system };
    return this.actor.createEmbeddedDocuments('Item', [itemData]);
  }

  async _onAbilityRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const dataset = element.dataset;
    
    if (dataset.ability) {
      await this.actor.rollAbilityCheck(dataset.ability);
    }
  }

  async _onItemRoll(event) {
    event.preventDefault();
    const element = event.currentTarget;
    const itemId = element.closest('.item').dataset.itemId;
    const item = this.actor.items.get(itemId);
    
    if (item) {
      await item.roll();
    }
  }
}