import { EditorSelection, EditorState, Prec, StateEffect, StateField, type Extension } from '@codemirror/state';
import { Decoration, EditorView, GutterMarker, ViewPlugin, WidgetType, keymap, lineNumberWidgetMarker } from '@codemirror/view';
import type { DecorationSet, ViewUpdate } from '@codemirror/view';
import { redo, undo } from '@codemirror/commands';
import { getCM, Vim } from '@replit/codemirror-vim';
import {
  deleteTableColumn,
  deleteTableRow,
  findTableMappingAt,
  findTableMappingsInRange,
  insertTableColumn,
  insertTableRow,
  isRowEmpty,
  normalizeCellText,
  normalizePastedText,
  parseInlinePreviewText,
  type TableAlignment,
  type TableMapping,
} from './structuredTableModel';

const structuredTableResizeObservers = new WeakMap<HTMLElement, ResizeObserver>();

interface TreeNode {
  name: string;
  from: number;
  to: number;
  firstChild: TreeNode | null;
  nextSibling: TreeNode | null;
  parent: TreeNode | null;
}

type StructureSelectionKind = 'row' | 'column';

interface TableFocusCell {
  tableFrom: number;
  row: number;
  col: number;
  editing: boolean;
}

interface TableStructureSelection {
  tableFrom: number;
  kind: StructureSelectionKind;
  index: number;
}

interface StructuredTableUiState {
  focusCell: TableFocusCell | null;
  structureSelection: TableStructureSelection | null;
}

interface TableMenuState {
  x: number;
  y: number;
  selection: TableStructureSelection;
}

interface EditingCellBinding {
  tableFrom: number;
  row: number;
  col: number;
  from: number;
  to: number;
  contentFrom: number;
  contentTo: number;
  text: string;
  isHeader: boolean;
}

const EMPTY_UI_STATE: StructuredTableUiState = {
  focusCell: null,
  structureSelection: null,
};

const setFocusCellEffect = StateEffect.define<TableFocusCell | null>();
const setStructureSelectionEffect = StateEffect.define<TableStructureSelection | null>();

const structuredTableUiField = StateField.define<StructuredTableUiState>({
  create: () => EMPTY_UI_STATE,
  update(value, transaction) {
    let next: StructuredTableUiState = {
      focusCell: value.focusCell
        ? {
            ...value.focusCell,
            tableFrom: transaction.changes.mapPos(value.focusCell.tableFrom),
          }
        : null,
      structureSelection: value.structureSelection
        ? {
            ...value.structureSelection,
            tableFrom: transaction.changes.mapPos(value.structureSelection.tableFrom),
          }
        : null,
    };

    for (const effect of transaction.effects) {
      if (effect.is(setFocusCellEffect)) {
        next = {
          ...next,
          focusCell: effect.value,
        };
      }

      if (effect.is(setStructureSelectionEffect)) {
        next = {
          ...next,
          structureSelection: effect.value,
        };
      }
    }

    return next;
  },
});

const structuredTableDecorationsField = StateField.define<DecorationSet>({
  create(state) {
    return buildStructuredTableDecorations(state);
  },
  update(value, transaction) {
    const nextFocusCell = transaction.state.field(structuredTableUiField, false)?.focusCell;
    if (
      transaction.docChanged &&
      nextFocusCell?.editing &&
      !findTableMappingAt(transaction.state, nextFocusCell.tableFrom)
    ) {
      return value.map(transaction.changes);
    }

    if (
      transaction.docChanged ||
      transaction.selection ||
      transaction.effects.some(
        (effect) => effect.is(setFocusCellEffect) || effect.is(setStructureSelectionEffect),
      )
    ) {
      return buildStructuredTableDecorations(transaction.state);
    }

    return buildStructuredTableDecorations(transaction.state);
  },
  provide: (field) => EditorView.decorations.from(field),
});

const STRUCTURED_TABLE_THEME = EditorView.theme({
  '.cm-structured-table-wrapper': {
    position: 'relative',
    margin: '0',
    boxSizing: 'border-box',
    width: '100%',
    maxWidth: '100%',
    paddingLeft: '1.5rem',
    paddingRight: '1.8rem',
    paddingBottom: '1.8rem',
    overflow: 'visible',
  },
  '.cm-structured-table': {
    width: '100%',
    borderCollapse: 'collapse',
    borderSpacing: '0',
    tableLayout: 'fixed',
    border: 'none',
    backgroundColor: 'transparent',
  },
  '.cm-structured-table-handle, .cm-structured-table-add': {
    position: 'absolute',
    zIndex: '10',
    border: '1px solid transparent',
    background: 'transparent',
    color: 'rgba(71, 85, 105, 0.92)',
    cursor: 'pointer',
    fontSize: '0.72rem',
    lineHeight: '1',
    padding: '0.16rem 0.32rem',
    borderRadius: '999px',
    boxShadow: 'none',
    opacity: '0',
    pointerEvents: 'none',
    transition: 'opacity 120ms ease, background-color 120ms ease, border-color 120ms ease, box-shadow 120ms ease',
  },
  '.cm-structured-table-handle-visible, .cm-structured-table-add-visible': {
    opacity: '1',
    pointerEvents: 'auto',
  },
  '.cm-structured-table-handle-visible:hover, .cm-structured-table-add-visible:hover, .cm-structured-table-handle-visible:focus-visible, .cm-structured-table-add-visible:focus-visible': {
    borderColor: 'rgba(148, 163, 184, 0.32)',
    background: 'rgba(255, 255, 255, 0.96)',
    boxShadow: '0 4px 10px rgba(15, 23, 42, 0.08)',
    outline: 'none',
  },
  '.cm-structured-table-col-handle': {
    transform: 'translate(-50%, calc(-100% - 6px))',
  },
  '.cm-structured-table-row-handle': {
    transform: 'translate(0, -50%) rotate(90deg)',
    transformOrigin: 'center',
  },
  '.cm-structured-table-header-cell, .cm-structured-table-cell': {
    borderBottom: '1px solid rgba(148, 163, 184, 0.18)',
    borderRight: '1px solid rgba(148, 163, 184, 0.12)',
    padding: '0.26rem 0.45rem',
    verticalAlign: 'top',
    overflowWrap: 'break-word',
    backgroundColor: 'transparent',
  },
  '.cm-structured-table-body-row:last-child .cm-structured-table-cell': {
    borderBottom: 'none',
  },
  '.cm-structured-table-header-cell:last-of-type, .cm-structured-table-cell:last-of-type': {
    borderRight: 'none',
  },
  '.cm-structured-table-header-cell': {
    fontWeight: '600',
    backgroundColor: 'var(--una-table-header-bg, rgba(15, 23, 42, 0.04))',
  },
  '.cm-structured-table-cell-content': {
    minHeight: '1.15rem',
    whiteSpace: 'pre-wrap',
  },
  '.cm-structured-table-cell-active': {
    boxShadow: 'inset 0 0 0 1px rgba(37, 99, 235, 0.45)',
    backgroundColor: 'rgba(219, 234, 254, 0.18)',
  },
  '.cm-structured-table-cell-selected': {
    backgroundColor: 'rgba(219, 234, 254, 0.12)',
  },
  '.cm-structured-table-context-menu': {
    position: 'absolute',
    zIndex: '30',
    display: 'none',
    minWidth: '8rem',
    padding: '0.35rem',
    borderRadius: '10px',
    border: '1px solid rgba(148, 163, 184, 0.35)',
    backgroundColor: 'white',
    boxShadow: '0 12px 32px rgba(15, 23, 42, 0.16)',
  },
  '.cm-structured-table-context-menu.cm-structured-table-context-menu-visible': {
    display: 'grid',
    gap: '0.2rem',
  },
  '.cm-structured-table-context-action': {
    border: 'none',
    background: 'transparent',
    borderRadius: '6px',
    textAlign: 'left',
    padding: '0.34rem 0.48rem',
    cursor: 'pointer',
    fontSize: '0.82rem',
  },
  '.cm-structured-table-overlay': {
    position: 'absolute',
    zIndex: '25',
    resize: 'none',
    margin: '0',
    padding: '0.26rem 0.45rem',
    borderRadius: '0',
    border: 'none',
    outline: 'none',
    appearance: 'none',
    boxSizing: 'border-box',
    boxShadow: 'inset 0 0 0 1px rgba(37, 99, 235, 0.52)',
    font: 'inherit',
    lineHeight: 'inherit',
    overflow: 'hidden',
    display: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
  },
  '.cm-structured-table-overlay.cm-structured-table-overlay-visible': {
    display: 'block',
  },
  '.cm-structured-table-overlay.cm-structured-table-overlay-readonly': {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    color: 'transparent',
    caretColor: '#0f172a',
  },
  '.cm-structured-table-side-add': {
    transform: 'translateY(-50%)',
  },
  '.cm-structured-table-bottom-add': {
    transform: 'translate(-50%, 6px)',
  },
  '.cm-structured-table-inline-code': {
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    borderRadius: '4px',
    padding: '0.08em 0.28em',
    fontFamily: 'var(--una-code-font-family, ui-monospace, SFMono-Regular, Menlo, monospace)',
  },
  '.cm-structured-table-link': {
    color: '#0b57d0',
    textDecoration: 'underline',
    textUnderlineOffset: '0.18em',
  },
  '.cm-structured-table-image': {
    display: 'block',
    maxWidth: '100%',
    maxHeight: '10rem',
    borderRadius: '8px',
    objectFit: 'contain',
  },
});

class StructuredTableWidget extends WidgetType {
  private readonly activeCellFromSelection: { row: number; col: number } | null;

  constructor(
    readonly table: TableMapping,
    private readonly uiState: StructuredTableUiState,
    selectionHead: number,
  ) {
    super();
    this.activeCellFromSelection = findCellCoordinatesAtPosition(this.table, selectionHead);
  }

  eq(other: StructuredTableWidget): boolean {
    return (
      this.table.from === other.table.from &&
      this.table.to === other.table.to &&
      this.table.rows.length === other.table.rows.length &&
      this.table.rows.every((row, rowIndex) =>
        row.cells.every((cell, colIndex) => cell.text === other.table.rows[rowIndex]?.cells[colIndex]?.text),
      ) &&
      this.activeCellFromSelection?.row === other.activeCellFromSelection?.row &&
      this.activeCellFromSelection?.col === other.activeCellFromSelection?.col &&
      sameFocusCell(this.uiState.focusCell, other.uiState.focusCell) &&
      sameStructureSelection(this.uiState.structureSelection, other.uiState.structureSelection)
    );
  }

  get estimatedHeight(): number {
    return estimateStructuredTableHeight(this.table);
  }

  toDOM(view: EditorView): HTMLElement {
    const wrapper = document.createElement('div');
    wrapper.className = 'cm-structured-table-wrapper';
    wrapper.dataset.tableFrom = String(this.table.from);
    wrapper.contentEditable = 'false';

    const table = document.createElement('table');
    table.className = 'cm-structured-table';
    table.dataset.tableFrom = String(this.table.from);
    table.tabIndex = -1;

    const tbody = document.createElement('tbody');
    for (const row of this.table.rows) {
      tbody.appendChild(this.buildDataRow(row));
    }

    table.appendChild(tbody);
    wrapper.appendChild(table);
    wrapper.appendChild(this.buildColumnHandles());
    wrapper.appendChild(this.buildRowHandles());
    wrapper.appendChild(this.buildSideAddButton());
    wrapper.appendChild(this.buildBottomAddButton());
    this.bindRemeasureOnImageLoad(wrapper, view);
    return wrapper;
  }

