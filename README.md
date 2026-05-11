# damienthumerel.com

Source of [damienthumerel.com](https://damienthumerel.com) — personal site, bilingual (EN/FR), terminal aesthetic.

Built with [Astro](https://astro.build) as a static site. Intended deploy target is Cloudflare Pages, but the project is **kept local-only for now** — no git, no remote — until the design has settled (see `DESIGN.md §16` and the workflow note at the top of `ROADMAP.md`).

## Design + roadmap

- [`DESIGN.md`](./DESIGN.md) — full technical design
- [`ROADMAP.md`](./ROADMAP.md) — build phases and execution tracker

## Local development

```bash
nvm use          # Node 20 via .nvmrc
npm install
npm run dev      # http://localhost:4321
```

| Script          | Purpose                           |
| --------------- | --------------------------------- |
| `npm run dev`     | Start the Astro dev server        |
| `npm run build`   | Build static output to `dist/`    |
| `npm run preview` | Preview the built output locally  |
| `npm run check`   | `astro check` + `tsc --noEmit`    |

## License

Code is released under the [MIT License](./LICENSE).

Content (prose in blog posts, page copy, images) is &copy; Damien Thumerel, all rights reserved unless a post says otherwise. Quoting with attribution is always fine.
