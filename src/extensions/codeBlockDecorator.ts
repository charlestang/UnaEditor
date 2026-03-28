import {
  ViewPlugin,
  type ViewUpdate,
  EditorView,
  Decoration,
  type DecorationSet,
} from '@codemirror/view';
import { syntaxTree } from '@codemirror/language';
import type { Range } from '@codemirror/state';

/**
 * Code block decorator plugin
 * Adds cm-code-block-line class and optional line numbers to code blocks
 * This plugin is always active and independent of hybridMarkdown's active-scope
 */
class CodeBlockDecoratorPlugin {
  decorations: DecorationSet;

  constructor(
    view: EditorView,
    private showLineNumbers: boolean,
  ) {
    this.decorations = this.buildDecorations(view);
  }

  update(update: ViewUpdate) {
    if (update.docChanged || update.viewportChanged) {
      this.decorations = this.buildDecorations(update.view);
    }
  }

  buildDecorations(view: EditorView): DecorationSet {
    const decorations: Range<Decoration>[] = [];
    const tree = syntaxTree(view.state);

    for (const { from, to } of view.visibleRanges) {
      tree.iterate({
        from,
        to,
        enter: (node) => {
          if (node.name === 'FencedCode') {
            const startLine = view.state.doc.lineAt(node.from);
            const endLine = view.state.doc.lineAt(node.to);

            let lineNum = 1;
            for (let lineNo = startLine.number; lineNo <= endLine.number; lineNo++) {
              const line = view.state.doc.line(lineNo);
              const lineText = line.text.trim();
              const isOpeningFence = lineNo === startLine.number;
              const isClosingFence = lineNo === endLine.number && /^(?:```|~~~)/.test(lineText);

              if (isOpeningFence || isClosingFence) {
                decorations.push(
                  Decoration.line({
                    class: 'cm-code-block-fence',
                  }).range(line.from),
                );
                continue;
              }

              // Add line decoration: class + optional line number attribute
              const attributes: Record<string, string> = {};
              if (this.showLineNumbers) {
                attributes['data-code-line-number'] = String(lineNum);
              }

              decorations.push(
                Decoration.line({
                  class: 'cm-code-block-line',
                  attributes,
                }).range(line.from),
              );

              lineNum++;
            }
          }
        },
      });
    }

    return Decoration.set(decorations, true);
  }
}

/**
 * Create code block decorator extension
 * @param showLineNumbers - Whether to show line numbers
 */
export function createCodeBlockDecoratorExtension(showLineNumbers: boolean) {
  return [
    ViewPlugin.fromClass(
      class {
        plugin: CodeBlockDecoratorPlugin;

        constructor(view: EditorView) {
          this.plugin = new CodeBlockDecoratorPlugin(view, showLineNumbers);
        }

        update(update: ViewUpdate) {
          this.plugin.update(update);
        }

        get decorations() {
          return this.plugin.decorations;
        }
      },
      {
        decorations: (v) => v.decorations,
      },
    ),
    // CSS styles for line numbers via ::before pseudo-element
    EditorView.baseTheme({
      '.cm-line.cm-code-block-line[data-code-line-number]::before': {
        content: 'attr(data-code-line-number)',
        display: 'inline-block',
        minWidth: '2.5em',
        paddingRight: '0.5em',
        marginRight: '0.5em',
        textAlign: 'right',
        color: 'rgba(128, 128, 128, 0.6)',
        userSelect: 'none',
        fontSize: '0.9em',
        lineHeight: 'inherit',
        fontVariantNumeric: 'tabular-nums',
        fontFeatureSettings: '"tnum"',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
        borderRight: '1px solid rgba(128, 128, 128, 0.2)',
      },
    }),
  ];
}