  ignoreEvent(): boolean {
    return true;
  }

  coordsAt(dom: HTMLElement, pos: number, side: number): DOMRect | null {
    const absolutePos = this.table.from + pos;
    const located = locateCellAtDocumentPosition(this.table, absolutePos, side);
    if (!located) {
      return dom.getBoundingClientRect();
    }

    const cellElement = dom.querySelector<HTMLElement>(
      `[data-cell-row="${located.cell.row}"][data-cell-col="${located.cell.col}"]`,
    );
    if (!cellElement) return dom.getBoundingClientRect();

    const content =
      cellElement.querySelector<HTMLElement>('.cm-structured-table-cell-content') ?? cellElement;
    const visualOffset = clamp(
      located.position - located.cell.contentFrom,
      0,
      content.textContent?.length ?? located.cell.text.length,
    );

    return measureCellCaretRect(content, visualOffset, side) ?? cellElement.getBoundingClientRect();
  }

  private buildColumnHandles(): DocumentFragment {
    const fragment = document.createDocumentFragment();
    for (let col = 0; col < this.table.columnCount; col += 1) {
      const handle = document.createElement('button');
      handle.className = 'cm-structured-table-handle cm-structured-table-col-handle';
      handle.type = 'button';
      handle.textContent = ':::';
      handle.dataset.tableFrom = String(this.table.from);
      handle.dataset.structureKind = 'column';
      handle.dataset.structureIndex = String(col);
      handle.dataset.action = 'select-column';
      handle.dataset.colHandle = 'true';
      if (this.isColumnSelected(col)) {
        handle.dataset.selected = 'true';
      }

      fragment.appendChild(handle);
    }
    return fragment;
  }

  private buildDataRow(rowData: TableMapping['rows'][number]): HTMLTableRowElement {
    const row = document.createElement('tr');
    row.className = rowData.isHeader
      ? 'cm-structured-table-header-row'
      : 'cm-structured-table-body-row';

    for (const cell of rowData.cells) {
      const cellElement = rowData.isHeader ? document.createElement('th') : document.createElement('td');
      cellElement.className = rowData.isHeader
        ? 'cm-structured-table-header-cell'
        : 'cm-structured-table-cell';
      cellElement.dataset.tableFrom = String(this.table.from);
      cellElement.dataset.cellRow = String(cell.row);
      cellElement.dataset.cellCol = String(cell.col);
      cellElement.dataset.cellFrom = String(cell.from);
      cellElement.dataset.cellTo = String(cell.to);
      cellElement.dataset.contentFrom = String(cell.contentFrom);
      cellElement.dataset.contentTo = String(cell.contentTo);
      cellElement.dataset.action = 'focus-cell';
      const alignment = resolveColumnTextAlign(this.table.alignments[cell.col]);
      cellElement.dataset.align = alignment;
      cellElement.style.textAlign = alignment;
      if (cell.col === 0) {
        cellElement.dataset.firstCol = 'true';
      }
      if (cell.col === this.table.columnCount - 1) {
        cellElement.dataset.lastCol = 'true';
      }
      if (cell.row === 0) {
        cellElement.dataset.topRow = 'true';
      }
      if (cell.row === this.table.rows.length - 1) {
        cellElement.dataset.bottomRow = 'true';
      }

      const isActiveCell = this.isFocusedCell(cell.row, cell.col);

      if (isActiveCell) {
        cellElement.classList.add('cm-structured-table-cell-active');
      }
      if (this.isRowSelected(cell.row) || this.isColumnSelected(cell.col)) {
        cellElement.classList.add('cm-structured-table-cell-selected');
      }

      const content = document.createElement('div');
      content.className = 'cm-structured-table-cell-content';
      if (isActiveCell) {
        content.textContent = cell.text;
      } else {
        content.appendChild(renderInlinePreview(cell.text));
      }
      cellElement.appendChild(content);
      row.appendChild(cellElement);
    }
    return row;
  }

  private buildRowHandles(): DocumentFragment {
    const fragment = document.createDocumentFragment();
    for (const row of this.table.rows) {
      const rowHandle = document.createElement('button');
      rowHandle.className = 'cm-structured-table-handle cm-structured-table-row-handle';
      rowHandle.type = 'button';
      rowHandle.textContent = ':::';
      rowHandle.dataset.tableFrom = String(this.table.from);
      rowHandle.dataset.structureKind = 'row';
      rowHandle.dataset.structureIndex = String(row.row);
      rowHandle.dataset.action = 'select-row';
      rowHandle.dataset.rowHandle = 'true';
      if (this.isRowSelected(row.row)) {
        rowHandle.dataset.selected = 'true';
      }
      fragment.appendChild(rowHandle);
    }
    return fragment;
  }

  private buildSideAddButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'cm-structured-table-add cm-structured-table-side-add';
    button.type = 'button';
    button.textContent = '+';
    button.dataset.tableFrom = String(this.table.from);
    button.dataset.action = 'append-column';
    button.dataset.sideAdd = 'true';
    return button;
  }

  private buildBottomAddButton(): HTMLButtonElement {
    const button = document.createElement('button');
    button.className = 'cm-structured-table-add cm-structured-table-bottom-add';
    button.type = 'button';
    button.textContent = '+';
    button.dataset.tableFrom = String(this.table.from);
    button.dataset.action = 'append-row';
    button.dataset.bottomAdd = 'true';
    return button;
  }

  private bindRemeasureOnImageLoad(wrapper: HTMLElement, view: EditorView): void {
    const images = wrapper.querySelectorAll<HTMLImageElement>('.cm-structured-table-image');

    queueMicrotask(() => {
      if (wrapper.isConnected) {
        view.requestMeasure();
      }
    });

    window.setTimeout(() => {
      if (wrapper.isConnected) {
        view.requestMeasure();
      }
    }, 0);

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => {
        if (!wrapper.isConnected) return;
        view.requestMeasure();
      });
      observer.observe(wrapper);
      structuredTableResizeObservers.set(wrapper, observer);
    }

    if (!images.length) return;

    for (const image of images) {
      if (image.complete) continue;

      const handleImageSettled = () => {
        if (!wrapper.isConnected) return;
        view.requestMeasure();
      };

      image.addEventListener('load', handleImageSettled, { once: true });
      image.addEventListener('error', handleImageSettled, { once: true });
    }
  }

  destroy(dom: HTMLElement): void {
    structuredTableResizeObservers.get(dom)?.disconnect();
    structuredTableResizeObservers.delete(dom);
  }

  private isFocusedCell(row: number, col: number): boolean {
    const selected = this.uiState.structureSelection;
    if (selected?.tableFrom === this.table.from) {
      return false;
    }

    if (
      this.activeCellFromSelection?.row === row &&
      this.activeCellFromSelection?.col === col
    ) {
      return true;
    }

    const active = this.uiState.focusCell;
    return Boolean(
      active &&
        active.tableFrom === this.table.from &&
        active.row === row &&
        active.col === col,
    );
  }

  private isRowSelected(row: number): boolean {
    const selected = this.uiState.structureSelection;
    return Boolean(
      selected &&
        selected.tableFrom === this.table.from &&
        selected.kind === 'row' &&
        selected.index === row,
    );
  }

  private isColumnSelected(col: number): boolean {
    const selected = this.uiState.structureSelection;
    return Boolean(
      selected &&
        selected.tableFrom === this.table.from &&
        selected.kind === 'column' &&
        selected.index === col,
    );
  }
}

class StructuredTableLineNumberMarker extends GutterMarker {
  constructor(private readonly lineNumber: number) {
    super();
  }

  eq(other: GutterMarker): boolean {
    return (
      other instanceof StructuredTableLineNumberMarker &&
      other.lineNumber === this.lineNumber
    );
  }

  toDOM(): Node {
    return document.createTextNode(String(this.lineNumber));
  }
}

class StructuredTablePlugin {
  private overlay: HTMLTextAreaElement;
  private menu: HTMLDivElement;
  private isComposing = false;
  private pendingVimEditingSync = false;
  private pendingOverlayFocus = false;
  private pendingOverlayRefocusTimer: number | null = null;
  private pendingSelectionNormalization = false;
  private pendingOutsideClear = false;
  private pendingHoverClearTimer: number | null = null;
  private menuState: TableMenuState | null = null;
  private pendingSelection: { start: number; end: number } | null = null;
  private hoveredCell: { tableFrom: number; row: number; col: number } | null = null;
  private lastOverlayCellKey: string | null = null;
  private mouseDownFocusedCellKey: string | null = null;
  private fallbackEditingCell: EditingCellBinding | null = null;

  constructor(private readonly view: EditorView) {
    this.overlay = this.createOverlay();
    this.menu = this.createMenu();
    this.view.dom.appendChild(this.overlay);
    this.view.dom.appendChild(this.menu);
    this.bindDomEvents();
    this.syncOverlay();
    this.syncMenu();
  }

  update(update: ViewUpdate): void {
    if (update.selectionSet) {
      this.scheduleSelectionNormalization();
    }
    this.syncOverlay();
    this.syncMenu();
    this.syncHoverAffordances();
  }

  destroy(): void {
    this.view.dom.removeEventListener('mousedown', this.handleMouseDown);
    this.view.dom.removeEventListener('click', this.handleClick);
    this.view.dom.removeEventListener('contextmenu', this.handleContextMenu);
    this.view.dom.removeEventListener('mousemove', this.handleMouseMove);
    this.view.dom.removeEventListener('mouseleave', this.handleMouseLeave);
    this.view.dom.removeEventListener('scroll', this.handleScroll, true);
    this.view.dom.removeEventListener('keydown', this.handleKeyDown, true);
    if (this.pendingOverlayRefocusTimer != null) {
      window.clearTimeout(this.pendingOverlayRefocusTimer);
    }
    if (this.pendingHoverClearTimer != null) {
      window.clearTimeout(this.pendingHoverClearTimer);
    }
    this.overlay.remove();
    this.menu.remove();
  }

  private bindDomEvents(): void {
    this.view.dom.addEventListener('mousedown', this.handleMouseDown, true);
    this.view.dom.addEventListener('click', this.handleClick, true);
    this.view.dom.addEventListener('contextmenu', this.handleContextMenu, true);
    this.view.dom.addEventListener('mousemove', this.handleMouseMove);
    this.view.dom.addEventListener('mouseleave', this.handleMouseLeave);
    this.view.dom.addEventListener('scroll', this.handleScroll, true);
    this.view.dom.addEventListener('keydown', this.handleKeyDown, true);
  }

