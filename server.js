/**
 * Algorithm Study Dashboard — Express Server
 * Backend: Turso (LibSQL), Gemini API proxy
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { createClient } = require('@libsql/client');

const app = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '5mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// ── Turso DB Client ──────────────────────────────────────────
const db = createClient({
  url: process.env.DATABSE_URL,
  authToken: process.env.DATABASE_API_KEY,
});

// ── DB Initialization ────────────────────────────────────────
async function initDB() {
  await db.batch([
    `CREATE TABLE IF NOT EXISTS topics (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT DEFAULT '📁',
      description TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_custom INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS methods (
      id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      name TEXT NOT NULL,
      explanation TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_custom INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      PRIMARY KEY (id, topic_id),
      FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
    )`,
    `CREATE TABLE IF NOT EXISTS questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      method_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      title TEXT NOT NULL,
      link TEXT DEFAULT '#',
      difficulty TEXT DEFAULT 'Medium',
      checked INTEGER DEFAULT 0,
      remark TEXT DEFAULT '',
      revision INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at INTEGER DEFAULT (unixepoch()),
      FOREIGN KEY (method_id, topic_id) REFERENCES methods(id, topic_id) ON DELETE CASCADE,
      UNIQUE(method_id, topic_id, title)
    )`,
    `CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      scope TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at INTEGER DEFAULT (unixepoch()),
      updated_at INTEGER DEFAULT (unixepoch())
    )`,
    `CREATE TABLE IF NOT EXISTS solutions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      question_id INTEGER NOT NULL,
      approach TEXT NOT NULL DEFAULT 'brute',
      title TEXT NOT NULL DEFAULT '',
      explanation TEXT NOT NULL DEFAULT '',
      code TEXT NOT NULL DEFAULT '',
      time_complexity TEXT DEFAULT '',
      space_complexity TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE
    )`,
    `CREATE INDEX IF NOT EXISTS idx_methods_topic ON methods(topic_id)`,
    `CREATE INDEX IF NOT EXISTS idx_questions_method ON questions(method_id, topic_id)`,
    `CREATE INDEX IF NOT EXISTS idx_questions_revision ON questions(revision) WHERE revision = 1`,
    `CREATE INDEX IF NOT EXISTS idx_notes_scope ON notes(scope)`,
    `CREATE INDEX IF NOT EXISTS idx_solutions_question ON solutions(question_id)`,
  ]);
  console.log('✓ Database tables initialized');
}

// ── Seed default data if empty ───────────────────────────────
async function seedIfEmpty() {
  const result = await db.execute('SELECT COUNT(*) as cnt FROM topics');
  if (result.rows[0].cnt > 0) {
    console.log('✓ Database already has data, skipping seed');
    return;
  }

  const fs = require('fs');
  const dataPath = path.join(__dirname, 'public', 'data.js');
  const dataContent = fs.readFileSync(dataPath, 'utf-8');

  let TOPICS;
  eval(dataContent.replace('const TOPICS', 'TOPICS'));

  console.log(`Seeding ${TOPICS.length} topics...`);

  // Build all statements for a single batch
  const statements = [];

  for (let ti = 0; ti < TOPICS.length; ti++) {
    const topic = TOPICS[ti];
    statements.push({
      sql: 'INSERT OR IGNORE INTO topics (id, name, icon, description, sort_order, is_custom) VALUES (?, ?, ?, ?, ?, 0)',
      args: [topic.id, topic.name, topic.icon, topic.description, ti],
    });

    for (let mi = 0; mi < topic.methods.length; mi++) {
      const method = topic.methods[mi];
      statements.push({
        sql: 'INSERT OR IGNORE INTO methods (id, topic_id, name, explanation, sort_order, is_custom) VALUES (?, ?, ?, ?, ?, 0)',
        args: [method.id, topic.id, method.name, method.explanation, mi],
      });

      for (let qi = 0; qi < method.questions.length; qi++) {
        const q = method.questions[qi];
        statements.push({
          sql: 'INSERT OR IGNORE INTO questions (method_id, topic_id, title, link, difficulty, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          args: [method.id, topic.id, q.title, q.link, q.difficulty, qi],
        });
      }
    }
  }

  // Send all in one batch to Turso (single network round-trip)
  await db.batch(statements, 'write');
  console.log(`✓ Database seeded: ${statements.length} records`);
}

// ════════════════════════════════════════════════════════════
//  API ROUTES
// ════════════════════════════════════════════════════════════

// ── GET /api/topics — full data tree ─────────────────────────
app.get('/api/topics', async (req, res) => {
  try {
    const topics = await db.execute('SELECT * FROM topics ORDER BY sort_order, created_at');
    const methods = await db.execute('SELECT * FROM methods ORDER BY sort_order, created_at');
    const questions = await db.execute('SELECT * FROM questions ORDER BY sort_order, created_at');

    const tree = topics.rows.map(t => ({
      id: t.id,
      name: t.name,
      icon: t.icon,
      description: t.description,
      methods: methods.rows
        .filter(m => m.topic_id === t.id)
        .map(m => ({
          id: m.id,
          name: m.name,
          explanation: m.explanation,
          questions: questions.rows
            .filter(q => q.topic_id === t.id && q.method_id === m.id)
            .map(q => ({
              dbId: q.id,
              title: q.title,
              link: q.link,
              difficulty: q.difficulty,
              checked: !!q.checked,
              remark: q.remark || '',
              revision: !!q.revision,
            })),
        })),
    }));

    res.json(tree);
  } catch (err) {
    console.error('GET /api/topics error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/topics — add a topic ───────────────────────────
app.post('/api/topics', async (req, res) => {
  try {
    const { id, name, icon, description } = req.body;
    if (!id || !name) return res.status(400).json({ error: 'id and name required' });

    const countRes = await db.execute('SELECT COUNT(*) as cnt FROM topics');
    const sortOrder = countRes.rows[0].cnt;

    await db.execute({
      sql: 'INSERT INTO topics (id, name, icon, description, sort_order, is_custom) VALUES (?, ?, ?, ?, ?, 1)',
      args: [id, name, icon || '📁', description || '', sortOrder],
    });
    res.json({ success: true });
  } catch (err) {
    if (err.message?.includes('UNIQUE') || err.message?.includes('PRIMARY KEY')) {
      return res.status(409).json({ error: 'Topic already exists' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/methods — add a method/pattern ─────────────────
app.post('/api/methods', async (req, res) => {
  try {
    const { id, topicId, name, explanation } = req.body;
    if (!id || !topicId || !name) return res.status(400).json({ error: 'id, topicId, name required' });

    const countRes = await db.execute({
      sql: 'SELECT COUNT(*) as cnt FROM methods WHERE topic_id = ?',
      args: [topicId],
    });

    await db.execute({
      sql: 'INSERT INTO methods (id, topic_id, name, explanation, sort_order, is_custom) VALUES (?, ?, ?, ?, ?, 1)',
      args: [id, topicId, name, explanation || '', countRes.rows[0].cnt],
    });
    res.json({ success: true });
  } catch (err) {
    if (err.message?.includes('UNIQUE') || err.message?.includes('PRIMARY KEY')) {
      return res.status(409).json({ error: 'Method already exists in this topic' });
    }
    res.status(500).json({ error: err.message });
  }
});

// ── POST /api/questions — add question(s) ────────────────────
app.post('/api/questions', async (req, res) => {
  try {
    const { topicId, methodId, questions } = req.body;
    if (!topicId || !methodId || !questions?.length) {
      return res.status(400).json({ error: 'topicId, methodId, and questions[] required' });
    }

    const countRes = await db.execute({
      sql: 'SELECT COUNT(*) as cnt FROM questions WHERE topic_id = ? AND method_id = ?',
      args: [topicId, methodId],
    });
    let sortOrder = countRes.rows[0].cnt;

    let added = 0;
    for (const q of questions) {
      try {
        await db.execute({
          sql: 'INSERT INTO questions (method_id, topic_id, title, link, difficulty, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
          args: [methodId, topicId, q.title, q.link || '#', q.difficulty || 'Medium', sortOrder++],
        });
        added++;
      } catch (e) {
        // Skip duplicates
        if (!e.message?.includes('UNIQUE')) throw e;
      }
    }
    res.json({ success: true, added });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/questions/:id/check — toggle check + remark ───
app.patch('/api/questions/:id/check', async (req, res) => {
  try {
    const { checked, remark } = req.body;
    await db.execute({
      sql: 'UPDATE questions SET checked = ?, remark = ? WHERE id = ?',
      args: [checked ? 1 : 0, remark || '', req.params.id],
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/questions/:id/revision — toggle revision ──────
app.patch('/api/questions/:id/revision', async (req, res) => {
  try {
    const { revision } = req.body;
    await db.execute({
      sql: 'UPDATE questions SET revision = ? WHERE id = ?',
      args: [revision ? 1 : 0, req.params.id],
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── PATCH /api/questions/:id/remark — update remark ──────────
app.patch('/api/questions/:id/remark', async (req, res) => {
  try {
    const { remark } = req.body;
    await db.execute({
      sql: 'UPDATE questions SET remark = ? WHERE id = ?',
      args: [remark || '', req.params.id],
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/revision — get all revision questions ───────────
app.get('/api/revision', async (req, res) => {
  try {
    const result = await db.execute(`
      SELECT q.*, m.name as method_name, t.name as topic_name, t.icon as topic_icon
      FROM questions q
      JOIN methods m ON q.method_id = m.id AND q.topic_id = m.topic_id
      JOIN topics t ON q.topic_id = t.id
      WHERE q.revision = 1
      ORDER BY q.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Notes CRUD ───────────────────────────────────────────────
app.get('/api/notes/:scope', async (req, res) => {
  try {
    const result = await db.execute({
      sql: 'SELECT * FROM notes WHERE scope = ? ORDER BY created_at DESC',
      args: [req.params.scope],
    });
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notes', async (req, res) => {
  try {
    const { scope, text } = req.body;
    if (!scope || !text) return res.status(400).json({ error: 'scope and text required' });
    const result = await db.execute({
      sql: 'INSERT INTO notes (scope, text) VALUES (?, ?)',
      args: [scope, text],
    });
    res.json({ success: true, id: Number(result.lastInsertRowid) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/notes/:id', async (req, res) => {
  try {
    const { text } = req.body;
    await db.execute({
      sql: 'UPDATE notes SET text = ?, updated_at = unixepoch() WHERE id = ?',
      args: [text, req.params.id],
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    await db.execute({ sql: 'DELETE FROM notes WHERE id = ?', args: [req.params.id] });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Solutions ────────────────────────────────────────────────
app.get('/api/questions/:id/solutions', async (req, res) => {
  try {
    const rows = await db.execute({
      sql: 'SELECT * FROM solutions WHERE question_id = ? ORDER BY sort_order',
      args: [req.params.id],
    });
    res.json(rows.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/questions/:id/solutions', async (req, res) => {
  try {
    const qId = req.params.id;
    const { approaches } = req.body; // array of { approach, title, explanation, code, time_complexity, space_complexity }
    if (!approaches || !approaches.length) return res.status(400).json({ error: 'approaches[] required' });

    // Clear existing solutions for this question
    await db.execute({ sql: 'DELETE FROM solutions WHERE question_id = ?', args: [qId] });

    let added = 0;
    for (const a of approaches) {
      await db.execute({
        sql: `INSERT INTO solutions (question_id, approach, title, explanation, code, time_complexity, space_complexity, sort_order)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        args: [qId, a.approach || 'brute', a.title || '', a.explanation || '', a.code || '', a.time_complexity || '', a.space_complexity || '', added],
      });
      added++;
    }
    res.json({ success: true, message: `Saved ${added} solution approaches` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── AI Proxy (Gemini) ────────────────────────────────────────
app.post('/api/ai/chat', async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API;
    if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured on server' });

    const { message, context, history } = req.body;
    if (!message) return res.status(400).json({ error: 'message required' });

    const model = req.body.model || 'gemini-2.5-flash';
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const systemPrompt = buildAISystemPrompt(context || {});

    // Build multi-turn contents array
    const contents = [];

    // First message: system prompt + first user message (or current if no history)
    if (history && history.length > 0) {
      // System prompt goes with the first user message
      contents.push({ role: 'user', parts: [{ text: systemPrompt + '\n\nUSER REQUEST: ' + history[0].text }] });

      // Add the rest of history as alternating turns
      for (let i = 1; i < history.length; i++) {
        const h = history[i];
        contents.push({
          role: h.role === 'user' ? 'user' : 'model',
          parts: [{ text: h.text }],
        });
      }

      // Current message
      contents.push({ role: 'user', parts: [{ text: message }] });
    } else {
      contents.push({ role: 'user', parts: [{ text: systemPrompt + '\n\nUSER REQUEST: ' + message }] });
    }

    const body = {
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      return res.status(response.status).json({ error: err?.error?.message || `Gemini API error: ${response.status}` });
    }

    const result = await response.json();
    const text = result?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return res.status(500).json({ error: 'Empty response from Gemini' });

    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (e) {
      // If parsing fails (often due to truncation from huge token output), use jsonrepair
      const { jsonrepair } = require('jsonrepair');
      try {
        parsed = JSON.parse(jsonrepair(cleaned));
        console.log('Successfully repaired truncated JSON response.');
      } catch (repairErr) {
        throw new Error('Failed to parse AI response even after repair: ' + repairErr.message);
      }
    }

    // Apply the action to DB
    const applyResult = await applyAIAction(parsed);
    res.json({ parsed, result: applyResult });
  } catch (err) {
    console.error('AI chat error:', err);
    res.status(500).json({ error: err.message });
  }
});

function buildAISystemPrompt(context) {
  return `You are an expert DSA (Data Structures & Algorithms) study assistant. You help users build their study dashboard by generating structured data about topics, patterns/methods, and practice questions.

CURRENT CONTEXT:
- Current view: ${context.view || 'welcome'}
${context.topicName ? `- Current topic: ${context.topicName} (id: ${context.topicId})` : ''}
${context.methodName ? `- Current method/pattern: ${context.methodName} (id: ${context.methodId})` : ''}
- Existing topics: ${(context.existingTopics || []).join(', ')}
${context.existingMethods ? `- Existing methods/patterns per topic: ${JSON.stringify(context.existingMethods)}` : ''}

RESPONSE FORMAT:
You MUST respond with valid JSON only. No markdown, no explanation, just raw JSON.

The JSON must follow this schema:
{
  "action": "reply" | "add_topic" | "add_method" | "add_questions" | "bulk_add",
  "data": {
    // For "reply" (use this for greetings, questions, casual chat, or anything that is NOT an explicit request to add data):
    "message": "Your friendly response text here"

    // For add_topic (adds a new topic with methods and questions):
    "id": "kebab-case-id",
    "name": "Display Name",
    "icon": "single emoji",
    "description": "Brief description",
    "methods": [
      {
        "id": "kebab-case-id",
        "name": "Method Name",
        "explanation": "<div class=\\"explanation-section\\"><p>HTML formatted explanation</p></div>",
        "questions": [
          { "title": "Question Title", "link": "https://leetcode.com/problems/slug/", "difficulty": "Easy|Medium|Hard" }
        ]
      }
    ]

    // For add_method (adds a pattern to an existing topic):
    "topicId": "existing-topic-id",
    "method": { "id": "kebab-case-id", "name": "Method Name", "explanation": "HTML", "questions": [...] }

    // For add_questions (adds questions to an existing method):
    "topicId": "existing-topic-id",
    "methodId": "existing-method-id",
    "questions": [ { "title": "...", "link": "...", "difficulty": "..." } ]

    // For bulk_add (USE THIS when adding to MULTIPLE methods/topics at once):
    "operations": [
      { "action": "add_topic|add_method|add_questions", "data": { ... } },
      { "action": "add_questions", "data": { "topicId": "...", "methodId": "...", "questions": [...] } }
    ]
  }
}

CRITICAL RULES:
1. Use "reply" action for ANY message that is NOT an explicit request to add/create data. This includes: greetings ("hi", "hello"), questions ("what is X?", "explain Y"), casual chat ("r u there?", "thanks"), confirmations, and anything ambiguous. When in doubt, use "reply".
2. ONLY use "add_topic", "add_method", or "add_questions" when the user CLEARLY and EXPLICITLY asks to ADD or CREATE something.
3. Use "bulk_add" when the user wants to add questions or methods to MULTIPLE existing methods/topics at once. Each operation in the array is independent.
4. Always generate proper LeetCode links. Format: https://leetcode.com/problems/problem-slug/
5. For explanations, use HTML with: <div class="explanation-section">, <h3> with emoji, <ul><li>, <code>, <div class="explanation-callout">, <div class="complexity-badges"><span class="complexity-badge">
6. Correctly categorize difficulty: Easy, Medium, or Hard
7. Generate comprehensive content — 3-5+ questions per method, detailed explanations
8. When user says "add this data structure/topic", use "add_topic" with full methods and questions
9. When viewing a topic and user says "add this pattern", use "add_method"
10. When viewing a method and user gives question names, use "add_questions"
11. When adding questions to MULTIPLE existing methods, use "bulk_add" with separate add_questions operations for each method
12. If a method/pattern doesn't exist yet, include an add_method operation for it before adding questions to it`;
}

async function applyAIAction(parsed) {
  const { action, data } = parsed;

  switch (action) {
    case 'reply': {
      return { success: true, message: data.message || 'I\'m here! Ask me to add topics, patterns, or questions.', isReply: true };
    }

    case 'add_topic': {
      // Check existence
      const existing = await db.execute({ sql: 'SELECT id FROM topics WHERE id = ?', args: [data.id] });
      const countRes = await db.execute('SELECT COUNT(*) as cnt FROM topics');

      if (existing.rows.length === 0) {
        await db.execute({
          sql: 'INSERT INTO topics (id, name, icon, description, sort_order, is_custom) VALUES (?, ?, ?, ?, ?, 1)',
          args: [data.id, data.name, data.icon || '📁', data.description || '', countRes.rows[0].cnt],
        });
      }

      let addedMethods = 0, addedQuestions = 0;
      for (const m of (data.methods || [])) {
        try {
          const mc = await db.execute({ sql: 'SELECT COUNT(*) as cnt FROM methods WHERE topic_id = ?', args: [data.id] });
          await db.execute({
            sql: 'INSERT INTO methods (id, topic_id, name, explanation, sort_order, is_custom) VALUES (?, ?, ?, ?, ?, 1)',
            args: [m.id, data.id, m.name, m.explanation || '', mc.rows[0].cnt],
          });
          addedMethods++;
        } catch (e) { if (!e.message?.includes('UNIQUE') && !e.message?.includes('PRIMARY KEY')) throw e; }

        let qSort = 0;
        for (const q of (m.questions || [])) {
          try {
            await db.execute({
              sql: 'INSERT INTO questions (method_id, topic_id, title, link, difficulty, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
              args: [m.id, data.id, q.title, q.link || '#', q.difficulty || 'Medium', qSort++],
            });
            addedQuestions++;
          } catch (e) { if (!e.message?.includes('UNIQUE')) throw e; }
        }
      }
      return { success: true, message: `Added topic "${data.name}" with ${addedMethods} patterns and ${addedQuestions} questions` };
    }

    case 'add_method': {
      const topicCheck = await db.execute({ sql: 'SELECT id FROM topics WHERE id = ?', args: [data.topicId] });
      if (topicCheck.rows.length === 0) return { success: false, message: `Topic "${data.topicId}" not found` };

      const m = data.method;
      try {
        const mc = await db.execute({ sql: 'SELECT COUNT(*) as cnt FROM methods WHERE topic_id = ?', args: [data.topicId] });
        await db.execute({
          sql: 'INSERT INTO methods (id, topic_id, name, explanation, sort_order, is_custom) VALUES (?, ?, ?, ?, ?, 1)',
          args: [m.id, data.topicId, m.name, m.explanation || '', mc.rows[0].cnt],
        });
      } catch (e) {
        if (!e.message?.includes('UNIQUE') && !e.message?.includes('PRIMARY KEY')) throw e;
      }

      let added = 0;
      for (const q of (m.questions || [])) {
        try {
          await db.execute({
            sql: 'INSERT INTO questions (method_id, topic_id, title, link, difficulty, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
            args: [m.id, data.topicId, q.title, q.link || '#', q.difficulty || 'Medium', added],
          });
          added++;
        } catch (e) { if (!e.message?.includes('UNIQUE')) throw e; }
      }
      return { success: true, message: `Added pattern "${m.name}" with ${added} questions` };
    }

    case 'add_questions': {
      const method = await db.execute({
        sql: 'SELECT id FROM methods WHERE id = ? AND topic_id = ?',
        args: [data.methodId, data.topicId],
      });
      if (method.rows.length === 0) return { success: false, message: `Method not found` };

      let added = 0;
      for (const q of (data.questions || [])) {
        try {
          const qc = await db.execute({
            sql: 'SELECT COUNT(*) as cnt FROM questions WHERE method_id = ? AND topic_id = ?',
            args: [data.methodId, data.topicId],
          });
          await db.execute({
            sql: 'INSERT INTO questions (method_id, topic_id, title, link, difficulty, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
            args: [data.methodId, data.topicId, q.title, q.link || '#', q.difficulty || 'Medium', qc.rows[0].cnt],
          });
          added++;
        } catch (e) { if (!e.message?.includes('UNIQUE')) throw e; }
      }
      return { success: true, message: `Added ${added} questions` };
    }

    case 'bulk_add': {
      const operations = data.operations || [];
      if (!operations.length) return { success: false, message: 'No operations provided' };

      const results = [];
      for (const op of operations) {
        try {
          const result = await applyAIAction(op);
          if (result.success) results.push(result.message);
        } catch (e) {
          console.error('Bulk op error:', e.message);
        }
      }
      return {
        success: results.length > 0,
        message: results.length > 0
          ? `Completed ${results.length}/${operations.length} operations: ${results.join('; ')}`
          : 'No operations succeeded',
      };
    }

    default:
      return { success: false, message: `Unknown action: ${action}` };
  }
}

// ── Stats endpoint ───────────────────────────────────────────
app.get('/api/stats', async (req, res) => {
  try {
    const topics = await db.execute('SELECT COUNT(*) as cnt FROM topics');
    const methods = await db.execute('SELECT COUNT(*) as cnt FROM methods');
    const questions = await db.execute('SELECT COUNT(*) as cnt FROM questions');
    const checked = await db.execute('SELECT COUNT(*) as cnt FROM questions WHERE checked = 1');
    const revision = await db.execute('SELECT COUNT(*) as cnt FROM questions WHERE revision = 1');

    res.json({
      topics: topics.rows[0].cnt,
      methods: methods.rows[0].cnt,
      questions: questions.rows[0].cnt,
      checked: checked.rows[0].cnt,
      revision: revision.rows[0].cnt,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── Fallback to SPA ──────────────────────────────────────────
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api/')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});

// ── Start ────────────────────────────────────────────────────
async function start() {
  try {
    await initDB();
    await seedIfEmpty();
    app.listen(PORT, () => {
      console.log(`\n🚀 AlgoStudy Dashboard running at http://localhost:${PORT}\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

// If running locally, start the server. On Vercel, it just exports the app.
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  start();
} else {
  // Run migrations in background on cold start for Vercel
  initDB().then(seedIfEmpty).catch(console.error);
}

module.exports = app;
