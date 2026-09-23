'use strict';

const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ADMIN_EMAILS = ['rsivarajan1234@gmail.com'];
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'projects.json');

function isAdminEmail(email) {
  return !!email && ADMIN_EMAILS.includes(String(email).toLowerCase());
}

function loadProjects() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function saveProjects(projects) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(projects, null, 2));
}

function normalizeProject(body) {
  const src = body && typeof body === 'object' ? body : {};
  const ownerEmail = String(src.ownerEmail || '').trim().toLowerCase();
  return {
    name: String(src.name || '').trim(),
    ownerLabel: String(src.ownerLabel || '').trim(),
    ownerEmail: ownerEmail || null,
    purpose: String(src.purpose || '').trim(),
    stage: String(src.stage || 'idea').trim() || 'idea',
    approval: String(src.approval || 'none').trim() || 'none',
    people: String(src.people || '').trim()
  };
}

function getToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : '';
}

const sessions = new Map();
const app = express();
app.use(express.json({ limit: '1mb' }));

function getUser(req) {
  const token = getToken(req);
  if (!token) return null;
  return sessions.get(token) || null;
}

app.get('/api/health', function (_req, res) {
  res.json({ ok: true, admin: ADMIN_EMAILS, mode: 'local' });
});

app.get('/api/me', function (req, res) {
  const user = getUser(req);
  if (!user) return res.json({ user: null, isAdmin: false });
  res.json({ user: user, isAdmin: isAdminEmail(user.email) });
});

app.post('/api/auth/signin', function (req, res) {
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Enter a valid email address.' });
  }
  const user = {
    uid: crypto.createHash('sha256').update(email).digest('hex').slice(0, 16),
    email: email,
    name: email.split('@')[0],
    avatarUrl: ''
  };
  const token = crypto.randomBytes(32).toString('hex');
  sessions.set(token, user);
  res.json({ token: token, user: user, isAdmin: isAdminEmail(email) });
});

app.post('/api/auth/signout', function (req, res) {
  const token = getToken(req);
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

app.get('/api/projects', function (_req, res) {
  res.json(loadProjects());
});

app.post('/api/projects', function (req, res) {
  const user = getUser(req);
  if (!user || !isAdminEmail(user.email)) {
    return res.status(403).json({ error: 'Only the admin can create projects.' });
  }
  const now = new Date().toISOString();
  const project = normalizeProject(req.body);
  if (!project.name) return res.status(400).json({ error: 'Project name is required.' });
  project.id = crypto.randomUUID();
  project.createdAt = now;
  project.updatedAt = now;
  const all = loadProjects();
  all.unshift(project);
  saveProjects(all);
  res.status(201).json(project);
});

app.patch('/api/projects/:id', function (req, res) {
  const user = getUser(req);
  if (!user) return res.status(401).json({ error: 'Sign in to edit.' });
  const all = loadProjects();
  const idx = all.findIndex(function (p) { return p.id === req.params.id; });
  if (idx === -1) return res.status(404).json({ error: 'Project not found.' });
  const existing = all[idx];
  const owner = existing.ownerEmail && existing.ownerEmail.toLowerCase() === user.email;
  if (!isAdminEmail(user.email) && !owner) {
    return res.status(403).json({ error: 'You cannot edit this project.' });
  }
  const next = Object.assign({}, existing, normalizeProject(req.body), {
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  });
  all[idx] = next;
  saveProjects(all);
  res.json(next);
});

app.delete('/api/projects/:id', function (req, res) {
  const user = getUser(req);
  if (!user || !isAdminEmail(user.email)) {
    return res.status(403).json({ error: 'Only the admin can delete projects.' });
  }
  saveProjects(loadProjects().filter(function (p) { return p.id !== req.params.id; }));
  res.json({ ok: true });
});

app.use(express.static(__dirname, {
  extensions: ['html'],
  index: 'index.html'
}));

if (!fs.existsSync(DATA_FILE)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DATA_FILE, '[]\n');
}

app.listen(PORT, '0.0.0.0', function () {
  console.log('Project Pulse is running at http://localhost:' + PORT);
  console.log('Anyone with the link can view the portfolio.');
  console.log('Admin (create / edit / delete): ' + ADMIN_EMAILS.join(', '));
});
