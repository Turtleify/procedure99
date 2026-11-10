/**
 * Toolbox encyclopedia structure: every tool belongs to one category, and
 * every category belongs to one phase of an app's life.
 */

export type Phase = 'plan' | 'build' | 'run'

export const PHASES: { id: Phase; title: string; blurb: string; icon: string }[] = [
  { id: 'plan', title: 'Plan', blurb: 'Pick a platform, sketch the system, agree on the API.', icon: 'pen-tool' },
  { id: 'build', title: 'Build', blurb: 'Compute, traffic, identity, data, messaging, and analytics.', icon: 'hammer' },
  { id: 'run', title: 'Run & maintain', blurb: 'Ship it, watch it, secure it, recover it.', icon: 'activity' }
]

export interface Category {
  name: string
  phase: Phase
  icon: string
  blurb: string
}

/** Display order matters: the Toolbox lists categories in this order. */
export const CATEGORIES: Category[] = [
  // Plan
  { name: 'Cloud platforms', phase: 'plan', icon: 'cloud', blurb: 'Where everything runs. Usually the first big decision.' },
  { name: 'Planning & design', phase: 'plan', icon: 'pen-tool', blurb: 'Diagrams, docs, and tickets that turn an idea into a plan.' },
  { name: 'API design', phase: 'plan', icon: 'braces', blurb: 'The contract between clients and services.' },

  // Build
  { name: 'Compute & hosting', phase: 'build', icon: 'server', blurb: 'Where your code runs: VMs, containers, serverless, platforms.' },
  { name: 'Networking & traffic', phase: 'build', icon: 'network', blurb: 'DNS, load balancers, proxies, gateways, and meshes.' },
  { name: 'Auth & identity', phase: 'build', icon: 'fingerprint', blurb: 'Who the user is and what they may do.' },
  { name: 'Databases', phase: 'build', icon: 'database', blurb: 'Relational, document, wide-column, graph, time-series.' },
  { name: 'Search & vectors', phase: 'build', icon: 'search', blurb: 'Full-text search and similarity search.' },
  { name: 'Caching & CDN', phase: 'build', icon: 'zap', blurb: 'Fast answers close to the user or the app.' },
  { name: 'Storage', phase: 'build', icon: 'hard-drive', blurb: 'Objects, blocks, and files.' },
  { name: 'Messaging & streaming', phase: 'build', icon: 'send', blurb: 'Queues, pub/sub, and event logs that decouple services.' },
  { name: 'Background jobs & workflows', phase: 'build', icon: 'workflow', blurb: 'Work that happens later, retries, and long-running processes.' },
  { name: 'Real-time', phase: 'build', icon: 'radio', blurb: 'Pushing updates to clients the moment they happen.' },
  { name: 'Coordination', phase: 'build', icon: 'waypoints', blurb: 'Leader election, config, and service discovery.' },
  { name: 'Data & analytics', phase: 'build', icon: 'bar-chart', blurb: 'Batch and stream processing, warehouses, and pipelines.' },

  // Run & maintain
  { name: 'CI/CD & source control', phase: 'run', icon: 'git-branch', blurb: 'From commit to production, automatically.' },
  { name: 'Infrastructure as code', phase: 'run', icon: 'file-code', blurb: 'Servers, networks, and permissions defined in files.' },
  { name: 'Observability', phase: 'run', icon: 'line-chart', blurb: 'Metrics, logs, traces, and errors.' },
  { name: 'Incident response', phase: 'run', icon: 'siren', blurb: 'Paging, coordination, and telling users what is happening.' },
  { name: 'Reliability & testing', phase: 'run', icon: 'gauge', blurb: 'Load tests, chaos experiments, and safe rollouts.' },
  { name: 'Security', phase: 'run', icon: 'shield', blurb: 'Secrets, keys, permissions, certificates, and scanning.' },
  { name: 'Backup & recovery', phase: 'run', icon: 'database-backup', blurb: 'Getting data back when something goes wrong.' }
]

export const CATEGORY_BY_NAME: Record<string, Category> = Object.fromEntries(CATEGORIES.map((c) => [c.name, c]))
