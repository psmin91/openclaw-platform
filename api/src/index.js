const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3001;
const TERRAFORM_DIR = path.resolve(__dirname, '../../terraform');
const MOCK_MODE = process.env.TERRAFORM_MOCK !== 'false'; // default: mock mode

app.use(cors());
app.use(express.json());

// In-memory store
let users = [];
let nextId = 1;

// ─── Helpers ──────────────────────────────────────────────

function readTfvars() {
  const p = path.join(TERRAFORM_DIR, 'terraform.tfvars.json');
  if (!fs.existsSync(p)) return { users: {} };
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeTfvars(data) {
  const p = path.join(TERRAFORM_DIR, 'terraform.tfvars.json');
  fs.writeFileSync(p, JSON.stringify(data, null, 2));
}

function readTfstate() {
  const p = path.join(TERRAFORM_DIR, 'terraform.tfstate');
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function parseInfraFromState(state) {
  if (!state || !state.resources) return { instances: [], network: {} };

  const instances = [];
  const network = {};

  for (const res of state.resources) {
    if (res.type === 'aws_instance' && res.instances?.[0]) {
      const attrs = res.instances[0].attributes;
      const userMatch = res.module?.match(/user_instances\["(.+?)"\]/);
      instances.push({
        userId: userMatch ? userMatch[1] : null,
        instanceId: attrs.id,
        instanceType: attrs.instance_type,
        publicIp: attrs.public_ip,
        privateIp: attrs.private_ip,
        state: attrs.instance_state,
        az: attrs.availability_zone,
        tags: attrs.tags || {},
        slackUserId: attrs.tags?.SlackUserId || null,
      });
    }
    if (res.type === 'aws_vpc' && res.instances?.[0]) {
      network.vpcId = res.instances[0].attributes.id;
      network.cidr = res.instances[0].attributes.cidr_block;
    }
    if (res.type === 'aws_subnet' && res.instances?.[0]) {
      network.subnetId = res.instances[0].attributes.id;
      network.subnetCidr = res.instances[0].attributes.cidr_block;
      network.az = res.instances[0].attributes.availability_zone;
    }
    if (res.type === 'aws_security_group' && res.instances?.[0]) {
      network.sgId = res.instances[0].attributes.id;
    }
  }

  return { instances, network, serial: state.serial, terraformVersion: state.terraform_version };
}

function generateMockPlan(tfvars, state) {
  const stateUsers = new Set();
  if (state?.resources) {
    for (const res of state.resources) {
      if (res.type === 'aws_instance') {
        const m = res.module?.match(/user_instances\["(.+?)"\]/);
        if (m) stateUsers.add(m[1]);
      }
    }
  }

  const plannedUsers = new Set(Object.keys(tfvars.users || {}));
  const toAdd = [...plannedUsers].filter(u => !stateUsers.has(u));
  const toDestroy = [...stateUsers].filter(u => !plannedUsers.has(u));
  const unchanged = [...plannedUsers].filter(u => stateUsers.has(u));

  const changes = [];
  for (const uid of toAdd) {
    const u = tfvars.users[uid];
    changes.push({
      action: 'create',
      resource: `module.user_instances["${uid}"].aws_instance.openclaw`,
      detail: {
        instance_type: u.instance_type,
        ami: tfvars.openclaw_ami_id || 'ami-0abcdef1234567890',
        tags: { User: uid, SlackUserId: u.slack_user_id },
      },
    });
  }
  for (const uid of toDestroy) {
    changes.push({
      action: 'destroy',
      resource: `module.user_instances["${uid}"].aws_instance.openclaw`,
      detail: {},
    });
  }

  return {
    add: toAdd.length,
    change: 0,
    destroy: toDestroy.length,
    unchanged: unchanged.length,
    changes,
    summary: `Plan: ${toAdd.length} to add, 0 to change, ${toDestroy.length} to destroy.`,
    raw: `Terraform will perform the following actions:\n\n` +
      changes.map(c => `  # ${c.resource} will be ${c.action === 'create' ? 'created' : 'destroyed'}\n  ${c.action === 'create' ? '+' : '-'} resource "aws_instance" "${c.resource.split('.').pop()}" {\n      + instance_type = "${c.detail.instance_type || '?'}"\n    }`).join('\n\n') +
      `\n\nPlan: ${toAdd.length} to add, 0 to change, ${toDestroy.length} to destroy.`,
  };
}

// ─── Health ───────────────────────────────────────────────

app.get('/health', (req, res) => res.json({ status: 'ok', mockMode: MOCK_MODE, timestamp: new Date().toISOString() }));

// ─── Users CRUD ───────────────────────────────────────────

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

  const instanceType = plan === 'enterprise' ? 't3.large' : plan === 'pro' ? 't3.medium' : 't3.small';
  const user = {
    id: `user-${String(nextId++).padStart(3, '0')}`,
    name, email, slackUserId,
    slackDisplayName: name.toLowerCase().replace(' ', '.'),
    instanceId: null,
    instanceState: 'not_created',
    instanceType,
    region: region || 'ap-northeast-2',
    plan: plan || 'basic',
    monthlyCost: 0,
    cpuUsage: 0,
    memoryUsage: 0,
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  };
  users.push(user);

  // Update tfvars
  const tfvars = readTfvars();
  tfvars.users[user.id] = {
    slack_user_id: slackUserId,
    instance_type: instanceType,
  };
  writeTfvars(tfvars);

  // Run terraform plan
  const state = readTfstate();
  let planResult;

  if (MOCK_MODE) {
    planResult = generateMockPlan(tfvars, state);
  } else {
    try {
      const output = execSync('terraform plan -no-color -var-file=terraform.tfvars.json', {
        cwd: TERRAFORM_DIR,
        timeout: 60000,
      }).toString();
      const addMatch = output.match(/(\d+) to add/);
      const changeMatch = output.match(/(\d+) to change/);
      const destroyMatch = output.match(/(\d+) to destroy/);
      planResult = {
        add: addMatch ? parseInt(addMatch[1]) : 0,
        change: changeMatch ? parseInt(changeMatch[1]) : 0,
        destroy: destroyMatch ? parseInt(destroyMatch[1]) : 0,
        raw: output,
        summary: output.split('\n').filter(l => l.includes('Plan:')).pop() || '',
      };
    } catch (err) {
      planResult = { error: true, message: err.message, raw: err.stderr?.toString() || '' };
    }
  }

  res.status(201).json({ user, planResult });
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

  const userId = users[idx].id;
  users.splice(idx, 1);

  // Remove from tfvars
  const tfvars = readTfvars();
  delete tfvars.users[userId];
  writeTfvars(tfvars);

  res.status(204).send();
});