  private readonly handleMouseDown = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target === this.overlay || target.closest('.cm-structured-table-overlay')) {
      return;
    }

    const menuAction = target.closest<HTMLElement>('.cm-structured-table-context-menu [data-action]');
    if (
      menuAction &&
      (menuAction.dataset.action === 'menu-delete' ||
        menuAction.dataset.action === 'menu-insert-before' ||
        menuAction.dataset.action === 'menu-insert-after')
    ) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      this.handleMenuAction(menuAction);
      this.mouseDownFocusedCellKey = null;
      return;
    }

    const wrapper = target.closest('.cm-structured-table-wrapper');
    if (!wrapper) return;
    const actionElement = target.closest<HTMLElement>('[data-action]');
    const action = actionElement?.dataset.action;

    if (event.button !== 0) {
      this.mouseDownFocusedCellKey = null;
      return;
    }

    if (action !== 'focus-cell') {
      this.mouseDownFocusedCellKey = null;
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    this.closeMenu();
    this.focusCellFromElement(actionElement as HTMLElement, event);
    this.mouseDownFocusedCellKey = getCellFocusKey(actionElement as HTMLElement);
  };

  private readonly handleClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    if (target === this.overlay || target.closest('.cm-structured-table-overlay')) {
      return;
    }
    const insideWrapper = target.closest('.cm-structured-table-wrapper');
    if (insideWrapper) {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }

    const actionElement = target.closest<HTMLElement>('[data-action]');

    if (!actionElement) {
      this.closeMenu();
      if (!target.closest('.cm-structured-table-wrapper')) {
        this.scheduleOutsideClear(target);
      }
      return;
    }

    const action = actionElement.dataset.action;
    const tableFrom = Number(actionElement.dataset.tableFrom);

    switch (action) {
      case 'focus-cell':
        this.closeMenu();
        if (this.mouseDownFocusedCellKey === getCellFocusKey(actionElement)) {
          this.mouseDownFocusedCellKey = null;
          return;
        }
        this.focusCellFromElement(actionElement, event);
        return;
      case 'select-row':
      case 'select-column':
        this.closeMenu();
        this.selectStructureFromElement(actionElement);
        return;
      case 'append-row':
        this.closeMenu();
        this.runAppendRow(tableFrom);
        return;
      case 'append-column':
        this.closeMenu();
        this.runAppendColumn(tableFrom);
        return;
      case 'menu-delete':
      case 'menu-insert-before':
      case 'menu-insert-after':
        this.handleMenuAction(actionElement);
        return;
      default:
        this.closeMenu();
    }

    this.mouseDownFocusedCellKey = null;
  };

  private readonly handleContextMenu = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const selection = this.resolveContextMenuSelection(target);
    if (!selection) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.view.dispatch({
      effects: [
        setStructureSelectionEffect.of(selection),
        setFocusCellEffect.of(null),
      ],
    });

    this.menuState = {
      x: event.clientX,
      y: event.clientY,
      selection,
    };
    this.syncMenu();
  };

  private readonly handleScroll = () => {
    this.syncOverlay();
    this.syncMenu();
    this.syncHoverAffordances();
  };

  private readonly handleMouseMove = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.closest('[data-row-handle], [data-col-handle], [data-side-add], [data-bottom-add]')) {
      this.cancelHoverClear();
      return;
    }

    const cell = target.closest<HTMLElement>('[data-action="focus-cell"]');
    if (cell) {
      this.cancelHoverClear();
      this.hoveredCell = {
        tableFrom: Number(cell.dataset.tableFrom),
        row: Number(cell.dataset.cellRow),
        col: Number(cell.dataset.cellCol),
      };
      this.syncHoverAffordances();
      return;
    }

    if (!target.closest('.cm-structured-table-wrapper')) {
      this.scheduleHoverClear();
    }
  };

  private readonly handleMouseLeave = () => {
    this.scheduleHoverClear();
  };

  private readonly handleKeyDown = (event: KeyboardEvent) => {
    if (
      event.defaultPrevented ||
      event.metaKey ||
      event.ctrlKey ||
      event.altKey ||
      event.target === this.overlay
    ) {
      return;
    }

    if (!isVimEnabled(this.view) || isVimInsertMode(this.view)) {
      return;
    }

    const focusCell = resolveCurrentFocusCell(this.view);
    if (!focusCell && (event.key === 'j' || event.key === 'k')) {
      const handled = moveVimOutsideStructuredTable(
        this.view,
        event.key === 'j' ? 1 : -1,
      );
      if (!handled) return;
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      this.closeMenu();
      return;
    }

    if (!focusCell) return;

    let handled = false;
    switch (event.key) {
      case 'h':
        handled = moveVimHorizontalInsideTable(this.view, -1);
        break;
      case 'l':
        handled = moveVimHorizontalInsideTable(this.view, 1);
        break;
      case 'j':
        handled = moveVimVerticalInsideTable(this.view, 1);
        break;
      case 'k':
        handled = moveVimVerticalInsideTable(this.view, -1);
        break;
      case 'w':
        handled = moveByWordInsideCell(this.view, true);
        break;
      case 'b':
        handled = moveByWordInsideCell(this.view, false);
        break;
      case 'i':
      case 'a':
        handled = enterVimInsertModeForCurrentCell(this.view, event.key);
        break;
      case 'Escape':
        handled = exitVimInsertModeForCurrentCell(this.view);
        break;
      case 'd':
        handled = dispatchVimKey(this.view, event.key);
        break;
      default:
        handled = false;
    }

    if (!handled) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    this.closeMenu();
  };

  private createOverlay(): HTMLTextAreaElement {
    const textarea = document.createElement('textarea');
    textarea.className = 'cm-structured-table-overlay';
    textarea.spellcheck = false;
    textarea.rows = 1;

    textarea.addEventListener('compositionstart', () => {
      this.isComposing = true;
    });

    textarea.addEventListener('compositionend', () => {
      this.isComposing = false;
      this.ensureFocusedCellVisibleForEditing();
      this.syncTextareaToDocument();
    });

    textarea.addEventListener('input', () => {
      this.ensureFocusedCellVisibleForEditing();
      this.syncTextareaToDocument();
    });

    textarea.addEventListener('keydown', (event) => {
      if (handleOverlayKeydown(this.view, textarea, event)) {
        this.closeMenu();
      }
    });

    textarea.addEventListener('select', () => {
      this.syncOverlaySelectionToDocument();
    });

    textarea.addEventListener('mouseup', () => {
      this.syncOverlaySelectionToDocument();
    });

    textarea.addEventListener('paste', (event) => {
      event.preventDefault();
      this.ensureFocusedCellVisibleForEditing();
      const pasted = event.clipboardData?.getData('text/plain') ?? '';
      const normalized = normalizePastedText(pasted);
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      textarea.setRangeText(normalized, start, end, 'end');
      this.pendingSelection = {
        start: textarea.selectionStart,
        end: textarea.selectionEnd,
      };
      this.syncTextareaToDocument();
    });

    return textarea;
  }

  private createMenu(): HTMLDivElement {
    const menu = document.createElement('div');
    menu.className = 'cm-structured-table-context-menu';
    return menu;
  }

  private syncTextareaToDocument(): void {
    const focusCell = this.view.state.field(structuredTableUiField).focusCell;
    if (!focusCell) return;
    const cell = this.resolveEditingCellBinding(focusCell);
    if (!cell) return;

    const nextValue = normalizeCellText(this.overlay.value);
    const selectionStart = this.pendingSelection?.start ?? this.overlay.selectionStart;
    const selectionEnd = this.pendingSelection?.end ?? this.overlay.selectionEnd;
    this.pendingSelection = null;

    const beforeSelection = normalizeCellText(this.overlay.value.slice(0, selectionStart));
    const beforeSelectionEnd = normalizeCellText(this.overlay.value.slice(0, selectionEnd));

    this.view.dispatch({
      changes: {
        from: cell.contentFrom,
        to: cell.contentTo,
        insert: nextValue,
      },
      selection: EditorSelection.single(
        cell.contentFrom + beforeSelection.length,
        cell.contentFrom + beforeSelectionEnd.length,
      ),
      effects: setFocusCellEffect.of({
        ...focusCell,
        editing: shouldOpenOverlay(this.view),
      }),
    });

    this.fallbackEditingCell = {
      tableFrom: focusCell.tableFrom,
      row: focusCell.row,
      col: focusCell.col,
      from: cell.contentFrom,
      to: cell.contentFrom + nextValue.length,
      contentFrom: cell.contentFrom,
      contentTo: cell.contentFrom + nextValue.length,
      text: nextValue,
      isHeader: focusCell.row === 0,
    };
  }

  private syncOverlaySelectionToDocument(): void {
    const focusCell = this.view.state.field(structuredTableUiField).focusCell;
    if (!focusCell) return;
    const cell = this.resolveEditingCellBinding(focusCell);
    if (!cell) return;

    this.view.dispatch({
      selection: EditorSelection.single(
        cell.contentFrom + this.overlay.selectionStart,
        cell.contentFrom + this.overlay.selectionEnd,
      ),
      effects: setFocusCellEffect.of({
        ...focusCell,
        editing: shouldOpenOverlay(this.view),
      }),
    });
  }

  private hideOverlay(restoreEditorFocus = false): void {
    this.overlay.classList.remove('cm-structured-table-overlay-visible');
    this.overlay.classList.remove('cm-structured-table-overlay-readonly');

    if (document.activeElement === this.overlay) {
      this.overlay.blur();
    }

    if (restoreEditorFocus) {
      this.view.focus();
      queueMicrotask(() => {
        this.view.focus();
      });
      window.setTimeout(() => {
        this.view.focus();
      }, 0);
    }
  }

  private editorOwnsFocus(): boolean {
    const activeElement = this.view.dom.ownerDocument.activeElement;
    return activeElement instanceof HTMLElement && this.view.dom.contains(activeElement);
  }

  private syncOverlay(): void {
    const state = this.view.state.field(structuredTableUiField);
    const focusCell = state.focusCell;

    if (focusCell && isVimEnabled(this.view) && focusCell.editing !== isVimInsertMode(this.view)) {
      this.scheduleVimEditingSync();
      return;
    }

    if (!focusCell || !focusCell.editing) {
      this.hideOverlay(this.editorOwnsFocus());
      this.lastOverlayCellKey = null;
      this.fallbackEditingCell = null;
      return;
    }

    const mapping = findTableMappingAt(this.view.state, focusCell.tableFrom);
    const cell = mapping?.rows[focusCell.row]?.cells[focusCell.col];
    if (cell) {
      this.fallbackEditingCell = {
        tableFrom: focusCell.tableFrom,
        row: focusCell.row,
        col: focusCell.col,
        from: cell.from,
        to: cell.to,
        contentFrom: cell.contentFrom,
        contentTo: cell.contentTo,
        text: cell.text,
        isHeader: cell.isHeader,
      };
    }

    const activeCell = cell ?? this.resolveEditingCellBinding(focusCell);
    if (!activeCell) {
      this.hideOverlay(this.editorOwnsFocus());
      this.lastOverlayCellKey = null;
      return;
    }

    const domCell = this.findCellElement(focusCell.tableFrom, focusCell.row, focusCell.col);
    if (!domCell) {
      this.hideOverlay(this.editorOwnsFocus());
      return;
    }
    const cellRect = domCell.getBoundingClientRect();
    const editorRect = this.view.dom.getBoundingClientRect();

    const nextValue = activeCell.text;
    const overlayCellKey = `${focusCell.tableFrom}:${focusCell.row}:${focusCell.col}:${focusCell.editing}`;
    const shouldResetSelection = this.lastOverlayCellKey !== overlayCellKey;
    const shouldSyncOverlayValue = shouldResetSelection || !focusCell.editing;

    if (!this.isComposing && shouldSyncOverlayValue && this.overlay.value !== nextValue) {
      this.overlay.value = nextValue;
    }

    this.overlay.style.left = `${cellRect.left - editorRect.left}px`;
    this.overlay.style.top = `${cellRect.top - editorRect.top}px`;
    this.overlay.style.width = `${cellRect.width}px`;
    this.overlay.style.height = `${cellRect.height}px`;
    this.overlay.readOnly = false;
    this.overlay.classList.add('cm-structured-table-overlay-visible');
    this.overlay.classList.remove('cm-structured-table-overlay-readonly');

    if (this.pendingSelection) {
      this.overlay.setSelectionRange(this.pendingSelection.start, this.pendingSelection.end);
      this.pendingSelection = null;
    } else if (shouldResetSelection) {
      const selection = getSelectionRangeInCell(this.view.state, activeCell);
      this.overlay.setSelectionRange(selection.start, selection.end);
    }

    this.scheduleOverlayFocus();
    this.lastOverlayCellKey = overlayCellKey;
  }

  private ensureFocusedCellVisibleForEditing(): void {
    const focusCell = this.view.state.field(structuredTableUiField).focusCell;
    if (!focusCell?.editing) return;

    const domCell = this.findCellElement(focusCell.tableFrom, focusCell.row, focusCell.col);
    if (domCell) {
      const cellRect = domCell.getBoundingClientRect();
      const editorRect = this.view.dom.getBoundingClientRect();
      const isVisible =
        cellRect.bottom >= editorRect.top && cellRect.top <= editorRect.bottom;
      if (isVisible) return;
    }

    this.view.dispatch({
      selection: this.view.state.selection,
      effects: setFocusCellEffect.of({ ...focusCell }),
      scrollIntoView: true,
    });
  }

  private scheduleVimEditingSync(): void {
    if (this.pendingVimEditingSync) return;
    this.pendingVimEditingSync = true;
    queueMicrotask(() => {
      this.pendingVimEditingSync = false;
      syncFocusCellEditingWithVimMode(this.view);
    });
  }

  private scheduleOverlayFocus(): void {
    if (this.pendingOverlayFocus) return;
    this.pendingOverlayFocus = true;
    queueMicrotask(() => {
      this.pendingOverlayFocus = false;
      if (!this.overlay.classList.contains('cm-structured-table-overlay-visible')) {
        return;
      }
      this.overlay.focus();
      if (this.pendingOverlayRefocusTimer != null) {
        window.clearTimeout(this.pendingOverlayRefocusTimer);
      }
      this.pendingOverlayRefocusTimer = window.setTimeout(() => {
        this.pendingOverlayRefocusTimer = null;
        if (!this.overlay.classList.contains('cm-structured-table-overlay-visible')) {
          return;
        }
        this.overlay.focus();
      }, 0);
    });
  }

  private scheduleSelectionNormalization(): void {
    if (this.pendingSelectionNormalization) return;
    this.pendingSelectionNormalization = true;
    queueMicrotask(() => {
      this.pendingSelectionNormalization = false;
      normalizeStructuredTableSelection(this.view);
    });
  }

  private cancelHoverClear(): void {
    if (this.pendingHoverClearTimer == null) return;
    window.clearTimeout(this.pendingHoverClearTimer);
    this.pendingHoverClearTimer = null;
  }

  private scheduleHoverClear(): void {
    this.cancelHoverClear();
    this.pendingHoverClearTimer = window.setTimeout(() => {
      this.pendingHoverClearTimer = null;
      this.hoveredCell = null;
      this.syncHoverAffordances();
    }, 140);
  }

  private syncMenu(): void {
    if (!this.menuState) {
      this.menu.className = 'cm-structured-table-context-menu';
      this.menu.innerHTML = '';
      return;
    }

    this.menu.className =
      'cm-structured-table-context-menu cm-structured-table-context-menu-visible';
    this.menu.style.left = `${this.menuState.x - this.view.dom.getBoundingClientRect().left}px`;
    this.menu.style.top = `${this.menuState.y - this.view.dom.getBoundingClientRect().top}px`;
    this.menu.innerHTML = '';

    const actions = [
      { action: 'menu-insert-before', label: this.menuState.selection.kind === 'row' ? 'Insert Row Before' : 'Insert Column Before' },
      { action: 'menu-insert-after', label: this.menuState.selection.kind === 'row' ? 'Insert Row After' : 'Insert Column After' },
      { action: 'menu-delete', label: this.menuState.selection.kind === 'row' ? 'Delete Row' : 'Delete Column' },
    ];

    for (const item of actions) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'cm-structured-table-context-action';
      button.textContent = item.label;
      button.dataset.action = item.action;
      button.dataset.tableFrom = String(this.menuState.selection.tableFrom);
      button.dataset.structureKind = this.menuState.selection.kind;
      button.dataset.structureIndex = String(this.menuState.selection.index);
      this.menu.appendChild(button);
    }
  }

  private syncHoverAffordances(): void {
    for (const handle of this.view.dom.querySelectorAll<HTMLElement>('[data-row-handle], [data-col-handle]')) {
      handle.classList.remove('cm-structured-table-handle-visible');
      handle.style.top = '';
      handle.style.left = '';
    }

    for (const button of this.view.dom.querySelectorAll<HTMLElement>('[data-side-add], [data-bottom-add]')) {
      button.classList.remove('cm-structured-table-add-visible');
      button.style.top = '';
      button.style.left = '';
    }

    const hovered = this.hoveredCell;
    if (!hovered) return;

    const table = findTableMappingAt(this.view.state, hovered.tableFrom);
    if (!table) return;

    if (hovered.col === 0) {
      const hoveredCell = this.findCellElement(hovered.tableFrom, hovered.row, hovered.col);
      const wrapper = this.view.dom.querySelector<HTMLElement>(
        `.cm-structured-table-wrapper[data-table-from="${hovered.tableFrom}"]`,
      );
      const rowHandle = this.view.dom.querySelector<HTMLElement>(
        `[data-row-handle="true"][data-table-from="${hovered.tableFrom}"][data-structure-index="${hovered.row}"]`,
      );
      if (rowHandle && hoveredCell && wrapper) {
        const cellRect = hoveredCell.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        rowHandle.style.left = '4px';
        rowHandle.style.top = `${cellRect.top - wrapperRect.top + cellRect.height / 2}px`;
        rowHandle.classList.add('cm-structured-table-handle-visible');
      }
    }

    if (hovered.row === 0) {
      const hoveredCell = this.findCellElement(hovered.tableFrom, hovered.row, hovered.col);
      const wrapper = this.view.dom.querySelector<HTMLElement>(
        `.cm-structured-table-wrapper[data-table-from="${hovered.tableFrom}"]`,
      );
      const colHandle = this.view.dom.querySelector<HTMLElement>(
        `[data-col-handle="true"][data-table-from="${hovered.tableFrom}"][data-structure-index="${hovered.col}"]`,
      );
      if (colHandle && hoveredCell && wrapper) {
        const cellRect = hoveredCell.getBoundingClientRect();
        const wrapperRect = wrapper.getBoundingClientRect();
        colHandle.style.left = `${cellRect.left - wrapperRect.left + cellRect.width / 2}px`;
        colHandle.style.top = '0px';
        colHandle.classList.add('cm-structured-table-handle-visible');
      }
    }

    if (hovered.col === table.columnCount - 1) {
      const sideAdd = this.view.dom.querySelector<HTMLElement>(
        `[data-side-add="true"][data-table-from="${hovered.tableFrom}"]`,
      );
      const wrapper = this.view.dom.querySelector<HTMLElement>(
        `.cm-structured-table-wrapper[data-table-from="${hovered.tableFrom}"]`,
      );
      const hoveredCell = this.findCellElement(hovered.tableFrom, hovered.row, hovered.col);
      if (sideAdd && wrapper && hoveredCell) {
        const wrapperRect = wrapper.getBoundingClientRect();
        const cellRect = hoveredCell.getBoundingClientRect();
        sideAdd.style.top = `${cellRect.top - wrapperRect.top + cellRect.height / 2}px`;
        sideAdd.style.left = `${cellRect.right - wrapperRect.left + 6}px`;
        sideAdd.classList.add('cm-structured-table-add-visible');
      }
    }

    if (hovered.row === table.rows.length - 1) {
      const bottomAdd = this.view.dom.querySelector<HTMLElement>(
        `[data-bottom-add="true"][data-table-from="${hovered.tableFrom}"]`,
      );
      const wrapper = this.view.dom.querySelector<HTMLElement>(
        `.cm-structured-table-wrapper[data-table-from="${hovered.tableFrom}"]`,
      );
      const hoveredCell = this.findCellElement(hovered.tableFrom, hovered.row, hovered.col);
      if (bottomAdd && wrapper && hoveredCell) {
        const wrapperRect = wrapper.getBoundingClientRect();
        const cellRect = hoveredCell.getBoundingClientRect();
        bottomAdd.style.left = `${cellRect.left - wrapperRect.left + cellRect.width / 2}px`;
        bottomAdd.style.top = `${cellRect.bottom - wrapperRect.top}px`;
        bottomAdd.classList.add('cm-structured-table-add-visible');
      }
    }
  }

  private focusCellFromElement(element: HTMLElement, event?: MouseEvent): void {
    const row = Number(element.dataset.cellRow);
    const col = Number(element.dataset.cellCol);
    const tableFrom = Number(element.dataset.tableFrom);
    const mapping = findTableMappingAt(this.view.state, tableFrom);
    const cell = mapping?.rows[row]?.cells[col];
    if (!mapping || !cell) return;
    this.fallbackEditingCell = {
      tableFrom,
      row,
      col,
      from: cell.from,
      to: cell.to,
      contentFrom: cell.contentFrom,
      contentTo: cell.contentTo,
      text: cell.text,
      isHeader: cell.isHeader,
    };

    const editing = shouldOpenOverlay(this.view);
    const offset = event ? getCellTextOffsetFromEvent(element, event, cell.text.length) : 0;
    this.view.dispatch({
      selection: EditorSelection.single(cell.contentFrom + offset),
      effects: [
        setFocusCellEffect.of({
          tableFrom,
          row,
          col,
          editing,
        }),
        setStructureSelectionEffect.of(null),
      ],
      scrollIntoView: true,
    });
    this.hoveredCell = { tableFrom, row, col };
    this.syncHoverAffordances();
    if (!editing) {
      this.view.focus();
      this.syncOverlay();
    }
  }

  private clearFocusedCell(): void {
    const state = this.view.state.field(structuredTableUiField);
    if (!state.focusCell && !state.structureSelection) return;
    this.fallbackEditingCell = null;

    this.view.dispatch({
      effects: [setFocusCellEffect.of(null), setStructureSelectionEffect.of(null)],
    });
  }

  private scheduleOutsideClear(target: HTMLElement): void {
    if (this.pendingOutsideClear) return;
    this.pendingOutsideClear = true;
    window.setTimeout(() => {
      this.pendingOutsideClear = false;
      if (document.activeElement === this.overlay) {
        this.overlay.blur();
      }
      this.clearFocusedCell();
      if (target.closest('.cm-content, .cm-line, .cm-editor, .cm-scroller')) {
        this.view.focus();
        queueMicrotask(() => {
          this.view.focus();
        });
        window.setTimeout(() => {
          this.view.focus();
        }, 0);
      }
    }, 0);
  }

  private resolveContextMenuSelection(target: HTMLElement): TableStructureSelection | null {
    const handle = target.closest<HTMLElement>('[data-structure-kind]');
    if (handle) {
      return {
        tableFrom: Number(handle.dataset.tableFrom),
        kind: handle.dataset.structureKind as StructureSelectionKind,
        index: Number(handle.dataset.structureIndex),
      };
    }

    const current = this.view.state.field(structuredTableUiField).structureSelection;
    if (!current) {
      return null;
    }

    const cell = target.closest<HTMLElement>('[data-action="focus-cell"]');
    if (!cell) {
      return null;
    }

    const tableFrom = Number(cell.dataset.tableFrom);
    const row = Number(cell.dataset.cellRow);
    const col = Number(cell.dataset.cellCol);

    if (tableFrom !== current.tableFrom) {
      return null;
    }

    if (current.kind === 'row' && row === current.index) {
      return current;
    }

    if (current.kind === 'column' && col === current.index) {
      return current;
    }

    return null;
  }

  private selectStructureFromElement(element: HTMLElement): void {
    const kind = element.dataset.structureKind as StructureSelectionKind;
    const index = Number(element.dataset.structureIndex);
    const tableFrom = Number(element.dataset.tableFrom);
    this.fallbackEditingCell = null;

    this.view.dispatch({
      effects: [
        setStructureSelectionEffect.of({ tableFrom, kind, index }),
        setFocusCellEffect.of(null),
      ],
    });
  }

  private runAppendRow(tableFrom: number): void {
    const mapping = findTableMappingAt(this.view.state, tableFrom);
    if (!mapping) return;
    const rewrite = insertTableRow(mapping, mapping.rows.length - 1, 'after');
    applyRewrite(this.view, mapping, rewrite, true);
  }

  private runAppendColumn(tableFrom: number): void {
    const mapping = findTableMappingAt(this.view.state, tableFrom);
    if (!mapping) return;
    const rewrite = insertTableColumn(mapping, mapping.columnCount - 1, 'after');
    applyRewrite(this.view, mapping, rewrite, true);
  }

  private handleMenuAction(element: HTMLElement): void {
    const action = element.dataset.action;
    const kind = element.dataset.structureKind as StructureSelectionKind;
    const index = Number(element.dataset.structureIndex);
    const tableFrom = Number(element.dataset.tableFrom);
    const mapping = findTableMappingAt(this.view.state, tableFrom);

    if (!mapping) return;

    let rewrite = null;

    if (kind === 'row') {
      if (action === 'menu-delete') {
        rewrite = deleteTableRow(mapping, index);
      } else if (action === 'menu-insert-before') {
        rewrite = insertTableRow(mapping, index, 'before');
      } else if (action === 'menu-insert-after') {
        rewrite = insertTableRow(mapping, index, 'after');
      }
    } else {
      if (action === 'menu-delete') {
        rewrite = deleteTableColumn(mapping, index);
      } else if (action === 'menu-insert-before') {
        rewrite = insertTableColumn(mapping, index, 'before');
      } else if (action === 'menu-insert-after') {
        rewrite = insertTableColumn(mapping, index, 'after');
      }
    }

    this.closeMenu();

    if (!rewrite) return;
    applyRewrite(this.view, mapping, rewrite, true);
  }

  private closeMenu(): void {
    this.menuState = null;
    this.syncMenu();
  }

  private findCellElement(tableFrom: number, row: number, col: number): HTMLElement | null {
    return this.view.dom.querySelector<HTMLElement>(
      `[data-table-from="${tableFrom}"][data-cell-row="${row}"][data-cell-col="${col}"]`,
    );
  }

  private resolveEditingCellBinding(focusCell: TableFocusCell): EditingCellBinding | null {
    const table = findTableMappingAt(this.view.state, focusCell.tableFrom);
    const cell = table?.rows[focusCell.row]?.cells[focusCell.col];
    if (cell) {
      return {
        tableFrom: focusCell.tableFrom,
        row: focusCell.row,
        col: focusCell.col,
        from: cell.from,
        to: cell.to,
        contentFrom: cell.contentFrom,
        contentTo: cell.contentTo,
        text: cell.text,
        isHeader: cell.isHeader,
      };
    }

    const fallback = this.fallbackEditingCell;
    if (
      fallback &&
      fallback.tableFrom === focusCell.tableFrom &&
      fallback.row === focusCell.row &&
      fallback.col === focusCell.col
    ) {
      return fallback;
    }

    return null;
  }
}

