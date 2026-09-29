const express = require('express');
const path = require('path');
const QRCode = require('qrcode');
const bwipjs = require('bwip-js');

const app = express();
const port = Number(process.env.PORT || 3000);
const publicDir = path.join(__dirname, 'public');

app.use(express.json({ limit: '32kb' }));
app.use(express.static(publicDir));

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const CODE39_VALUE = /^[0-9A-Z\-. $/+%]+$/;
const BARCODE_FORMATS = {
  code128: { bcid: 'code128', label: 'Code 128' },
  code39: { bcid: 'code39', label: 'Code 39' },
  ean13: { bcid: 'ean13', label: 'EAN-13' },
  ean8: { bcid: 'ean8', label: 'EAN-8' },
  upca: { bcid: 'upca', label: 'UPC-A' },
  isbn13: { bcid: 'ean13', label: 'ISBN-13' }
};

function fail(message, status = 400) {
  return { status, body: { ok: false, error: message } };
}

function color(value, label, fallback) {
  if (value === undefined || value === '') return fallback;
  if (typeof value !== 'string' || !HEX_COLOR.test(value)) {
    throw new Error(`${label} must be a six-digit hex color such as #123ABC.`);
  }
  return value;
}

function integer(value, label, low, high, fallback) {
  if (value === undefined || value === '') return fallback;
  const result = Number(value);
  if (!Number.isInteger(result)) throw new Error(`${label} must be a whole number.`);
  if (result < low || result > high) throw new Error(`${label} must be between ${low} and ${high}.`);
  return result;
}

function validateBarcode(format, value) {
  if (format === 'code39' && (value.length > 64 || !CODE39_VALUE.test(value))) {
    throw new Error('Code 39 uses up to 64 characters: A–Z, 0–9, spaces, and - . $ / + %.');
  }
  if (['ean13', 'isbn13'].includes(format) && (!/^\d+$/.test(value) || ![12, 13].includes(value.length))) {
    throw new Error(`${BARCODE_FORMATS[format].label} needs 12 or 13 digits.`);
  }
  if (format === 'ean8' && (!/^\d+$/.test(value) || ![7, 8].includes(value.length))) {
    throw new Error('EAN-8 needs 7 or 8 digits.');
  }
  if (format === 'upca' && (!/^\d+$/.test(value) || ![11, 12].includes(value.length))) {
    throw new Error('UPC-A needs 11 or 12 digits.');
  }
}

function asDataUrl(buffer) {
  return `data:image/png;base64,${buffer.toString('base64')}`;
}

async function generateQr(value, body) {
  const errorCorrection = String(body.error_correction || 'M').toUpperCase();
  if (!['L', 'M', 'Q', 'H'].includes(errorCorrection)) {
    throw new Error('Choose a QR error correction level of L, M, Q, or H.');
  }
  const scale = integer(body.box_size, 'QR module size', 2, 20, 8);
  const margin = integer(body.border, 'QR border', 4, 12, 4);
  const dark = color(body.fill_color, 'QR foreground', '#10233f');
  const light = color(body.back_color, 'QR background', '#f8f5ef');
  return {
    image: await QRCode.toDataURL(value, {
      errorCorrectionLevel: errorCorrection,
      margin,
      scale,
      color: { dark, light }
    }),
    filename: 'qr-code.png',
    label: 'QR code'
  };
}

async function generateBarcode(value, body) {
  const format = String(body.format || 'code128').toLowerCase();
  if (!BARCODE_FORMATS[format]) throw new Error('Choose one of the supported barcode formats.');
  validateBarcode(format, value);
  const barColor = color(body.bar_color, 'Barcode bar color', '#10233f').slice(1);
  const background = color(body.bar_background, 'Barcode background', '#f8f5ef').slice(1);
  const height = integer(body.height, 'Barcode height', 30, 140, 70);
  const buffer = await bwipjs.toBuffer({
    bcid: BARCODE_FORMATS[format].bcid,
    text: value,
    scale: 3,
    height,
    includetext: body.show_text !== false,
    textxalign: 'center',
    barcolor: barColor,
    backgroundcolor: background,
    paddingwidth: 4,
    paddingheight: 4
  });
  return { image: asDataUrl(buffer), filename: `${format}-barcode.png`, label: `${BARCODE_FORMATS[format].label} barcode` };
}

app.get('/health', (_req, res) => res.json({ ok: true, service: 'codecraft-node' }));

app.post('/api/generate', async (req, res) => {
  try {
    const body = req.body || {};
    if (typeof body.value !== 'string') throw new Error('Value must be text.');
    const value = body.value.trim();
    if (!value) throw new Error('Enter a value before generating your code.');
    if (value.length > 2048) throw new Error('Keep the value under 2,048 characters so the code stays scannable.');

    const result = String(body.mode || 'qr').toLowerCase() === 'barcode'
      ? await generateBarcode(value, body)
      : await generateQr(value, body);
    res.json({ ok: true, value, ...result });
  } catch (error) {
    const status = error instanceof Error && /could not be generated/i.test(error.message) ? 500 : 400;
    res.status(status).json({ ok: false, error: error.message || 'The code could not be generated.' });
  }
});

app.get('*', (_req, res) => res.sendFile(path.join(publicDir, 'index.html')));

app.listen(port, '0.0.0.0', () => {
  console.log(`CodeCraft Node server listening on http://0.0.0.0:${port}`);
});