// ─── Terraform Plan (standalone) ──────────────────────────

app.post('/api/terraform/plan', (req, res) => {
  const tfvars = readTfvars();
  const state = readTfstate();

  if (MOCK_MODE) {
    const planResult = generateMockPlan(tfvars, state);
    return res.json(planResult);
  }

  try {
    const output = execSync('terraform plan -no-color -var-file=terraform.tfvars.json', {
      cwd: TERRAFORM_DIR,
      timeout: 60000,
    }).toString();
    res.json({ raw: output });
  } catch (err) {
    res.status(500).json({ error: err.message, raw: err.stderr?.toString() || '' });
  }
});

// ─── Terraform Apply (dummy) ─────────────────────────────

app.post('/api/terraform/apply', (req, res) => {
  res.json({
    status: 'queued',
    message: 'Apply queued. Infrastructure changes will be applied shortly.',
    jobId: `apply-${Date.now()}`,
    estimatedTime: '2-5 minutes',
  });
});

// ─── Infrastructure Status (from tfstate) ────────────────

app.get('/api/infrastructure', (req, res) => {
  const state = readTfstate();
  if (!state) return res.json({ instances: [], network: {}, error: 'No state file found' });
  const infra = parseInfraFromState(state);
  res.json(infra);
});

// ─── Instance Actions ─────────────────────────────────────

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

// ─── Heartbeat ────────────────────────────────────────────

app.post('/api/heartbeat', (req, res) => {
  const { userId } = req.body;
  const user = users.find(u => u.id === userId);
  if (user) user.lastActive = new Date().toISOString();
  res.json({ status: 'ok' });
});

// ─── Metrics ──────────────────────────────────────────────

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

// ─── SSM Session URL ──────────────────────────────────────

app.get('/api/instances/:instanceId/ssm-url', (req, res) => {
  const { instanceId } = req.params;
  const region = req.query.region || 'ap-northeast-2';
  const url = `https://console.aws.amazon.com/systems-manager/session-manager/start-session?region=${region}&target=${instanceId}`;
  res.json({ url, instanceId, region });
});

// ─── OpenClaw Status (per user) ──────────────────────────

const models = ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'gpt-4o', 'claude-3.5-haiku', 'gpt-4o-mini'];
const versions = ['0.28.4', '0.28.3', '0.27.9', '0.28.1', '0.26.5'];

app.get('/api/users/:id/openclaw-status', (req, res) => {
  const user = users.find(u => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.instanceState !== 'running') {
    return res.json({ status: 'offline', instanceState: user.instanceState });
  }
  const seed = parseInt(user.id.replace(/\D/g, '')) || 1;
  const r = Math.abs(Math.sin(seed * 7)) ;
  res.json({
    status: 'online',
    version: versions[Math.floor(r * versions.length)],
    gatewayState: r > 0.15 ? 'running' : 'stopped',
    lastActivity: new Date(Date.now() - Math.floor(r * 3600000)).toISOString(),
    model: models[Math.floor(Math.abs(Math.sin(seed * 13)) * models.length)],
    tokenUsage: {
      prompt: Math.floor(r * 500000),
      completion: Math.floor(Math.abs(Math.sin(seed * 19)) * 200000),
      total: Math.floor(r * 500000 + Math.abs(Math.sin(seed * 19)) * 200000),
    },
    uptime: `${Math.floor(r * 72)}h ${Math.floor(Math.abs(Math.sin(seed * 23)) * 60)}m`,
    channels: ['slack'],
  });
});

app.get('/api/openclaw-status', (req, res) => {
  const statuses = users.filter(u => u.instanceState === 'running').map(u => {
    const seed = parseInt(u.id.replace(/\D/g, '')) || 1;
    const r = Math.abs(Math.sin(seed * 7));
    return {
      userId: u.id,
      name: u.name,
      version: versions[Math.floor(r * versions.length)],
      gatewayState: r > 0.15 ? 'running' : 'stopped',
      model: models[Math.floor(Math.abs(Math.sin(seed * 13)) * models.length)],
      tokenUsage: { total: Math.floor(r * 500000 + Math.abs(Math.sin(seed * 19)) * 200000) },
    };
  });
  res.json({ statuses, total: statuses.length });
});

// ─── Slack Mapping ────────────────────────────────────────

app.get('/api/slack/mappings', (req, res) => {
  const mapped = users.filter(u => u.instanceId).map(u => ({
    userId: u.id,
    slackUserId: u.slackUserId,
    instanceId: u.instanceId,
    instanceState: u.instanceState,
  }));
  res.json({ mappings: mapped });
});

app.listen(PORT, () => console.log(`OpenClaw API running on :${PORT} (mock mode: ${MOCK_MODE})`));
