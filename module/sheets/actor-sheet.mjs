export class StarFrontiersActorSheet extends ActorSheet {

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["starfrontiers", "sheet", "actor"],
      width: 720,
      height: 680,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "abilities" }]
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
    }

    context.rollData = context.actor.getRollData();

    return context;
  }

  _prepareCharacterData(context) {
    // Ensure numeric ability/stamina values are integers and default blank abilities to 45
    const sys = context.system || {};

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

          // Ensure modifier is an integer (no commas)
          const rawMod = val.modifier;
          const parsedMod = parseInt(String(rawMod).replace(/,/g, ''), 10);
          val.modifier = Number.isNaN(parsedMod) ? 0 : parsedMod;
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
        const dex = (sys.dex && typeof sys.dex.value !== 'undefined') ? Number(sys.dex.value) : 0;
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
    }

    context.weapons = weapons;
    context.armor = armor;
    context.equipment = equipment;
    context.skills = skills;
  }

  activateListeners(html) {
    super.activateListeners(html);

    if (!this.isEditable) return;

    html.find('.item-edit').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.sheet.render(true);
    });

    html.find('.item-delete').click(ev => {
      const li = $(ev.currentTarget).parents(".item");
      const item = this.actor.items.get(li.data("itemId"));
      item.delete();
      li.slideUp(200, () => this.render(false));
    });

    html.find('.ability-roll').click(this._onAbilityRoll.bind(this));
    html.find('.item-roll').click(this._onItemRoll.bind(this));

    // Live-update IM display when RS changes
    const updateIM = (input) => {
      const $input = $(input);
      const val = parseInt(String($input.val()).replace(/,/g, ''), 10);
      const rs = Number.isNaN(val) ? 0 : val;
      const im = Math.floor(rs / 10);
      // find the nearest .im-display in the same sheet section
      const imDisplay = $input.closest('.abilities-list').find('.im-display');
      imDisplay.val(im);
    };

    // Initialize displays
    html.find('.rs-input').each((i, el) => updateIM(el));

    // Update as user types
    html.find('.rs-input').on('input', (ev) => updateIM(ev.currentTarget));
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