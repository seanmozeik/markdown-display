import boxen from 'boxen';
import { Effect } from 'effect';

import { loadUserConfig } from '../config';
import { loadTheme } from '../ui/themes';
import { setColorConfig } from '../ui/themes/color-support';
import {
  getAccentColor,
  getHeadingColor,
  getHexColors,
  getMutedColor,
  getSuccessColor,
} from '../ui/themes/semantic';

const prepareThemedCli = Effect.fn('md.prepareThemedCli')(function* prepareThemedCliGen() {
  const config = yield* loadUserConfig();
  setColorConfig(config.truecolor);
  loadTheme(config.theme);
});

export const showVersion = Effect.fn('md.showVersion')((version: string) =>
  Effect.gen(function* showVersionGen() {
    yield* prepareThemedCli();
    const { showBanner } = yield* Effect.promise(() => import('../ui/banner'));
    yield* Effect.promise(() => showBanner());
    const colors = getHexColors();
    console.log(
      boxen(getMutedColor()(`v${version}`), {
        borderColor: colors.accent,
        borderStyle: 'round',
        padding: { bottom: 0, left: 2, right: 2, top: 0 },
      }),
    );
  }),
);

export const showHelp = Effect.fn('md.showHelp')((version: string) =>
  Effect.gen(function* showHelpGen() {
    yield* prepareThemedCli();
    const { showBanner } = yield* Effect.promise(() => import('../ui/banner'));
    yield* Effect.promise(() => showBanner());
    console.log(getMutedColor()(`v${version}`));
    console.log();

    const h = getHeadingColor(1);
    const accent = getAccentColor();
    const opt = getSuccessColor();
    const colors = getHexColors();
    const dim = getMutedColor();
    const helpText = `${h('Usage:')}
  ${accent('md')} ${dim('[file...]')} ${dim('[options]')}

${h('Options:')}
  ${opt('-h, --help')}        Show this help message
  ${opt('-v, --version')}     Show version number
  ${opt('-w, --width <n>')}   Set output width (default: auto)
  ${opt('-t, --theme <name>')} Color theme (e.g., nord, dracula)
  ${opt('--list-themes')}     List all available themes
  ${opt('-p, --plain')}       No colors, just structure
  ${opt('-r, --raw')}         Pass through without rendering
  ${opt('--no-pager')}        Write directly, never use pager
  ${opt('--scroll')}          Horizontal scroll for code blocks
  ${opt('--wrap')}            Wrap code blocks (default)

${h('Examples:')}
  ${dim('$')} md README.md
  ${dim('$')} md README.md CHANGELOG.md
  ${dim('$')} md docs/guide.md --width 80
  ${dim('$')} cat file.md | md`;

    console.log(boxen(helpText, { borderColor: colors.accent, borderStyle: 'round', padding: 1 }));
  }),
);
