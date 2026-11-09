import type { Comparison, Tool } from '../../../shared/types'

/** Tools unlock when their unit is completed. */
export const TOOLS: Tool[] = [
  {
    id: 's3',
    name: 'Amazon S3',
    category: 'Storage',
    unit: 'u1',
    icon: '🪣',
    tagline: 'Object storage for files, backups and static assets',
    strengths: ['Designed for 11 nines of durability', 'Effectively unlimited capacity, cheap per GB', 'Lifecycle rules to move old data to colder, cheaper tiers', 'Perfect home for DB backups and user uploads'],
    weaknesses: ['Higher latency than local disk; not a filesystem or database', 'Whole-object writes (no in-place edits)', 'Egress costs add up'],
    useWhen: ['Storing user uploads (photos, videos)', 'Database backups and logs', 'Static site/CDN origin'],
    avoidWhen: ['You need low-latency random reads/writes', 'You need queries over the data (use a DB)'],
    alternatives: ['Google Cloud Storage', 'Azure Blob Storage', 'Cloudflare R2', 'MinIO (self-hosted)']
  },
  {
    id: 'docker',
    name: 'Docker',
    category: 'Compute',
    unit: 'u3',
    icon: '🐳',
    tagline: 'Package an app and its dependencies into a portable container',
    strengths: ['"Works on my machine" → works everywhere', 'Fast startup compared to VMs', 'Same image from dev to prod', 'Foundation for horizontal scaling'],
    weaknesses: ['Doesn’t orchestrate many containers across machines by itself', 'Persistent data needs volumes and care', 'Image hygiene/security scanning required'],
    useWhen: ['Shipping any service consistently', 'Local dev environments (docker compose)'],
    avoidWhen: ['Workloads needing special hardware/kernel access without extra setup'],
    alternatives: ['Podman', 'VMs', 'Buildpacks']
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    category: 'Compute',
    unit: 'u3',
    icon: '☸️',
    tagline: 'Runs, heals and autoscales containers across a cluster',
    strengths: ['Self-healing: restarts failed containers', 'Horizontal Pod Autoscaler scales on CPU/metrics', 'Rolling deploys and rollbacks', 'Service discovery and internal load balancing'],
    weaknesses: ['Steep learning curve and operational complexity', 'Overkill for a handful of services', 'Many moving parts to secure'],
    useWhen: ['Many services, multiple teams', 'Need autoscaling and standardized deploys'],
    avoidWhen: ['Small team with one or two services (use a PaaS / ECS / Cloud Run)'],
    alternatives: ['AWS ECS', 'Google Cloud Run', 'Nomad', 'Heroku/Render (PaaS)']
  },
  {
    id: 'nginx',
    name: 'Nginx',
    category: 'Load balancing',
    unit: 'u4',
    icon: '🟩',
    tagline: 'Web server, reverse proxy and L7 load balancer',
    strengths: ['Very fast at serving static files and proxying HTTP', 'TLS termination, caching, compression, rate limiting', 'Simple config, huge community'],
    weaknesses: ['Open-source version only has passive health checks (active checks need NGINX Plus)', 'Config reloads for dynamic backends', 'Less rich LB stats than HAProxy'],
    useWhen: ['Reverse proxy in front of app servers', 'Serving static content + proxying the API'],
    avoidWhen: ['You want a fully managed LB in the cloud'],
    alternatives: ['HAProxy', 'Envoy', 'Caddy', 'Traefik']
  },
  {
    id: 'haproxy',
    name: 'HAProxy',
    category: 'Load balancing',
    unit: 'u4',
    icon: '🔀',
    tagline: 'High-performance L4/L7 load balancer',
    strengths: ['Extremely fast and battle-tested', 'Active health checks, rich algorithms, detailed stats page', 'Both TCP (L4) and HTTP (L7) modes'],
    weaknesses: ['Not a web server (no static files)', 'You run and make it highly available yourself (keepalived etc.)'],
    useWhen: ['Self-hosted, high-throughput load balancing', 'Non-HTTP TCP balancing'],
    avoidWhen: ['A managed cloud LB would remove the ops burden'],
    alternatives: ['Nginx', 'Envoy', 'AWS NLB/ALB']
  },
  {
    id: 'alb',
    name: 'AWS ALB / NLB',
    category: 'Load balancing',
    unit: 'u4',
    icon: '☁️',
    tagline: 'Managed L7 (ALB) and L4 (NLB) load balancers',
    strengths: ['Fully managed and redundant across availability zones', 'ALB: path/host routing, TLS, WebSockets', 'NLB: ultra-low latency L4, static IPs', 'Integrates with autoscaling groups and ECS/EKS'],
    weaknesses: ['Cost per hour + per capacity unit', 'AWS lock-in', 'Less tunable than self-hosted'],
    useWhen: ['You are on AWS and don’t want to run LBs'],
    avoidWhen: ['Multi-cloud/on-prem requirements'],
    alternatives: ['GCP Cloud Load Balancing', 'Azure Load Balancer / App Gateway', 'HAProxy']
  },
  {
    id: 'cdn',
    name: 'CDN (Cloudflare, CloudFront)',
    category: 'Edge',
    unit: 'u4',
    icon: '🌍',
    tagline: 'Caches content at edges close to users',
    strengths: ['Slashes latency for global users', 'Offloads traffic from your origin', 'DDoS protection and TLS at the edge'],
    weaknesses: ['Cache invalidation and stale content', 'Dynamic/personalized responses are hard to cache', 'Another vendor in the path'],
    useWhen: ['Static assets, images, video', 'Global audience'],
    avoidWhen: ['Highly personalized, uncacheable responses (still useful for TLS/DDoS)'],
    alternatives: ['Cloudflare', 'AWS CloudFront', 'Fastly', 'Akamai']
  },
  {
    id: 'postgres',
    name: 'PostgreSQL',
    category: 'Database',
    unit: 'u5',
    icon: '🐘',
    tagline: 'The feature-rich, ACID relational default',
    strengths: ['Strong ACID transactions and constraints', 'Rich SQL: CTEs, window functions, JSONB, full-text', 'Extensions: PostGIS, pgvector, Citus', 'Streaming replication + read replicas'],
    weaknesses: ['Process-per-connection: needs a pooler (PgBouncer) at high connection counts', 'Write scaling beyond one primary needs sharding (Citus)', 'VACUUM/MVCC bloat requires tuning'],
    useWhen: ['Default choice for most apps', 'Money, inventory, anything relational'],
    avoidWhen: ['Massive write throughput with simple access patterns across many nodes'],
    alternatives: ['MySQL', 'CockroachDB', 'Aurora']
  },
  {
    id: 'mysql',
    name: 'MySQL',
    category: 'Database',
    unit: 'u5',
    icon: '🐬',
    tagline: 'Widely deployed relational DB with simple replication',
    strengths: ['Proven at massive scale (often sharded)', 'Simple, well-understood replication', 'Huge ecosystem, managed everywhere'],
    weaknesses: ['Fewer advanced SQL features than Postgres', 'Sharding requires middleware like Vitess'],
    useWhen: ['Web apps with read-heavy relational data', 'Teams with MySQL expertise'],
    avoidWhen: ['You need advanced types/extensions (PostGIS, rich JSON queries)'],
    alternatives: ['PostgreSQL', 'MariaDB', 'Aurora MySQL']
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'Database',
    unit: 'u5',
    icon: '🍃',
    tagline: 'Document database with flexible schemas',
    strengths: ['JSON-like documents map naturally to app objects', 'Flexible schema per document', 'Built-in replica sets and sharding', 'Multi-document transactions (since 4.0)'],
    weaknesses: ['Joins ($lookup) are limited compared to SQL', 'Schema discipline is on you', 'Denormalized data means multi-place updates'],
    useWhen: ['Varied, nested records (catalogs, CMS, profiles)', 'Rapidly evolving schemas'],
    avoidWhen: ['Heavily relational data with many joins'],
    alternatives: ['Postgres JSONB', 'Couchbase', 'DynamoDB']
  },
  {
    id: 'cassandra',
    name: 'Apache Cassandra',
    category: 'Database',
    unit: 'u5',
    icon: '👁️',
    tagline: 'Leaderless wide-column store for huge write volumes',
    strengths: ['Linear horizontal scaling, no single leader', 'Excellent write throughput (LSM trees)', 'Multi-datacenter replication built in', 'Tunable consistency (ONE, QUORUM, ALL)'],
    weaknesses: ['Model one table per query; no joins', 'Ad-hoc queries are painful', 'Tombstones, repairs, compaction: ops heavy'],
    useWhen: ['Time-series, messages, IoT, activity feeds at scale', 'Always-on multi-region writes'],
    avoidWhen: ['Transactions across rows/partitions', 'Unknown or changing query patterns'],
    alternatives: ['ScyllaDB', 'DynamoDB', 'HBase']
  },
  {
    id: 'dynamodb',
    name: 'Amazon DynamoDB',
    category: 'Database',
    unit: 'u5',
    icon: '⚡',
    tagline: 'Serverless key-value/document DB with predictable latency at any scale',
    strengths: ['No servers to manage; scales automatically', 'Single-digit ms latency at virtually any scale', 'On-demand or provisioned pricing', 'Streams, TTL, global tables'],
    weaknesses: ['You must know access patterns up front (PK/SK design)', '400 KB item limit; Scans are slow and costly', 'AWS lock-in; complex queries need GSIs'],
    useWhen: ['Known key-based access patterns at scale', 'Serverless architectures'],
    avoidWhen: ['Ad-hoc analytics or complex relational queries'],
    alternatives: ['Cassandra', 'MongoDB', 'Google Bigtable / Firestore']
  },
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    category: 'Search',
    unit: 'u6',
    icon: '🔍',
    tagline: 'Distributed full-text search and analytics engine',
    strengths: ['Inverted indexes: fast full-text and fuzzy search', 'Relevance scoring and aggregations', 'Scales horizontally with shards/replicas'],
    weaknesses: ['Not a primary system of record (near-real-time, ~1s refresh)', 'Memory hungry; cluster ops are non-trivial', 'Must sync from your main DB'],
    useWhen: ['Product/site search', 'Log search and analytics'],
    avoidWhen: ['Simple exact-match lookups a B-tree index handles'],
    alternatives: ['OpenSearch', 'Meilisearch', 'Typesense', 'Postgres full-text']
  },
  {
    id: 'redis',
    name: 'Redis',
    category: 'Cache',
    unit: 'u7',
    icon: '🟥',
    tagline: 'In-memory data structure store: cache, sessions, queues, leaderboards',
    strengths: ['Sub-millisecond latency', 'Rich types: hashes, lists, sets, sorted sets, streams, geo', 'TTLs, atomic ops (INCR), Lua scripts', 'Optional persistence (RDB/AOF), replication, Cluster'],
    weaknesses: ['Dataset must fit in RAM (expensive)', 'Mostly single-threaded command execution per instance', 'Persistence is async by default: not a ledger', 'License changed in 2024 (Valkey is the open-source fork)'],
    useWhen: ['Caching, sessions, rate limiting', 'Leaderboards, counters, simple queues'],
    avoidWhen: ['Primary store for critical data that must never be lost'],
    alternatives: ['Valkey', 'Memcached', 'KeyDB', 'Dragonfly']
  },
  {
    id: 'memcached',
    name: 'Memcached',
    category: 'Cache',
    unit: 'u7',
    icon: '🧊',
    tagline: 'Simple, multithreaded key-value cache',
    strengths: ['Dead simple and very fast', 'Multithreaded: uses all cores in one instance', 'Predictable LRU memory behavior'],
    weaknesses: ['Strings only, no data structures', 'No persistence or built-in replication', 'Clients handle sharding'],
    useWhen: ['Pure look-aside caching of blobs/strings at scale'],
    avoidWhen: ['You need TTL’d sessions with structures, leaderboards, pub/sub, persistence'],
    alternatives: ['Redis / Valkey']
  },
  {
    id: 'vitess',
    name: 'Vitess',
    category: 'Sharding',
    unit: 'u8',
    icon: '🧩',
    tagline: 'Horizontal sharding layer for MySQL (born at YouTube)',
    strengths: ['Apps talk to it like one MySQL database', 'Online resharding', 'Connection pooling and query routing'],
    weaknesses: ['Significant operational complexity', 'Some SQL features limited across shards'],
    useWhen: ['MySQL has outgrown a single primary for writes/size'],
    avoidWhen: ['Replicas + vertical scaling still suffice'],
    alternatives: ['Citus (Postgres)', 'CockroachDB', 'PlanetScale (managed Vitess)', 'App-level sharding']
  },
  {
    id: 'kafka',
    name: 'Apache Kafka',
    category: 'Messaging',
    unit: 'u9',
    icon: '📜',
    tagline: 'Distributed, durable event log',
    strengths: ['Huge throughput via partitions', 'Retains events: consumers replay from any offset', 'Many independent consumer groups', 'Ordering within a partition'],
    weaknesses: ['Operational complexity (fewer parts since KRaft removed ZooKeeper)', 'Per-message routing/priorities/delays are not its strength', 'Overkill for simple task queues'],
    useWhen: ['Event streaming, analytics pipelines, CDC', 'Many consumers of the same data'],
    avoidWhen: ['Simple background jobs at low volume'],
    alternatives: ['Redpanda', 'AWS Kinesis', 'Pulsar']
  },
  {
    id: 'rabbitmq',
    name: 'RabbitMQ',
    category: 'Messaging',
    unit: 'u9',
    icon: '🐇',
    tagline: 'Flexible message broker for task queues',
    strengths: ['Per-message acknowledgements, retries, dead-letter queues', 'Flexible routing with exchanges (topic, fanout, direct)', 'Priorities and delayed messages', 'Simple mental model for work queues'],
    weaknesses: ['Lower throughput than Kafka', 'Messages usually removed after consumption (limited replay)'],
    useWhen: ['Background jobs: emails, thumbnails, webhooks', 'Complex routing between services'],
    avoidWhen: ['High-volume event streams needing replay by many consumers'],
    alternatives: ['AWS SQS', 'Redis Streams', 'Kafka']
  }
]

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
]
