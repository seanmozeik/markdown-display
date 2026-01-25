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

export function renderTable(headers: string[], rows: string[][]): string {
  const table = new Table({
    colorMap: {
      custom_header: '\x1b[38;5;189m\x1b[1m', // frappe.text + bold
      custom_row: '\x1b[38;5;146m' // frappe.subtext1
    },
    columns: headers.map((header) => ({
      alignment: 'left',
      color: ROW_COLOR,
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
