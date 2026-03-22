import { markdownLanguage } from '@codemirror/lang-markdown';
import { syntaxTree } from '@codemirror/language';
import type { EditorState, Text } from '@codemirror/state';

interface TreeNode {
  name: string;
  from: number;
  to: number;
  firstChild: TreeNode | null;
  nextSibling: TreeNode | null;
  parent: TreeNode | null;
}

export type TableAlignment = 'none' | 'left' | 'right' | 'center';

export interface TableCellMapping {
  row: number;
  col: number;
  from: number;
  to: number;
  contentFrom: number;
  contentTo: number;
  text: string;
  isHeader: boolean;
}

export interface TableRowMapping {
  row: number;
  from: number;
  to: number;
  cells: TableCellMapping[];
  isHeader: boolean;
}

export interface TableMapping {
  from: number;
  to: number;
  delimiterFrom: number;
  delimiterTo: number;
  columnCount: number;
  alignments: TableAlignment[];
  rows: TableRowMapping[];
}

interface CellRewriteOffset {
  contentFrom: number;
  contentTo: number;
}

export interface TableRewriteResult {
  text: string;
  focusRow: number;
  focusCol: number;
  focusFrom: number;
  focusTo: number;
}

interface SerializedTable {
  text: string;
  cellOffsets: CellRewriteOffset[][];
}

export function normalizePastedText(text: string): string {
  return text.replace(/\r\n?/g, '\n').replace(/\n/g, '<br>');
}

export function normalizeCellText(text: string): string {
  return escapePipesOutsideInlineCode(text.replace(/\r\n?/g, '\n').replace(/\n/g, '<br>'));
}

export function findTableMappingAt(state: EditorState, pos: number): TableMapping | null {
  let node: TreeNode | null = syntaxTree(state).resolveInner(pos, 1) as unknown as TreeNode;

  while (node) {
    if (node.name === 'Table') {
      return buildTableMapping(state.doc, node);
    }
    node = node.parent;
  }

  return null;
}

export function findTableMappingsInRange(
  state: EditorState,
  from: number,
  to: number,
): TableMapping[] {
  const tables: TableMapping[] = [];

  syntaxTree(state).iterate({
    from,
    to,
    enter(node) {
      if (node.name !== 'Table') return;
      const mapping = buildTableMapping(state.doc, node.node);
      if (mapping) {
        tables.push(mapping);
      }
      return false;
    },
  });

  return tables;
}

export function updateTableCell(
  table: TableMapping,
  row: number,
  col: number,
  text: string,
): TableRewriteResult {
  const grid = toGrid(table);
  grid[row][col] = normalizeCellText(text);
  return serializeGrid(grid, table.alignments, row, col);
}

export function insertTableRow(
  table: TableMapping,
  rowIndex: number,
  position: 'before' | 'after',
): TableRewriteResult {
  const grid = toGrid(table);
  const insertAt = position === 'before' ? rowIndex : rowIndex + 1;
  const safeIndex = Math.min(Math.max(1, insertAt), grid.length);
  const emptyRow = Array.from({ length: table.columnCount }, () => '');

  grid.splice(safeIndex, 0, emptyRow);

  return serializeGrid(grid, table.alignments, safeIndex, 0);
}

export function insertTableColumn(
  table: TableMapping,
  colIndex: number,
  position: 'before' | 'after',
): TableRewriteResult {
  const grid = toGrid(table);
  const insertAt = position === 'before' ? colIndex : colIndex + 1;
  const safeIndex = Math.min(Math.max(0, insertAt), table.columnCount);

  for (const row of grid) {
    row.splice(safeIndex, 0, '');
  }

  const alignments = [...table.alignments];
  alignments.splice(safeIndex, 0, 'none');

  return serializeGrid(grid, alignments, 0, safeIndex);
}

