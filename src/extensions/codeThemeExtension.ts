import { EditorView } from '@codemirror/view';
import type { Extension } from '@codemirror/state';
import { syntaxHighlighting } from '@codemirror/language';
import { classHighlighter } from '@lezer/highlight';
import type { CodeTheme } from '../types/editor';

/**
 * Create code theme extension
 * Applies theme colors to code blocks via line-scoped CSS selectors and syntax highlighting
 */
export function createCodeThemeExtension(theme: CodeTheme): Extension {
  const { colors } = theme;

  return [
    // Expose stable tok-* classes so code-block styles can be scoped to line classes.
    syntaxHighlighting(classHighlighter),

    // Apply theme-specific styles
    EditorView.theme({
      '.cm-line.cm-code-block-line, .cm-line.cm-code-block-fence': {
        backgroundColor: colors.background,
        color: colors.foreground,
      },

      '.cm-line.cm-code-block-fence': {
        color: colors.lineNumber,
      },

      '.cm-line.cm-code-block-line .cm-selectionBackground, .cm-line.cm-code-block-fence .cm-selectionBackground': {
        backgroundColor: colors.selection,
      },

      '.cm-line.cm-code-block-line[data-code-line-number]::before': {
        color: colors.lineNumber,
      },

      '.cm-line.cm-code-block-line .tok-keyword': {
        color: colors.keyword,
      },
      '.cm-line.cm-code-block-line .tok-variableName.tok-definition': {
        color: colors.function,
      },
      '.cm-line.cm-code-block-line .tok-string, .cm-line.cm-code-block-line .tok-string2': {
        color: colors.string,
      },
      '.cm-line.cm-code-block-line .tok-number': {
        color: colors.number,
      },
      '.cm-line.cm-code-block-line .tok-comment': {
        color: colors.comment,
        fontStyle: 'italic',
      },
      '.cm-line.cm-code-block-line .tok-operator': {
        color: colors.operator,
      },
      '.cm-line.cm-code-block-line .tok-variableName': {
        color: colors.variable,
      },
      '.cm-line.cm-code-block-line .tok-typeName': {
        color: colors.type,
      },
      '.cm-line.cm-code-block-line .tok-propertyName': {
        color: colors.property || colors.variable,
      },
      '.cm-line.cm-code-block-line .tok-attributeName': {
        color: colors.attribute || colors.variable,
      },
      '.cm-line.cm-code-block-line .tok-tagName': {
        color: colors.tag || colors.keyword,
      },
      '.cm-line.cm-code-block-line .tok-variableName.tok-constant': {
        color: colors.constant || colors.number,
      },
    }),
  ];
}
