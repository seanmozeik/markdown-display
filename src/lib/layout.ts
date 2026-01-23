// src/lib/layout.ts

export interface LayoutConfig {
  maxWidth: number; // 0 = disabled, 80-120 = constrain & center
  padding: boolean; // enable responsive padding
}

export interface LayoutResult {
  contentWidth: number;
  sidePadding: number;
}

export function calculateLayout(
  terminalWidth: number,
  defaultContentWidth: number,
  config: LayoutConfig
): LayoutResult {
  const { maxWidth, padding } = config;

  // Readability mode: constrain to maxWidth and center on actual terminal
  if (maxWidth > 0) {
    const contentWidth = Math.min(maxWidth, terminalWidth - 2); // min 1 padding each side
    const sidePadding = Math.floor((terminalWidth - contentWidth) / 2);
    return { contentWidth, sidePadding };
  }

  // Padding disabled: use default content width (may be capped)
  if (!padding) {
    return { contentWidth: defaultContentWidth, sidePadding: 0 };
  }

  // Responsive padding breakpoints based on default content width
  const sidePadding = defaultContentWidth < 60 ? 1 : defaultContentWidth <= 100 ? 2 : 3;

  return {
    contentWidth: defaultContentWidth - sidePadding * 2,
    sidePadding
  };
}

export function applyPadding(content: string, sidePadding: number): string {
  if (sidePadding === 0) return content;

  const paddingStr = ' '.repeat(sidePadding);
  return content
    .split('\n')
    .map((line) => `${paddingStr}${line}`)
    .join('\n');
}
