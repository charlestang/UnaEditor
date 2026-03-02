## Context

`UnaEditor` currently exposes a standard CodeMirror editing experience with optional behaviors layered in through `useEditor()`, including dynamic compartments for theme, line numbers, readonly state, and hybrid Markdown rendering. Adding Vim support introduces a second editing behavior mode that changes keyboard semantics more deeply than existing visual toggles, and it depends on a new external package: `@replit/codemirror-vim`.

The design needs to preserve the default experience for non-Vim users, keep the public API simple, and avoid destabilizing existing keyboard behavior such as `Mod-s` and the custom hybrid Markdown arrow-key navigation.

## Goals / Non-Goals

**Goals:**
- Add a single configurable switch that toggles the editor between standard and Vim keybinding modes.
- Keep standard mode as the default, preserving all current behavior when Vim mode is disabled.
- Preserve existing save shortcut behavior while Vim mode is active.
- Integrate Vim mode in a way that is consistent with the current compartment-based dynamic reconfiguration model.

**Non-Goals:**
- Adding a full Vim status bar or mode indicator UI in the component for the first iteration.
- Implementing a broader keybinding mode system beyond the two modes: standard and Vim.
- Customizing or extending Vim ex commands such as `:w`, `:q`, or plugin-specific command sets in the first iteration.

## Decisions

### Add a dedicated `vimMode` prop and a separate Vim compartment
The public API should expose Vim support as a single boolean prop, `vimMode`, defaulting to `false`. Internally, `useEditor()` should gain a dedicated `Compartment` for the Vim extension so the mode can be enabled or disabled dynamically without rebuilding the editor instance.

This matches the current architecture, where optional behaviors are attached as isolated extension layers. It also keeps the first version aligned with the user-facing requirement of “standard vs Vim” without prematurely expanding into a more generic keybinding-mode enum.

Alternative considered:
- Introduce a `keybindingMode: 'standard' | 'vim'` API immediately. This is more extensible, but it adds conceptual overhead now without providing near-term product value.

### Treat Vim mode as an editing-behavior layer, not a replacement for other editor features
Vim mode should only change how keyboard input is interpreted. It should not replace existing features such as hybrid Markdown rendering, theme handling, save events, or readonly behavior.

This keeps responsibilities separated:
- visual and document presentation remain controlled by existing extensions
- Vim mode controls keyboard semantics

Alternative considered:
- Make Vim mode drive additional display behavior, such as forcing hybrid structures to collapse back to rendered state on `Esc`. This creates tighter coupling between two independent systems and would make the first implementation significantly more fragile.

### Preserve existing arrow-key navigation and `Mod-s` priority expectations
The editor already has custom arrow-key behavior inside the hybrid Markdown extension and an explicit `Mod-s` save keymap. Vim integration should be designed so those behaviors remain valid:
- arrow keys should continue to follow the editor’s current navigation rules
- `Mod-s` should continue to emit the save event in both Vim normal mode and insert mode

This means the final extension order and key precedence need to be validated explicitly rather than assuming the Vim extension can simply be appended without consequence.

Alternative considered:
- Let Vim mode fully own all navigation keys and shortcut routing. This would be closer to a pure Vim environment, but it would break expectations already established by the editor’s current hybrid navigation behavior.

### Keep first-phase Vim UX low-intrusion
The first iteration should ship with behavior only: enable Vim mode, get classic modal editing. It should not add new visual UI such as a status line, badge, or dedicated mode display.

This keeps the component surface minimal and avoids committing to a UI contract before the keyboard behavior has been validated in real usage.

Alternative considered:
- Add a built-in mode indicator immediately. This improves discoverability for Vim users, but it grows the component UI and opens additional API questions around customization and styling.

## Risks / Trade-offs

- [Keymap precedence conflicts] `@replit/codemirror-vim` may intercept keys that currently power save and hybrid navigation. → Validate extension order explicitly and cover `Mod-s`, arrow keys, and mode transitions with focused tests.
- [Behavioral mismatch with “pure Vim” expectations] Preserving existing arrow-key behavior means Vim mode will be integrated into UnaEditor’s rules rather than acting like a fully isolated Vim environment. → Document that first-phase Vim mode prioritizes compatibility with existing editor behavior.
- [Dynamic reconfiguration edge cases] Toggling Vim mode on an existing editor instance may preserve internal state in unexpected ways. → Scope the first implementation around compartment-based toggling and test switching on/off after the editor is mounted.
- [Dependency footprint] Adding Vim support introduces a new runtime dependency for a capability that is disabled by default. → Keep the API optional and revisit code-splitting or lazy-loading only if bundle cost becomes material.

## Migration Plan

1. Add the new dependency and wire it into the editor’s extension assembly.
2. Extend the public props and documentation to expose `vimMode`.
3. Verify standard mode remains unchanged when the prop is absent.
4. Validate Vim mode behavior in tests and Playground before release.

No data migration is required. Rollback is straightforward: disable the `vimMode` prop or remove the Vim extension wiring.

## Open Questions

- Whether the first implementation should expose any hook for consumers to observe the current Vim sub-mode (`normal`, `insert`, etc.) later.
- Whether the dependency should remain eagerly bundled or become a lazily loaded optional enhancement in a future optimization pass.