export function deleteTableRow(table: TableMapping, row: number): TableRewriteResult | null {
  const grid = toGrid(table);

  if (row < 0 || row >= grid.length) {
    return null;
  }

  if (row === 0 && grid.length > 1) {
    return null;
  }

  grid.splice(row, 1);

  if (grid.length === 0) {
    return {
      text: '',
      focusRow: 0,
      focusCol: 0,
      focusFrom: 0,
      focusTo: 0,
    };
  }

  const nextRow = Math.min(row, grid.length - 1);
  const nextCol = Math.min(table.columnCount - 1, Math.max(0, 0));
  return serializeGrid(grid, table.alignments, nextRow, nextCol);
}

export function deleteTableColumn(table: TableMapping, col: number): TableRewriteResult | null {
  if (col < 0 || col >= table.columnCount) {
    return null;
  }

  if (table.columnCount === 1) {
    return {
      text: '',
      focusRow: 0,
      focusCol: 0,
      focusFrom: 0,
      focusTo: 0,
    };
  }

  const grid = toGrid(table);
  for (const row of grid) {
    row.splice(col, 1);
  }

  const alignments = table.alignments.filter((_, index) => index !== col);
  const nextCol = Math.min(col, alignments.length - 1);
  return serializeGrid(grid, alignments, 0, nextCol);
}

export function isCellEmpty(table: TableMapping, row: number, col: number): boolean {
  const cell = table.rows[row]?.cells[col];
  return !cell || cell.text.trim().length === 0;
}

export function isRowEmpty(table: TableMapping, row: number): boolean {
  const rowData = table.rows[row];
  if (!rowData) return false;
  return rowData.cells.every((cell) => cell.text.trim().length === 0);
}

function buildTableMapping(doc: Text, tableNode: TreeNode): TableMapping | null {
  const children = getChildren(tableNode);
  const headerNode = children.find((node) => node.name === 'TableHeader');
  const delimiterNode = children.find((node) => node.name === 'TableDelimiter');
  const rowNodes = children.filter((node) => node.name === 'TableRow');

  if (!headerNode || !delimiterNode) {
    return null;
  }

  const header = parseRowMapping(doc, headerNode, 0, true);
  if (!header || header.cells.length === 0) {
    return null;
  }

  const alignments = parseAlignments(doc, delimiterNode, header.cells.length);
  if (!alignments) {
    return null;
  }

  const rows: TableRowMapping[] = [header];

  for (const [index, rowNode] of rowNodes.entries()) {
    const row = parseRowMapping(doc, rowNode, index + 1, false);
    if (!row || row.cells.length !== header.cells.length) {
      return null;
    }
    rows.push(row);
  }

  return {
    from: tableNode.from,
    to: tableNode.to,
    delimiterFrom: delimiterNode.from,
    delimiterTo: delimiterNode.to,
    columnCount: header.cells.length,
    alignments,
    rows,
  };
}

function parseRowMapping(
  doc: Text,
  rowNode: TreeNode,
  rowIndex: number,
  isHeader: boolean,
): TableRowMapping | null {
  const segments = buildCellSegments(doc, rowNode.from, rowNode.to);
  if (segments.length === 0) {
    return null;
  }

  const cells = segments.map((segment, colIndex) =>
    buildCellMapping(doc, rowIndex, colIndex, segment.from, segment.to, isHeader),
  );

  return {
    row: rowIndex,
    from: rowNode.from,
    to: rowNode.to,
    cells,
    isHeader,
  };
}

