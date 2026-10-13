# tunedecho.github.io

Website for Tuned Echo Systems LLC. "Tuning your systems to echo your mission"

## Layout

- `index.html`: the whole site, one self-contained page. Fonts load from Google Fonts; everything else is inline.
- `assets/seal.svg`: the seal as vector art. A copy is inlined in the hero of `index.html` so it can animate.
- `assets/te-flight.js`: the hero animation. The fork is struck, a Brooklyn skyline rises, the camera tilts up to an aerial view of New York, pulls back to a spinning Earth, and the Earth settles back into the seal. It plays once after the page loads (the wide flight in light mode, the night flight in dark mode). Each click on the seal plays the same flight inside the seal's inner circle. Visitors who prefer reduced motion only see it when they click.
- `assets/te-geo.js`: land outlines for the animation, from Natural Earth via the world-atlas package (public domain).
- `assets/reference-wordmark.png`, `assets/reference-seal.png`: the original logo concepts.
- `.github/workflows/deploy.yml`: deploys the repository root to GitHub Pages on every push to `main`.

## Publishing

In the repository settings, under Pages, set the source to "GitHub Actions". After that, every push to `main` deploys the site.

## Editing

Open `index.html` in a browser to preview. Edit the text in place; the design tokens (colors, fonts) sit at the top of the `<style>` block.