function normalizeStructuredTableSelection(view: EditorView): boolean {
  const selection = view.state.selection.main;
  if (!selection.empty) return false;

  const position = selection.head;
  const table = findTableMappingAt(view.state, position);
  if (!table) return false;
  if (position < table.from || position > table.to) return false;

  const located = locateCellAtDocumentPosition(table, position, 1);
  if (!located) return false;

  const targetPosition = clamp(position, located.cell.contentFrom, located.cell.contentTo);
  const nextFocusCell: TableFocusCell = {
    tableFrom: table.from,
    row: located.cell.row,
    col: located.cell.col,
    editing: shouldOpenOverlay(view),
  };

  const currentFocusCell = view.state.field(structuredTableUiField).focusCell;
  const shouldMoveSelection = targetPosition !== position;
  const shouldUpdateFocus = !sameFocusCell(currentFocusCell, nextFocusCell);

  if (!shouldMoveSelection && !shouldUpdateFocus) {
    return false;
  }

  view.dispatch({
    selection: EditorSelection.single(targetPosition),
    effects: [
      setFocusCellEffect.of(nextFocusCell),
      setStructureSelectionEffect.of(null),
    ],
  });
  return true;
}

function locateCellAtDocumentPosition(
  table: TableMapping,
  position: number,
  side: number,
): { cell: TableMapping['rows'][number]['cells'][number]; position: number } | null {
  for (const row of table.rows) {
    if (position >= row.from && position <= row.to) {
      const cell = findClosestCellInRow(row, position, side);
      if (cell) {
        return {
          cell,
          position: clamp(position, cell.contentFrom, cell.contentTo),
        };
      }
    }

    for (const cell of row.cells) {
      if (position >= cell.contentFrom && position <= cell.contentTo) {
        return { cell, position };
      }

      if (position > cell.from && position < cell.to) {
        return {
          cell,
          position:
            side < 0 ? cell.contentFrom : side > 0 ? cell.contentTo : clamp(position, cell.contentFrom, cell.contentTo),
        };
      }
    }
  }

  if (position <= table.from) {
    const firstCell = table.rows[0]?.cells[0];
    return firstCell ? { cell: firstCell, position: firstCell.contentFrom } : null;
  }

  const lastRow = table.rows[table.rows.length - 1];
  const lastCell = lastRow?.cells[lastRow.cells.length - 1];
  return lastCell ? { cell: lastCell, position: lastCell.contentTo } : null;
}

