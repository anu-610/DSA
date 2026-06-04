/**
 * Algorithm Study Dashboard — Frontend Application
 * Strategy: Load once → navigate from memory → optimistic mutations
 */

(function () {
  'use strict';

  // ── State ──────────────────────────────────────────────────
  let TOPICS = [];         // full topic tree, loaded once
  let notesCache = {};     // scope → notes[], lazily populated
  let solutionsCache = {}; // questionDbId → approaches[], lazily populated

  const state = {
    currentView: 'loading',
    activeTopic: null,
    activeMethod: null,
    expandedTopics: new Set(),
    questionsVisible: false,
    allQuestionsVisible: false,
    allQuestionsFilter: 'all',
    revisionFilter: 'all',
    searchQuery: '',
    aiPanelOpen: false,
    aiLoading: false,
  };

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  // ── API (fire-and-forget for mutations) ────────────────────

  async function api(method, path, body) {
    const opts = { method, headers: { 'Content-Type': 'application/json' } };
    if (body) opts.body = JSON.stringify(body);
    const res = await fetch(`/api${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `API error ${res.status}`);
    return data;
  }

  /** Fire API call in background — don't block UI */
  function fireAPI(method, path, body) {
    api(method, path, body).catch(err => {
      console.error('Background API error:', err);
      showToast(`Sync error: ${err.message}`, 'error');
    });
  }

  // ── Local Stats (computed from memory) ─────────────────────

  function computeStats() {
    let topics = TOPICS.length, methods = 0, questions = 0, checked = 0, revision = 0;
    TOPICS.forEach(t => {
      methods += t.methods.length;
      t.methods.forEach(m => {
        m.questions.forEach(q => {
          questions++;
          if (q.checked) checked++;
          if (q.revision) revision++;
        });
      });
    });
    return { topics, methods, questions, checked, revision };
  }

  // ── Find helpers (all from memory) ─────────────────────────

  function findTopic(id) { return TOPICS.find(t => t.id === id); }
  function findMethod(topicId, methodId) {
    const t = findTopic(topicId); return t ? t.methods.find(m => m.id === methodId) : null;
  }
  function findQuestionByDbId(dbId) {
    for (const t of TOPICS)
      for (const m of t.methods)
        for (const q of m.questions)
          if (q.dbId == dbId) return { question: q, topic: t, method: m };
    return null;
  }
  function getTopicQuestions(topic) {
    const qs = [];
    topic.methods.forEach(m => m.questions.forEach(q => qs.push({ ...q, methodName: m.name, methodId: m.id, topicId: topic.id })));
    return qs;
  }
  function slugify(str) { return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''); }
  function escapeHtml(str) { const d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
  function timeAgo(ts) {
    const diff = Date.now() / 1000 - ts;
    if (diff < 60) return 'just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    return new Date(ts * 1000).toLocaleDateString();
  }

  // ── Toast (minimal error feedback) ─────────────────────────

  function showToast(msg, type = 'info') {
    let container = $('#toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.style.cssText = 'position:fixed;bottom:80px;left:50%;transform:translateX(-50%);z-index:600;display:flex;flex-direction:column;gap:8px;align-items:center;';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.style.cssText = `padding:8px 16px;border-radius:8px;font-size:13px;font-weight:500;box-shadow:0 4px 12px rgba(0,0,0,0.12);animation:fadeIn 200ms ease;background:${type === 'error' ? '#FEF2F2' : '#F0FDF4'};color:${type === 'error' ? '#DC2626' : '#16A34A'};border:1px solid ${type === 'error' ? '#FECACA' : '#BBF7D0'}`;
    toast.textContent = msg;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 300ms'; setTimeout(() => toast.remove(), 300); }, 3000);
  }

  // ── Views ──────────────────────────────────────────────────

  function setView(view) {
    state.currentView = view;
    $$('.view-panel').forEach(v => v.classList.remove('active'));
    const el = $(`#${view}-view`);
    if (el) el.classList.add('active');
    $('#main-content').scrollTop = 0;
  }

  // ── Sidebar ────────────────────────────────────────────────

  function renderSidebar() {
    const query = state.searchQuery.toLowerCase();
    let html = '';
    TOPICS.forEach(topic => {
      const isExpanded = state.expandedTopics.has(topic.id);
      const isActive = state.activeTopic === topic.id;
      const filteredMethods = query
        ? topic.methods.filter(m => m.name.toLowerCase().includes(query) || m.questions.some(q => q.title.toLowerCase().includes(query)))
        : topic.methods;
      if (query && filteredMethods.length === 0 && !topic.name.toLowerCase().includes(query)) return;
      const showExpanded = isExpanded || (query && filteredMethods.length > 0);
      const methods = query ? filteredMethods : topic.methods;
      html += `<div class="nav-topic"><button class="nav-topic-btn ${isActive ? 'active' : ''} ${showExpanded ? 'expanded' : ''}" data-topic-id="${topic.id}"><span class="nav-topic-icon">${topic.icon}</span><span>${escapeHtml(topic.name)}</span><span class="nav-topic-chevron"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M5 3.5L9 7L5 10.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg></span></button>
        <div class="nav-methods ${showExpanded ? 'expanded' : ''}">${methods.map(m => `<button class="nav-method-btn ${state.activeMethod === m.id && state.activeTopic === topic.id ? 'active' : ''}" data-topic-id="${topic.id}" data-method-id="${m.id}"><span>${escapeHtml(m.name)}</span><span class="nav-method-count">${m.questions.length}</span></button>`).join('')}</div></div>`;
    });
    $('#sidebar-nav').innerHTML = html;
    $('#sidebar-nav').querySelectorAll('.nav-topic-btn').forEach(b => b.addEventListener('click', () => toggleTopic(b.dataset.topicId)));
    $('#sidebar-nav').querySelectorAll('.nav-method-btn').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); navigateToMethod(b.dataset.topicId, b.dataset.methodId); }));
  }

  function toggleTopic(id) {
    state.expandedTopics.has(id) ? state.expandedTopics.delete(id) : state.expandedTopics.add(id);
    navigateToTopic(id);
    renderSidebar();
  }

  // ── Progress (from memory) ─────────────────────────────────

  function updateProgress() {
    const stats = computeStats();
    $('#progress-pct').textContent = `${stats.checked} / ${stats.questions}`;
    $('#progress-fill').style.width = stats.questions > 0 ? `${Math.round((stats.checked / stats.questions) * 100)}%` : '0%';
  }

  // ── Welcome ────────────────────────────────────────────────

  function renderWelcome() {
    const stats = computeStats();
    $('#welcome-stats').innerHTML = `
      <div class="stat-card"><div class="stat-number">${stats.topics}</div><div class="stat-label">Topics</div></div>
      <div class="stat-card"><div class="stat-number">${stats.methods}</div><div class="stat-label">Patterns</div></div>
      <div class="stat-card"><div class="stat-number">${stats.checked}<span class="stat-sub">/ ${stats.questions}</span></div><div class="stat-label">Solved</div></div>
      <div class="stat-card clickable" id="stat-revision-card"><div class="stat-number">${stats.revision}</div><div class="stat-label">For Revision</div></div>`;
    $('#stat-revision-card')?.addEventListener('click', navigateToRevision);
    updateProgress();

    $('#welcome-cards').innerHTML = TOPICS.map(t => {
      const qc = getTopicQuestions(t).length;
      return `<div class="welcome-card" data-topic-id="${t.id}"><div class="welcome-card-icon">${t.icon}</div><div class="welcome-card-info"><h3>${escapeHtml(t.name)}</h3><p>${t.methods.length} patterns · ${qc} questions</p></div></div>`;
    }).join('');
    $('#welcome-cards').querySelectorAll('.welcome-card').forEach(c => c.addEventListener('click', () => { state.expandedTopics.add(c.dataset.topicId); navigateToTopic(c.dataset.topicId); }));

    renderNotes('home', 'home-notes-list', 'home-add-note-btn');
  }

  // ── Navigation (all synchronous from memory) ───────────────

  function navigateToWelcome() {
    state.activeTopic = null; state.activeMethod = null;
    renderWelcome();
    setView('welcome');
    renderSidebar();
  }

  function navigateToTopic(topicId) {
    const topic = findTopic(topicId);
    if (!topic) return;
    state.activeTopic = topicId; state.activeMethod = null;
    state.allQuestionsVisible = false; state.allQuestionsFilter = 'all';
    state.expandedTopics.add(topicId);

    $('#topic-icon').textContent = topic.icon;
    $('#topic-title').textContent = topic.name;
    $('#topic-desc').textContent = topic.description;
    $('#topic-method-count').textContent = `${topic.methods.length} patterns`;
    $('#view-all-questions-btn span').textContent = `View All ${topic.name} Questions`;
    $('#all-questions-panel').classList.remove('visible');
    resetFilters('difficulty-filters');
    renderMethodCards(topic);
    renderNotes(`topic:${topicId}`, 'topic-notes-list', 'topic-add-note-btn');
    setView('topic'); renderSidebar();
  }

  function navigateToMethod(topicId, methodId) {
    const topic = findTopic(topicId);
    const method = findMethod(topicId, methodId);
    if (!topic || !method) return;
    state.activeTopic = topicId; state.activeMethod = methodId;
    state.questionsVisible = false; state.expandedTopics.add(topicId);

    $('#method-badge').textContent = topic.name;
    $('#method-title').textContent = method.name;
    $('#method-explanation').innerHTML = method.explanation;
    $('#method-back-text').textContent = `Back to ${topic.name}`;
    $('#method-questions').classList.remove('visible');
    $('#show-questions-btn').classList.remove('expanded');
    $('#show-questions-btn span').textContent = 'Show Questions';
    renderNotes(`method:${topicId}:${methodId}`, 'method-notes-list', 'method-add-note-btn');
    setView('method'); renderSidebar();
  }

  function navigateToRevision() {
    state.activeTopic = null; state.activeMethod = null; state.revisionFilter = 'all';
    renderRevisionList();
    setView('revision'); renderSidebar();
  }

  // ── Method Cards ───────────────────────────────────────────

  function renderMethodCards(topic) {
    const c = $('#method-cards');
    c.innerHTML = topic.methods.map(m => {
      const preview = m.explanation.replace(/<[^>]+>/g, '').trim().substring(0, 120) + '…';
      const solved = m.questions.filter(q => q.checked).length;
      return `<div class="method-card" data-topic-id="${topic.id}" data-method-id="${m.id}"><div class="method-card-info"><h3>${escapeHtml(m.name)}</h3><p>${preview}</p></div><div class="method-card-meta">${solved > 0 ? `<span class="method-card-solved">${solved}/${m.questions.length}</span>` : ''}<span class="method-card-count">${m.questions.length} questions</span><span class="method-card-arrow"><svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg></span></div></div>`;
    }).join('');
    c.querySelectorAll('.method-card').forEach(card => card.addEventListener('click', () => navigateToMethod(card.dataset.topicId, card.dataset.methodId)));
  }

  // ── Question Rendering ─────────────────────────────────────

  function renderQuestionItem(q, index, topicId, methodId, opts = {}) {
    return `
      <div class="question-item-wrapper" data-dbid="${q.dbId}">
        <div class="question-item ${q.checked ? 'checked' : ''}" data-dbid="${q.dbId}" style="animation-delay:${index * 30}ms">
          <button class="question-check ${q.checked ? 'active' : ''}" data-dbid="${q.dbId}" title="${q.checked ? 'Uncheck' : 'Mark solved'}">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">${q.checked
              ? '<rect width="16" height="16" rx="4" fill="#18181B"/><path d="M4.5 8L7 10.5L11.5 5.5" stroke="#fff" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>'
              : '<rect x="0.5" y="0.5" width="15" height="15" rx="3.5" stroke="currentColor" stroke-width="1"/>'}</svg>
          </button>
          <span class="question-number">${String(index + 1).padStart(2, '0')}</span>
          <div class="question-info">
            <button class="question-title-btn ${q.checked ? 'solved' : ''}" data-dbid="${q.dbId}" title="View Solutions">${escapeHtml(q.title)}</button>
            ${q.remark ? `<span class="question-remark">${escapeHtml(q.remark)}</span>` : ''}
          </div>
          ${opts.showMethodTag ? `<span class="question-method-tag">${escapeHtml(q.methodName || '')}</span>` : ''}
          <span class="difficulty-tag ${q.difficulty.toLowerCase()}">${q.difficulty}</span>
          <button class="question-action-btn revision-btn ${q.revision ? 'active' : ''}" data-dbid="${q.dbId}" title="${q.revision ? 'Unmark revision' : 'Mark for revision'}">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.4 3.3 12.3l.7-4.1-3-2.9 4.2-.7L7 1z" stroke="currentColor" stroke-width="1.2" fill="${q.revision ? 'currentColor' : 'none'}" stroke-linejoin="round"/></svg>
          </button>
          <button class="question-action-btn note-btn" data-dbid="${q.dbId}" data-title="${escapeHtml(q.title)}" data-topicid="${topicId}" data-methodid="${methodId}" title="Remark / Notes">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 2h10v9l-3-1.5L6 11V2" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
          </button>
          <a class="question-link" href="${q.link}" target="_blank" rel="noopener noreferrer">Solve <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M4 3H9V8" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 3L3 9" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg></a>
        </div>
        <div class="solution-panel" id="solution-panel-${q.dbId}" style="display:none;"></div>
      </div>`;
  }

  function attachQuestionListeners(container) {
    // Checkbox — optimistic
    container.querySelectorAll('.question-check').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dbId = btn.dataset.dbid;
        const found = findQuestionByDbId(dbId);
        if (!found) return;
        const q = found.question;

        if (!q.checked) {
          // Show remark modal, then update
          showRemarkModal(dbId, (remark) => {
            q.checked = true;
            q.remark = remark;
            fireAPI('PATCH', `/questions/${dbId}/check`, { checked: true, remark });
            refreshCurrentView();
          });
        } else {
          q.checked = false;
          q.remark = '';
          fireAPI('PATCH', `/questions/${dbId}/check`, { checked: false, remark: '' });
          refreshCurrentView();
        }
      });
    });

    // Revision — optimistic
    container.querySelectorAll('.revision-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const found = findQuestionByDbId(btn.dataset.dbid);
        if (!found) return;
        found.question.revision = !found.question.revision;
        fireAPI('PATCH', `/questions/${btn.dataset.dbid}/revision`, { revision: found.question.revision });
        refreshCurrentView();
      });
    });

    // Note button
    container.querySelectorAll('.note-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const scope = `question:${btn.dataset.topicid}:${btn.dataset.methodid}:${btn.dataset.title}`;
        showQuestionNoteModal(btn.dataset.dbid, scope);
      });
    });

    // Title click → toggle solution panel
    container.querySelectorAll('.question-title-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dbId = btn.dataset.dbid;
        const panel = document.getElementById(`solution-panel-${dbId}`);
        if (!panel) return;

        if (panel.style.display !== 'none') {
          panel.style.display = 'none';
          btn.classList.remove('expanded');
          return;
        }

        // Collapse any other open panels in this container
        container.querySelectorAll('.solution-panel').forEach(p => { p.style.display = 'none'; });
        container.querySelectorAll('.question-title-btn').forEach(b => b.classList.remove('expanded'));

        btn.classList.add('expanded');
        panel.style.display = 'block';
        loadSolutionPanel(dbId, panel);
      });
    });
  }

  // ── Solution Panel ─────────────────────────────────────────

  async function loadSolutionPanel(dbId, panel) {
    // Show loading
    panel.innerHTML = '<div class="solution-loading"><div class="spinner-sm"></div><span>Loading solutions…</span></div>';

    // Fetch or use cache
    let approaches = solutionsCache[dbId];
    if (!approaches) {
      try {
        approaches = await api('GET', `/questions/${dbId}/solutions`);
        solutionsCache[dbId] = approaches;
      } catch {
        approaches = [];
      }
    }

    if (!approaches.length) {
      panel.innerHTML = `
        <div class="solution-empty">
          <p>No solutions added yet.</p>
          <div style="max-width:400px; margin: 16px auto 0;">
            <input type="text" id="sol-instruct-${dbId}" class="modal-textarea" style="margin-bottom:8px;font-size:13px;padding:8px" placeholder="Optional: Custom instructions for AI (e.g. 'Use Python' or 'Explain like I am 5')">
            <button class="btn btn-secondary btn-sm solution-generate-btn" data-dbid="${dbId}">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              Generate with AI
            </button>
          </div>
        </div>`;
      panel.querySelector('.solution-generate-btn')?.addEventListener('click', () => generateSolutions(dbId, panel));
      return;
    }

    renderSolutionApproaches(approaches, panel, dbId);
  }

  function renderSolutionApproaches(approaches, panel, dbId) {
    const approachLabels = { brute: 'Brute Force', better: 'Better', optimal: 'Optimal' };
    const approachIcons = { brute: '🔨', better: '⚡', optimal: '🎯' };
    const approachColors = { brute: '#EF4444', better: '#F59E0B', optimal: '#10B981' };

    let html = `
      <div class="solution-approaches">
        ${approaches.map((a, i) => `
          <div class="approach-card" data-approach="${a.approach}">
            <button class="approach-header" data-index="${i}">
              <div class="approach-header-left">
                <span class="approach-icon">${approachIcons[a.approach] || '📌'}</span>
                <span class="approach-label" style="--approach-color: ${approachColors[a.approach] || '#6B7280'}">${a.title || approachLabels[a.approach] || a.approach}</span>
              </div>
              <div class="approach-header-right">
                ${a.time_complexity ? `<span class="complexity-pill" title="Time Complexity">⏱ ${escapeHtml(a.time_complexity)}</span>` : ''}
                ${a.space_complexity ? `<span class="complexity-pill" title="Space Complexity">💾 ${escapeHtml(a.space_complexity)}</span>` : ''}
                <svg class="approach-chevron" width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4 5.5L7 8.5L10 5.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
            </button>
            <div class="approach-body" style="display:none;">
              <div class="approach-explanation">${a.explanation}</div>
              ${a.code ? `
                <div class="approach-code-section">
                  <button class="approach-code-toggle">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M4.5 3.5L1.5 7l3 3.5M9.5 3.5l3 3.5-3 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                    <span>View Code</span>
                    <svg class="code-chevron" width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
                  </button>
                  <div class="approach-code-block" style="display:none;">
                    <div class="code-header">
                      <span>Code</span>
                      <button class="code-copy-btn" title="Copy code">
                        <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="4" y="4" width="9" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/><path d="M10 4V2.5A1.5 1.5 0 008.5 1H2.5A1.5 1.5 0 001 2.5v6A1.5 1.5 0 002.5 10H4" stroke="currentColor" stroke-width="1.2"/></svg>
                      </button>
                    </div>
                    <pre><code>${escapeHtml(a.code)}</code></pre>
                  </div>
                </div>
              ` : ''}
            </div>
          </div>
        `).join('')}
      </div>
      <div class="solution-actions" style="margin-top:16px; display:flex; gap:8px; align-items:center; border-top:1px solid var(--color-border); padding-top:16px;">
        <input type="text" id="sol-instruct-${dbId}" class="modal-textarea" style="flex:1; font-size:13px; padding:8px 12px; margin:0; height:36px" placeholder="Custom AI instructions (e.g. 'Use Python' or 'Explain like I am 5')">
        <button class="btn btn-secondary btn-sm solution-regen-btn" style="height:36px; white-space:nowrap;">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M1 4v4h4M13 10V6H9M13 6A6 6 0 114.5 1.8M1 10a6 6 0 008.5 4.2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Regenerate
        </button>
      </div>
    `;
    panel.innerHTML = html;

    // Bind approach accordion
    panel.querySelectorAll('.approach-header').forEach(hdr => {
      hdr.addEventListener('click', () => {
        const card = hdr.closest('.approach-card');
        const body = card.querySelector('.approach-body');
        const isOpen = body.style.display !== 'none';
        body.style.display = isOpen ? 'none' : 'block';
        card.classList.toggle('open', !isOpen);
      });
    });

    // Bind code toggles
    panel.querySelectorAll('.approach-code-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const block = btn.nextElementSibling;
        const isOpen = block.style.display !== 'none';
        block.style.display = isOpen ? 'none' : 'block';
        btn.classList.toggle('open', !isOpen);
      });
    });

    // Bind copy buttons
    panel.querySelectorAll('.code-copy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.closest('.approach-code-block').querySelector('code').textContent;
        navigator.clipboard.writeText(code).then(() => showToast('Code copied!', 'success'));
      });
    });

    // Bind regenerate
    panel.querySelector('.solution-regen-btn')?.addEventListener('click', () => generateSolutions(dbId, panel));

    // Auto-expand first approach
    const firstHeader = panel.querySelector('.approach-header');
    if (firstHeader) firstHeader.click();
  }

  async function generateSolutions(dbId, panel) {
    const found = findQuestionByDbId(dbId);
    if (!found) return;
    const q = found.question;

    // Grab custom instruction before replacing HTML
    const instructInput = document.getElementById(`sol-instruct-${dbId}`);
    const customInstruction = instructInput ? instructInput.value.trim() : '';

    panel.innerHTML = '<div class="solution-loading"><div class="spinner-sm"></div><span>Generating solutions with AI… This may take a moment.</span></div>';

    let prompt = `Generate solutions for the LeetCode problem "${q.title}" (${q.difficulty}).
CRITICAL REQUIREMENTS:
1. Provide ALL applicable approaches in this order: brute force, then better, then optimal. If an approach doesn't exist, omit it, but you MUST provide optimal.
2. You MUST include time_complexity and space_complexity for EVERY approach (e.g. "O(N)", "O(1)"). Do not leave them empty.
3. For each approach provide: approach type ("brute", "better", or "optimal"), a short title, a clear explanation with algorithm steps, and code.`;

    if (customInstruction) {
      prompt += `\nUSER INSTRUCTION: ${customInstruction}`;
    } else {
      prompt += `\nCode should be in C++.`;
    }

    prompt += `\nRespond with JSON only:
{
  "approaches": [
    {
      "approach": "brute|better|optimal",
      "title": "Short title of approach",
      "explanation": "<div class='solution-text'><h4>Intuition</h4><p>...</p><h4>Algorithm</h4><ol><li>...</li></ol></div>",
      "code": "Code here",
      "time_complexity": "O(...)",
      "space_complexity": "O(...)"
    }
  ]
}`;

    const models = ['gemini-3.5-flash', 'gemini-2.5-flash'];

    for (const model of models) {
      try {
        panel.innerHTML = `<div class="solution-loading"><div class="spinner-sm"></div><span>Generating with ${model}…</span></div>`;

        const res = await api('POST', '/ai/chat', {
          message: prompt,
          context: { view: 'generate_solutions' },
          model,
        });

        if (res.parsed?.approaches) {
          await api('POST', `/questions/${dbId}/solutions`, { approaches: res.parsed.approaches });
          solutionsCache[dbId] = res.parsed.approaches;
          renderSolutionApproaches(res.parsed.approaches, panel, dbId);
          showToast(`Solutions generated with ${model}!`, 'success');
          return;
        }
      } catch (err) {
        console.warn(`${model} failed:`, err.message);
        if (model === models[models.length - 1]) {
          // Last model also failed
          panel.innerHTML = `<div class="solution-empty"><p>Error: ${escapeHtml(err.message)}</p>
          <button class="btn btn-secondary btn-sm mt-2" onclick="loadSolutionPanel('${dbId}', document.getElementById('solution-panel-${dbId}'))">Try Again</button></div>`;
          return;
        }
      }
    }

    panel.innerHTML = `<div class="solution-empty"><p>Could not generate solutions. Please try again.</p>
    <button class="btn btn-secondary btn-sm mt-2" onclick="loadSolutionPanel('${dbId}', document.getElementById('solution-panel-${dbId}'))">Try Again</button></div>`;
  }

  function renderMethodQuestions() {
    const method = findMethod(state.activeTopic, state.activeMethod);
    if (!method) return;
    const grouped = { Easy: [], Medium: [], Hard: [] };
    method.questions.forEach(q => { if (grouped[q.difficulty]) grouped[q.difficulty].push(q); });
    let html = '', idx = 0;
    ['Easy', 'Medium', 'Hard'].forEach(d => {
      if (!grouped[d].length) return;
      html += `<div class="difficulty-section"><div class="difficulty-section-header"><span class="difficulty-dot ${d.toLowerCase()}"></span>${d} (${grouped[d].length})</div><div class="questions-grid">${grouped[d].map(q => renderQuestionItem(q, idx++, state.activeTopic, state.activeMethod)).join('')}</div></div>`;
    });
    const inner = $('#method-questions-inner');
    inner.innerHTML = html;
    attachQuestionListeners(inner);
  }

  function renderAllQuestions() {
    const topic = findTopic(state.activeTopic);
    if (!topic) return;
    const qs = getTopicQuestions(topic);
    const f = state.allQuestionsFilter;
    const filtered = f === 'all' ? qs : qs.filter(q => q.difficulty === f);
    const c = $('#all-questions-list');
    if (!filtered.length) { c.innerHTML = '<div class="empty-state"><p>No questions match this filter.</p></div>'; return; }
    c.innerHTML = filtered.map((q, i) => renderQuestionItem(q, i, q.topicId, q.methodId, { showMethodTag: true })).join('');
    attachQuestionListeners(c);
  }

  // ── Revision List (from memory) ────────────────────────────

  function renderRevisionList() {
    const f = state.revisionFilter;
    const items = [];
    TOPICS.forEach(t => t.methods.forEach(m => m.questions.forEach(q => {
      if (!q.revision) return;
      if (f !== 'all' && q.difficulty !== f) return;
      items.push({ ...q, topicId: t.id, methodId: m.id, methodName: m.name, topicName: t.name });
    })));

    const c = $('#revision-list');
    if (!items.length) { c.innerHTML = '<div class="empty-state"><p>No items marked for revision.</p></div>'; return; }
    c.innerHTML = `<div class="questions-grid">${items.map((q, i) => renderQuestionItem(q, i, q.topicId, q.methodId, { showMethodTag: true })).join('')}</div>`;
    attachQuestionListeners(c);
  }

  // ── Notes (lazy-cached) ────────────────────────────────────

  async function renderNotes(scope, listId, addBtnId) {
    const list = $(`#${listId}`);
    const addBtn = $(`#${addBtnId}`);
    if (!list || !addBtn) return;

    // Use cache if available, otherwise fetch once
    let notes;
    if (notesCache[scope]) {
      notes = notesCache[scope];
    } else {
      try {
        notes = await api('GET', `/notes/${encodeURIComponent(scope)}`);
        notesCache[scope] = notes;
      } catch {
        notes = [];
      }
    }

    list.innerHTML = notes.length === 0 ? '' : notes.map(n => `
      <div class="note-card"><div class="note-content">${escapeHtml(n.text)}</div>
      <div class="note-meta"><span>${timeAgo(n.created_at)}</span><div class="note-actions">
        <button class="btn-icon-sm note-edit" data-scope="${scope}" data-note-id="${n.id}"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2L4 10H2V8L8.5 1.5z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg></button>
        <button class="btn-icon-sm note-delete" data-scope="${scope}" data-note-id="${n.id}"><svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg></button>
      </div></div></div>
    `).join('');

    list.querySelectorAll('.note-edit').forEach(b => b.addEventListener('click', () => {
      const n = notes.find(x => x.id == b.dataset.noteId);
      if (n) showEditNoteModal(b.dataset.scope, b.dataset.noteId, n.text, listId, addBtnId);
    }));
    list.querySelectorAll('.note-delete').forEach(b => b.addEventListener('click', async () => {
      // Optimistic: remove from cache
      notesCache[scope] = (notesCache[scope] || []).filter(n => n.id != b.dataset.noteId);
      fireAPI('DELETE', `/notes/${b.dataset.noteId}`);
      renderNotes(scope, listId, addBtnId);
    }));

    const newBtn = addBtn.cloneNode(true);
    addBtn.parentNode.replaceChild(newBtn, addBtn);
    newBtn.addEventListener('click', () => showAddNoteModal(scope, listId, addBtnId));
  }

  // ── Modals ─────────────────────────────────────────────────

  function showModal(title, bodyHtml, footerHtml, onSubmit) {
    const overlay = $('#modal-overlay');
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = bodyHtml;
    $('#modal-footer').innerHTML = footerHtml;
    overlay.classList.add('visible');
    const close = () => overlay.classList.remove('visible');
    $('#modal-close').onclick = close;
    overlay.onclick = (e) => { if (e.target === overlay) close(); };
    if (onSubmit) {
      const sub = $('#modal').querySelector('[data-action="submit"]');
      if (sub) sub.onclick = () => { onSubmit(); close(); };
    }
    setTimeout(() => { const inp = $('#modal').querySelector('input, textarea'); if (inp) inp.focus(); }, 100);
    return close;
  }

  function showRemarkModal(dbId, onDone) {
    showModal('Mark as Solved', `
      <label class="modal-label">Add a remark (optional)</label>
      <textarea id="remark-input" class="modal-textarea" placeholder="e.g., Used two-pass approach…" rows="3"></textarea>
    `, `<button class="btn btn-ghost" data-action="skip">Skip</button><button class="btn btn-primary" data-action="submit">Mark Solved</button>`,
    () => { onDone($('#remark-input').value.trim()); });
    setTimeout(() => {
      const skip = $('#modal').querySelector('[data-action="skip"]');
      if (skip) skip.onclick = () => { $('#modal-overlay').classList.remove('visible'); onDone(''); };
    }, 10);
  }

  async function showQuestionNoteModal(dbId, scope) {
    const found = findQuestionByDbId(dbId);
    const currentRemark = found?.question?.remark || '';

    // Fetch existing notes or use cache
    if (!notesCache[scope]) {
      try {
        notesCache[scope] = await api('GET', `/notes/${encodeURIComponent(scope)}`);
      } catch { notesCache[scope] = []; }
    }

    function renderModalContent() {
      const notes = notesCache[scope] || [];
      return `
        <div class="qnote-section">
          <label class="modal-label">Remark</label>
          <textarea id="qnote-remark" class="modal-textarea" placeholder="Quick remark about your approach…" rows="2">${escapeHtml(currentRemark)}</textarea>
        </div>

        <div class="qnote-section" style="margin-top:20px">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
            <label class="modal-label" style="margin:0">Notes <span style="color:var(--color-text-tertiary);font-weight:400">(${notes.length})</span></label>
          </div>
          ${notes.length === 0 ? '<p style="color:var(--color-text-tertiary);font-size:13px;margin:0;">No notes yet. Add one below.</p>' : `
            <div id="qnote-list" style="max-height:240px;overflow-y:auto;display:flex;flex-direction:column;gap:8px;">
              ${notes.map(n => `
                <div class="qnote-card" data-note-id="${n.id}">
                  <div class="qnote-card-body">
                    <div class="qnote-card-text">${escapeHtml(n.text)}</div>
                    <div class="qnote-card-meta">
                      <span>${timeAgo(n.created_at)}</span>
                      <div class="qnote-card-actions">
                        <button class="qnote-action-btn qnote-edit-btn" data-note-id="${n.id}" title="Edit">
                          <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M8.5 1.5l2 2L4 10H2V8L8.5 1.5z" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/></svg>
                        </button>
                        <button class="qnote-action-btn qnote-delete-btn" data-note-id="${n.id}" title="Delete">
                          <svg width="13" height="13" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>

        <div class="qnote-section" style="margin-top:20px">
          <label class="modal-label">Add a new note</label>
          <div style="display:flex;gap:8px;">
            <textarea id="qnote-new" class="modal-textarea" placeholder="Write a note…" rows="2" style="flex:1"></textarea>
            <button id="qnote-add-btn" class="btn btn-secondary" style="align-self:flex-end;white-space:nowrap;height:38px;padding:0 16px;">+ Add</button>
          </div>
        </div>
      `;
    }

    function bindModalEvents() {
      // Add note inline
      const addBtn = $('#qnote-add-btn');
      if (addBtn) addBtn.onclick = async () => {
        const txt = $('#qnote-new').value.trim();
        if (!txt) return;
        const newNote = { id: Date.now(), text: txt, created_at: Math.floor(Date.now() / 1000) };
        notesCache[scope] = [newNote, ...(notesCache[scope] || [])];
        fireAPI('POST', '/notes', { scope, text: txt });
        // Re-render modal content in-place
        $('#modal-body').innerHTML = renderModalContent();
        bindModalEvents();
      };

      // Edit buttons
      document.querySelectorAll('.qnote-edit-btn').forEach(btn => {
        btn.onclick = () => {
          const noteId = btn.dataset.noteId;
          const card = btn.closest('.qnote-card');
          const notes = notesCache[scope] || [];
          const note = notes.find(n => n.id == noteId);
          if (!note) return;
          // Replace card content with an edit textarea
          const body = card.querySelector('.qnote-card-body');
          body.innerHTML = `
            <textarea class="modal-textarea qnote-edit-area" rows="3" style="font-size:13px">${escapeHtml(note.text)}</textarea>
            <div style="display:flex;gap:6px;justify-content:flex-end;margin-top:6px">
              <button class="btn btn-ghost btn-sm qnote-cancel-edit">Cancel</button>
              <button class="btn btn-primary btn-sm qnote-save-edit">Save</button>
            </div>
          `;
          body.querySelector('.qnote-edit-area').focus();
          body.querySelector('.qnote-cancel-edit').onclick = () => {
            $('#modal-body').innerHTML = renderModalContent();
            bindModalEvents();
          };
          body.querySelector('.qnote-save-edit').onclick = async () => {
            const newText = body.querySelector('.qnote-edit-area').value.trim();
            if (!newText) return;
            note.text = newText;
            fireAPI('PATCH', `/notes/${noteId}`, { text: newText });
            $('#modal-body').innerHTML = renderModalContent();
            bindModalEvents();
          };
        };
      });

      // Delete buttons
      document.querySelectorAll('.qnote-delete-btn').forEach(btn => {
        btn.onclick = () => {
          const noteId = btn.dataset.noteId;
          notesCache[scope] = (notesCache[scope] || []).filter(n => n.id != noteId);
          fireAPI('DELETE', `/notes/${noteId}`);
          $('#modal-body').innerHTML = renderModalContent();
          bindModalEvents();
        };
      });
    }

    showModal('Question Notes & Remark', renderModalContent(),
      `<button class="btn btn-primary" data-action="submit">Save Remark</button>`,
      () => {
        const remark = $('#qnote-remark').value.trim();
        if (found) {
          found.question.remark = remark;
          fireAPI('PATCH', `/questions/${dbId}/remark`, { remark });
        }
        refreshCurrentView();
      }
    );
    bindModalEvents();
  }

  function showAddNoteModal(scope, listId, addBtnId) {
    showModal('Add Note', `<textarea id="new-note-text" class="modal-textarea" placeholder="Write your note…" rows="4"></textarea>`,
    `<button class="btn btn-primary" data-action="submit">Add Note</button>`,
    () => {
      const t = $('#new-note-text').value.trim();
      if (t) {
        const newNote = { id: Date.now(), text: t, created_at: Math.floor(Date.now() / 1000) };
        notesCache[scope] = [newNote, ...(notesCache[scope] || [])];
        fireAPI('POST', '/notes', { scope, text: t });
        renderNotes(scope, listId, addBtnId);
      }
    });
  }

  function showEditNoteModal(scope, noteId, currentText, listId, addBtnId) {
    showModal('Edit Note', `<textarea id="edit-note-text" class="modal-textarea" rows="4">${escapeHtml(currentText)}</textarea>`,
    `<button class="btn btn-primary" data-action="submit">Save</button>`,
    () => {
      const t = $('#edit-note-text').value.trim();
      if (t) {
        // Optimistic update cache
        const cached = notesCache[scope];
        if (cached) { const n = cached.find(x => x.id == noteId); if (n) n.text = t; }
        fireAPI('PATCH', `/notes/${noteId}`, { text: t });
        renderNotes(scope, listId, addBtnId);
      }
    });
  }

  // ── Add Topic / Method / Question Modals ───────────────────

  function showAddTopicModal() {
    showModal('Add New Topic', `
      <label class="modal-label">Topic Name</label><input type="text" id="new-topic-name" class="modal-input" placeholder="e.g., Backtracking" />
      <label class="modal-label">Icon (emoji)</label><input type="text" id="new-topic-icon" class="modal-input" placeholder="e.g., 🔙" maxlength="4" />
      <label class="modal-label">Description</label><textarea id="new-topic-desc" class="modal-textarea" placeholder="Brief description…" rows="2"></textarea>
    `, `<button class="btn btn-primary" data-action="submit">Add Topic</button>`,
    async () => {
      const name = $('#new-topic-name').value.trim();
      if (!name) return;
      const id = slugify(name);
      const icon = $('#new-topic-icon').value.trim() || '📁';
      const desc = $('#new-topic-desc').value.trim();
      // Optimistic: add to memory
      TOPICS.push({ id, name, icon, description: desc, methods: [] });
      fireAPI('POST', '/topics', { id, name, icon, description: desc });
      renderSidebar(); renderWelcome(); navigateToTopic(id);
    });
  }

  function showAddMethodModal() {
    const topic = findTopic(state.activeTopic);
    if (!topic) return;
    showModal(`Add Pattern to ${topic.name}`, `
      <label class="modal-label">Pattern Name</label><input type="text" id="new-method-name" class="modal-input" placeholder="e.g., Monotonic Stack" />
      <label class="modal-label">Explanation (HTML or plain text)</label><textarea id="new-method-expl" class="modal-textarea" placeholder="Describe the pattern…" rows="6"></textarea>
    `, `<button class="btn btn-primary" data-action="submit">Add Pattern</button>`,
    async () => {
      const name = $('#new-method-name').value.trim();
      if (!name) return;
      let expl = $('#new-method-expl').value.trim();
      if (expl && !expl.includes('<')) expl = `<div class="explanation-section"><p>${expl}</p></div>`;
      const id = slugify(name);
      // Optimistic
      topic.methods.push({ id, name, explanation: expl || '', questions: [] });
      fireAPI('POST', '/methods', { id, topicId: state.activeTopic, name, explanation: expl || '' });
      navigateToTopic(state.activeTopic);
    });
  }

  function showAddQuestionModal() {
    const method = findMethod(state.activeTopic, state.activeMethod);
    if (!method) return;
    showModal(`Add Question to ${method.name}`, `
      <label class="modal-label">Question Title</label><input type="text" id="new-q-title" class="modal-input" placeholder="e.g., Two Sum" />
      <label class="modal-label">LeetCode Link</label><input type="text" id="new-q-link" class="modal-input" placeholder="https://leetcode.com/problems/..." />
      <label class="modal-label">Difficulty</label><select id="new-q-diff" class="modal-select"><option value="Easy">Easy</option><option value="Medium" selected>Medium</option><option value="Hard">Hard</option></select>
      <div class="modal-divider"></div>
      <p class="modal-hint">Or add multiple (one per line):</p>
      <textarea id="new-q-bulk" class="modal-textarea" placeholder="Question 1&#10;Question 2" rows="4"></textarea>
    `, `<button class="btn btn-primary" data-action="submit">Add</button>`,
    async () => {
      const title = $('#new-q-title').value.trim();
      const link = $('#new-q-link').value.trim();
      const diff = $('#new-q-diff').value;
      const bulk = $('#new-q-bulk').value.trim();
      const qs = [];
      if (title) qs.push({ title, link: link || `https://leetcode.com/problems/${slugify(title)}/`, difficulty: diff });
      if (bulk) bulk.split('\n').forEach(l => { const t = l.trim(); if (t && t !== title) qs.push({ title: t, link: `https://leetcode.com/problems/${slugify(t)}/`, difficulty: diff }); });
      if (qs.length) {
        // Optimistic: add to memory with temp dbIds
        qs.forEach(q => method.questions.push({ dbId: 'tmp-' + Date.now() + Math.random(), title: q.title, link: q.link, difficulty: q.difficulty, checked: false, remark: '', revision: false }));
        // Fire API, then reload to get real dbIds
        api('POST', '/questions', { topicId: state.activeTopic, methodId: state.activeMethod, questions: qs })
          .then(() => api('GET', '/topics'))
          .then(data => { TOPICS = data; refreshCurrentView(); renderSidebar(); })
          .catch(err => showToast(err.message, 'error'));
        if (state.questionsVisible) renderMethodQuestions();
        renderSidebar();
      }
    });
  }

  // ── Refresh (all from memory) ──────────────────────────────

  function resetFilters(id) { $$(`#${id} .filter-btn`).forEach(b => b.classList.toggle('active', b.dataset.filter === 'all')); }

  function refreshCurrentView() {
    updateProgress();
    switch (state.currentView) {
      case 'welcome': renderWelcome(); break;
      case 'topic': navigateToTopic(state.activeTopic); break;
      case 'method':
        if (state.questionsVisible) renderMethodQuestions();
        renderNotes(`method:${state.activeTopic}:${state.activeMethod}`, 'method-notes-list', 'method-add-note-btn');
        break;
      case 'revision': renderRevisionList(); break;
    }
    renderSidebar();
  }

  // ── AI Chat ────────────────────────────────────────────────

  let chatHistory = []; // {role: 'user'|'model', text: string}

  function initAI() {
    const fab = $('#ai-fab'), panel = $('#ai-panel');
    fab.addEventListener('click', () => { state.aiPanelOpen = !state.aiPanelOpen; panel.classList.toggle('open', state.aiPanelOpen); fab.classList.toggle('active', state.aiPanelOpen); if (state.aiPanelOpen) $('#ai-input').focus(); });
    $('#ai-close-btn').addEventListener('click', () => { state.aiPanelOpen = false; panel.classList.remove('open'); fab.classList.remove('active'); });
    $('#ai-send-btn').addEventListener('click', sendAI);
    $('#ai-input').addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendAI(); } });
  }

  function addAIMsg(role, text) {
    const msgs = $('#ai-messages');
    const div = document.createElement('div');
    div.className = `ai-msg ai-msg-${role}`;
    div.innerHTML = role === 'system' ? `<span class="ai-system-msg">${text}</span>` : `<span>${escapeHtml(text)}</span>`;
    msgs.appendChild(div); msgs.scrollTop = msgs.scrollHeight;
  }

  async function sendAI() {
    const input = $('#ai-input');
    const text = input.value.trim();
    if (!text || state.aiLoading) return;
    addAIMsg('user', text); input.value = '';
    state.aiLoading = true;
    addAIMsg('system', '⏳ Thinking…');

    const context = {
      view: state.currentView,
      topicName: state.activeTopic ? findTopic(state.activeTopic)?.name : null,
      topicId: state.activeTopic,
      methodName: state.activeMethod ? findMethod(state.activeTopic, state.activeMethod)?.name : null,
      methodId: state.activeMethod,
      existingTopics: TOPICS.map(t => t.name),
      existingMethods: Object.fromEntries(TOPICS.map(t => [t.id, t.methods.map(m => ({ id: m.id, name: m.name }))])),
    };

    try {
      const model = $('#ai-model-select').value;
      // Send full chat history so Gemini remembers past messages
      const res = await api('POST', '/ai/chat', { message: text, context, model, history: chatHistory });

      // Add user message to history
      chatHistory.push({ role: 'user', text });

      const msgs = $('#ai-messages');
      if (msgs.lastElementChild) msgs.lastElementChild.remove();

      if (res.result?.success) {
        let replyText;
        if (res.result.isReply) {
          replyText = res.result.message;
          addAIMsg('system', replyText);
        } else {
          replyText = `✅ ${res.result.message}`;
          addAIMsg('system', replyText);
          TOPICS = await api('GET', '/topics');
          notesCache = {};
          refreshCurrentView();
        }
        // Add assistant response to history
        chatHistory.push({ role: 'model', text: replyText });
      } else {
        const errMsg = res.result?.message || 'Unknown error';
        addAIMsg('system', `⚠️ ${errMsg}`);
        chatHistory.push({ role: 'model', text: errMsg });
      }

      // Cap history at 20 messages to avoid token overflow
      if (chatHistory.length > 20) chatHistory = chatHistory.slice(-20);

    } catch (err) {
      const msgs = $('#ai-messages');
      if (msgs.lastElementChild) msgs.lastElementChild.remove();
      addAIMsg('system', `❌ ${err.message}`);
    }
    state.aiLoading = false;
  }

  // ── Event Listeners ────────────────────────────────────────

  $('#sidebar-toggle').addEventListener('click', () => $('#sidebar').classList.toggle('collapsed'));
  $('#sidebar-reopen').addEventListener('click', () => $('#sidebar').classList.remove('collapsed'));
  $('#search-input').addEventListener('input', e => { state.searchQuery = e.target.value; renderSidebar(); });
  $('#back-btn').addEventListener('click', navigateToWelcome);
  $('#revision-back-btn').addEventListener('click', navigateToWelcome);
  $('#method-back-btn').addEventListener('click', () => state.activeTopic ? navigateToTopic(state.activeTopic) : navigateToWelcome());

  $('#view-all-questions-btn').addEventListener('click', () => {
    state.allQuestionsVisible = !state.allQuestionsVisible;
    if (state.allQuestionsVisible) { renderAllQuestions(); $('#all-questions-panel').classList.add('visible'); $('#view-all-questions-btn span').textContent = 'Hide All Questions'; }
    else { $('#all-questions-panel').classList.remove('visible'); const t = findTopic(state.activeTopic); if (t) $('#view-all-questions-btn span').textContent = `View All ${t.name} Questions`; }
  });

  $$('#difficulty-filters .filter-btn').forEach(b => b.addEventListener('click', () => {
    state.allQuestionsFilter = b.dataset.filter;
    $$('#difficulty-filters .filter-btn').forEach(x => x.classList.remove('active')); b.classList.add('active');
    renderAllQuestions();
  }));
  $$('#revision-filters .filter-btn').forEach(b => b.addEventListener('click', () => {
    state.revisionFilter = b.dataset.filter;
    $$('#revision-filters .filter-btn').forEach(x => x.classList.remove('active')); b.classList.add('active');
    renderRevisionList();
  }));

  $('#show-questions-btn').addEventListener('click', () => {
    state.questionsVisible = !state.questionsVisible;
    if (state.questionsVisible) { renderMethodQuestions(); $('#method-questions').classList.add('visible'); $('#show-questions-btn').classList.add('expanded'); $('#show-questions-btn span').textContent = 'Hide Questions'; }
    else { $('#method-questions').classList.remove('visible'); $('#show-questions-btn').classList.remove('expanded'); $('#show-questions-btn span').textContent = 'Show Questions'; }
  });

  $('#sidebar-add-topic-btn').addEventListener('click', showAddTopicModal);
  $('#sidebar-revision-btn').addEventListener('click', navigateToRevision);
  $('#add-method-btn').addEventListener('click', showAddMethodModal);
  $('#add-question-btn').addEventListener('click', showAddQuestionModal);

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); $('#search-input').focus(); if ($('#sidebar').classList.contains('collapsed')) $('#sidebar').classList.remove('collapsed'); }
    if (e.key === 'Escape') {
      if (document.activeElement === $('#search-input')) { $('#search-input').value = ''; state.searchQuery = ''; $('#search-input').blur(); renderSidebar(); }
      if (state.aiPanelOpen) { state.aiPanelOpen = false; $('#ai-panel').classList.remove('open'); $('#ai-fab').classList.remove('active'); }
      $('#modal-overlay').classList.remove('visible');
    }
  });

  // ── Init ───────────────────────────────────────────────────

  async function init() {
    try {
      // Single fetch on startup — everything else is from memory
      TOPICS = await api('GET', '/topics');
      renderSidebar();
      renderWelcome();
      updateProgress();
      initAI();
      setView('welcome');
    } catch (err) {
      console.error('Init error:', err);
      $('#loading-view').innerHTML = `<div style="text-align:center"><p style="color:var(--color-hard)">Failed to connect to server</p><p style="font-size:12px;margin-top:8px;color:var(--color-text-tertiary)">${escapeHtml(err.message)}</p></div>`;
    }
  }

  init();
})();
