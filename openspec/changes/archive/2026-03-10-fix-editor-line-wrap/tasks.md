## 1. Type Definitions

- [ ] 1.1 Update `EditorProps` interface in `src/types/editor.ts` to include `lineWrap?: boolean`

## 2. Component Implementation

- [ ] 2.1 Add `lineWrap` default value (true) to `withDefaults` in `src/components/UnaEditor.vue`
- [ ] 2.2 Create a new `Compartment` for line wrapping in `src/composables/useEditor.ts`
- [ ] 2.3 Add `EditorView.lineWrapping` to the initial extensions list in `useEditor` based on the prop value
- [ ] 2.4 Add a `watch` effect in `useEditor` to dynamically reconfigure the line wrapping compartment when `props.lineWrap` changes

## 3. Playground / Testing (Optional but recommended)

- [ ] 3.1 Expose `lineWrap` toggle in the playground to verify dynamic switching behavior
