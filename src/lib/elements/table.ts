// src/lib/elements/table.ts
import { Table } from 'console-table-printer';

// Catppuccin Frappe colors for table styling
const TABLE_STYLE = {
  headerBottom: { left: '├', mid: '┼', other: '─', right: '┤' },
  headerTop: { left: '┌', mid: '┬', other: '─', right: '┐' },
  tableBottom: { left: '└', mid: '┴', other: '─', right: '┘' },
  vertical: '│'
};

const ROW_COLOR = 'white';

interface TableOptions {
  width?: number;
}

export function renderTable(headers: string[], rows: string[][], options?: TableOptions): string {
  const numColumns = headers.length;

  // Calculate maxLen per column if width constraint provided
  let columnMaxLens: number[] | undefined;
  if (options?.width && numColumns > 0) {
    // Table structure: │ col1 │ col2 │ col3 │
    // Borders: numColumns + 1, Padding: 2 per column
    const borderOverhead = numColumns + 1 + 2 * numColumns;
    const availableForContent = options.width - borderOverhead;
    // Distribute evenly, with remainder going to first columns
    const baseLen = Math.max(10, Math.floor(availableForContent / numColumns));
    const remainder = availableForContent - baseLen * numColumns;
    columnMaxLens = headers.map((_, i) => (i < remainder ? baseLen + 1 : baseLen));
  }

  const table = new Table({
    colorMap: {
      custom_header: '\x1b[38;5;189m\x1b[1m', // frappe.text + bold
      custom_row: '\x1b[38;5;146m' // frappe.subtext1
    },
    columns: headers.map((header, i) => ({
      alignment: 'left' as const,
      color: ROW_COLOR,
      maxLen: columnMaxLens?.[i],
      name: header
    })),
    style: {
      headerBottom: TABLE_STYLE.headerBottom,
      headerTop: TABLE_STYLE.headerTop,
      tableBottom: TABLE_STYLE.tableBottom,
      vertical: TABLE_STYLE.vertical
    }
  });

  for (const row of rows) {
    const rowObj = Object.fromEntries(headers.map((header, i) => [header, row[i] ?? '']));
    table.addRow(rowObj, { color: 'custom_row' });
  }

  return table.render();
}
