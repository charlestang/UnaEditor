import type { Ref } from 'vue';
import type { EditorProps } from './editor';
import type { ResolvedEditorAppearance } from '../themes/editorAppearance';

export type EditorFileInputSource = 'drop' | 'paste';

export interface EditorRuntimeCallbacks {
  onModelValueChange: (value: string) => void;
  onChange: (value: string) => void;
  onSave: () => void;
  onFocus: () => void;
  onBlur: () => void;
  onFileInput: (payload: { source: EditorFileInputSource; files: File[] }) => void;
}

export interface EditorRuntimeInput {
  props: EditorProps;
  appearance: Readonly<Ref<ResolvedEditorAppearance>>;
  callbacks: EditorRuntimeCallbacks;
}
