# FAO Flash Post

A browser-only post editor with five fixed FAO reference layouts.

## Android

Open https://tony-digitalcreate.github.io/fao-flash-post/ in Chrome.
Tap **Install on this device**, or use Chrome's **Add to Home screen / Install app** menu.

Select a template, insert your photos, drag or use the position and zoom sliders, edit text and colors, then export the 1080 × 1080 PNG. Downloads normally appear in Android's Downloads folder.

Photos are processed locally and never sent to a server. Save style stores text, colors and template selection in this browser; it does not store photos. Export before closing. An internet connection is currently required to load the app.

## Development

Use Node.js 22.13+:

```sh
npm ci
npm run dev
npm run build
```

The Vite base path is /fao-flash-post/. Build output is dist/.

## Deployment

The GitHub Pages workflow publishes dist/ from pushes to main. Enable Pages with GitHub Actions as its source.

The public repository starts with sanitized source only. Real event photos and the private site's Git history are not included.

This is a communications tool, not an official FAO publishing service. FAO and UN logos remain the property of their respective organizations; use must follow their applicable brand permissions.
