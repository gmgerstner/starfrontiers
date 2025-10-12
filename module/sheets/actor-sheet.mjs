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
    // Add character-specific data here
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