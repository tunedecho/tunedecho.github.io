# tunedecho.github.io

Website for Tuned Echo Systems LLC. "Tuning your systems until they echo your mission"

## Layout

- `index.html`: the whole site, one self-contained page. Fonts load from Google Fonts; everything else is inline.
- `assets/seal.svg`: the seal, redrawn as vector art. The same drawing is inlined in `index.html` so it takes the page's text color.
- `assets/reference-wordmark.png`, `assets/reference-seal.png`: the original logo concepts.
- `.github/workflows/deploy.yml`: deploys the repository root to GitHub Pages on every push to `main`.

## Publishing

In the repository settings, under Pages, set the source to "GitHub Actions". After that, every push to `main` deploys the site.

## Editing

Open `index.html` in a browser to preview. Edit the text in place; the design tokens (colors, fonts) sit at the top of the `<style>` block.
