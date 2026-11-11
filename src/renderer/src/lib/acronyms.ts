import type { Comparison, Lesson, Question, Scenario, Tool, Unit } from '../../../shared/types'

/**
 * Acronym glossary. The first time an acronym shows up in a lesson, question,
 * scenario, Toolbox entry or design problem, it gets its meaning in parentheses:
 * "DAU" → "DAU (daily active users)". Later uses in the same place stay short.
 *
 * Value is the expansion, or [singular, plural] when "+s" would read wrong.
 * Words that are product names, SQL keywords or Redis commands are left out on purpose.
 * tests/acronyms.test.ts fails if content uses an all-caps word that is neither here nor in IGNORED.
 */
export const GLOSSARY: Record<string, string | [string, string]> = {
  // cloud providers & services
  AWS: 'Amazon Web Services',
  GCP: 'Google Cloud Platform',
  S3: 'Simple Storage Service',
  EC2: 'Elastic Compute Cloud',
  RDS: 'Relational Database Service',
  SQS: 'Simple Queue Service',
  SNS: 'Simple Notification Service',
  ECS: 'Elastic Container Service',
  EKS: 'Elastic Kubernetes Service',
  GKE: 'Google Kubernetes Engine',
  AKS: 'Azure Kubernetes Service',
  ECR: 'Elastic Container Registry',
  EBS: 'Elastic Block Store',
  EFS: 'Elastic File System',
  EMR: 'Elastic MapReduce',
  ELB: 'Elastic Load Balancing',
  ALB: 'Application Load Balancer',
  NLB: 'Network Load Balancer',
  IAM: 'Identity and Access Management',
  KMS: 'Key Management Service',
  STS: 'Security Token Service',
  ACM: 'AWS Certificate Manager',
  AMI: 'Amazon Machine Image',
  ARN: 'Amazon Resource Name',
  ASG: 'Auto Scaling group',
  CDK: 'Cloud Development Kit',
  GCS: 'Google Cloud Storage',
  ADLS: 'Azure Data Lake Storage',
  MWAA: 'Managed Workflows for Apache Airflow',
  GHCR: 'GitHub Container Registry',
  OAC: 'origin access control',
  VPC: 'virtual private cloud',
  VPN: 'virtual private network',
  AZ: 'availability zone',
  WAF: 'web application firewall',
  NAT: 'network address translation',
  NACLs: ['network access control lists', 'network access control lists'],
  CIDR: 'Classless Inter-Domain Routing',
  WCU: 'write capacity unit',
  IA: 'Infrequent Access',

  // networking & web
  API: 'application programming interface',
  HTTP: 'Hypertext Transfer Protocol',
  HTTPS: 'Hypertext Transfer Protocol Secure',
  CDN: 'content delivery network',
  DNS: 'Domain Name System',
  TCP: 'Transmission Control Protocol',
  UDP: 'User Datagram Protocol',
  IP: 'Internet Protocol address',
  TLS: 'Transport Layer Security',
  TLD: 'top-level domain',
  URL: 'Uniform Resource Locator',
  URI: 'Uniform Resource Identifier',
  REST: 'Representational State Transfer',
  RPC: 'remote procedure call',
  LB: 'load balancer',
  L4: 'layer 4, the transport layer',
  L7: 'layer 7, the application layer',
  L2: 'layer 2, the data link layer',
  OSI: 'Open Systems Interconnection',
  RTT: 'round-trip time',
  CNAME: 'canonical name record',
  TXT: 'text record',
  AAAA: 'IPv6 address record',
  SSE: 'server-sent events',
  HLS: 'HTTP Live Streaming',
  STUN: 'Session Traversal Utilities for NAT',
  TURN: 'Traversal Using Relays around NAT',
  SFU: 'selective forwarding unit',
  CORS: 'cross-origin resource sharing',
  ISP: 'internet service provider',
  VRRP: 'Virtual Router Redundancy Protocol',
  FTP: 'File Transfer Protocol',
  SSH: 'Secure Shell',
  NFS: 'Network File System',
  MQTT: 'Message Queuing Telemetry Transport',
  AMQP: 'Advanced Message Queuing Protocol',
  VCL: 'Varnish Configuration Language',
  GPS: 'Global Positioning System',
  SMS: 'text message',

  // data & databases
  DB: 'database',
  SQL: 'Structured Query Language',
  ACID: 'atomicity, consistency, isolation, durability',
  WAL: 'write-ahead log',
  CDC: 'change data capture',
  OLTP: 'online transaction processing',
  OLAP: 'online analytical processing',
  ETL: 'extract, transform, load',
  ELT: 'extract, load, transform',
  KV: 'key-value',
  PK: 'partition key',
  SK: 'sort key',
  GSI: 'global secondary index',
  LSI: 'local secondary index',
  LSM: 'log-structured merge tree',
  MVCC: 'multi-version concurrency control',
  PITR: 'point-in-time recovery',
  RDB: 'Redis Database snapshot',
  AOF: 'append-only file',
  LRU: 'least recently used',
  LFU: 'least frequently used',
  FIFO: 'first in, first out',
  DLQ: 'dead-letter queue',
  TTL: ['time to live', 'time-to-live values'],
  JSON: 'JavaScript Object Notation',
  JSONB: 'binary JSON',
  BSON: 'binary JSON',
  XML: 'Extensible Markup Language',
  YAML: 'YAML Ain’t Markup Language',
  CSV: 'comma-separated values',
  CQL: 'Cassandra Query Language',
  HDFS: 'Hadoop Distributed File System',
  GIN: 'generalized inverted index',
  HNSW: 'hierarchical navigable small world',
  ANN: 'approximate nearest neighbor',
  BM25: 'Best Matching 25 ranking',
  FTS: 'full-text search',
  ORM: 'object-relational mapper',
  CTE: 'common table expression',
  JDBC: 'Java Database Connectivity',
  RLS: 'row-level security',
  LSN: 'log sequence number',
  RF: 'replication factor',
  DCS: 'distributed configuration store',
  ESR: 'equality, sort, range',
  TSDB: 'time-series database',
  MPP: 'massively parallel processing',
  ORC: 'Optimized Row Columnar',
  CRUD: 'create, read, update, delete',
  UUID: 'universally unique identifier',
  ULID: 'universally unique lexicographically sortable identifier',
  KSUID: 'K-sortable unique identifier',
  ER: 'entity-relationship',
  BI: 'business intelligence',
  RAG: 'retrieval-augmented generation',
  ML: 'machine learning',
  AI: 'artificial intelligence',
  LLM: 'large language model',
  DAG: 'directed acyclic graph',
  JMS: 'Java Message Service',
  ZAB: 'ZooKeeper Atomic Broadcast',
  ISR: 'in-sync replicas',

  // hardware & sizes
  CPU: 'central processing unit',
  GPU: 'graphics processing unit',
  RAM: 'random-access memory',
  SSD: 'solid-state drive',
  HDD: 'hard disk drive',
  IOPS: 'input/output operations per second',
  VM: 'virtual machine',
  OS: 'operating system',
  KB: 'kilobytes',
  MB: 'megabytes',
  GB: 'gigabytes',
  TB: 'terabytes',
  PB: 'petabytes',
  OOM: 'out of memory',
  JVM: 'Java Virtual Machine',
  GC: 'garbage collection',
  PID: 'process ID',

  // scale & reliability
  QPS: 'queries per second',
  RPS: 'requests per second',
  DAU: 'daily active users',
  SLA: 'service level agreement',
  SLO: 'service level objective',
  SLI: 'service level indicator',
  SPOF: ['single point of failure', 'single points of failure'],
  HA: 'high availability',
  DR: 'disaster recovery',
  RTO: 'recovery time objective',
  RPO: 'recovery point objective',
  SRE: 'site reliability engineering',
  APM: 'application performance monitoring',
  RED: 'rate, errors, duration',
  USE: 'utilization, saturation, errors',
  NRQL: 'New Relic Query Language',
  SPL: 'Search Processing Language',
  JQL: 'Jira Query Language',
  HPA: 'Horizontal Pod Autoscaler',
  ELK: 'Elasticsearch, Logstash, Kibana',
  OTLP: 'OpenTelemetry Protocol',
  SIEM: 'security information and event management',
  DORA: 'DevOps Research and Assessment',
  SIGTERM: 'termination signal',
  UTC: 'Coordinated Universal Time',

  // design & process
  HLD: 'high-level design',
  LLD: 'low-level design',
  NFR: 'non-functional requirement',
  UML: 'Unified Modeling Language',
  ADR: 'architecture decision record',
  MVP: 'minimum viable product',
  OOP: 'object-oriented programming',
  DSL: 'domain-specific language',
  BFF: 'backend for frontend',
  CI: 'continuous integration',
  CD: 'continuous delivery',
  'CI/CD': 'continuous integration and continuous delivery',
  PR: 'pull request',
  SCM: 'source control management',
  LFS: 'Large File Storage',
  IDE: 'integrated development environment',
  CLI: 'command-line interface',
  GUI: 'graphical user interface',
  SDK: 'software development kit',
  UI: 'user interface',
  UX: 'user experience',
  DX: 'developer experience',
  HCL: 'HashiCorp Configuration Language',
  CNCF: 'Cloud Native Computing Foundation',
  OCI: 'Open Container Initiative',
  OSS: 'open-source software',
  RFC: 'Request for Comments',
  W3C: 'World Wide Web Consortium',
  SPA: 'single-page app',
  SSR: 'server-side rendering',
  CMS: 'content management system',
  HTML: 'HyperText Markup Language',
  CSS: 'Cascading Style Sheets',
  JS: 'JavaScript',
  TS: 'TypeScript',
  SVG: 'Scalable Vector Graphics',
  PNG: 'Portable Network Graphics',
  GIS: 'geographic information system',
  B2B: 'business-to-business',
  CTO: 'chief technology officer',
  HR: 'human resources',
  DIY: 'do it yourself',
  POSIX: 'Portable Operating System Interface',

  // licenses
  BSD: 'Berkeley Software Distribution',
  MIT: 'Massachusetts Institute of Technology',
  GPL: 'GNU General Public License',
  GNU: 'GNU’s Not Unix',
  AGPL: 'GNU Affero General Public License',
  SSPL: 'Server Side Public License',
  BSL: 'Business Source License',
  MPL: 'Mozilla Public License',
  RSAL: 'Redis Source Available License',

  // auth & security
  SSO: 'single sign-on',
  MFA: 'multi-factor authentication',
  OIDC: 'OpenID Connect',
  SAML: 'Security Assertion Markup Language',
  JWT: 'JSON Web Token',
  JWKS: 'JSON Web Key Set',
  PKCE: 'Proof Key for Code Exchange',
  RBAC: 'role-based access control',
  ACL: 'access control list',
  LDAP: 'Lightweight Directory Access Protocol',
  SCIM: 'System for Cross-domain Identity Management',
  AD: 'Active Directory',
  SP: 'service provider',
  ACS: 'Assertion Consumer Service',
  IdP: 'identity provider',
  CSRF: 'cross-site request forgery',
  XSS: 'cross-site scripting',
  OWASP: 'Open Worldwide Application Security Project',
  TOTP: 'time-based one-time password',
  OTP: 'one-time password',
  FIDO: 'Fast Identity Online',
  FIDO2: 'Fast Identity Online 2',
  HMAC: 'hash-based message authentication code',
  SHA: 'Secure Hash Algorithm',
  AES: 'Advanced Encryption Standard',
  RSA: 'Rivest–Shamir–Adleman encryption',
  PIN: 'personal identification number',
  ISO: 'International Organization for Standardization',
  HSM: 'hardware security module',
  PKI: 'public key infrastructure',
  CA: 'certificate authority',
  ACME: 'Automatic Certificate Management Environment',
  ISRG: 'Internet Security Research Group',
  OV: 'organization-validated',
  EV: 'extended validation',
  RS256: 'RSA signature with SHA-256',
  HS256: 'HMAC with SHA-256',
  ES256: 'ECDSA signature with SHA-256',
  PASETO: 'Platform-Agnostic Security Tokens',
  OASIS: 'Organization for the Advancement of Structured Information Standards'
}