function findCellCoordinatesAtPosition(
  table: TableMapping,
  position: number,
): { row: number; col: number } | null {
  for (const row of table.rows) {
    if (position >= row.from && position <= row.to) {
      const cell = findClosestCellInRow(row, position, 1);
      if (cell) {
        return { row: row.row, col: cell.col };
      }
    }

    for (const cell of row.cells) {
      if (position >= cell.from && position <= cell.to) {
        return { row: row.row, col: cell.col };
      }
    }
  }

  return null;
}

function findClosestCellInRow(
  row: TableMapping['rows'][number],
  position: number,
  side: number,
): TableMapping['rows'][number]['cells'][number] | null {
  if (!row.cells.length) return null;

  if (position <= row.cells[0].from) {
    return row.cells[0];
  }

  for (let index = 0; index < row.cells.length; index += 1) {
    const cell = row.cells[index];
    if (position >= cell.from && position <= cell.to) {
      return cell;
    }

    const nextCell = row.cells[index + 1];
    if (nextCell && position > cell.to && position < nextCell.from) {
      return side < 0 ? cell : nextCell;
    }
  }

  return row.cells[row.cells.length - 1];
}

function measureCellCaretRect(
  root: HTMLElement,
  offset: number,
  side: number,
): DOMRect | null {
  const range = document.createRange();
  const resolved = resolveDomPointAtTextOffset(root, offset, side);
  if (!resolved) {
    return root.getBoundingClientRect();
  }

  range.setStart(resolved.node, resolved.offset);
  range.setEnd(resolved.node, resolved.offset);
  const rects = range.getClientRects();
  const rect = rects[0] ?? range.getBoundingClientRect();
  if (!rect) {
    return root.getBoundingClientRect();
  }
  if (rect.width || rect.height) {
    return rect;
  }

  const contentRect = root.getBoundingClientRect();
  return new DOMRect(rect.left || contentRect.left, rect.top || contentRect.top, 1, rect.height || contentRect.height);
}

function resolveDomPointAtTextOffset(
  root: HTMLElement,
  offset: number,
  side: number,
): { node: Node; offset: number } | null {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let current = walker.nextNode();
  while (current) {
    if (current.nodeType === Node.TEXT_NODE) {
      textNodes.push(current as Text);
    }
    current = walker.nextNode();
  }

  if (!textNodes.length) {
    return { node: root, offset: side < 0 ? 0 : root.childNodes.length };
  }

  let remaining = offset;
  for (const node of textNodes) {
    const length = node.textContent?.length ?? 0;
    if (remaining <= length) {
      return { node, offset: clamp(remaining, 0, length) };
    }
    remaining -= length;
  }

  const lastNode = textNodes[textNodes.length - 1];
  return { node: lastNode, offset: lastNode.textContent?.length ?? 0 };
}

function sameFocusCell(left: TableFocusCell | null, right: TableFocusCell | null): boolean {
  return (
    left?.tableFrom === right?.tableFrom &&
    left?.row === right?.row &&
    left?.col === right?.col &&
    left?.editing === right?.editing
  );
}

function sameStructureSelection(
  left: TableStructureSelection | null,
  right: TableStructureSelection | null,
): boolean {
  return (
    left?.tableFrom === right?.tableFrom &&
    left?.kind === right?.kind &&
    left?.index === right?.index
  );
}

function shouldOpenOverlay(view: EditorView): boolean {
  const cm = getCM(view);
  if (!cm) return true;
  return Boolean(cm.state.vim?.insertMode);
}

