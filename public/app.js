const state = { mode: 'qr', image: '', filename: 'codecraft.png' };

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function setText(id, text) { $(id).textContent = text; }

function setStatus(message = '', type = '') {
  const status = $('#status');
  status.textContent = message;
  status.className = `status ${type}`;
}

function updateCount() {
  setText('#char-count', `${$('#value').value.length.toLocaleString()} / 2,048`);
}

function updateColorLabel(inputId, labelId) {
  setText(labelId, $(inputId).value.toUpperCase());
}

function updateRange(inputId, outputId) {
  setText(outputId, $(inputId).value);
}

function setMode(mode) {
  state.mode = mode;
  $$('.segment').forEach((button) => button.classList.toggle('active', button.dataset.mode === mode));
  $('#qr-options').classList.toggle('hidden', mode !== 'qr');
  $('#barcode-options').classList.toggle('hidden', mode !== 'barcode');
  setText('#value-hint', mode === 'qr' ? 'QR codes can hold text, links, and more.' : 'Choose a retail format for product-style numbers, or use Code 128 for flexible text.');
  setText('#tip-text', mode === 'qr' ? 'For a scannable QR code, keep strong contrast between the foreground and background.' : 'Code 128 is the most flexible barcode choice for ordinary letters and numbers.');
  setStatus('');
}

function payload() {
  const common = { mode: state.mode, value: $('#value').value };
  if (state.mode === 'qr') {
    return { ...common, error_correction: $('#error-correction').value, box_size: $('#box-size').value, border: $('#border').value, fill_color: $('#fill-color').value, back_color: $('#back-color').value };
  }
  return { ...common, format: $('#barcode-format').value, height: $('#height').value, bar_color: $('#bar-color').value, bar_background: $('#bar-background').value, show_text: $('#show-text').checked };
}

async function generateCode() {
  const button = $('#generate-button');
  button.disabled = true;
  button.classList.add('loading');
  button.querySelector('span:first-child').textContent = 'Generating…';
  setStatus('Creating your code…', 'working');
  try {
    const response = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload()) });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'Something went wrong.');
    state.image = result.image;
    state.filename = result.filename;
    $('#generated-image').src = result.image;
    $('#generated-image').alt = `${result.label} generated from ${result.value}`;
    setText('#result-value', result.value);
    setText('#output-badge', 'READY');
    $('#output-badge').className = 'output-badge ready';
    $('#preview-empty').classList.add('hidden');
    $('#preview-result').classList.remove('hidden');
    $('#download-button').disabled = false;
    setText('#download-note', 'PNG • ready for your project or presentation');
    setStatus(`${result.label} generated successfully.`, 'success');
  } catch (error) {
    setStatus(error.message, 'error');
  } finally {
    button.disabled = false;
    button.classList.remove('loading');
    button.querySelector('span:first-child').textContent = 'Generate code';
  }
}

function downloadCode() {
  if (!state.image) return;
  const link = document.createElement('a');
  link.href = state.image;
  link.download = state.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setStatus('Download started — your PNG is ready.', 'success');
}

async function copyValue() {
  try {
    await navigator.clipboard.writeText($('#value').value);
    setStatus('Source value copied to your clipboard.', 'success');
  } catch {
    setStatus('Copy is not available here. Select the source value manually.', 'error');
  }
}

$$('.segment').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
$$('.example-chip').forEach((button) => button.addEventListener('click', () => { $('#value').value = button.dataset.value; updateCount(); }));
$('#value').addEventListener('input', updateCount);
$('#generate-button').addEventListener('click', generateCode);
$('#download-button').addEventListener('click', downloadCode);
$('#copy-button').addEventListener('click', copyValue);
$('#box-size').addEventListener('input', () => updateRange('#box-size', '#box-size-output'));
$('#border').addEventListener('input', () => updateRange('#border', '#border-output'));
$('#height').addEventListener('input', () => updateRange('#height', '#height-output'));
[['#fill-color', '#fill-color-value'], ['#back-color', '#back-color-value'], ['#bar-color', '#bar-color-value'], ['#bar-background', '#bar-background-value']].forEach(([input, label]) => $(input).addEventListener('input', () => updateColorLabel(input, label)));
$('#barcode-format').addEventListener('change', () => {
  const format = $('#barcode-format').value;
  const hints = { code128: 'Code 128 accepts letters, numbers, spaces, and symbols.', code39: 'Code 39 uses uppercase letters, numbers, spaces, and a small set of symbols.', ean13: 'EAN-13 needs 12 or 13 digits.', ean8: 'EAN-8 needs 7 or 8 digits.', upca: 'UPC-A needs 11 or 12 digits.', isbn13: 'ISBN-13 needs 12 or 13 digits.' };
  setText('#barcode-hint', hints[format]);
});

updateCount();
