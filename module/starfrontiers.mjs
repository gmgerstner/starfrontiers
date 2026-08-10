import { StarFrontiersActor } from "./documents/actor.mjs";
import { StarFrontiersItem } from "./documents/item.mjs";
import { StarFrontiersActorSheet } from "./sheets/actor-sheet.mjs";
import { StarFrontiersItemSheet } from "./sheets/item-sheet.mjs";
import { dataModels } from "./data/models.mjs";

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

  // Initiative: 1d10 + Initiative Modifier (RS / 10). @im resolves from actor roll data.
  CONFIG.Combat.initiative = {
    formula: "1d10 + @im",
    decimals: 0
  };

  // Ranged to-hit modifiers by range band. Each band's upper bound is a multiple of
  // the weapon's `range` (treated as its Short/normal range in metres). Editable here.
  CONFIG.STARFRONTIERS = {
    rangeBrackets: [
      { key: "pointBlank", label: "Point Blank", maxMult: 0.25, mod: 10 },
      { key: "short",      label: "Short",       maxMult: 1,    mod: 0 },
      { key: "medium",     label: "Medium",      maxMult: 2,    mod: -10 },
      { key: "long",       label: "Long",        maxMult: 3,    mod: -20 },
      { key: "extreme",    label: "Extreme",     maxMult: 4,    mod: -40 }
    ]
  };

  CONFIG.Actor.documentClass = StarFrontiersActor;
  CONFIG.Item.documentClass = StarFrontiersItem;

  // System Data Models (replaces the deprecated template.json).
  CONFIG.Actor.dataModels = dataModels.Actor;
  CONFIG.Item.dataModels = dataModels.Item;

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

// Wire up "Apply damage" buttons on weapon-attack chat cards.
Hooks.on('renderChatMessage', (message, html) => {
  const root = html instanceof HTMLElement ? html : html[0];
  if (!root) return;

  root.querySelectorAll('.sf-apply-damage').forEach((btn) => {
    btn.addEventListener('click', async (ev) => {
      ev.preventDefault();
      const { tokenId, net, damage } = ev.currentTarget.dataset;

      // Explicit target token: apply the pre-computed (armor-adjusted) net damage.
      if (tokenId) {
        const token = canvas.tokens?.get(tokenId);
        const actor = token?.actor;
        if (!actor) return ui.notifications?.warn('Target token not found on the current scene.');
        if (!actor.isOwner) return ui.notifications?.warn('You do not have permission to modify that token.');
        const applied = await actor.applyDamage(Number(net) || 0);
        return ui.notifications?.info(`Applied ${applied} damage to ${actor.name}.`);
      }

      // No target: apply raw damage (minus each token's own defense) to selected tokens.
      const controlled = canvas.tokens?.controlled ?? [];
      if (!controlled.length) return ui.notifications?.warn('Select one or more tokens to apply damage to.');
      const raw = Number(damage) || 0;
      let any = false;
      for (const tk of controlled) {
        const a = tk.actor;
        if (!a?.isOwner) continue;
        const dmg = Math.max(0, raw - (a.totalDefense ?? 0));
        await a.applyDamage(dmg);
        any = true;
      }
      ui.notifications?.[any ? 'info' : 'warn'](any
        ? 'Damage applied to selected token(s).'
        : 'You do not have permission to modify the selected token(s).');
    });
  });
});