function syncFocusCellEditingWithVimMode(view: EditorView): boolean {
  const state = view.state.field(structuredTableUiField);
  const focusCell = state.focusCell;
  if (!focusCell || !isVimEnabled(view)) {
    return false;
  }

  const shouldEdit = isVimInsertMode(view);
  if (focusCell.editing === shouldEdit) {
    return false;
  }

  view.dispatch({
    effects: setFocusCellEffect.of({
      ...focusCell,
      editing: shouldEdit,
    }),
  });
  return true;
}

function isVimInsertMode(view: EditorView): boolean {
  const cm = getCM(view);
  return Boolean(cm?.state.vim) && Boolean(cm?.state.vim?.insertMode);
}

function isVimEnabled(view: EditorView): boolean {
  return Boolean(getCM(view)?.state.vim);
}

function moveFocusCell(
  view: EditorView,
  nextRow: number,
  nextCol: number,
  editing = true,
  cursor: 'start' | 'end' | number = 'end',
): boolean {
  const state = view.state.field(structuredTableUiField);
  const current = state.focusCell;
  if (!current) return false;

  const table = findTableMappingAt(view.state, current.tableFrom);
  const nextCell = table?.rows[nextRow]?.cells[nextCol];
  if (!table || !nextCell) return false;

  const anchor =
    cursor === 'start'
      ? nextCell.contentFrom
      : cursor === 'end'
        ? nextCell.contentTo
        : nextCell.contentFrom + clamp(cursor, 0, nextCell.contentTo - nextCell.contentFrom);

  view.dispatch({
    selection: EditorSelection.single(anchor),
    effects: [
      setFocusCellEffect.of({
        tableFrom: current.tableFrom,
        row: nextRow,
        col: nextCol,
        editing,
      }),
      setStructureSelectionEffect.of(null),
    ],
    scrollIntoView: true,
  });

  return true;
}

export function enterStructuredTableFromAdjacentText(
  view: EditorView,
  direction: 1 | -1,
  editing: boolean,
  position = view.state.selection.main.head,
): boolean {
  const selection = view.state.selection.main;
  if (!selection.empty) return false;

  const currentLine = view.state.doc.lineAt(position);
  const targetLineNumber = currentLine.number + direction;
  if (targetLineNumber < 1 || targetLineNumber > view.state.doc.lines) {
    return false;
  }

  const targetLine = view.state.doc.line(targetLineNumber);
  const table = findTableMappingForLine(view.state, targetLine.from, targetLine.to);
  if (!table) return false;

  const targetRow = direction > 0 ? 0 : table.rows.length - 1;
  const targetCell = table.rows[targetRow]?.cells[0];
  if (!targetCell) return false;

  view.dispatch({
    selection: EditorSelection.single(targetCell.contentFrom),
    effects: [
      setFocusCellEffect.of({
        tableFrom: table.from,
        row: targetRow,
        col: 0,
        editing,
      }),
      setStructureSelectionEffect.of(null),
    ],
    scrollIntoView: true,
  });

  return true;
}

function findTableMappingForLine(
  state: EditorState,
  lineFrom: number,
  lineTo: number,
): TableMapping | null {
  if (lineFrom > lineTo) return null;

  const probes = new Set<number>([
    lineFrom,
    Math.min(lineTo, lineFrom + 1),
    lineTo,
    Math.max(lineFrom, lineTo - 1),
  ]);

  for (const pos of probes) {
    const table = findTableMappingAt(state, pos);
    if (table) return table;
  }

  return findTableMappingsInRange(state, lineFrom, lineTo)[0] ?? null;
}

function clearEditing(view: EditorView): boolean {
  const state = view.state.field(structuredTableUiField);
  if (!state.focusCell) return false;

  view.dispatch({
    effects: setFocusCellEffect.of({
      ...state.focusCell,
      editing: false,
    }),
  });
  return true;
}

function applyRewrite(
  view: EditorView,
  table: TableMapping,
  rewrite: { text: string; focusRow: number; focusCol: number; focusFrom: number; focusTo: number },
  editing: boolean,
): boolean {
  const changeFrom = table.from;
  let changeTo = table.to;
  let selectionBase = table.from;

  if (!rewrite.text) {
    const trailingNewline = view.state.doc.sliceString(changeTo, changeTo + 1);
    if (trailingNewline === '\n') {
      changeTo += 1;
    }
    selectionBase = changeFrom;
  }

  const newSelectionAnchor = selectionBase + rewrite.focusTo;
  const newSelectionHead = selectionBase + rewrite.focusFrom;

  view.dispatch({
    changes: {
      from: changeFrom,
      to: changeTo,
      insert: rewrite.text,
    },
    selection: EditorSelection.single(newSelectionAnchor, newSelectionHead),
    effects: [
      setFocusCellEffect.of(
        rewrite.text
          ? {
              tableFrom: table.from,
              row: rewrite.focusRow,
              col: rewrite.focusCol,
              editing,
            }
          : null,
      ),
      setStructureSelectionEffect.of(null),
    ],
    scrollIntoView: true,
  });

  return true;
}

function findPositionOutsideTable(
  state: EditorState,
  table: TableMapping,
  edge: 'start' | 'end',
): number {
  const docLength = state.doc.length;

  if (edge === 'end') {
    for (let pos = Math.min(docLength, table.to + 1); pos <= docLength; pos += 1) {
      const mapping = findTableMappingAt(state, pos);
      if (!mapping || mapping.from !== table.from) {
        return pos;
      }
    }
    return docLength;
  }

  for (let pos = Math.max(0, table.from - 1); pos >= 0; pos -= 1) {
    const mapping = findTableMappingAt(state, pos);
    if (!mapping || mapping.from !== table.from) {
      return pos;
    }
  }

  return 0;
}

function leaveStructuredTable(view: EditorView, table: TableMapping, edge: 'start' | 'end'): boolean {
  const outsidePosition = findPositionOutsideTable(view.state, table, edge);

  view.dispatch({
    selection: EditorSelection.single(outsidePosition),
    effects: [setFocusCellEffect.of(null), setStructureSelectionEffect.of(null)],
    scrollIntoView: true,
  });

  view.focus();
  queueMicrotask(() => {
    view.focus();
  });
  window.setTimeout(() => {
    view.focus();
  }, 0);
  return true;
}

function navigateFromOverlay(
  view: EditorView,
  direction: 'left' | 'right' | 'up' | 'down',
): boolean {
  const state = view.state.field(structuredTableUiField);
  const current = state.focusCell;
  if (!current) return false;

  const table = findTableMappingAt(view.state, current.tableFrom);
  if (!table) return false;

  if (direction === 'left') {
    if (current.col === 0) return false;
    return moveFocusCell(view, current.row, current.col - 1, true, 'end');
  }

  if (direction === 'right') {
    if (current.col >= table.columnCount - 1) return false;
    return moveFocusCell(view, current.row, current.col + 1, true, 'start');
  }

  if (direction === 'up') {
    if (current.row === 0) return leaveStructuredTable(view, table, 'start');
    return moveFocusCell(view, current.row - 1, current.col, true, 'end');
  }

  if (current.row >= table.rows.length - 1) return leaveStructuredTable(view, table, 'end');

  return moveFocusCell(view, current.row + 1, current.col, true, 'end');
}

function handleOverlayKeydown(
  view: EditorView,
  textarea: HTMLTextAreaElement,
  event: KeyboardEvent,
): boolean {
  const state = view.state.field(structuredTableUiField);
  const current = state.focusCell;
  if (!current) return false;

  if ((event.metaKey || event.ctrlKey) && !event.altKey) {
    const key = event.key.toLowerCase();
    if (key === 'z') {
      event.preventDefault();
      return event.shiftKey ? redo(view) : undo(view);
    }

    if (key === 'y' && !event.shiftKey) {
      event.preventDefault();
      return redo(view);
    }
  }

  const table = findTableMappingAt(view.state, current.tableFrom);
  if (!table) return false;

  if (isVimEnabled(view) && !current.editing && !isVimInsertMode(view)) {
    switch (event.key) {
      case 'h':
        event.preventDefault();
        return moveVimHorizontalInsideTable(view, -1);
      case 'l':
        event.preventDefault();
        return moveVimHorizontalInsideTable(view, 1);
      case 'j':
        event.preventDefault();
        return moveVimVerticalInsideTable(view, 1);
      case 'k':
        event.preventDefault();
        return moveVimVerticalInsideTable(view, -1);
      case 'w':
        event.preventDefault();
        return moveByWordInsideCell(view, true);
      case 'b':
        event.preventDefault();
        return moveByWordInsideCell(view, false);
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault();
        return handleTableArrowNavigation(view, event.key);
      case 'i':
      case 'a':
      case 'd':
        event.preventDefault();
        return dispatchVimKey(view, event.key);
      default:
        return false;
    }
  }

  switch (event.key) {
    case 'Escape':
      event.preventDefault();
      if (isVimEnabled(view)) {
        return exitVimInsertModeForCurrentCell(view);
      }
      clearEditing(view);
      view.focus();
      return true;
    case 'Tab':
      event.preventDefault();
      if (event.shiftKey) {
        if (current.col > 0) {
          return moveFocusCell(view, current.row, current.col - 1, true, 'end');
        }
        return false;
      }
      if (current.col < table.columnCount - 1) {
        return moveFocusCell(view, current.row, current.col + 1, true, 'start');
      }
      if (current.row < table.rows.length - 1) {
        return moveFocusCell(view, current.row + 1, 0, true, 'start');
      }
      return applyRewrite(view, table, insertTableRow(table, current.row, 'after'), true);
    case 'Enter':
      event.preventDefault();
      if (event.shiftKey) {
        if (current.row === 0) {
          return false;
        }
        return moveFocusCell(view, current.row - 1, current.col, true, 'end');
      }
      if (current.row >= table.rows.length - 1) {
        const rewrite = insertTableRow(table, current.row, 'after');
        return applyRewrite(view, table, { ...rewrite, focusCol: current.col }, true);
      }
      return moveFocusCell(view, current.row + 1, current.col, true, 'end');
    case 'ArrowLeft':
      if (textarea.selectionStart === 0 && textarea.selectionEnd === 0) {
        event.preventDefault();
        return navigateFromOverlay(view, 'left');
      }
      return false;
    case 'ArrowRight':
      if (
        textarea.selectionStart === textarea.value.length &&
        textarea.selectionEnd === textarea.value.length
      ) {
        event.preventDefault();
        return navigateFromOverlay(view, 'right');
      }
      return false;
    case 'ArrowUp':
      event.preventDefault();
      return navigateFromOverlay(view, 'up');
    case 'ArrowDown':
      event.preventDefault();
      return navigateFromOverlay(view, 'down');
    case 'Backspace':
      if (
        textarea.selectionStart === 0 &&
        textarea.selectionEnd === 0 &&
        current.col === 0 &&
        current.row === table.rows.length - 1 &&
        isRowEmpty(table, current.row)
      ) {
        event.preventDefault();
        const rewrite = deleteTableRow(table, current.row);
        if (!rewrite) return false;
        return applyRewrite(view, table, rewrite, true);
      }
      return false;
    default:
      return false;
  }
}

