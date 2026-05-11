#!/usr/bin/env node
import { writeFile, access, mkdir } from 'node:fs/promises';
import { constants } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';
import { parseArgs, slugify, todayIso, die } from './_cli.mjs';

const CATEGORIES = ['homelab', 'tutorial', 'career', 'til'];
const LOCALES = ['en', 'fr'];

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = parseArgs(process.argv.slice(2));

if (!args.title) die('--title is required');
const title = String(args.title);

const locale = String(args.locale ?? 'en');
if (!LOCALES.includes(locale)) die(`--locale must be one of: ${LOCALES.join(', ')}`);

const category = String(args.category ?? 'til');
if (!CATEGORIES.includes(category)) die(`--category must be one of: ${CATEGORIES.join(', ')}`);

const slug = args.slug ? slugify(args.slug) : slugify(title);
if (!slug) die('could not derive a slug - ass --slug explicitly');

const tags = typeof args.tags === 'string'
  ? args.tags.split(',').map((t) => t.trim()).filter(Boolean)
  : [];

const targetDir = join(root, 'src', 'content', 'blog', locale);
const targetPath = join(targetDir, `${slug}.mdx`);

try {
  await access(targetPath, constants.F_OK);
  if (!args.force) die(`${targetPath} already exists (pass --force to overwrite)`);
} catch {
}

await mkdir(targetDir, { recursive: true });

const body = `---
title: ${title}
pubDate: ${todayIso()}
summary: TODO - 1–2 sentences, <= 200 chars.
tags:
${tags.length > 0 ? tags.map((t) => `  - ${t}`).join('\n') : '  - TODO'}
category: ${category}
draft: true
---

Write the post here. Frontmatter \`draft: true\` keeps it out of production
builds - flip to \`false\` when ready to ship.
`;

await writeFile(targetPath, body, 'utf8');
process.stdout.write(`wrote ${targetPath}\n`);
