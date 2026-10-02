# Saratoga Flyers website

The website for Saratoga Flyers, Inc., a flying club at Saratoga County Airport (5B2).
Hosted on Cloudflare (Worker `saratogaflyers`, built by Workers Builds) (moving to https://saratogaflyers.org). Source: https://github.com/roundlakelabs/saratogaflyers.

Club members who aren't developers edit content in Round Lake Labs' self-hosted
[Pages CMS](https://pagescms.org) at https://cms.roundlakelabs.com. See
[EDITING.md](EDITING.md) for their instructions. This file is for whoever maintains the code.

## Stack, and why

| Piece | What it does | Why |
|---|---|---|
| Plain HTML + CSS | The site itself (`src/`). No JavaScript. | Small, fast, easy to hand over. |
| [Eleventy](https://www.11ty.dev/) 3 (Nunjucks templates) | Build step: combines templates with content files into static HTML in `_site/`. | Its only job is to fill templates with content. It's the only dependency. |
| [Pages CMS](https://pagescms.org) (MIT-licensed, self-hosted by Round Lake Labs at cms.roundlakelabs.com) | Web editor for the content files. Saves by committing to this repo. | Editors don't need GitHub accounts or any technical knowledge. |
| Cloudflare Workers Builds | Cloudflare builds the site on every push to `main` and serves it. | Free, no servers, and supports redirects (`_redirects`) and headers (`_headers`). |

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
  -> Cloudflare Workers Builds sees the push, runs `npm run build`
  -> _site/ goes live (about 1–2 minutes end to end)
```

Nothing else triggers a build: there is no GitHub Action and no nightly rebuild. "Upcoming
events" is decided at build time (see `upcomingEvents` in `eleventy.config.js`), and a small
script on the home page hides any event whose date has passed since the last build.

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
- Images picked in the CMS are stored as root-relative paths (`/media/photo.jpg`). The site is
  served from the domain root, so these work as-is. Eleventy's `HtmlBasePlugin` would add a
  `PATH_PREFIX` to them if the site were ever built for a subfolder. Links between pages and to
  `images/`, `docs/` and `style.css` are plain relative paths.

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

- **Hosting:** Cloudflare Worker `saratogaflyers`, connected to this repo with Workers Builds
  (Cloudflare dashboard → Workers & Pages → saratogaflyers → Settings → Build). Cloudflare's
  GitHub App pulls and builds the repo itself, so no API tokens or GitHub secrets are needed.
  Build status shows up as the "Workers Builds: saratogaflyers" check on each commit.
- **Custom domain (saratogaflyers.org):** in the Cloudflare dashboard, Workers & Pages →
  saratogaflyers → Settings → Domains & Routes. Worker custom domains need the domain's DNS on
  Cloudflare (move the nameservers there first). Add both
  `saratogaflyers.org` and `www.saratogaflyers.org`, and redirect one to the other with a
  Cloudflare redirect rule. No code change is needed.
- **Redirects and headers:** put a [`_redirects`](https://developers.cloudflare.com/pages/configuration/redirects/)
  or [`_headers`](https://developers.cloudflare.com/pages/configuration/headers/) file in `src/`.
  Eleventy already copies them to the site root if they exist.
- **Old URL:** the site used to be on GitHub Pages at https://www.roundlakelabs.com/saratogaflyers/.
  Once GitHub Pages is turned off for this repo (Settings → Pages), that URL stops working.
- **Pages CMS:** we use Round Lake Labs' self-hosted instance at https://cms.roundlakelabs.com,
  not the public app.pagescms.org. Its GitHub App must be installed on
  `roundlakelabs/saratogaflyers`. Editors (collaborators) are managed at
  https://cms.roundlakelabs.com and stored in that instance's database, not in this repo.