function handleTableArrowNavigation(view: EditorView, key: string): boolean {
  const state = view.state.field(structuredTableUiField);
  const current = state.focusCell;
  if (!current) {
    if (key === 'ArrowUp') {
      return enterStructuredTableFromAdjacentText(view, -1, shouldOpenOverlay(view));
    }
    if (key === 'ArrowDown') {
      return enterStructuredTableFromAdjacentText(view, 1, shouldOpenOverlay(view));
    }
    return false;
  }
  const table = findTableMappingAt(view.state, current.tableFrom);
  if (!table) return false;

  switch (key) {
    case 'ArrowLeft':
      if (!current.editing) {
        return moveHorizontalCaretInsideTable(view, -1, false);
      }
      return current.col > 0
        ? moveFocusCell(view, current.row, current.col - 1, shouldOpenOverlay(view), 'end')
        : false;
    case 'ArrowRight':
      if (!current.editing) {
        return moveHorizontalCaretInsideTable(view, 1, false);
      }
      return current.col < table.columnCount - 1
        ? moveFocusCell(view, current.row, current.col + 1, shouldOpenOverlay(view), 'start')
        : false;
    case 'ArrowUp':
      if (current.row === 0) {
        return leaveStructuredTable(view, table, 'start');
      }
      return moveFocusCell(view, current.row - 1, current.col, shouldOpenOverlay(view), 'end');
    case 'ArrowDown':
      if (current.row >= table.rows.length - 1) {
        return leaveStructuredTable(view, table, 'end');
      }
      return moveFocusCell(view, current.row + 1, current.col, shouldOpenOverlay(view), 'end');
    default:
      return false;
  }
}

function handleTableEnterNavigation(view: EditorView, reverse = false): boolean {
  const state = view.state.field(structuredTableUiField);
  const current = state.focusCell;
  if (!current) return false;

  const table = findTableMappingAt(view.state, current.tableFrom);
  if (!table) return false;

  if (reverse) {
    if (current.row === 0) return true;
    return moveFocusCell(view, current.row - 1, current.col, shouldOpenOverlay(view), 'end');
  }

  if (current.row >= table.rows.length - 1) {
    return applyRewrite(view, table, insertTableRow(table, current.row, 'after'), shouldOpenOverlay(view));
  }

  return moveFocusCell(view, current.row + 1, current.col, shouldOpenOverlay(view), 'end');
}

function handleTableTabNavigation(view: EditorView, reverse = false): boolean {
  const state = view.state.field(structuredTableUiField);
  const current = state.focusCell;
  if (!current) return false;
  const table = findTableMappingAt(view.state, current.tableFrom);
  if (!table) return false;

  if (reverse) {
    if (current.col === 0) return false;
    return moveFocusCell(view, current.row, current.col - 1, shouldOpenOverlay(view), 'end');
  }

  if (current.col < table.columnCount - 1) {
    return moveFocusCell(view, current.row, current.col + 1, shouldOpenOverlay(view), 'start');
  }

  if (current.row < table.rows.length - 1) {
    return moveFocusCell(view, current.row + 1, 0, shouldOpenOverlay(view), 'start');
  }

  const rewrite = insertTableRow(table, current.row, 'after');
  return applyRewrite(view, table, rewrite, shouldOpenOverlay(view));
}

function handleTableBackspace(view: EditorView): boolean {
  const state = view.state.field(structuredTableUiField);
  const current = state.focusCell;
  if (!current) return false;
  const table = findTableMappingAt(view.state, current.tableFrom);
  if (!table) return false;

  if (current.col === 0 && current.row === table.rows.length - 1 && isRowEmpty(table, current.row)) {
    const rewrite = deleteTableRow(table, current.row);
    if (!rewrite) return false;
    return applyRewrite(view, table, rewrite, shouldOpenOverlay(view));
  }

  return false;
}

function moveVimHorizontalInsideTable(view: EditorView, direction: -1 | 1): boolean {
  return moveHorizontalCaretInsideTable(view, direction, false);
}

function moveHorizontalCaretInsideTable(
  view: EditorView,
  direction: -1 | 1,
  editing: boolean,
): boolean {
  const focusCell = resolveCurrentFocusCell(view);
  if (!focusCell) return false;

  const table = findTableMappingAt(view.state, focusCell.tableFrom);
  const cell = table?.rows[focusCell.row]?.cells[focusCell.col];
  if (!table || !cell) return false;

  const offset = getCellOffset(view.state, cell);
  const cellLength = cell.contentTo - cell.contentFrom;

  if (direction < 0) {
    if (offset > 0) {
      return setCellSelection(view, focusCell, cell.contentFrom + offset - 1, editing);
    }
    return focusCell.col > 0
      ? moveFocusCell(view, focusCell.row, focusCell.col - 1, editing, 'end')
      : false;
  }

  if (offset < cellLength) {
    return setCellSelection(view, focusCell, cell.contentFrom + offset + 1, editing);
  }

  return focusCell.col < table.columnCount - 1
    ? moveFocusCell(view, focusCell.row, focusCell.col + 1, editing, 'start')
    : false;
}

function moveVimVerticalInsideTable(view: EditorView, direction: -1 | 1): boolean {
  const focusCell = resolveCurrentFocusCell(view);
  if (!focusCell) return false;

  const table = findTableMappingAt(view.state, focusCell.tableFrom);
  const cell = table?.rows[focusCell.row]?.cells[focusCell.col];
  if (!table || !cell) return false;

  const nextRow = focusCell.row + direction;
  if (nextRow < 0 || nextRow >= table.rows.length) {
    return false;
  }

  return moveFocusCell(view, nextRow, focusCell.col, false, getCellOffset(view.state, cell));
}

function moveVimOutsideStructuredTable(view: EditorView, direction: 1 | -1): boolean {
  const selection = view.state.selection.main;
  if (!selection.empty) return false;

  const currentLine = view.state.doc.lineAt(selection.head);
  const targetLineNumber = currentLine.number + direction;
  if (targetLineNumber < 1 || targetLineNumber > view.state.doc.lines) {
    return false;
  }

  const goalColumn = getVimGoalColumn(view, selection.head - currentLine.from);
  if (enterStructuredTableFromAdjacentText(view, direction, false, selection.head)) {
    setVimGoalColumn(view, goalColumn);
    return true;
  }

  const targetLine = view.state.doc.line(targetLineNumber);
  const targetPosition = Math.min(targetLine.to, targetLine.from + goalColumn);
  view.dispatch({
    selection: EditorSelection.single(targetPosition),
    effects: [setFocusCellEffect.of(null), setStructureSelectionEffect.of(null)],
    scrollIntoView: true,
  });
  setVimGoalColumn(view, goalColumn);
  return true;
}

function moveByWordInsideCell(view: EditorView, forward: boolean): boolean {
  const focusCell = resolveCurrentFocusCell(view);
  if (!focusCell) return false;
  const table = findTableMappingAt(view.state, focusCell.tableFrom);
  const cell = table?.rows[focusCell.row]?.cells[focusCell.col];
  if (!table || !cell) return false;

  const currentOffset = Math.max(0, view.state.selection.main.head - cell.contentFrom);
  const nextOffset = findWordBoundary(cell.text, currentOffset, forward);

  view.dispatch({
    selection: EditorSelection.single(cell.contentFrom + nextOffset),
    effects: setFocusCellEffect.of({
      ...focusCell,
      editing: false,
    }),
  });
  return true;
}

function setCellSelection(
  view: EditorView,
  focusCell: TableFocusCell,
  position: number,
  editing: boolean,
): boolean {
  view.dispatch({
    selection: EditorSelection.single(position),
    effects: setFocusCellEffect.of({
      ...focusCell,
      editing,
    }),
  });
  return true;
}

function dispatchVimKey(view: EditorView, key: string): boolean {
  const cm = getCM(view);
  if (!cm) return false;
  Vim.handleKey(cm, key, 'structured-table');
  syncFocusCellEditingWithVimMode(view);
  return true;
}

function getVimGoalColumn(view: EditorView, fallback: number): number {
  const cm = getCM(view);
  const lastHPos = cm?.state.vim?.lastHPos;
  return typeof lastHPos === 'number' && lastHPos >= 0 ? lastHPos : fallback;
}

function setVimGoalColumn(view: EditorView, value: number): void {
  const cm = getCM(view);
  if (!cm?.state.vim) return;
  cm.state.vim.lastHPos = value;
}

function enterVimInsertModeForCurrentCell(view: EditorView, key: 'i' | 'a'): boolean {
  return dispatchVimKey(view, key);
}

function exitVimInsertModeForCurrentCell(view: EditorView): boolean {
  const cm = getCM(view);
  if (!cm?.state.vim) {
    return clearEditing(view);
  }
  Vim.exitInsertMode(cm as Parameters<typeof Vim.exitInsertMode>[0]);
  syncFocusCellEditingWithVimMode(view);
  view.focus();
  return true;
}

function getSelectionRangeInCell(
  state: EditorState,
  cell: TableMapping['rows'][number]['cells'][number],
): { start: number; end: number } {
  return {
    start: getClampedCellPosition(state.selection.main.from, cell),
    end: getClampedCellPosition(state.selection.main.to, cell),
  };
}

function getCellOffset(
  state: EditorState,
  cell: TableMapping['rows'][number]['cells'][number],
): number {
  return getClampedCellPosition(state.selection.main.head, cell);
}

function getClampedCellPosition(
  position: number,
  cell: TableMapping['rows'][number]['cells'][number],
): number {
  return clamp(position - cell.contentFrom, 0, cell.contentTo - cell.contentFrom);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function resolveColumnTextAlign(alignment: TableAlignment): 'left' | 'center' | 'right' {
  switch (alignment) {
    case 'center':
      return 'center';
    case 'right':
      return 'right';
    default:
      return 'left';
  }
}

function estimateStructuredTableHeight(table: TableMapping): number {
  const baseRowHeight = 30;
  const imageRowHeight = 96;
  const verticalMargin = 0;

  let total = verticalMargin;
  for (const row of table.rows) {
    const hasImageCell = row.cells.some((cell) => /!\[[^\]]*]\((\S+?)(?:\s+["'][^"']*["'])?\)/.test(cell.text));
    total += hasImageCell ? imageRowHeight : baseRowHeight;
  }

  return total;
}

function getCellTextOffsetFromEvent(
  cellElement: HTMLElement,
  event: MouseEvent,
  textLength: number,
): number {
  const content =
    cellElement.querySelector<HTMLElement>('.cm-structured-table-cell-content') ?? cellElement;
  const docWithCaret = document as Document & {
    caretPositionFromPoint?: (
      x: number,
      y: number,
    ) => { offsetNode: Node; offset: number } | null;
    caretRangeFromPoint?: (
      x: number,
      y: number,
    ) => { startContainer: Node; startOffset: number } | null;
  };

  const position = docWithCaret.caretPositionFromPoint?.(event.clientX, event.clientY);
  const range = docWithCaret.caretRangeFromPoint?.(event.clientX, event.clientY);
  const offset =
    (position &&
      getTextOffsetWithinRoot(content, position.offsetNode, position.offset)) ??
    (range && getTextOffsetWithinRoot(content, range.startContainer, range.startOffset));

  if (offset != null) {
    return clamp(offset, 0, textLength);
  }

  const rect = cellElement.getBoundingClientRect();
  if (!rect.width) return 0;
  return event.clientX >= rect.left + rect.width / 2 ? textLength : 0;
}

