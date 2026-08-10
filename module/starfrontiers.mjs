import { StarFrontiersActor } from "./documents/actor.mjs";
import { StarFrontiersItem } from "./documents/item.mjs";
import { StarFrontiersActorSheet } from "./sheets/actor-sheet.mjs";
import { StarFrontiersItemSheet } from "./sheets/item-sheet.mjs";

Hooks.once('init', async function() {
  console.log('Star Frontiers | Initializing Star Frontiers Game System');

  game.starfrontiers = {
    StarFrontiersActor,
    StarFrontiersItem
  };

  // Handlebars helpers used by the sheets
  Handlebars.registerHelper('sfSigned', function (n) {
    const v = Number(n);
    if (Number.isNaN(v)) return '+0';
    return (v >= 0 ? '+' : '') + v;
  });

  Handlebars.registerHelper('eq', function (a, b) {
    return a === b;
  });

  CONFIG.Actor.documentClass = StarFrontiersActor;
  CONFIG.Item.documentClass = StarFrontiersItem;

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("starfrontiers", StarFrontiersActorSheet, { 
    makeDefault: true,
    label: "STARFRONTIERS.SheetClassActor"
  });

  Items.unregisterSheet("core", ItemSheet);
  Items.registerSheet("starfrontiers", StarFrontiersItemSheet, { 
    makeDefault: true,
    label: "STARFRONTIERS.SheetClassItem"
  });

  await loadTemplates([
    "systems/starfrontiers/templates/actor/parts/actor-abilities.hbs",
    "systems/starfrontiers/templates/actor/parts/actor-items.hbs"
  ]);
});

Hooks.once('ready', async function() {
  console.log('Star Frontiers | System Ready');
});