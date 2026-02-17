// Mock data for 100 users
export interface User {
  id: string;
  name: string;
  email: string;
  slackUserId: string;
  slackDisplayName: string;
  instanceId: string | null;
  instanceState: 'running' | 'stopped' | 'terminated' | 'pending' | 'not_created';
  instanceType: string;
  region: string;
  lastActive: string;
  monthlyCost: number;
  cpuUsage: number;
  memoryUsage: number;
  createdAt: string;
  plan: 'basic' | 'pro' | 'enterprise';
}

const firstNames = ['James', 'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'Oliver', 'Isabella',
  'Elijah', 'Mia', 'Lucas', 'Charlotte', 'Mason', 'Amelia', 'Logan', 'Harper', 'Alexander', 'Evelyn',
  'Ethan', 'Abigail', 'Jacob', 'Emily', 'Michael', 'Elizabeth', 'Daniel', 'Sofia', 'Henry', 'Avery',
  'Sebastian', 'Ella', 'Jack', 'Scarlett', 'Aiden', 'Grace', 'Owen', 'Chloe', 'Samuel', 'Victoria',
  'Ryan', 'Riley', 'Nathan', 'Aria', 'Caleb', 'Lily', 'Christian', 'Aurora', 'Dylan', 'Zoey'];

const lastNames = ['Kim', 'Lee', 'Park', 'Choi', 'Jung', 'Kang', 'Cho', 'Yoon', 'Jang', 'Lim',
  'Han', 'Oh', 'Seo', 'Shin', 'Kwon', 'Hwang', 'Ahn', 'Song', 'Yoo', 'Hong',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];

const states: User['instanceState'][] = ['running', 'stopped', 'running', 'running', 'stopped', 'running', 'pending', 'not_created'];
const plans: User['plan'][] = ['basic', 'pro', 'enterprise'];
const regions = ['ap-northeast-2', 'us-east-1', 'us-west-2', 'eu-west-1'];

function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export function generateUsers(count: number = 100): User[] {
  return Array.from({ length: count }, (_, i) => {
    const r = (n: number) => seededRandom(i * 13 + n);
    const firstName = firstNames[Math.floor(r(1) * firstNames.length)];
    const lastName = lastNames[Math.floor(r(2) * lastNames.length)];
    const state = states[Math.floor(r(3) * states.length)];
    const plan = plans[Math.floor(r(4) * plans.length)];
    const region = regions[Math.floor(r(5) * regions.length)];
    const isActive = state === 'running';

    return {
      id: `user-${String(i + 1).padStart(3, '0')}`,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@company.com`,
      slackUserId: `U${String(1000 + i).padStart(8, '0')}`,
      slackDisplayName: `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
      instanceId: state === 'not_created' ? null : `i-${Math.floor(r(6) * 0xffffffffffff).toString(16).padStart(12, '0')}`,
      instanceState: state,
      instanceType: plan === 'enterprise' ? 't3.large' : plan === 'pro' ? 't3.medium' : 't3.small',
      region,
      lastActive: new Date(Date.now() - Math.floor(r(7) * 7 * 24 * 60 * 60 * 1000)).toISOString(),
      monthlyCost: state === 'not_created' ? 0 : Math.round((isActive ? 30 + r(8) * 50 : 5 + r(8) * 10) * 100) / 100,
      cpuUsage: isActive ? Math.round(r(9) * 80 + 5) : 0,
      memoryUsage: isActive ? Math.round(r(10) * 70 + 15) : 0,
      createdAt: new Date(Date.now() - Math.floor(r(11) * 180 * 24 * 60 * 60 * 1000)).toISOString(),
      plan,
    };
  });
}

export const mockUsers = generateUsers(100);

export function getStats() {
  const running = mockUsers.filter(u => u.instanceState === 'running').length;
  const stopped = mockUsers.filter(u => u.instanceState === 'stopped').length;
  const pending = mockUsers.filter(u => u.instanceState === 'pending').length;
  const notCreated = mockUsers.filter(u => u.instanceState === 'not_created').length;
  const totalCost = mockUsers.reduce((sum, u) => sum + u.monthlyCost, 0);
  const avgCpu = mockUsers.filter(u => u.instanceState === 'running').reduce((sum, u) => sum + u.cpuUsage, 0) / (running || 1);
  const avgMem = mockUsers.filter(u => u.instanceState === 'running').reduce((sum, u) => sum + u.memoryUsage, 0) / (running || 1);

  return {
    totalUsers: mockUsers.length,
    running,
    stopped,
    pending,
    notCreated,
    totalMonthlyCost: Math.round(totalCost * 100) / 100,
    avgCpuUsage: Math.round(avgCpu),
    avgMemoryUsage: Math.round(avgMem),
  };
}
