# Changelog

## 2.3.7

- Fixed settings menu crash on Foundry V14: the config template used Handlebars helpers `subtract`, `multiply`, and `add` that are not registered by Foundry. Page slot ranges are now precomputed in the application context and passed to the template as `slotRange`.

## 2.3.6

- Compliance and hardening release: sole Lisa's Dungeon authorship and contact fields (Discord MystryssLysa, email Lisasdungeon@gmail.com, Patreon LisasDungeon); lazy loading / trigger-based startup where needed; 500 LOC file cap; full source line coverage; no emoji or AI references in the shipped package.
- Compliance pass: sole author Lisa's Dungeon with Discord MystryssLysa / email Lisasdungeon@gmail.com / Patreon LisasDungeon; enforce 500 LOC file cap; remove non-compliant branding and symbols where present.
- Lazy-load the config Application: settings menu, keybinding, macro-directory button, and scene control open it via dynamic import only when triggered.
- Full line coverage on all source files under `scripts/` (config, presets, styles, utils, hooks, settings, module).

## 2.3.5

- Migrated the configuration hub (`HideHotbarConfig`) from the deprecated V1 `FormApplication` framework to `ApplicationV2` + `HandlebarsApplicationMixin`, and its preset/delete dialogs from `Dialog` to `DialogV2`. V1 support is being removed in Foundry v16; this clears the deprecation warning shown on every open of the hub.
- Split preset save/load/delete and config export/import out of `config.js` into a new `presets.js`, keeping both files under this repo's 500-line-per-file limit after the migration.
- Added a real render-path test (`tests/config.test.mjs`) covering the per-player override fix and the GM `applyToGM` + hide-option save path against the actual class, instead of only ad-hoc scripts.

## 2.3.4

- Fixed a critical bug where enabling the module broke the entire Foundry UI (hotbar, sidebar, players list, scene navigation, scene controls, placeables directory all failed to render) immediately on load. The module registered its own global Handlebars `localize` helper under the same name Foundry core already uses everywhere, silently replacing it; the replacement then called `foundry.utils.formatString`, which doesn't exist, so every core template using `{{localize}}` threw and failed to render. Removed the duplicate helper entirely — Foundry's own `localize` helper already does everything this module's templates need.
- Fixed the same underlying bug in the module's own `localize()` utility (used to build labels in the GM configuration hub itself), which also called the nonexistent `foundry.utils.formatString` and would have crashed the hub's own render once the Handlebars collision above was fixed. Now uses `game.i18n.format`.

## 2.3.3

- Added a GM-only scene controls (left toolbar) button that opens the configuration hub, so it no longer has to be reached through the Macro Directory footer button or the Ctrl+Alt+H keybinding alone.
- Fixed "Hide Scene Controls", "Hide Chat", "Hide Players List", and "Hide Scene Navigation" applying to the GM's own view immediately, even with "Apply to GM" left unchecked. These now respect "Apply to GM" the same way every other visibility toggle already did, so enabling one of these for players no longer also blinds the GM.

## 2.3.2

- Renamed the repository's default branch from `master` to `main`.
- Switched the manifest to a version-pinned download URL and a raw-file manifest URL, matching the convention used across the rest of the module collection.

## 2.3.1

- Fixed imported configuration files (Export/Import, and preset data) being trusted without validation: hidden-slot, hidden-page, sidebar-tab, opacity, and animation-duration values from an imported file are interpolated directly into a world-wide dynamically generated stylesheet, so a crafted or shared config file could have injected arbitrary CSS into every connected client. Imports are now validated the same way the form's own save path already validates its input.
- Fixed the manifest's README/LICENSE links pointing at a `main` branch that doesn't exist on this repository (it uses `master`).
- Fixed the Hotbar Pages panel's "Slots X-Y" hint text being off by one (e.g. showing "10-20" for a page that actually covers slots 11-20).
- Removed an author `patreon` field from the manifest that isn't part of Foundry's recognized author schema.
- Added twelve missing sidebar-tab translation strings; the sidebar-tab checkboxes were rendering raw translation keys instead of labels.
- Removed a duplicated inline sidebar-tab-id list (now a single shared constant) and roughly 30 unused, leftover translation keys from an earlier, more elaborate settings-panel design that was never built.
- Fixed the release build script shipping its own dev-only tooling (`build-release.mjs`, `validate.mjs`) inside the release zip.
- Added a real behavioral test suite (25 tests) alongside the existing validation script.

## 2.3.0

- Updated documentation and metadata to point to the Lisa's Dungeon GitHub, Patreon, and Discord.
- Made the release build script cross-platform (Linux `zip` + Windows PowerShell).
- Removed stale media references to missing asset files.

## 2.2.9

- Verified compatibility against Foundry Virtual Tabletop v14 while maintaining support for v13+.
- Updated manifest and documentation to reflect verified v14 compatibility.

## 2.2.8

- rebuilt missing settings template and stylesheet files
- added working validation and release build scripts
- aligned manifest metadata with `protected: false`
- updated compatibility to Foundry Virtual Tabletop 13
- cleaned runtime configuration wiring for presets and per-player rules
- refreshed documentation and release packaging flow
