const ENDPOINT = '/api/unicodex/reports';
const RECEIPTS = 'unicodex-report-receipts-v1';
const ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LABELS = { received: 'Received', reviewing: 'Under review', fixed: 'Fixed', limitation: 'Limitation explained', needs_information: 'More information needed' };

export function setupReporting({ getSnapshot }) {
  const el = id => document.getElementById(id);
  const opener = el('report'), dialog = el('report-dialog');
  if (!opener || !dialog) return;
  let snapshot, reportId, sending = false, sent = false;
  let receipts = [];
  try {
    const saved = JSON.parse(localStorage.getItem(RECEIPTS) || '[]');
    if (Array.isArray(saved)) receipts = saved.filter(x => x && ID.test(x.id)).slice(0, 10);
  } catch { /* The report still works when browser storage is unavailable. */ }
  const message = (text, error = false) => {
    el('report-status').textContent = text;
    el('report-status').classList.toggle('error', error);
  };
  const close = () => { if (!sending) { dialog.close(); opener.focus(); } };
  el('report-close').addEventListener('click', close);
  dialog.addEventListener('cancel', event => { if (sending) event.preventDefault(); else opener.focus(); });
  opener.addEventListener('click', () => {
    snapshot = getSnapshot();
    if (!snapshot) { el('source').focus(); return; }
    reportId = crypto.randomUUID();
    sent = false;
    el('report-submit').disabled = false;
    el('report-comment').value = '';
    el('report-expected').value = '';
    el('report-source').value = snapshot.source;
    el('report-output').value = snapshot.output;
    message('');
    dialog.showModal();
    el('report-comment').focus();
  });
  function drawReceipts(states = new Map()) {
    el('report-receipts').hidden = !receipts.length;
    const list = el('receipt-list');
    list.replaceChildren();
    for (const receipt of receipts) {
      const item = document.createElement('li');
      const state = states.get(receipt.id);
      item.textContent = `${receipt.id.slice(0, 8)} · ${state ? LABELS[state.status] || 'Received' : 'Submitted'}${state?.note ? ` · ${state.note}` : ''}${state?.fixedVersion ? ` · v${state.fixedVersion}` : ''}`;
      list.append(item);
    }
  }
  async function refresh() {
    el('refresh-reports').disabled = true;
    const states = new Map();
    let failed = false;
    await Promise.all(receipts.map(async receipt => {
      try {
        const response = await fetch(`${ENDPOINT}/${receipt.id}`, { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw Error('Status unavailable');
        states.set(receipt.id, await response.json());
      } catch { failed = true; }
    }));
    drawReceipts(states);
    el('receipt-status').textContent = failed ? 'Some statuses could not be loaded. Try again later.' : 'Statuses updated.';
    el('refresh-reports').disabled = false;
  }
  el('refresh-reports').addEventListener('click', refresh);
  el('report-form').addEventListener('submit', async event => {
    event.preventDefault();
    if (sending || sent || !snapshot) return;
    sending = true;
    el('report-submit').disabled = true;
    el('report-close').disabled = true;
    message('Sending report…');
    try {
      const response = await fetch(ENDPOINT, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', 'X-Unicodex-Report': '1' }, signal: AbortSignal.timeout(15000),
        body: JSON.stringify({ ...snapshot, id: reportId, comment: el('report-comment').value, expected: el('report-expected').value }) });
      const receipt = await response.json();
      if (!response.ok || receipt.id !== reportId || receipt.status !== 'received') throw Error('Report not accepted');
      sent = true;
      receipts = [{ id: receipt.id, createdAt: receipt.createdAt }, ...receipts.filter(x => x.id !== receipt.id)].slice(0, 10);
      try { localStorage.setItem(RECEIPTS, JSON.stringify(receipts)); } catch { /* Receipt remains visible this session. */ }
      drawReceipts(new Map([[receipt.id, receipt]]));
      message(`Received · ${receipt.id.slice(0, 8)}. Queued for review. You can track its status below the editor.`);
    } catch {
      message('The report was not confirmed. Your text is still here; retry to send it. Reporting is available on the hosted ProjectHub app.', true);
    } finally {
      sending = false;
      el('report-submit').disabled = sent;
      el('report-close').disabled = false;
    }
  });
  drawReceipts();
}
