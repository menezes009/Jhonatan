// dashboard.js – Persistente
const KEY_PREFIX = 'qr_v5';
const USED_KEY = `${KEY_PREFIX}_used`;
const LOG_KEY  = `${KEY_PREFIX}_checkins`;

const tbody = document.getElementById('tbody');
const filterInput = document.getElementById('filter');
const btnExport = document.getElementById('btnExport');
const btnExportJson = document.getElementById('btnExportJson');
const btnHardReset = document.getElementById('btnHardReset');
const imp = document.getElementById('imp');

function getCheckins(){ return JSON.parse(localStorage.getItem(LOG_KEY) || '[]'); }

function renderTable(){
  const q = (filterInput.value || '').toLowerCase();
  const arr = getCheckins();
  const rows = (arr||[]).slice()
    .sort((a,b)=>(b.at||0)-(a.at||0))
    .filter(c => !q || (String(c.code||'').toLowerCase().includes(q) || String(c.name||'').toLowerCase().includes(q)))
    .map(c => {
      const when = c.at ? new Date(c.at).toLocaleString() : '-';
      return `<tr>
        <td>${when}</td>
        <td>${escapeHtml(c.code||'')}</td>
        <td>${escapeHtml(c.name||'')}</td>
        <td>${escapeHtml(c.deviceId||'local')}</td>
      </tr>`;
    }).join('');
  tbody.innerHTML = rows || '<tr><td colspan="4"><em>Nenhum check-in neste aparelho.</em></td></tr>';
}
function escapeHtml(s){ return s.replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',\"'\":'&#039;' }[m])); }

btnExport.addEventListener('click', () => {
  const header = ['quando','codigo','nome','origem'];
  const rows = getCheckins()
    .slice()
    .sort((a,b)=>(a.at||0)-(b.at||0))
    .map(c => [
      c.at ? new Date(c.at).toISOString() : '',
      (c.code||''), (c.name||''), (c.deviceId||'local')
    ]);
  const csv = [header, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(',')).join('\\n');
  const blob = new Blob([csv], {type:'text/csv;charset=utf-8;'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `checkins-local.csv`; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 5000);
});

btnExportJson.addEventListener('click', () => {
  const data = {
    log:  JSON.parse(localStorage.getItem(LOG_KEY) || '[]')
  };
  const blob = new Blob([JSON.stringify(data)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href=url; a.download='backup-checkins.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url), 5000);
});

btnHardReset.addEventListener('click', () => {
  localStorage.removeItem(LOG_KEY);
  alert('Logs zerados. Atualizando painel…');
  renderTable();
});

imp.addEventListener('change', e => {
  const f = e.target.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try{
      const data = JSON.parse(r.result);
      if (Array.isArray(data.log))  localStorage.setItem(LOG_KEY, JSON.stringify(data.log));
      alert('Backup restaurado. Atualizando…');
      renderTable();
    }catch(e){ alert('Arquivo inválido.'); }
  };
  r.readAsText(f);
});

filterInput.addEventListener('input', renderTable);
renderTable();
