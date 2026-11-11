import type { Comparison, Tool } from '../../../shared/types'

import { ANALYTICS_DELIVERY_TOOLS } from './toolbox/analytics-delivery'
import { CACHE_STORAGE_MESSAGING_TOOLS } from './toolbox/cache-storage-messaging'
import { COMPUTE_NETWORK_TOOLS } from './toolbox/compute-network'
import { DATA_STORE_TOOLS } from './toolbox/data-stores'
import { OPERATIONS_TOOLS } from './toolbox/operations'
import { PLAN_AUTH_TOOLS } from './toolbox/plan-auth'
import { explainComparison, explainTool } from '../lib/acronyms'

/**
 * The Toolbox encyclopedia: every entry is readable from day one.
 * Entries live in content/toolbox/*.ts, grouped by phase/category
 * (see content/toolbox/categories.ts for the order shown in the app).
 */
export const TOOLS: Tool[] = [
  ...PLAN_AUTH_TOOLS,
  ...COMPUTE_NETWORK_TOOLS,
  ...DATA_STORE_TOOLS,
  ...CACHE_STORAGE_MESSAGING_TOOLS,
  ...ANALYTICS_DELIVERY_TOOLS,
  ...OPERATIONS_TOOLS
].map(explainTool)

export const COMPARISONS: Comparison[] = [
  {
    id: 'mono-micro',
    unit: 'u3',
    title: 'Monolith vs Microservices',
    columns: ['', 'Monolith', 'Microservices'],
    rows: [
      ['Deploy', 'One unit', 'Each service independently'],
      ['Scaling', 'Whole app together', 'Per service'],
      ['Calls between features', 'In-process function calls', 'Network (latency, failures)'],
      ['Transactions', 'Easy ACID', 'Sagas / eventual consistency'],
      ['Ops overhead', 'Low', 'High (discovery, tracing, CI/CD per service)'],
      ['Best for', 'Small teams, early products', 'Many teams, clear domains, divergent scaling']
    ],
    verdict: 'Start modular-monolith; extract services when a concrete pain (team contention, divergent scaling) appears.'
  },
  {
    id: 'vert-horiz',
    unit: 'u3',
    title: 'Vertical vs Horizontal Scaling',
    columns: ['', 'Vertical (up)', 'Horizontal (out)'],
    rows: [
      ['How', 'Bigger machine', 'More machines'],
      ['Code changes', 'None', 'Stateless design + LB'],
      ['Ceiling', 'Hard limit', 'Practically unlimited'],
      ['Fault tolerance', 'Still a SPOF', 'Survives node loss'],
      ['Great for', 'Databases (early on)', 'Stateless app tier']
    ],
    verdict: 'Scale the app tier out; scale the database up first, then replicas, then shards.'
  },
  {
    id: 'lbs',
    unit: 'u4',
    title: 'Nginx vs HAProxy vs AWS ALB',
    columns: ['', 'Nginx', 'HAProxy', 'AWS ALB'],
    rows: [
      ['Layer', 'L7 (also L4 stream)', 'L4 + L7', 'L7 (NLB for L4)'],
      ['Health checks', 'Passive (active in Plus)', 'Active + passive', 'Active, managed'],
      ['Static files', 'Excellent', 'No', 'No'],
      ['Operations', 'You run it', 'You run it', 'Fully managed'],
      ['Cost model', 'Free / servers', 'Free / servers', 'Hourly + usage'],
      ['Sweet spot', 'Reverse proxy + static', 'High-perf self-hosted LB', 'AWS teams wanting zero LB ops']
    ],
    verdict: 'On a cloud with a small team: managed LB. Self-hosted: HAProxy for pure balancing, Nginx when you also serve/proxy web content.'
  },
  {
    id: 'l4-l7',
    unit: 'u4',
    title: 'L4 vs L7 Load Balancing',
    columns: ['', 'Layer 4', 'Layer 7'],
    rows: [
      ['Sees', 'IP + port (TCP/UDP)', 'HTTP: path, headers, cookies'],
      ['Routing', 'By connection', 'By request content'],
      ['TLS termination', 'Usually passthrough', 'Yes'],
      ['Speed', 'Fastest, lowest overhead', 'More work per request'],
      ['Use for', 'Non-HTTP protocols, raw throughput', 'Web apps, APIs, microservice routing']
    ],
    verdict: 'Default to L7 for HTTP apps; choose L4 for non-HTTP protocols or extreme throughput.'
  },
  {
    id: 'pg-mysql',
    unit: 'u5',
    title: 'PostgreSQL vs MySQL',
    columns: ['', 'PostgreSQL', 'MySQL'],
    rows: [
      ['SQL features', 'Very rich (CTEs, window fns, JSONB, extensions)', 'Solid, fewer advanced features'],
      ['Extensions', 'PostGIS, pgvector, Citus…', 'Limited'],
      ['Replication', 'Streaming, logical', 'Simple binlog replication'],
      ['Sharding tools', 'Citus', 'Vitess'],
      ['Connections', 'Process per conn: use PgBouncer', 'Thread per conn']
    ],
    verdict: 'Both are excellent. Postgres is the more feature-rich default; MySQL is great when your team/ecosystem is MySQL-based.'
  },
  {
    id: 'pg-mongo',
    unit: 'u5',
    title: 'PostgreSQL vs MongoDB',
    columns: ['', 'PostgreSQL', 'MongoDB'],
    rows: [
      ['Model', 'Tables + relations', 'JSON-like documents'],
      ['Schema', 'Enforced (JSONB for flexible parts)', 'Flexible per document'],
      ['Joins', 'First-class', 'Limited ($lookup); embed instead'],
      ['Transactions', 'Full ACID', 'ACID, multi-doc since 4.0'],
      ['Horizontal scaling', 'Replicas; sharding via Citus', 'Built-in sharding']
    ],
    verdict: 'Relational data and integrity → Postgres. Nested, varied documents with built-in sharding → MongoDB.'
  },
  {
    id: 'cass-dynamo',
    unit: 'u5',
    title: 'Cassandra vs DynamoDB',
    columns: ['', 'Cassandra', 'DynamoDB'],
    rows: [
      ['Hosting', 'Self-managed (or managed vendors)', 'Fully managed AWS'],
      ['Data model', 'Wide-column, partition + clustering keys', 'Key-value/document, PK + SK'],
      ['Consistency', 'Tunable per query', 'Eventual or strong reads'],
      ['Multi-region', 'Built-in multi-DC', 'Global tables'],
      ['Lock-in', 'Open source', 'AWS only']
    ],
    verdict: 'Same philosophy (design per query, massive scale). Pick DynamoDB to avoid ops on AWS; Cassandra for portability or control.'
  },
  {
    id: 'redis-memcached',
    unit: 'u7',
    title: 'Redis vs Memcached',
    columns: ['', 'Redis', 'Memcached'],
    rows: [
      ['Data types', 'Strings, hashes, lists, sets, sorted sets, streams, geo', 'Strings only'],
      ['Persistence', 'Optional (RDB/AOF)', 'None'],
      ['Replication', 'Built-in + Cluster', 'None (client-side sharding)'],
      ['Threading', 'Mostly single-threaded execution', 'Multithreaded'],
      ['Extras', 'Pub/sub, Lua, TTL per key', 'Just get/set']
    ],
    verdict: 'Redis (or Valkey) is the default. Memcached when you only need a huge, simple multithreaded blob cache.'
  },
  {
    id: 'cache-writes',
    unit: 'u7',
    title: 'Cache Write Strategies',
    columns: ['', 'Cache-aside', 'Write-through', 'Write-back'],
    rows: [
      ['Write path', 'Write DB, delete cache key', 'Write cache + DB synchronously', 'Write cache, flush DB later'],
      ['Read freshness', 'Stale until TTL/invalidation', 'Always fresh', 'Fresh in cache'],
      ['Write latency', 'DB speed', 'Slower (two writes)', 'Fastest'],
      ['Data-loss risk', 'None', 'None', 'Yes, if cache dies before flush'],
      ['Good for', 'General read-heavy data', 'Read-after-write freshness', 'Counters, high-volume metrics']
    ],
    verdict: 'Cache-aside is the default. Write-through when freshness matters; write-back only when small loss is acceptable.'
  },
  {
    id: 'sync-async',
    unit: 'u8',
    title: 'Sync vs Async Replication',
    columns: ['', 'Synchronous', 'Asynchronous'],
    rows: [
      ['Write ack', 'After replica confirms', 'Immediately'],
      ['Write latency', 'Higher', 'Lower'],
      ['Data loss on failover', 'None', 'Possible (recent writes)'],
      ['Replica freshness', 'Up to date', 'Lags (stale reads)'],
      ['Slow replica', 'Stalls writes', 'Just lags']
    ],
    verdict: 'Most systems run async or semi-sync (one sync replica) to balance durability and speed.'
  },
  {
    id: 'sharding',
    unit: 'u8',
    title: 'Sharding Strategies',
    columns: ['', 'Range', 'Hash', 'Directory'],
    rows: [
      ['How', 'Key ranges per shard', 'hash(key) → shard', 'Lookup table maps key → shard'],
      ['Distribution', 'Can be uneven/hot', 'Even', 'Whatever you decide'],
      ['Range queries', 'Efficient', 'Scatter to all shards', 'Depends'],
      ['Rebalancing', 'Split ranges', 'Use consistent hashing', 'Update the directory'],
      ['Cost', 'Hotspots on sequential keys', 'Lose locality', 'Extra hop + component to keep available']
    ],
    verdict: 'Hash (with consistent hashing) for even load; range when range scans dominate and keys aren’t sequential; directory for flexibility.'
  },
  {
    id: 'kafka-rabbit',
    unit: 'u9',
    title: 'Kafka vs RabbitMQ',
    columns: ['', 'Kafka', 'RabbitMQ'],
    rows: [
      ['Model', 'Distributed append-only log', 'Message broker with queues'],
      ['After consumption', 'Retained (replayable)', 'Removed after ack'],
      ['Consumers', 'Many independent groups, own offsets', 'Competing consumers per queue'],
      ['Throughput', 'Very high', 'High, lower than Kafka'],
      ['Routing', 'By topic/partition', 'Rich (exchanges, bindings)'],
      ['Best for', 'Event streams, pipelines', 'Task queues, RPC, complex routing']
    ],
    verdict: 'Events many systems read and replay → Kafka. Jobs to be done once, with retries → RabbitMQ/SQS.'
  }
].map(explainComparison)
