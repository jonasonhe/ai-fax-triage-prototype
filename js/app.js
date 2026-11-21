(function () {
  const { decideRoute, topCandidate } = window.TriageRules;
  const { SAMPLE_FAXES } = window.TriageData;
  const app = document.getElementById('app');

  const STATUS = { AUTO: 'auto-filed', TRIAGE: 'needs-triage', PUSHED: 'pushed' };
  const QUEUES = ['Lab results', 'Referrals', 'Cardiology triage', 'Pediatrics', 'Imaging'];
  const URGENCY = ['Routine', 'Urgent'];

  // In-memory state. Reloading the page resets the prototype.
  const state = {
    faxes: SAMPLE_FAXES.map((f) => ({
      ...f,
      candidates: f.candidates.map((c) => ({ ...c })),
      status: decideRoute(f).route === 'auto' ? STATUS.AUTO : STATUS.TRIAGE,
      triage: null,
      pushedAt: null,
    })),
  };

  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const findFax = (id) => state.faxes.find((f) => f.id === id);
  // URL shape: #/fax/<id>
  const currentFax = () => findFax(location.hash.split('/')[2]);
  const countBy = (status) => state.faxes.filter((f) => f.status === status).length;
  const nowTime = () => new Date().toLocaleTimeString('en-CA', { hour: '2-digit', minute: '2-digit', hour12: false });

  function initTriage(f) {
    if (!f.triage) {
      f.triage = {
        step: 1,
        candidateId: null,
        fields: { ...f.extracted },
        urgency: f.extracted.urgency,
        updatePhone: true,
      };
    }
    return f.triage;
  }

  function statusChip(status) {
    const map = {
      [STATUS.AUTO]: ['Auto-filed', 'chip-green'],
      [STATUS.TRIAGE]: ['Needs triage', 'chip-amber'],
      [STATUS.PUSHED]: ['Pushed to EMR', 'chip-blue'],
    };
    const [label, cls] = map[status];
    return `<span class="chip ${cls}">${label}</span>`;
  }

  function signalChip(label, kind) {
    return `<span class="chip chip-${kind}">${esc(label)}</span>`;
  }

  function signalKind(value) {
    return { match: 'green', close: 'amber', differs: 'red' }[value] || 'gray';
  }

  function renderWorklist() {
    const rows = state.faxes.map((f) => {
      const top = topCandidate(f);
      const match = top
        ? `${esc(top.name)} · ${top.score}% match`
        : 'No patient match found';
      return `
        <tr class="row ${f.status === STATUS.TRIAGE ? 'row-triage' : ''}" data-action="open" data-id="${f.id}">
          <td>${esc(f.received)}</td>
          <td><strong>${esc(f.docType)} · ${f.docConfidence}%</strong><div class="muted">${esc(f.source)}</div></td>
          <td>${match}</td>
          <td>${statusChip(f.status)}</td>
        </tr>`;
    }).join('');

    app.innerHTML = `
      <div class="shell">
        ${sidebar()}
        <main class="main">
          <h1>Inbox Agent</h1>
          <p class="muted">Auto-files only on a 100% patient match. Everything else goes to manual triage.</p>
          <div class="cards">
            <div class="card"><div class="muted">Auto-filed (100% match)</div><div class="value">${countBy(STATUS.AUTO)}</div></div>
            <div class="card"><div class="muted">Needs triage</div><div class="value">${countBy(STATUS.TRIAGE)}</div></div>
            <div class="card"><div class="muted">Pushed to EMR</div><div class="value">${countBy(STATUS.PUSHED)}</div></div>
          </div>
          <table class="table">
            <thead><tr><th>Received</th><th>Document · confidence</th><th>Patient match</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <p class="footnote">Sample data. All patients, clinics, and documents are fictional.</p>
        </main>
      </div>`;
  }

  function sidebar() {
    return `
      <aside class="sidebar">
        <div class="wordmark">Clinic Ops</div>
        <div class="nav nav-active">Inbox Agent</div>
      </aside>`;
  }

  function topBar(f, backLabel = '← Worklist') {
    return `
      <header class="topbar">
        <button class="link" data-action="worklist">${backLabel}</button>
        <div>
          <div class="doc-title">${esc(f.docType)} · ${esc(f.source)}</div>
          <div class="muted small">Received ${esc(f.received)} · ${f.pages} page${f.pages > 1 ? 's' : ''}</div>
        </div>
      </header>`;
  }

  function preview(f, highlight) {
    const e = f.extracted;
    const hl = (text) => (highlight ? `<mark>${esc(text)}</mark>` : esc(text));
    return `
      <section class="preview">
        <div class="page">
          <div class="page-header">${esc(f.source).toUpperCase()} · ${esc(f.docType).toUpperCase()}</div>
          <p>Patient: ${hl(e.name)}</p>
          <p>DOB: ${hl(e.dob)}</p>
          <p>Phone: ${hl(e.phone)}</p>
          <p class="muted">Referring: ${esc(e.referring)}</p>
          <p class="muted">Reason: ${esc(e.reason)}</p>
          ${Array.from({ length: 6 }, (_, i) => `<div class="body-line" style="width:${90 - (i % 3) * 18}%"></div>`).join('')}
        </div>
      </section>`;
  }

  function stepper(active) {
    const steps = ['Confirm patient', 'Check fields', 'Push to EMR'];
    return `
      <ol class="stepper">
        ${steps.map((label, i) => {
          const n = i + 1;
          const cls = n === active ? 'active' : n < active ? 'done' : '';
          return `<li class="${cls}"><span class="dot">${n < active ? '✓' : n}</span>${label}</li>`;
        }).join('')}
      </ol>`;
  }

  function renderTriage(f) {
    const t = initTriage(f);
    const decision = decideRoute(f);
    const bannerClass = t.step === 1 ? 'banner-amber' : 'banner-blue';
    const bannerText = t.step === 1
      ? `Not auto-filed. ${decision.reason} Triage and push to EMR manually.`
      : t.step === 2
        ? 'Check each extracted field against the fax. Fix anything the AI got wrong.'
        : 'Nothing reaches the EMR until you click Push to EMR.';

    let panel = '';
    let footer = '';

    if (t.step === 1) {
      const options = f.candidates.map((c) => `
        <label class="candidate ${t.candidateId === c.id ? 'selected' : ''}">
          <input type="radio" name="candidate" value="${c.id}" data-action="select-candidate" data-id="${c.id}" ${t.candidateId === c.id ? 'checked' : ''}>
          <div class="candidate-body">
            <div class="candidate-name">${esc(c.name)}</div>
            <div class="muted small">Chart #${esc(c.chart)} · DOB ${esc(c.dob)}</div>
            <div class="signals">
              ${signalChip(`Name: ${c.signals.name}`, signalKind(c.signals.name))}
              ${signalChip(`DOB: ${c.signals.dob}`, signalKind(c.signals.dob))}
              ${signalChip(`Phone: ${c.signals.phone}`, signalKind(c.signals.phone))}
            </div>
          </div>
          <div class="score">${c.score}%</div>
        </label>`).join('');
      const newOption = `
        <label class="candidate ${t.candidateId === 'new' ? 'selected' : ''}">
          <input type="radio" name="candidate" value="new" data-action="select-candidate" data-id="new" ${t.candidateId === 'new' ? 'checked' : ''}>
          <div class="candidate-body">
            <div class="candidate-name">Create new chart</div>
            <div class="muted small">Use when no existing chart matches this patient</div>
          </div>
        </label>`;
      panel = `
        <h2>Choose the patient chart</h2>
        <div class="extracted">
          <div><span class="muted">Name</span> ${esc(f.extracted.name)}</div>
          <div><span class="muted">DOB</span> ${esc(f.extracted.dob)}</div>
          <div><span class="muted">Phone</span> ${esc(f.extracted.phone)}</div>
        </div>
        ${options || '<p class="muted">No existing charts match this fax.</p>'}
        ${newOption}`;
      footer = `
        <button class="btn" data-action="worklist">Back to worklist</button>
        <button class="btn btn-primary" data-action="next" ${t.candidateId ? '' : 'disabled'}>Next: check fields</button>`;
    }

    if (t.step === 2) {
      const e = t.fields;
      panel = `
        <h2>Check fields</h2>
        <p class="muted small">AI suggestions are pre-filled. Edit any field before pushing.</p>
        ${textField('Document type', 'docType', e.docType)}
        ${textField('Date of referral', 'date', e.date)}
        ${textField('Referring physician', 'referring', e.referring)}
        ${textField('Reason', 'reason', e.reason)}
        <div class="field">
          <label class="muted small">Urgency</label>
          <div class="toggle-row">
            ${URGENCY.map((u) => `<button class="toggle ${t.urgency === u ? 'on' : ''}" data-action="urgency" data-value="${u}">${u}</button>`).join('')}
          </div>
        </div>
        <div class="field">
          <label class="muted small">Assign to</label>
          <select data-field="queue">
            ${QUEUES.map((q) => `<option ${e.queue === q ? 'selected' : ''}>${esc(q)}</option>`).join('')}
          </select>
        </div>`;
      footer = `
        <button class="btn" data-action="back">Back</button>
        <button class="btn btn-primary" data-action="next">Next: review and push</button>`;
    }

    if (t.step === 3) {
      const chart = t.candidateId === 'new'
        ? `New chart for ${esc(f.extracted.name)}`
        : (() => { const c = f.candidates.find((x) => x.id === t.candidateId); return `${esc(c.name)} · Chart #${esc(c.chart)}`; })();
      panel = `
        <h2>Review before push</h2>
        <div class="summary">
          ${summaryRow('Patient', chart)}
          ${summaryRow('Document', `${esc(t.fields.docType)} · ${f.pages} page${f.pages > 1 ? 's' : ''}`)}
          ${summaryRow('Referring', esc(t.fields.referring))}
          ${summaryRow('Urgency', esc(t.urgency))}
          ${summaryRow('Assigned to', esc(t.fields.queue))}
        </div>
        <label class="check">
          <input type="checkbox" data-action="toggle-phone" ${t.updatePhone ? 'checked' : ''}>
          Also update the phone on the chart to ${esc(f.extracted.phone)}
        </label>
        <p class="muted small">This push is logged to the chart with your name and the time.</p>`;
      footer = `
        <button class="btn" data-action="back">Back</button>
        <button class="btn btn-primary" data-action="push">Push to EMR</button>`;
    }

    app.innerHTML = `
      <div class="triage">
        ${topBar(f)}
        <div class="banner ${bannerClass}">${bannerText}</div>
        ${stepper(t.step)}
        <div class="body">
          <div class="left">${preview(f, t.step === 1)}</div>
          <aside class="panel">
            <div class="panel-body">${panel}</div>
            <div class="panel-footer">${footer}</div>
          </aside>
        </div>
      </div>`;
  }

  function textField(label, key, value) {
    return `
      <div class="field">
        <label class="muted small">${esc(label)}</label>
        <input type="text" data-field="${key}" value="${esc(value)}">
      </div>`;
  }

  function summaryRow(label, value) {
    return `<div class="summary-row"><div class="muted small">${label}</div><div>${value}</div></div>`;
  }

  function renderAuto(f) {
    const top = topCandidate(f);
    const e = f.extracted;
    app.innerHTML = `
      <div class="triage">
        ${topBar(f)}
        <div class="banner banner-green">
          Auto-filed to chart: 100% patient match on name, DOB, and health card.
          <span class="banner-actions">
            <button class="btn small" data-action="undo-auto">Undo</button>
          </span>
        </div>
        <div class="body">
          <div class="left">${preview(f, true)}</div>
          <aside class="panel">
            <div class="panel-body">
              <h2>Extracted fields</h2>
              <div class="patient-card">
                <div class="muted small">PATIENT · 100% MATCH</div>
                <div class="candidate-name">${esc(e.name)}</div>
                <div class="muted small">DOB ${esc(e.dob)} · Chart #${esc(top.chart)}</div>
              </div>
              ${readonlyRow('Document type', `${esc(e.docType)} · ${f.docConfidence}%`)}
              ${readonlyRow('Date', esc(e.date))}
              ${readonlyRow('Referring', esc(e.referring))}
              ${readonlyRow('Urgency', esc(e.urgency))}
              ${readonlyRow('Assigned to', esc(e.queue))}
              ${readonlyRow('Pages', `${f.pages}`)}
            </div>
            <div class="panel-footer">
              <button class="btn" data-action="worklist">Back to worklist</button>
            </div>
          </aside>
        </div>
      </div>`;
  }

  function readonlyRow(label, value) {
    return `<div class="summary-row"><div class="muted small">${label}</div><div>${value}</div></div>`;
  }

  function renderPushed(f) {
    const t = f.triage;
    const chart = t.candidateId === 'new'
      ? `New chart for ${f.extracted.name}`
      : (() => { const c = f.candidates.find((x) => x.id === t.candidateId); return `${c.name} · Chart #${c.chart}`; })();
    app.innerHTML = `
      <div class="triage">
        ${topBar(f)}
        <div class="confirm-wrap">
          <div class="confirm-card">
            <div class="success-icon">✓</div>
            <h2>Pushed to EMR</h2>
            <p class="muted">${esc(f.docType)} filed after manual triage</p>
            <div class="summary">
              ${summaryRow('Chart', esc(chart))}
              ${summaryRow('Document', `${esc(t.fields.docType)} · ${f.pages} pages attached`)}
              ${summaryRow('Assigned to', esc(t.fields.queue))}
              ${summaryRow('Phone update', t.updatePhone ? 'Applied to chart' : 'Not applied')}
              ${summaryRow('Audit', `Push logged · you · ${esc(f.pushedAt)}`)}
            </div>
            <div class="confirm-actions">
              <button class="btn" data-action="undo-push">Undo push</button>
              <button class="btn btn-primary" data-action="worklist">Back to worklist</button>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderFax(id) {
    const f = findFax(id);
    if (!f) return renderWorklist();
    if (f.status === STATUS.AUTO) return renderAuto(f);
    if (f.status === STATUS.PUSHED) return renderPushed(f);
    return renderTriage(f);
  }

  function render() {
    const parts = (location.hash || '#/worklist').replace(/^#\//, '').split('/');
    if (parts[0] === 'fax' && parts[1]) return renderFax(parts[1]);
    return renderWorklist();
  }

  // ----- events -----
  app.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el || el.disabled) return;
    const action = el.dataset.action;
    const id = el.dataset.id;

    if (action === 'worklist') return go('#/worklist');
    if (action === 'open') {
      const f = findFax(id);
      if (f.status === STATUS.TRIAGE) initTriage(f);
      return go(`#/fax/${id}`);
    }

    const f = currentFax();
    if (!f) return;
    const t = f.triage;

    switch (action) {
      case 'select-candidate': t.candidateId = el.dataset.id; return render();
      case 'next': t.step = Math.min(3, t.step + 1); return render();
      case 'back': t.step = Math.max(1, t.step - 1); return render();
      case 'urgency': t.urgency = el.dataset.value; return render();
      case 'toggle-phone': t.updatePhone = el.checked; return;
      case 'push':
        f.status = STATUS.PUSHED;
        f.pushedAt = nowTime();
        return render();
      case 'undo-push':
        f.status = STATUS.TRIAGE;
        f.pushedAt = null;
        t.step = 3;
        return render();
      case 'undo-auto':
        f.status = STATUS.TRIAGE;
        initTriage(f);
        return render();
    }
  });

  app.addEventListener('input', (e) => {
    const key = e.target.dataset.field;
    const f = currentFax();
    if (key && f && f.triage && key in f.triage.fields) f.triage.fields[key] = e.target.value;
  });

  app.addEventListener('change', (e) => {
    const f = currentFax();
    if (!f || !f.triage) return;
    if (e.target.dataset.field === 'queue') f.triage.fields.queue = e.target.value;
    if (e.target.dataset.action === 'toggle-phone') f.triage.updatePhone = e.target.checked;
  });

  function go(hash) {
    if (location.hash === hash) render();
    else location.hash = hash;
  }

  window.addEventListener('hashchange', render);
  render();
})();