function buildCellSegments(
  doc: Text,
  rowFrom: number,
  rowTo: number,
): Array<{ from: number; to: number }> {
  const segments: Array<{ from: number; to: number }> = [];
  const delimiterPositions = findUnescapedTablePipes(doc.sliceString(rowFrom, rowTo)).map(
    (index) => rowFrom + index,
  );

  if (delimiterPositions.length === 0) {
    return segments;
  }

  if (delimiterPositions.length === 1) {
    segments.push({ from: delimiterPositions[0] + 1, to: rowTo });
    return segments;
  }

  for (let index = 0; index < delimiterPositions.length - 1; index += 1) {
    segments.push({
      from: delimiterPositions[index] + 1,
      to: delimiterPositions[index + 1],
    });
  }

  const last = delimiterPositions[delimiterPositions.length - 1];
  if (last + 1 < rowTo) {
    segments.push({
      from: last + 1,
      to: rowTo,
    });
  }

  if (segments.length === 0 && rowFrom < rowTo) {
    segments.push({ from: rowFrom, to: rowTo });
  }

  return segments;
}

function findUnescapedTablePipes(text: string): number[] {
  const positions: number[] = [];
  let activeCodeSpanLength = 0;

  for (let index = 0; index < text.length; index += 1) {
    const current = text[index];

    if (current === '\\') {
      index += 1;
      continue;
    }

    if (current === '`') {
      let runLength = 1;
      while (index + runLength < text.length && text[index + runLength] === '`') {
        runLength += 1;
      }

      if (activeCodeSpanLength === 0) {
        activeCodeSpanLength = runLength;
      } else if (activeCodeSpanLength === runLength) {
        activeCodeSpanLength = 0;
      }

      index += runLength - 1;
      continue;
    }

    if (current === '|' && activeCodeSpanLength === 0) {
      positions.push(index);
    }
  }

  return positions;
}

function buildCellMapping(
  doc: Text,
  row: number,
  col: number,
  from: number,
  to: number,
  isHeader: boolean,
): TableCellMapping {
  let contentFrom = from;
  let contentTo = to;

  while (contentFrom < contentTo) {
    const next = doc.sliceString(contentFrom, contentFrom + 1);
    if (next !== ' ' && next !== '\t') break;
    contentFrom += 1;
  }

  while (contentTo > contentFrom) {
    const previous = doc.sliceString(contentTo - 1, contentTo);
    if (previous !== ' ' && previous !== '\t') break;
    contentTo -= 1;
  }

  return {
    row,
    col,
    from,
    to,
    contentFrom,
    contentTo,
    text: doc.sliceString(contentFrom, contentTo),
    isHeader,
  };
}

function parseAlignments(
  doc: Text,
  delimiterNode: TreeNode,
  expectedColumns: number,
): TableAlignment[] | null {
  const text = doc.sliceString(delimiterNode.from, delimiterNode.to).trim();
  const normalized = text.startsWith('|') ? text.slice(1) : text;
  const trimmed = normalized.endsWith('|') ? normalized.slice(0, -1) : normalized;
  const segments = trimmed.split('|').map((segment) => segment.trim());

  if (segments.length !== expectedColumns) {
    return null;
  }

  const alignments = segments.map(parseAlignment);
  return alignments.every((alignment) => alignment !== null)
    ? (alignments as TableAlignment[])
    : null;
}

function parseAlignment(text: string): TableAlignment | null {
  if (!/^:?-{3,}:?$/.test(text)) {
    return null;
  }

  if (text.startsWith(':') && text.endsWith(':')) return 'center';
  if (text.startsWith(':')) return 'left';
  if (text.endsWith(':')) return 'right';
  return 'none';
}

function toGrid(table: TableMapping): string[][] {
  return table.rows.map((row) => row.cells.map((cell) => cell.text));
}

function serializeGrid(
  grid: string[][],
  alignments: TableAlignment[],
  focusRow: number,
  focusCol: number,
): TableRewriteResult {
  const normalizedGrid = grid.map((row) => {
    const next = [...row];
    while (next.length < alignments.length) {
      next.push('');
    }
    return next.slice(0, alignments.length);
  });

  if (normalizedGrid.length === 0) {
    return {
      text: '',
      focusRow: 0,
      focusCol: 0,
      focusFrom: 0,
      focusTo: 0,
    };
  }

  const serialized = serializeTable(normalizedGrid, alignments);
  const targetRow = Math.min(Math.max(0, focusRow), serialized.cellOffsets.length - 1);
  const targetCol = Math.min(
    Math.max(0, focusCol),
    serialized.cellOffsets[targetRow].length - 1,
  );
  const target = serialized.cellOffsets[targetRow][targetCol];

  return {
    text: serialized.text,
    focusRow: targetRow,
    focusCol: targetCol,
    focusFrom: target.contentFrom,
    focusTo: target.contentTo,
  };
}

