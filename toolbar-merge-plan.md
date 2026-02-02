**Toolbar vs Main: Current Status**

- `toolbar` is rebased onto `main` (rebased tip: `fcea7a4`).
- The WASM/worker/types layers expose `setSchema`, `setOption`, and `setPreference`.
- Preferences use the levers `CustomSettings` API to write to `<schema>.custom.yaml` (or `default.custom.yaml`) and trigger deploy.
- `switches_list` remains disabled behind `RIME_HAS_SWITCHES_LIST` because the current librime C API doesn’t expose it.
- The example app now renders `Toolbar` and `Preferences`, and README includes usage notes.

**Remaining Plan**

1. Confirm preference mappings are correct for your schemas.
Files: `wasm/api.cpp`, `src/components/Preferences.tsx`.
Work: verify `menu/page_size` and `translator/enable_*` keys are the right targets; adjust if you want per‑schema vs global behavior.

2. Stabilize option state defaults.
Files: `src/hooks/useRimeOption.ts`, `src/components/Toolbar.tsx`.
Work: decide whether to read initial option states from Rime (via a new `getOption` API) or keep local-storage defaults.

3. (Optional) Implement `switches_list` support.
Files: `wasm/api.cpp`, possibly `src/worker.ts`.
Options:

- Upgrade librime to expose `RimeSwitchesList` and define `RIME_HAS_SWITCHES_LIST` during WASM build.
- Or derive switch data from schema config and emit `switches_list` manually.

1. Validate.
Suggested commands: `npm run wasm`, `npm run build`, and the example app build/run.

**Notes**

- `set_preference` returns `bool` from WASM; JS triggers a deploy after successful updates.
- Default page size is represented by `-1` (clears the custom patch key).
