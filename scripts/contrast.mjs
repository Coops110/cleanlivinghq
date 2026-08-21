/**
 * WCAG contrast checker for the palette in src/styles/global.css.
 *
 * This exists because "it looks fine" is not a measurement, and small text on
 * a phone read outdoors — which is most of this site's traffic — is exactly
 * where a marginal ratio fails first.
 *
 *   node scripts/contrast.mjs
 *
 * AA needs 4.5:1 for normal text, 3:1 for large text (>=24px, or >=18.66px
 * bold) and for non-text UI boundaries a user must perceive to operate.
 *
 * Rows marked `fill` are colours that are DELIBERATELY too low-contrast for
 * text. They are checked in the roles they are actually used in — as a
 * background behind --ink, or as a fill on dark — never as text on paper.
 */
const hex = (h) => {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const lum = (h) =>
  hex(h)
    .map((v) => v / 255)
    .map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
    .reduce((acc, v, i) => acc + v * [0.2126, 0.7152, 0.0722][i], 0);

const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};

const P = {
  ink:        '#0b1524',
  slate:      '#46586f',
  azure:      '#0b6ae0',
  azureDark:  '#0a52ad',
  cyan:       '#22d3ee',
  zest:       '#ffc400',
  coral:      '#ff5a1f',
  flame:      '#c2410c',
  paper:      '#ffffff',
  mist:       '#eff6ff',
  tint:       '#dbeafe',
  line:       '#c5dcf7',
  lineStrong: '#6f90bd',
  onDark:     '#c9d6e8',
  danger:     '#b3261e',
};

const checks = [
  // fg, bg, needed, role
  [P.ink,        P.paper, 4.5, 'body text on paper'],
  [P.slate,      P.paper, 4.5, 'secondary text on paper'],
  [P.azure,      P.paper, 4.5, 'links and headings on paper'],
  [P.azureDark,  P.paper, 4.5, 'link hover on paper'],
  [P.flame,      P.paper, 4.5, 'accent TEXT on paper'],
  [P.danger,     P.paper, 4.5, 'danger text on paper'],
  [P.slate,      P.mist,  4.5, 'secondary text on the tinted surface'],
  [P.azure,      P.mist,  4.5, 'links on the tinted surface'],
  [P.ink,        P.tint,  4.5, 'body text on the stronger tint'],
  [P.azureDark,  P.tint,  4.5, 'links on the stronger tint'],

  ['#ffffff',    P.azure, 4.5, 'primary button label (white on azure)'],
  [P.ink,        P.zest,  4.5, 'main CTA label (ink on hi-vis yellow)'],
  [P.ink,        P.coral, 4.5, 'secondary CTA label (ink on coral)'],
  [P.ink,        P.cyan,  4.5, 'badge label (ink on cyan)'],

  ['#ffffff',    P.ink,   4.5, 'text on the dark hero and footer'],
  [P.onDark,     P.ink,   4.5, 'secondary text on dark'],
  [P.zest,       P.ink,   4.5, 'hi-vis yellow on dark'],
  [P.cyan,       P.ink,   4.5, 'cyan on dark'],
  [P.coral,      P.ink,   4.5, 'coral on dark'],

  [P.lineStrong, P.paper, 3.0, 'form control borders (3:1 non-text)'],
  [P.azure,      P.paper, 3.0, 'focus ring (3:1 non-text)'],
];

// Colours that must NEVER be used as text on paper, asserted rather than assumed.
const fillOnly = [
  [P.zest,  'zest  #ffc400'],
  [P.cyan,  'cyan  #22d3ee'],
  [P.coral, 'coral #ff5a1f'],
];

let fails = 0;
console.log('\n  ratio   AA    role');
console.log('  ' + '─'.repeat(64));
for (const [fg, bg, need, role] of checks) {
  const r = ratio(fg, bg);
  const pass = r >= need;
  if (!pass) fails++;
  console.log(`  ${r.toFixed(2).padStart(5)}  ${(pass ? 'PASS' : 'FAIL').padEnd(5)} ${role}`);
}

console.log('\n  Fill-only colours — these MUST fail as text on paper:');
for (const [c, label] of fillOnly) {
  const r = ratio(c, P.paper);
  const correct = r < 4.5;
  if (!correct) fails++;
  console.log(`  ${r.toFixed(2).padStart(5)}  ${(correct ? 'ok' : 'UNEXPECTED').padEnd(5)} ${label} — never use as text; use --flame`);
}

console.log('  ' + '─'.repeat(64));
console.log(fails === 0 ? '  All checks pass.\n' : `  ${fails} failure(s).\n`);
process.exit(fails === 0 ? 0 : 1);
