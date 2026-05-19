// Src/lib/layout.ts

interface LayoutConfig {
  /** 0 = disabled, 80-120 = constrain and center */
  maxWidth: number;
  /** Enable responsive padding */
  padding: boolean;
}

interface LayoutResult {
  contentWidth: number;
  sidePadding: number;
}

const TERMINAL_EDGE_PADDING = 2;
const NARROW_CONTENT_THRESHOLD = 60;
const MEDIUM_CONTENT_THRESHOLD = 100;
const NARROW_SIDE_PADDING = 1;
const MEDIUM_SIDE_PADDING = 2;
const WIDE_SIDE_PADDING = 3;

const sidePaddingForWidth = (contentWidth: number): number => {
  if (contentWidth < NARROW_CONTENT_THRESHOLD) {
    return NARROW_SIDE_PADDING;
  }
  if (contentWidth <= MEDIUM_CONTENT_THRESHOLD) {
    return MEDIUM_SIDE_PADDING;
  }
  return WIDE_SIDE_PADDING;
};

const calculateLayout = (
  terminalWidth: number,
  defaultContentWidth: number,
  config: LayoutConfig,
): LayoutResult => {
  const { maxWidth, padding } = config;

  if (maxWidth > 0) {
    const contentWidth = Math.min(maxWidth, terminalWidth - TERMINAL_EDGE_PADDING);
    const sidePadding = Math.floor((terminalWidth - contentWidth) / 2);
    return { contentWidth, sidePadding };
  }

  if (!padding) {
    return { contentWidth: defaultContentWidth, sidePadding: 0 };
  }

  const sidePadding = sidePaddingForWidth(defaultContentWidth);

  return { contentWidth: defaultContentWidth - sidePadding * 2, sidePadding };
};

const applyPadding = (content: string, sidePadding: number): string => {
  if (sidePadding === 0) {
    return content;
  }

  const paddingStr = ' '.repeat(sidePadding);
  return content
    .split('\n')
    .map((line) => `${paddingStr}${line}`)
    .join('\n');
};

export type { LayoutConfig, LayoutResult };
export { applyPadding, calculateLayout };
