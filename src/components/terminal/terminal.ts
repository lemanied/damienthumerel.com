import {
  runCommand,
  completeToken,
  type Ctx,
  type Line,
  type TermData,
  type CommandResult,
} from './commands';

type BootLine = { text: string; delay: number; ok?: boolean };

const PROMPT = 'guest@damienthumerel:~$';
const PROMPT_PROJECTS = 'guest@damienthumerel:~/projects$';

function prompt(ctx: Ctx): string {
  return ctx.cwd === 'projects' ? PROMPT_PROJECTS : PROMPT;
}

const BOOT_LINES: BootLine[] = [
  { text: '[  OK  ] Mounting /home ...', delay: 300, ok: true },
  { text: '[  OK  ] Starting damienthumerel terminal ...', delay: 500, ok: true },
  { text: '[  OK  ] Loading user profile: guest', delay: 400, ok: true },
  { text: '[  OK  ] Welcome.', delay: 400, ok: true },
  { text: '', delay: 150 },
];

function readData(): TermData {
  const el = document.getElementById('term-data');
  if (!el) throw new Error('terminal: #term-data not found');
  return JSON.parse(el.textContent ?? '{}') as TermData;
}

function appendLine(screen: HTMLElement, line: Line): void {
  const el = document.createElement('pre');
  el.className = `term__line term__line--${line.kind}`;
  el.textContent = line.text;
  screen.appendChild(el);
}

function appendPromptLine(screen: HTMLElement, ctx: Ctx, command: string): void {
  const el = document.createElement('pre');
  el.className = 'term__line term__line--prompt';
  el.textContent = `${prompt(ctx)} ${command}`;
  screen.appendChild(el);
}

function appendBootLine(screen: HTMLElement, line: BootLine): void {
  const el = document.createElement('pre');
  el.className = 'term__line term__line--boot';
  if (line.ok) {
    const match = line.text.match(/^\[(\s+OK\s+)\](.*)$/);
    if (match) {
      el.innerHTML = '[<span class="ok">' + escapeHtml(match[1]) + '</span>]' + escapeHtml(match[2]);
      screen.appendChild(el);
      return;
    }
  }
  el.textContent = line.text;
  screen.appendChild(el);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function clearScreen(screen: HTMLElement): void {
  while (screen.firstChild) screen.removeChild(screen.firstChild);
}

function scrollToBottom(root: HTMLElement): void {
  root.scrollIntoView({ block: 'end' });
  window.scrollTo({ top: document.documentElement.scrollHeight });
}

function applyResult(screen: HTMLElement, result: CommandResult): 'exit' | null {
  const lines = Array.isArray(result) ? result : result.lines;
  const effect = Array.isArray(result) ? undefined : result.effect;
  if (effect === 'clear') {
    clearScreen(screen);
    return null;
  }
  for (const line of lines) appendLine(screen, line);
  if (effect === 'exit') return 'exit';
  return null;
}

async function runBoot(screen: HTMLElement, skipFlag: { skip: boolean }): Promise<void> {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for (const line of BOOT_LINES) {
    if (skipFlag.skip || reduced) {
      appendBootLine(screen, line);
      continue;
    }
    await sleep(line.delay);
    if (skipFlag.skip) {
      appendBootLine(screen, line);
      continue;
    }
    appendBootLine(screen, line);
    scrollToBottom(screen);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function longestCommonPrefix(strings: string[]): string {
  if (strings.length === 0) return '';
  let prefix = strings[0];
  for (const s of strings.slice(1)) {
    while (!s.startsWith(prefix)) {
      prefix = prefix.slice(0, -1);
      if (prefix === '') return '';
    }
  }
  return prefix;
}

function init(): void {
  const root = document.querySelector<HTMLElement>('[data-term-root]');
  const screen = document.querySelector<HTMLElement>('[data-term-screen]');
  const form = document.querySelector<HTMLFormElement>('[data-term-form]');
  const input = document.querySelector<HTMLInputElement>('[data-term-input]');
  const prefix = document.querySelector<HTMLElement>('[data-term-prefix]');
  const skipHint = document.querySelector<HTMLElement>('[data-term-skip]');

  if (!root || !screen || !form || !input || !prefix) {
    return;
  }

  const data = readData();

  const ctx: Ctx = {
    data,
    cwd: 'home',
    history: [],
    clearScreen: () => clearScreen(screen),
    exit: () => {
      window.location.href = '/';
    },
  };

  form.classList.add('term__form--hidden');
  const skipFlag = { skip: false };
  const onAnyKey = () => { skipFlag.skip = true; };
  window.addEventListener('keydown', onAnyKey, { once: true });

  runBoot(screen, skipFlag).then(() => {
    window.removeEventListener('keydown', onAnyKey);
    skipHint?.remove();

    appendLine(screen, { kind: 'out', text: data.motd });
    appendLine(screen, { kind: 'dim', text: "type `help` to see available commands." });
    appendLine(screen, { kind: 'out', text: '' });

    form.classList.remove('term__form--hidden');
    prefix.textContent = prompt(ctx);
    input.focus();
    scrollToBottom(screen);
  });

  root.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('a')) return;
    input.focus();
  });

  let historyCursor = -1;
  let pendingInput = '';

  input.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (ctx.history.length === 0) return;
      if (historyCursor === -1) {
        pendingInput = input.value;
        historyCursor = ctx.history.length - 1;
      } else if (historyCursor > 0) {
        historyCursor -= 1;
      }
      input.value = ctx.history[historyCursor];
      input.setSelectionRange(input.value.length, input.value.length);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyCursor === -1) return;
      if (historyCursor < ctx.history.length - 1) {
        historyCursor += 1;
        input.value = ctx.history[historyCursor];
      } else {
        historyCursor = -1;
        input.value = pendingInput;
      }
      input.setSelectionRange(input.value.length, input.value.length);
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const matches = completeToken(input.value, ctx);
      if (matches.length === 0) return;
      if (matches.length === 1) {
        const trailingSpace = /\s$/.test(input.value);
        const tokens = input.value.split(/\s+/);
        if (trailingSpace) tokens.push('');
        tokens[tokens.length - 1] = matches[0];
        input.value = tokens.join(' ') + (matches[0].endsWith('/') ? '' : ' ');
        return;
      }
      const prefixMatch = longestCommonPrefix(matches);
      const trailingSpace = /\s$/.test(input.value);
      const tokens = input.value.split(/\s+/);
      if (trailingSpace) tokens.push('');
      if (prefixMatch.length > tokens[tokens.length - 1].length) {
        tokens[tokens.length - 1] = prefixMatch;
        input.value = tokens.join(' ');
      }
      appendLine(screen, { kind: 'dim', text: matches.join('  ') });
      scrollToBottom(screen);
      return;
    }

    if (historyCursor !== -1 && e.key.length === 1) {
      historyCursor = -1;
      pendingInput = '';
    }
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const raw = input.value;
    input.value = '';
    historyCursor = -1;
    pendingInput = '';

    appendPromptLine(screen, ctx, raw);

    const trimmed = raw.trim();
    if (trimmed !== '' && ctx.history[ctx.history.length - 1] !== trimmed) {
      ctx.history.push(trimmed);
    }

    const chain = raw.split('&&').map((s) => s.trim());
    for (const cmd of chain) {
      const result = runCommand(cmd, ctx);
      const effect = applyResult(screen, result);
      if (effect === 'exit') {
        ctx.exit();
        return;
      }
    }

    prefix.textContent = prompt(ctx);
    scrollToBottom(screen);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
