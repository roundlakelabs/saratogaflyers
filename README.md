# Saratoga Flyers website

The website for Saratoga Flyers, Inc., a flying club at Saratoga County Airport (5B2).
Live at https://saratogaflyers.github.io/sf-website/ (moving to https://saratogaflyers.org). Source: https://github.com/saratogaflyers/sf-website (owned by the club's GitHub organization).

Club members who aren't developers edit content in [Pages CMS](https://pagescms.org). See
[EDITING.md](EDITING.md) for their instructions. This file is for whoever maintains the code.

## Stack, and why

| Piece | What it does | Why |
|---|---|---|
| Plain HTML + CSS | The site itself (`src/`). No JavaScript. | Small, fast, easy to hand over. |
| [Eleventy](https://www.11ty.dev/) 3 (Nunjucks templates) | Build step: combines templates with content files into static HTML in `_site/`. | Its only job is to fill templates with content. It's the only dependency. |
| [Pages CMS](https://pagescms.org) (hosted, free, MIT-licensed) | Web editor for the content files. Saves by committing to this repo. | Editors don't need GitHub accounts or any technical knowledge. |
| GitHub Actions + GitHub Pages | Builds and hosts the site. | Free, no servers. |

Nothing here costs money and there are no databases or servers.

## Run it locally

Requires Node.js 22 or newer.

```bash
npm install
npm start      # dev server at http://localhost:8080 with live reload
npm run build  # one-off build into _site/
```

## Project structure

```
.pages.yml                 Pages CMS config: what editors can edit, and the form fields
eleventy.config.js         Eleventy config: folders, passthrough copies, event filters
.github/workflows/deploy.yml  Build + deploy to GitHub Pages
src/
  index.html               Home page (Nunjucks template, outputs /index.html)
  our-plane.html           /our-plane.html
  resources.html           /resources.html
  more-info.html           /more-info.html (Contact Us)
  _includes/
    layouts/base.njk       <head>, header, footer wrapper for every page
    header.njk             Logo + navigation (nav links are defined here)
    footer.njk
    banner.njk             Red page banner used by inner pages
    photo.njk              One gallery photo
  _data/                   Single-file content (JSON), available in templates by filename
    site.json              Club name, contact email, footer, calendar link
    membership.json        Costs, membership text, home page notice
    plane.json             Tail number, specs, equipment, photos
    home.json              Home page text and gallery
    contact.json           Contact page text and photo
    resources.json         Quotes and link groups on the Resources page
  content/events/          One Markdown file per event (front matter + description)
    events.json            Directory data: tags them "events", no page of their own
  media/                   Photos/files managed in the CMS; served at /media/
  images/                  Design images used by the CSS and templates (logo, hero, banner)
  docs/                    PDFs linked from Resources (kept at their old URLs)
  style.css
```

Every page keeps its original URL (`/index.html`, `/our-plane.html`, etc.). Each page sets
this explicitly with `permalink` in its front matter.

## How content flows

```
Editor saves in Pages CMS
  -> Pages CMS commits the changed file to main
  -> GitHub Action runs `npm ci && npm run build`
  -> _site/ is deployed to GitHub Pages (about 1–2 minutes end to end)
```

The same workflow runs when you push to `main`, when you run it manually (Actions tab, "Run
workflow"), and **nightly at 09:10 UTC**. The nightly run matters: "upcoming events" is decided
at build time (see `upcomingEvents` in `eleventy.config.js`), so without a daily rebuild past
events would stay on the home page.

> GitHub disables scheduled workflows in public repos after 60 days with no commits. If
> the site goes quiet for that long, re-enable the workflow on the Actions tab.

### Things to know about the content files

- **Rich-text fields in JSON are HTML.** The templates output them with `| safe`. Event
  descriptions are Markdown (the body of each `.md` file).
- **Pages CMS rewrites a whole file from the schema when it saves.** Any key in a data
  file that isn't listed in `.pages.yml` is dropped the next time someone saves that file. If you add
  a key to a data file, add a field for it in `.pages.yml` at the same time.
- **Event dates** are stored in the `start` field as local wall-clock strings like
  `2026-10-12T09:00`, in Eastern time. The field is named `start` rather than `date` on purpose:
  Eleventy treats a `date` key specially and would read these as UTC.
- Event Markdown is rendered with `templateEngineOverride: md`, so a stray `{{` typed by an
  editor can't break the build.
- Images picked in the CMS are stored as root-relative paths (`/media/photo.jpg`). Eleventy's
  `HtmlBasePlugin` adds `pathPrefix` to these in the built HTML, so they also work while the site
  lives under `/sf-website/`. Links between pages and to `images/`, `docs/` and `style.css` are
  plain relative paths, which work either way because every page sits at the site root.

## Adding a new kind of content

1. **Data:** add a JSON file in `src/_data/`, e.g. `instructors.json`. Use a top-level array
   if it's a list. Or, for repeatable items that need Markdown bodies, add a folder under
   `src/content/` with a directory data file (see `content/events/events.json`).
2. **Template:** read it in a page, e.g. `{% for i in instructors %}…{% endfor %}`, or
   `collections.<tag>` for a folder of Markdown files. For a new page, copy an existing page's
   front matter (`layout`, `permalink`, `title`, `description`) and add it to `navItems` in
   `src/_includes/header.njk`.
3. **CMS:** add an entry under `content:` in `.pages.yml`. Field `name`s must match the keys the
   template reads exactly. For single files, set
   `operations: { create: false, rename: false, delete: false }`. For a JSON array file, use
   `list: true`. Docs: https://pagescms.org/docs/configuration/
4. Run `npm run build` and check the output.

## Domain, DNS and hosting settings

- **Current URL:** https://saratogaflyers.github.io/sf-website/. The workflow reads the base
  path from `actions/configure-pages` (`/sf-website` now, empty once a custom domain is set) and
  passes it to Eleventy as `PATH_PREFIX`. Locally the prefix is `/`; to preview the subfolder build,
  run `PATH_PREFIX=/sf-website/ npm run build`.
- **Switching to saratogaflyers.org:** set up DNS (below), then enter the domain under repo
  Settings → Pages → Custom domain and re-run the workflow. No code change is needed. With
  Actions-based deploys GitHub ignores `CNAME` files, so the repo doesn't have one.
- **DNS:** set at the domain registrar. For an apex domain, GitHub Pages needs A records
  pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` (and
  optionally AAAA records). Add a `www` CNAME pointing to `saratogaflyers.github.io`. See
  [GitHub's docs](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site).
- **GitHub Pages:** repo Settings → Pages. Source must be **GitHub Actions**. The custom domain
  and "Enforce HTTPS" are also set there.
- **Pages CMS:** the GitHub App is installed on this repo. Editors (collaborators) are
  managed at https://app.pagescms.org. They're stored in Pages CMS's database, not in this repo.

### Redirects from an old site

GitHub Pages can't do server-side redirects. If old URLs (e.g. from a previous WordPress
site) need to redirect, the easiest free alternative is **Cloudflare Pages**, which reads a
`_redirects` file. The build is identical; only the deploy step changes. Put `_redirects` in
`src/`, add it to the passthrough copies, and point Cloudflare Pages at this repo with build
command `npm run build` and output directory `_site`.
