#!/usr/bin/env node
import { writeFile, access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { parseArgs, slugify, die } from './_cli.mjs';

const STATUSES = ['active', 'archived', 'past'];
const LOCALES = ['en', 'fr'];

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = parseArgs(process.argv.slice(2));

if (!args.title) die('--title is required');
const title = String(args.title);

const locale = String(args.locale ?? 'en');
if (!LOCALES.includes(locale)) die(`--locale must be one of: ${LOCALES.join(', ')}`);

const status = String(args.status ?? 'active');
if (!STATUSES.includes(status)) die(`--status must be one of: ${STATUSES.join(', ')}`);

const role = String(args.role ?? 'solo');
const year = args.year ?? new Date().getFullYear();

const slug = args.slug ? slugify(args.slug) : slugify(title);
if (!slug) die('could not derive a slug - pass --slug explicitly');

const tech = typeof args.tech === 'string'
  ? args.tech.split(',').map((t) => t.trim()).filter(Boolean)
  : [];

const featured = args.featured === true || args.featured === 'true';
const order = Number.parseInt(String(args.order ?? '100'), 10);

const targetDir = join(root, 'src', 'content', 'projects', locale);
const targetPath = join(targetDir, `${slug}.mdx`);

try {
  await access(targetPath, constants.F_OK);
  if (!args.force) die(`${targetPath} already exists (pass --force to overwrite)`);
} catch {
}

await mkdir(targetDir, { recursive: true });

const body = `---
title: ${title}
status: ${status}
role: ${role}
year: ${year}
featured: ${featured}
order: ${order}
summary: TODO - 1 sentence, <= 160 chars.
tech:
${tech.length > 0 ? tech.map((t) => `  - ${t}`).join('\n') : '  - TODO'}
---

## problem

What problem the project solves, in one paragraph.

## approach

High-level design and the key decisions. Bullet the trade-offs where useful.

## outcome

What shipped, how it performs, what is still open.

## lessons

The things you would do differently next time, or that generalized beyond
this project.
`;

await writeFile(targetPath, body, 'utf8');
process.stdout.write(`wrote ${targetPath}\n`);
