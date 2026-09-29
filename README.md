# CodeCraft QR & Barcode Generator

A school-project-friendly QR code and barcode generator built with **Node.js and plain HTML/CSS/JavaScript**.

## Features

- Generate QR codes from text, links, or messages.
- Generate Code 128, Code 39, EAN-13, EAN-8, UPC-A, and ISBN-13 barcodes.
- Customize QR error correction, module size, border, and colors.
- Customize barcode format, colors, height, and displayed text.
- Preview the generated image and download it as a PNG.
- No database, login, or saved personal data.

## Run on Windows, macOS, or Linux

1. Install Node.js 18 or newer from <https://nodejs.org/>.
2. Open a terminal in this project folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the app:

   ```bash
   npm start
   ```

5. Open <http://127.0.0.1:3000>.

For automatic restart while editing, use:

```bash
npm run dev
```

## Project files

- `server.js` — Express server, validation, QR generation, and barcode generation.
- `public/index.html` — user interface.
- `public/styles.css` — visual styling.
- `public/app.js` — browser interactions and downloads.
- `package.json` — Node.js dependencies and scripts.
- `Dockerfile` — production container configuration.
