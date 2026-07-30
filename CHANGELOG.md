# Changelog

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
