// Src/lib/elements/table.ts
import { Table } from 'console-table-printer';

const TABLE_STYLE = {
  headerBottom: { left: '├', mid: '┼', other: '─', right: '┤' },
  headerTop: { left: '┌', mid: '┬', other: '─', right: '┐' },
  tableBottom: { left: '└', mid: '┴', other: '─', right: '┘' },
  vertical: '│',
};

const ROW_COLOR = 'white';
const MIN_COLUMN_WIDTH = 10;

interface TableOptions {
  width?: number;
}

export const renderTable = (
  headers: string[],
  rows: string[][],
  options?: TableOptions,
): string => {
  const numColumns = headers.length;

  let columnMaxLens: number[] | undefined;
  const tableWidth = options?.width;
  if (tableWidth !== undefined && tableWidth > 0 && numColumns > 0) {
    const borderOverhead = numColumns + 1 + 2 * numColumns;
    const availableForContent = tableWidth - borderOverhead;
    const baseLen = Math.max(MIN_COLUMN_WIDTH, Math.floor(availableForContent / numColumns));
    const remainder = availableForContent - baseLen * numColumns;
    columnMaxLens = headers.map((_, i) => (i < remainder ? baseLen + 1 : baseLen));
  }

  const table = new Table({
    colorMap: {
      // Frappe.text + bold
      custom_header: '\u001B[38;5;189m\u001B[1m',
      // Frappe.subtext1
      custom_row: '\u001B[38;5;146m',
    },
    columns: headers.map((header, i) => {
      const maxLen = columnMaxLens?.[i];
      return {
        alignment: 'left' as const,
        color: ROW_COLOR,
        name: header,
        ...(maxLen === undefined ? {} : { maxLen }),
      };
    }),
    style: {
      headerBottom: TABLE_STYLE.headerBottom,
      headerTop: TABLE_STYLE.headerTop,
      tableBottom: TABLE_STYLE.tableBottom,
      vertical: TABLE_STYLE.vertical,
    },
  });

  for (const row of rows) {
    const rowObj = Object.fromEntries(headers.map((header, i) => [header, row[i] ?? '']));
    table.addRow(rowObj, { color: 'custom_row' });
  }

  return table.render();
};
