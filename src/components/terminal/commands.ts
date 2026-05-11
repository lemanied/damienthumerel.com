export type LineKind = 'out' | 'dim' | 'err' | 'ok';

export interface Line {
  kind: LineKind;
  text: string;
}

export interface TermProject {
  slug: string;
  title: string;
  summary: string;
  status: 'active' | 'archived' | 'past';
  role: string;
  year: string;
  tech: string[];
}

export interface TermData {
  motd: string;
  about: string[];
  now: string;
  contact: string[];
  secret: string[];
  projects: TermProject[];
  uname: string;
  version: string;
}

export interface Ctx {
  data: TermData;
  cwd: 'home' | 'projects';
  history: string[];
  clearScreen: () => void;
  exit: () => void;
}

export type CommandResult = Line[] | { lines: Line[]; effect?: 'clear' | 'exit' };

export type CommandFn = (args: string[], ctx: Ctx) => CommandResult;

const out = (text: string): Line => ({ kind: 'out', text });
const dim = (text: string): Line => ({ kind: 'dim', text });
const err = (text: string): Line => ({ kind: 'err', text });

function formatHelp(): Line[] {
  const rows: Array<[string, string]> = [
    ['help',              'show this message'],
    ['ls',                'list files in the current directory'],
    ['cat <file>',        'print a file (try about.txt, now.md, contact.conf)'],
    ['cd <dir>',          'change directory (only `projects` or `..`)'],
    ['whoami',            'print the current user'],
    ['sudo whoami',       'try it'],
    ['uname -a',          'print system info'],
    ['date',              'print the current date'],
    ['echo <args>',       'echo arguments'],
    ['history',           'list commands from this session'],
    ['clear',             'clear the screen'],
    ['exit',              'leave the terminal'],
  ];
  const w = Math.max(...rows.map(([k]) => k.length)) + 2;
  return [
    out('available commands:'),
    ...rows.map(([k, v]) => out(`  ${k.padEnd(w, ' ')}${v}`)),
    dim('tip: ↑/↓ cycles history, tab completes commands and filenames.'),
  ];
}

function filesAt(ctx: Ctx): string[] {
  if (ctx.cwd === 'projects') {
    return ctx.data.projects.map((p) => p.slug);
  }
  return ['about.txt', 'projects/', 'blog/', 'now.md', 'contact.conf', '.secret'];
}

function resolveFile(path: string, ctx: Ctx): { kind: 'about' | 'now' | 'contact' | 'secret' | 'project' | 'blog-dir'; slug?: string } | null {
  const parts = path.split('/').filter(Boolean);

  if (ctx.cwd === 'projects') {
    if (parts.length === 1 && ctx.data.projects.some((p) => p.slug === parts[0])) {
      return { kind: 'project', slug: parts[0] };
    }
    if (parts[0] === '..') return resolveFileFromHome(parts.slice(1), ctx);
  }

  return resolveFileFromHome(parts, ctx);
}

function resolveFileFromHome(parts: string[], ctx: Ctx): ReturnType<typeof resolveFile> {
  if (parts.length === 0) return null;
  const [head, ...rest] = parts;
  if (head === 'about.txt' && rest.length === 0) return { kind: 'about' };
  if (head === 'now.md' && rest.length === 0) return { kind: 'now' };
  if (head === 'contact.conf' && rest.length === 0) return { kind: 'contact' };
  if (head === '.secret' && rest.length === 0) return { kind: 'secret' };
  if (head === 'projects' && rest.length === 1) {
    const slug = rest[0];
    if (ctx.data.projects.some((p) => p.slug === slug)) return { kind: 'project', slug };
  }
  if (head === 'blog' && rest.length === 0) return { kind: 'blog-dir' };
  return null;
}

const commands: Record<string, CommandFn> = {
  help: () => formatHelp(),

  ls: (args, ctx) => {
    if (args.length === 1 && args[0] === 'projects' && ctx.cwd === 'home') {
      return ctx.data.projects.map((p) => out(p.slug));
    }
    return filesAt(ctx).map(out);
  },

  cat: (args, ctx) => {
    if (args.length === 0) return [err('cat: missing file operand')];
    const target = resolveFile(args[0], ctx);
    if (!target) return [err(`cat: ${args[0]}: no such file or directory`)];
    switch (target.kind) {
      case 'about':
        return ctx.data.about.map(out);
      case 'now':
        return ctx.data.now.split('\n').map(out);
      case 'contact':
        return ctx.data.contact.map(out);
      case 'secret':
        return ctx.data.secret.map(dim);
      case 'project': {
        const p = ctx.data.projects.find((x) => x.slug === target.slug)!;
        return [
          out(`# ${p.title}`),
          dim(`  status: ${p.status}  ·  role: ${p.role}  ·  year: ${p.year}`),
          dim(`  tech:   ${p.tech.join(', ')}`),
          out(''),
          out(p.summary),
          dim(`  more:   /en/projects/${p.slug}`),
        ];
      }
      case 'blog-dir':
        return [err(`cat: ${args[0]}: is a directory`)];
    }
  },

  cd: (args, ctx) => {
    const target = args[0] ?? '~';
    if (target === 'projects') {
      if (ctx.cwd === 'projects') return [];
      ctx.cwd = 'projects';
      return [];
    }
    if (target === '..' || target === '/' || target === '~') {
      ctx.cwd = 'home';
      return [];
    }
    return [err(`cd: ${target}: no such directory`)];
  },

  pwd: (_args, ctx) => [out(ctx.cwd === 'projects' ? '/home/guest/projects' : '/home/guest')],

  whoami: () => [out('guest')],

  sudo: (args) => {
    if (args[0] === 'whoami') {
      return [
        dim('[sudo] password for guest: '),
        out('damien'),
        dim('(hi.)'),
      ];
    }
    return [err('sudo: only `sudo whoami` is implemented on this host.')];
  },

  uname: (args, ctx) => {
    if (args[0] === '-a') return [out(ctx.data.uname)];
    return [out('damienthumerel')];
  },

  date: () => {
    const d = new Date();
    return [out(d.toString())];
  },

  echo: (args) => [out(args.join(' '))],

  history: (_args, ctx) => ctx.history.map((cmd, i) => out(`  ${String(i + 1).padStart(4, ' ')}  ${cmd}`)),

  clear: () => ({ lines: [], effect: 'clear' }),

  exit: () => ({ lines: [dim('logout')], effect: 'exit' }),

  version: (_args, ctx) => [out(`damienthumerel terminal v${ctx.data.version}`)],
};

export function runCommand(rawCommand: string, ctx: Ctx): CommandResult {
  const trimmed = rawCommand.trim();
  if (trimmed === '') return [];
  const [name, ...args] = trimmed.split(/\s+/);
  const fn = commands[name];
  if (!fn) return [err(`command not found: ${name}`)];
  return fn(args, ctx);
}

export const KNOWN_COMMANDS = Object.keys(commands);

export function completeToken(input: string, ctx: Ctx): string[] {
  const trailingSpace = /\s$/.test(input);
  const tokens = input.trimStart().split(/\s+/);
  const firstToken = tokens[0] ?? '';
  const lastToken = trailingSpace ? '' : tokens[tokens.length - 1];

  if (tokens.length === 1 && !trailingSpace) {
    return KNOWN_COMMANDS.filter((c) => c.startsWith(firstToken));
  }

  if (['cat', 'cd', 'ls'].includes(firstToken)) {
    const pool = filesAt(ctx);
    const extras = ctx.cwd === 'home' ? [] : ['..'];
    return [...pool, ...extras].filter((name) => name.startsWith(lastToken));
  }

  return [];
}
