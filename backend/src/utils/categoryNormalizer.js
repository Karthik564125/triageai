const CATEGORY_MAP = {
  infrastructure: 'Infrastructure',
  'payment processing / billing': 'Billing & Finance',
  'payment processing': 'Billing & Finance',
  billing: 'Billing & Finance',
  'billing & finance': 'Billing & Finance',
  'authentication & email delivery': 'Authentication',
  authentication: 'Authentication',
  identity: 'Authentication',
  'frontend/ui': 'UI / Frontend',
  'frontend / ui': 'UI / Frontend',
  frontend: 'UI / Frontend',
  ui: 'UI / Frontend',
  'backend/api': 'API & Webhooks',
  'backend / api': 'API & Webhooks',
  backend: 'API & Webhooks',
  api: 'API & Webhooks',
  performance: 'Performance',
  database: 'Database',
  'feature request': 'Feature Request',
  general: 'Other',
  other: 'Other'
};

const CATEGORY_KEYWORDS = [
  { terms: ['payment', 'billing', 'invoice', 'subscription', 'charge'], category: 'Billing & Finance' },
  { terms: ['authentication', 'identity', 'login', 'password', 'email delivery', 'email'], category: 'Authentication' },
  { terms: ['frontend', 'front-end', 'ui', 'user interface', 'browser'], category: 'UI / Frontend' },
  { terms: ['backend', 'back-end', 'api', 'webhook', 'endpoint'], category: 'API & Webhooks' },
  { terms: ['database', 'sql', 'query', 'postgres', 'mysql'], category: 'Database' },
  { terms: ['performance', 'latency', 'slow', 'timeout'], category: 'Performance' },
  { terms: ['infrastructure', 'server', 'cloud', 'deployment', 'network'], category: 'Infrastructure' },
  { terms: ['feature request', 'enhancement', 'new feature'], category: 'Feature Request' }
];

const normalizeCategory = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return 'Other';

  const exact = CATEGORY_MAP[raw.toLowerCase()];
  if (exact) return exact;

  const lower = raw.toLowerCase();
  const match = CATEGORY_KEYWORDS.find(({ terms }) => terms.some((term) => lower.includes(term)));
  return match ? match.category : 'Other';
};

module.exports = { normalizeCategory };
