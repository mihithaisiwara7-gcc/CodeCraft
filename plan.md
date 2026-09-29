# CodeCraft QR & Barcode Generator — Node.js Plan

## Product outcome
A beginner-friendly school-project web app that accepts text or values, generates either a QR code or a barcode, lets the user tune the important visual options, previews the result, validates input, and downloads the generated PNG image.

## Architecture
The app uses Node.js with Express in `server.js`, `qrcode` for QR generation, and `bwip-js` for barcode rendering. The frontend is plain HTML, CSS, and browser JavaScript in `public/`. The API endpoint `POST /api/generate` returns a PNG data URL, while `/health` provides a deployment health check and `/manus-routes.json` declares the application route.

## User-facing behavior
Users choose QR code or barcode, enter a value, select examples, adjust code-specific options, generate a preview without reloading, copy the source value, and download a PNG. QR options include error correction, module size, border, foreground color, and background color. Barcode options include Code 128, Code 39, EAN-13, EAN-8, UPC-A, and ISBN-13, plus bar color, background color, height, and optional displayed value text.

## Validation
The server rejects empty values, values over 2,048 characters, invalid hex colors, out-of-range numeric options, invalid Code 39 characters, and incorrect EAN/UPC/ISBN digit lengths. Errors return HTTP 400 JSON with helpful messages.

## Project structure
```text
server.js             Express server and code-generation API
public/index.html     Accessible static interface
public/app.js         Mode switching, API calls, preview, and download behavior
public/styles.css     Responsive visual system
public/logo.svg/png   Project branding
public/manus-routes.json Required application route manifest
package.json          Node.js dependencies and scripts
Dockerfile             Production Node.js container
README.md              Local setup instructions
```

## Serving arrangement
The app runs as one Node.js container because the HTML shell and generation API share the same Express process. `Dockerfile` runs `node server.js` on the platform-provided `PORT`. The deployment health path is `/health`; no database or static/frontend split is needed.
