const express = require('express');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// In-memory store (replace with SQLite/DynamoDB)
let users = [];
let nextId = 1;

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// --- Users CRUD ---
app.get('/api/users', (req, res) => {
  const { status, plan, search } = req.query;
  let result = [...users];
  if (status) result = result.filter(u => u.instanceState === status);
  if (plan) result = result.filter(u => u.plan === plan);
  if (search) result = result.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );
  res.json({ users: result, total: result.length });
});

app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.post('/api/users', (req, res) => {
  const { name, email, slackUserId, plan, region } = req.body;
  if (!name || !email || !slackUserId) return res.status(400).json({ error: 'Missing required fields' });
  const user = {
    id: `user-${String(nextId++).padStart(3, '0')}`,
    name, email, slackUserId,
    slackDisplayName: name.toLowerCase().replace(' ', '.'),
    instanceId: null,
    instanceState: 'not_created',
    instanceType: plan === 'enterprise' ? 't3.large' : plan === 'pro' ? 't3.medium' : 't3.small',
    region: region || 'ap-northeast-2',
    plan: plan || 'basic',
    monthlyCost: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  res.status(201).json(user);
});

app.put('/api/users/:id', (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users[idx] = { ...users[idx], ...req.body };
  res.json(users[idx]);
});

app.delete('/api/users/:id', (req, res) => {
  const idx = users.findIndex(u => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'User not found' });
  users.splice(idx, 1);
  res.status(204).send();
});

// --- Instance Actions ---
app.post('/api/users/:id/instance/start', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.instanceState = 'running';
  user.lastActive = new Date().toISOString();
  res.json({ message: 'Instance starting', user });
});

app.post('/api/users/:id/instance/stop', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.instanceState = 'stopped';
  res.json({ message: 'Instance stopping', user });
});

app.post('/api/users/:id/instance/create', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  user.instanceId = `i-${Math.random().toString(16).slice(2, 14)}`;
  user.instanceState = 'pending';
  res.json({ message: 'Instance creating', user });
});

// --- Heartbeat ---
app.post('/api/heartbeat', (req, res) => {
  const { userId, instanceId } = req.body;
  const user = users.find(u => u.id === userId);
  if (user) {
    user.lastActive = new Date().toISOString();
  }
  res.json({ status: 'ok' });
});

// --- Metrics ---
app.get('/api/metrics', (req, res) => {
  const running = users.filter(u => u.instanceState === 'running');
  res.json({
    totalUsers: users.length,
    running: running.length,
    stopped: users.filter(u => u.instanceState === 'stopped').length,
    totalMonthlyCost: users.reduce((s, u) => s + u.monthlyCost, 0),
    avgCpu: running.length ? running.reduce((s, u) => s + u.cpuUsage, 0) / running.length : 0,
    avgMemory: running.length ? running.reduce((s, u) => s + u.memoryUsage, 0) / running.length : 0,
  });
});

// --- Slack Mapping ---
app.get('/api/slack/mappings', (req, res) => {
  const mapped = users.filter(u => u.instanceId).map(u => ({
    userId: u.id,
    slackUserId: u.slackUserId,
    instanceId: u.instanceId,
    instanceState: u.instanceState,
  }));
  res.json({ mappings: mapped });
});

app.listen(PORT, () => console.log(`OpenClaw API running on :${PORT}`));