function serializeTable(grid: string[][], alignments: TableAlignment[]): SerializedTable {
  const lines: string[] = [];
  const cellOffsets: CellRewriteOffset[][] = [];
  let offset = 0;

  for (let rowIndex = 0; rowIndex < grid.length; rowIndex += 1) {
    const serializedRow = serializeRow(grid[rowIndex], offset);
    lines.push(serializedRow.text);
    cellOffsets.push(serializedRow.offsets);
    offset += serializedRow.text.length + 1;

    if (rowIndex === 0) {
      const delimiterLine = serializeDelimiterRow(alignments);
      lines.push(delimiterLine);
      offset += delimiterLine.length + 1;
    }
  }

  return {
    text: lines.join('\n'),
    cellOffsets,
  };
}

function serializeRow(cells: string[], rowOffset: number): {
  text: string;
  offsets: CellRewriteOffset[];
} {
  let text = '|';
  const offsets: CellRewriteOffset[] = [];

  for (const cell of cells) {
    text += ' ';
    const contentFrom = rowOffset + text.length;
    text += cell;
    const contentTo = rowOffset + text.length;
    text += ' |';
    offsets.push({
      contentFrom,
      contentTo,
    });
  }

  return { text, offsets };
}

function serializeDelimiterRow(alignments: TableAlignment[]): string {
  const segments = alignments.map((alignment) => {
    switch (alignment) {
      case 'left':
        return ':---';
      case 'right':
        return '---:';
      case 'center':
        return ':---:';
      default:
        return '---';
    }
  });

  return `| ${segments.join(' | ')} |`;
}

function escapePipesOutsideInlineCode(text: string): string {
  let index = 0;
  let result = '';

  while (index < text.length) {
    if (text[index] === '`') {
      const markerLength = countMarkerRun(text, index, '`');
      const closingIndex = findClosingMarker(text, index + markerLength, '`', markerLength);

      if (closingIndex !== -1) {
        result += text.slice(index, closingIndex + markerLength);
        index = closingIndex + markerLength;
        continue;
      }
    }

    const current = text[index];
    if (current === '|' && !isEscaped(text, index)) {
      result += '\\|';
      index += 1;
      continue;
    }

    result += current;
    index += 1;
  }

  return result;
}

function isEscaped(text: string, index: number): boolean {
  let slashCount = 0;
  let current = index - 1;

  while (current >= 0 && text[current] === '\\') {
    slashCount += 1;
    current -= 1;
  }

  return slashCount % 2 === 1;
}

function countMarkerRun(text: string, from: number, marker: string): number {
  let count = 0;
  let index = from;

  while (text[index] === marker) {
    count += 1;
    index += 1;
  }

  return count;
}

function findClosingMarker(
  text: string,
  from: number,
  marker: string,
  markerLength: number,
): number {
  let index = from;

  while (index < text.length) {
    if (text[index] === marker && countMarkerRun(text, index, marker) === markerLength) {
      return index;
    }
    index += 1;
  }

  return -1;
}

function getChildren(node: TreeNode): TreeNode[] {
  const children: TreeNode[] = [];
  for (let child = node.firstChild; child; child = child.nextSibling) {
    children.push(child);
  }
  return children;
}

export function parseInlinePreviewText(text: string): TreeNode {
  return markdownLanguage.parser.parse(text).topNode as unknown as TreeNode;
}