function getTextOffsetWithinRoot(root: Node, targetNode: Node, targetOffset: number): number | null {
  if (root !== targetNode && !root.contains(targetNode)) {
    return null;
  }

  let total = 0;

  function measure(node: Node): number {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent?.length ?? 0;
    }

    let length = 0;
    for (const child of node.childNodes) {
      length += measure(child);
    }
    return length;
  }

  function walk(node: Node): boolean {
    if (node === targetNode) {
      if (node.nodeType === Node.TEXT_NODE) {
        total += clamp(targetOffset, 0, node.textContent?.length ?? 0);
        return true;
      }

      const boundedOffset = clamp(targetOffset, 0, node.childNodes.length);
      for (let index = 0; index < boundedOffset; index += 1) {
        total += measure(node.childNodes[index]);
      }
      return true;
    }

    if (node.nodeType === Node.TEXT_NODE) {
      total += node.textContent?.length ?? 0;
      return false;
    }

    for (const child of node.childNodes) {
      if (walk(child)) {
        return true;
      }
    }

    return false;
  }

  return walk(root) ? total : null;
}

function getCellFocusKey(element: HTMLElement): string {
  return `${element.dataset.tableFrom ?? ''}:${element.dataset.cellRow ?? ''}:${element.dataset.cellCol ?? ''}`;
}

function resolveCurrentFocusCell(view: EditorView): TableFocusCell | null {
  const focusCell = view.state.field(structuredTableUiField).focusCell;
  if (focusCell) {
    const table = findTableMappingAt(view.state, focusCell.tableFrom);
    const cell = table?.rows[focusCell.row]?.cells[focusCell.col];
    const pos = view.state.selection.main.head;
    if (cell && pos >= cell.from && pos <= cell.to) {
      return focusCell;
    }
  }

  const pos = view.state.selection.main.head;
  const table = findTableMappingAt(view.state, pos);
  if (!table) return null;

  for (const row of table.rows) {
    for (const cell of row.cells) {
      if (pos >= cell.from && pos <= cell.to) {
        return {
          tableFrom: table.from,
          row: row.row,
          col: cell.col,
          editing: false,
        };
      }
    }
  }

  return null;
}

function findWordBoundary(text: string, from: number, forward: boolean): number {
  const isWord = (value: string) => /[\p{L}\p{N}_]/u.test(value);

  if (forward) {
    let index = from;
    while (index < text.length && isWord(text[index])) index += 1;
    while (index < text.length && !isWord(text[index])) index += 1;
    return index;
  }

  let index = Math.max(0, from - 1);
  while (index > 0 && !isWord(text[index])) index -= 1;
  while (index > 0 && isWord(text[index - 1])) index -= 1;
  return index;
}

function renderInlinePreview(text: string): DocumentFragment {
  const fragment = document.createDocumentFragment();
  const top = parseInlinePreviewText(text);
  const root = top.firstChild ?? top;
  appendInlineChildren(fragment, root, text, new Set());
  return fragment;
}

function appendInlineChildren(
  parent: Node,
  node: TreeNode,
  text: string,
  hiddenNodeNames: Set<string>,
): void {
  let cursor = node.from;

  for (let child = node.firstChild; child; child = child.nextSibling) {
    if (child.from > cursor) {
      parent.appendChild(document.createTextNode(text.slice(cursor, child.from)));
    }

    appendInlineNode(parent, child, text, hiddenNodeNames);
    cursor = child.to;
  }

  if (cursor < node.to) {
    parent.appendChild(document.createTextNode(text.slice(cursor, node.to)));
  }
}

function appendInlineNode(
  parent: Node,
  node: TreeNode,
  text: string,
  hiddenNodeNames: Set<string>,
): void {
  if (hiddenNodeNames.has(node.name)) return;

  switch (node.name) {
    case 'Paragraph':
    case 'Document':
      appendInlineChildren(parent, node, text, hiddenNodeNames);
      return;
    case 'StrongEmphasis': {
      const strong = document.createElement('strong');
      appendInlineChildren(strong, node, text, new Set([...hiddenNodeNames, 'EmphasisMark']));
      parent.appendChild(strong);
      return;
    }
    case 'Emphasis': {
      const em = document.createElement('em');
      appendInlineChildren(em, node, text, new Set([...hiddenNodeNames, 'EmphasisMark']));
      parent.appendChild(em);
      return;
    }
    case 'InlineCode': {
      const code = document.createElement('code');
      code.className = 'cm-structured-table-inline-code';
      code.textContent = stripBacktickMarkers(text.slice(node.from, node.to));
      parent.appendChild(code);
      return;
    }
    case 'Link': {
      const match = text.slice(node.from, node.to).match(/^\[(?<label>.*)\]\((?<href>\S+?)\)$/);
      if (!match?.groups?.href) {
        parent.appendChild(document.createTextNode(text.slice(node.from, node.to)));
        return;
      }
      const link = document.createElement('a');
      link.className = 'cm-structured-table-link';
      link.href = match.groups.href;
      link.textContent = match.groups.label ?? match.groups.href;
      link.target = '_blank';
      link.rel = 'noreferrer noopener';
      parent.appendChild(link);
      return;
    }
    case 'Image': {
      const match = text
        .slice(node.from, node.to)
        .match(/^!\[(?<alt>[^\]]*)\]\((?<src>\S+?)(?:\s+["'][^"']*["'])?\)$/);
      if (!match?.groups?.src) {
        parent.appendChild(document.createTextNode(text.slice(node.from, node.to)));
        return;
      }
      const image = document.createElement('img');
      image.className = 'cm-structured-table-image';
      image.src = match.groups.src;
      image.alt = match.groups.alt ?? '';
      image.loading = 'lazy';
      parent.appendChild(image);
      return;
    }
    case 'HTMLTag': {
      const raw = text.slice(node.from, node.to);
      if (raw === '<br>' || raw === '<br/>') {
        parent.appendChild(document.createElement('br'));
        return;
      }
      parent.appendChild(document.createTextNode(raw));
      return;
    }
    case 'LinkMark':
    case 'EmphasisMark':
    case 'URL':
    case 'CodeMark':
      return;
    default:
      parent.appendChild(document.createTextNode(text.slice(node.from, node.to)));
  }
}

function stripBacktickMarkers(text: string): string {
  const match = text.match(/^(`+)([\s\S]*)(\1)$/);
  return match ? match[2] : text.replace(/^`|`$/g, '');
}

export function setupStructuredTableVim(): void {
  // Structured table Vim behavior is implemented by local key interception
  // so it only applies when the active focus is inside a structured table.
}

const structuredTableTransactionFilter = EditorState.transactionFilter.of((transaction) => {
  if (!transaction.docChanged) return transaction;

  const focusCell = transaction.startState.field(structuredTableUiField, false)?.focusCell;
  if (!focusCell) return transaction;

  const table = findTableMappingAt(transaction.startState, focusCell.tableFrom);
  const cell = table?.rows[focusCell.row]?.cells[focusCell.col];
  if (!table || !cell) return transaction;

  let changeCount = 0;
  let deletionFrom = -1;
  let deletionTo = -1;
  let deletionInsert = '';
  transaction.changes.iterChanges((fromA, toA, _fromB, _toB, insert) => {
    changeCount += 1;
    deletionFrom = fromA;
    deletionTo = toA;
    deletionInsert = insert.toString();
  });

  if (changeCount !== 1) {
    return transaction;
  }

  if (deletionInsert.length > 0) {
    return transaction;
  }

  const line = transaction.startState.doc.lineAt(cell.contentFrom);
  const lineDeleteFrom = line.from;
  const lineDeleteTo =
    line.to < transaction.startState.doc.length ? line.to + 1 : transaction.startState.doc.length;

  if (deletionFrom !== lineDeleteFrom || deletionTo !== lineDeleteTo) {
    return transaction;
  }

  const rewrite = deleteTableRow(table, focusCell.row);
  if (!rewrite) {
    return [
      {
        selection: EditorSelection.single(cell.contentTo),
        effects: [
          setFocusCellEffect.of({
            ...focusCell,
            editing: false,
          }),
          setStructureSelectionEffect.of(null),
        ],
        scrollIntoView: true,
      },
    ];
  }

  return [
    {
      changes: {
        from: table.from,
        to: table.to,
        insert: rewrite.text,
      },
      selection: EditorSelection.single(table.from + rewrite.focusTo, table.from + rewrite.focusFrom),
      effects: [
        setFocusCellEffect.of({
          tableFrom: table.from,
          row: rewrite.focusRow,
          col: rewrite.focusCol,
          editing: false,
        }),
        setStructureSelectionEffect.of(null),
      ],
      scrollIntoView: true,
    },
  ];
});

export function createStructuredTableExtensions(): Extension {
  return [
    STRUCTURED_TABLE_THEME,
    structuredTableUiField,
    structuredTableDecorationsField,
    lineNumberWidgetMarker.of((view, widget) => {
      if (!(widget instanceof StructuredTableWidget)) return null;
      const lineNumber = view.state.doc.lineAt(widget.table.from).number;
      return new StructuredTableLineNumberMarker(lineNumber);
    }),
    structuredTableTransactionFilter,
    Prec.highest(
      keymap.of([
        { key: 'ArrowLeft', run: (view) => handleTableArrowNavigation(view, 'ArrowLeft') },
        { key: 'ArrowRight', run: (view) => handleTableArrowNavigation(view, 'ArrowRight') },
        { key: 'ArrowUp', run: (view) => handleTableArrowNavigation(view, 'ArrowUp') },
        { key: 'ArrowDown', run: (view) => handleTableArrowNavigation(view, 'ArrowDown') },
        { key: 'Enter', run: (view) => handleTableEnterNavigation(view, false) },
        { key: 'Shift-Enter', run: (view) => handleTableEnterNavigation(view, true) },
        { key: 'Tab', run: (view) => handleTableTabNavigation(view, false) },
        { key: 'Shift-Tab', run: (view) => handleTableTabNavigation(view, true) },
        { key: 'Backspace', run: (view) => handleTableBackspace(view) },
        { key: 'Escape', run: (view) => clearEditing(view) },
      ]),
    ),
    ViewPlugin.fromClass(StructuredTablePlugin),
  ];
}

export function isStructuredTableOverlayTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && Boolean(target.closest('.cm-structured-table-overlay'));
}

function buildStructuredTableDecorations(state: EditorView['state']): DecorationSet {
  const widgets = findTableMappingsInRange(state, 0, state.doc.length).map((table) =>
    Decoration.replace({
      block: true,
      widget: new StructuredTableWidget(
        table,
        state.field(structuredTableUiField),
        state.selection.main.head,
      ),
    }).range(table.from, table.to),
  );

  return Decoration.set(widgets, true);
}
