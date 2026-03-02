## 1. Dependency and API setup

- [ ] 1.1 Add `@replit/codemirror-vim` to the project dependencies and confirm the package resolves in the current build setup
- [ ] 1.2 Extend the editor prop types to expose a `vimMode` boolean that defaults to disabled

## 2. Editor integration

- [ ] 2.1 Add a dedicated Vim compartment in `useEditor()` and wire Vim mode into the editor extension assembly
- [ ] 2.2 Ensure Vim mode can be toggled dynamically on an existing editor instance without recreating the editor view

## 3. Keyboard behavior compatibility

- [ ] 3.1 Preserve the existing `Mod-s` save shortcut when Vim mode is active
- [ ] 3.2 Validate that arrow-key navigation continues to follow the current editor navigation rules when Vim mode is active
- [ ] 3.3 Verify the editor preserves standard behavior when `vimMode` is disabled or omitted

## 4. Verification and developer experience

- [ ] 4.1 Add focused tests covering standard mode, Vim activation, modal text entry expectations, and save shortcut compatibility
- [ ] 4.2 Update the Playground to expose a Vim mode toggle for manual verification
- [ ] 4.3 Update README usage examples and prop documentation for the new `vimMode` option
