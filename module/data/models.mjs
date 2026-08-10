/**
 * System Data Models for the Star Frontiers system.
 *
 * These replace the deprecated template.json. Each class mirrors the exact fields
 * the system previously declared so existing Actors/Items load unchanged. Derived
 * values (ability totals, IM, etc.) are still computed in the document/sheet layer.
 */

const fields = foundry.data.fields;

/** A percentile ability score (value + stored modifier). */
function abilityField(initial = 45) {
  return new fields.SchemaField({
    value: new fields.NumberField({ required: true, integer: true, min: 1, max: 100, initial }),
    modifier: new fields.NumberField({ required: true, integer: true, initial: 0 })
  });
}

/** Fields shared by both actor types (stamina, biography, abilities, RS). */
function baseActorSchema() {
  return {
    stamina: new fields.SchemaField({
      value: new fields.NumberField({ required: true, integer: true, min: 0, max: 100, initial: 45 }),
      max: new fields.NumberField({ required: true, integer: true, min: 0, max: 100, initial: 45 }),
      current: new fields.NumberField({ required: true, integer: true, min: 0, max: 100, initial: 45 })
    }),
    biography: new fields.HTMLField({ required: true, blank: true, initial: "" }),
    str: abilityField(),
    dex: abilityField(),
    int: abilityField(),
    per: abilityField(),
    ldr: abilityField(),
    log: abilityField(),
    // Reaction Speed. Null means "follow DEX" until explicitly set (matches prior behaviour).
    rs: new fields.NumberField({ required: false, nullable: true, integer: true, min: 1, max: 100, initial: null })
  };
}

/** Fields shared by all item types. */
function baseItemSchema() {
  return {
    description: new fields.HTMLField({ required: true, blank: true, initial: "" }),
    quantity: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
    weight: new fields.NumberField({ required: true, min: 0, initial: 0 }),
    cost: new fields.NumberField({ required: true, min: 0, initial: 0 })
  };
}

export class CharacterData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseActorSchema(),
      race: new fields.StringField({ required: true, blank: true, initial: "" }),
      experience: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      credits: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
    };
  }
}

export class NpcData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseActorSchema(),
      type: new fields.StringField({ required: true, blank: true, initial: "" }),
      cr: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
    };
  }
}

export class WeaponData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemSchema(),
      damage: new fields.StringField({ required: true, blank: true, initial: "1d10" }),
      range: new fields.NumberField({ required: true, min: 0, initial: 50 }),
      ammo: new fields.NumberField({ required: true, integer: true, min: 0, initial: 20 }),
      ammoMax: new fields.NumberField({ required: true, integer: true, min: 0, initial: 20 }),
      weaponType: new fields.StringField({ required: true, blank: false, initial: "ranged" }),
      skill: new fields.StringField({ required: true, blank: true, initial: "" }),
      skillLevel: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 })
    };
  }
}

export class ArmorData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      ...baseItemSchema(),
      defense: new fields.NumberField({ required: true, integer: true, min: 0, initial: 0 }),
      type: new fields.StringField({ required: true, blank: false, initial: "light" }),
      equipped: new fields.BooleanField({ required: true, initial: false })
    };
  }
}

export class EquipmentData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return { ...baseItemSchema() };
  }
}

export class SkillData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    return {
      level: new fields.NumberField({ required: true, integer: true, min: 0, initial: 1 }),
      ability: new fields.StringField({ required: true, blank: false, initial: "dex" }),
      psa: new fields.StringField({ required: true, blank: true, initial: "" }),
      description: new fields.HTMLField({ required: true, blank: true, initial: "" })
    };
  }
}

export class RaceData extends foundry.abstract.TypeDataModel {
  static defineSchema() {
    const mod = () => new fields.NumberField({ required: true, integer: true, initial: 0 });
    return {
      description: new fields.HTMLField({ required: true, blank: true, initial: "" }),
      specialAbilities: new fields.HTMLField({ required: true, blank: true, initial: "" }),
      movement: new fields.StringField({ required: true, blank: true, initial: "10/30 m per turn" }),
      abilityMods: new fields.SchemaField({
        str: mod(), dex: mod(), int: mod(), per: mod(), ldr: mod(), log: mod()
      })
    };
  }
}

export const dataModels = {
  Actor: { character: CharacterData, npc: NpcData },
  Item: { weapon: WeaponData, armor: ArmorData, equipment: EquipmentData, skill: SkillData, race: RaceData }
};