// ---------- matching ----------

type Entry = { singular: string; plural: string }

const ENTRIES: Record<string, Entry> = Object.fromEntries(
  Object.entries(GLOSSARY).map(([k, v]) => [
    k,
    Array.isArray(v) ? { singular: v[0], plural: v[1] } : { singular: v, plural: `${v}s` }
  ])
)

const escape = (s: string): string => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')

// longest first so "CI/CD" wins over "CI", "HTTPS" over "HTTP"
const KEYS = Object.keys(ENTRIES).sort((a, b) => b.length - a.length)
const WORD = new RegExp(`(?<![\\w./\\-#])(${KEYS.map(escape).join('|')})(s?)(?![\\w]|[/\\-]\\w)`, 'g')

/** Spans we never rewrite: tags, code, preformatted diagrams, keyboard keys, `backticked` text. */
const PROTECTED = /<(pre|code|kbd)\b[^>]*>[\s\S]*?<\/\1>|<[^>]*>|`[^`]*`/g

const stripTags = (s: string): string => s.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').toLowerCase()

/**
 * One reading context (a lesson, a question, a Toolbox entry…). Each acronym is
 * spelled out once per scope, at its first prose use. If the authors already
 * explained it, e.g. "DAU (daily active users)" or "daily active users (DAU)",
 * it is left alone.
 */
export class AcronymScope {
  private seen = new Set<string>()
  private haystack: string

  /** `all` = every string the scope will show, so authored expansions anywhere are respected */
  constructor(all: string[]) {
    this.haystack = stripTags(all.join(' \n '))
  }

  text = (s: string): string => this.rewrite(s)
  list = (xs: string[]): string[] => xs.map(this.text)

  private rewrite(s: string): string {
    let out = ''
    let last = 0
    for (const m of s.matchAll(PROTECTED)) {
      out += this.prose(s, last, m.index!)
      out += m[0]
      last = m.index! + m[0].length
    }
    return out + this.prose(s, last, s.length)
  }

  private prose(full: string, from: number, to: number): string {
    const chunk = full.slice(from, to)
    return chunk.replace(WORD, (match: string, key: string, s: string, offset: number) => {
      if (this.seen.has(key)) return match
      const e = ENTRIES[key]
      const meaning = s ? e.plural : e.singular
      // already explained by the author: "TTL (time to live)", "<b>TTL</b> (...)", "time to live (TTL)"
      const after = full.slice(from + offset + match.length).replace(/^(\s*<\/[^>]+>)*/, '')
      if (
        /^\s*\(/.test(after) ||
        this.haystack.includes(`${e.singular.toLowerCase()} (${key.toLowerCase()}`) ||
        this.haystack.includes(`${e.plural.toLowerCase()} (${key.toLowerCase()}`) ||
        // "SAML 2.0 (Security Assertion Markup Language)"
        this.haystack.includes(`(${e.singular.toLowerCase()}`)
      ) {
        this.seen.add(key)
        return match
      }
      this.seen.add(key)
      // already inside "( … )"? use brackets so parentheses don't nest
      const before = full.slice(0, from + offset)
      const depth = (before.match(/\(/g)?.length ?? 0) - (before.match(/\)/g)?.length ?? 0)
      return depth > 0 ? `${match} [${meaning}]` : `${match} (${meaning})`
    })
  }
}

// ---------- applying to content ----------

const questionStrings = (q: Question): string[] => [q.q, ...q.options, q.explain]

export function explainQuestion(q: Question): Question {
  const sc = new AcronymScope(questionStrings(q))
  return { ...q, q: sc.text(q.q), options: sc.list(q.options), explain: sc.text(q.explain) }
}

export function explainLesson(l: Lesson): Lesson {
  if (l.type === 'lesson') {
    const sc = new AcronymScope(l.cards.flatMap((c) => [c.title, c.body]))
    return {
      ...l,
      cards: l.cards.map((c) => ({ ...c, body: sc.text(c.body) })),
      quiz: l.quiz.map(explainQuestion)
    }
  }
  if (l.type === 'byte') {
    const sc = new AcronymScope([l.prompt, ...l.hints, l.model, ...l.points])
    return { ...l, prompt: sc.text(l.prompt), hints: sc.list(l.hints), model: sc.text(l.model), points: sc.list(l.points) }
  }
  const sc = new AcronymScope([l.intro, ...l.steps.flatMap((s) => [s.title, s.body]), l.outro])
  return {
    ...l,
    intro: sc.text(l.intro),
    steps: l.steps.map((s) => ({ ...s, body: sc.text(s.body) })),
    outro: sc.text(l.outro)
  }
}

export const explainUnits = (units: Unit[]): Unit[] =>
  units.map((u) => ({ ...u, lessons: u.lessons.map(explainLesson) }))

export function explainScenario(s: Scenario): Scenario {
  const sc = new AcronymScope([s.prompt, ...s.options.flatMap((o) => [o.text, o.why])])
  return {
    ...s,
    prompt: sc.text(s.prompt),
    options: s.options.map((o) => ({ ...o, text: sc.text(o.text), why: sc.text(o.why) }))
  }
}

export function explainTool(t: Tool): Tool {
  // taglines are one-liners shown in lists; the summary right below explains the terms
  const fields = [t.tagline, t.summary, ...t.strengths, ...t.weaknesses, ...t.useWhen, ...t.avoidWhen]
  const sc = new AcronymScope(fields)
  return {
    ...t,
    summary: sc.text(t.summary),
    strengths: sc.list(t.strengths),
    weaknesses: sc.list(t.weaknesses),
    useWhen: sc.list(t.useWhen),
    avoidWhen: sc.list(t.avoidWhen)
  }
}

export function explainComparison(c: Comparison): Comparison {
  const sc = new AcronymScope([...c.rows.flat(), c.verdict])
  // first cell of each row is the row label; keep it short
  return { ...c, rows: c.rows.map(([label, ...cells]) => [label, ...sc.list(cells)]), verdict: sc.text(c.verdict) }
}
