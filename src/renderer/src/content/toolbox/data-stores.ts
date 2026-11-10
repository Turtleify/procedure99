import type { Tool } from '../../../../shared/types'

export const DATA_STORE_TOOLS: Tool[] = [
  // ───────────────────────────── Databases ─────────────────────────────
  {
    id: 'postgres',
    name: 'PostgreSQL',
    category: 'Databases',
    unit: 'u5',
    alsoIn: ['u6', 'u8'],
    icon: 'database',
    tagline: 'The feature-rich, ACID relational default',
    summary:
      'PostgreSQL is an open-source relational database that stores data in tables, enforces constraints and runs multi-statement ACID transactions. It uses MVCC so readers do not block writers, and replicates to read replicas via its write-ahead log. It is the usual system of record behind an app server, and its extension system (PostGIS, pgvector, Citus, TimescaleDB) lets it cover many specialised workloads.',
    strengths: [
      'Strong ACID transactions, foreign keys and check constraints',
      'Rich SQL: CTEs, window functions, JSONB, full-text search',
      'Extensions: PostGIS, pgvector, Citus, TimescaleDB',
      'Streaming replication, read replicas and logical replication for CDC'
    ],
    weaknesses: [
      'Process-per-connection: needs a pooler (PgBouncer) at high connection counts',
      'Writes are limited to one primary; scaling out needs sharding (Citus)',
      'VACUUM/MVCC bloat needs monitoring and tuning'
    ],
    useWhen: [
      'Default choice for most apps with relational data',
      'Money, orders, inventory: anything needing transactions and constraints'
    ],
    avoidWhen: [
      'Massive write throughput with simple key-based access across many nodes',
      'Petabyte-scale analytics scans (use a columnar warehouse)'
    ],
    alternatives: ['MySQL', 'Amazon Aurora', 'CockroachDB', 'Neon', 'Supabase']
  },
  {
    id: 'mysql',
    name: 'MySQL',
    category: 'Databases',
    unit: 'u5',
    alsoIn: ['u8'],
    icon: 'database',
    tagline: 'Widely deployed relational DB with simple replication',
    summary:
      'MySQL is an open-source relational database (owned by Oracle) whose default InnoDB engine provides ACID transactions and row-level locking. Its binlog-based replication to read replicas is simple and battle-tested. Many of the largest web companies have run on MySQL, typically sharded with middleware such as Vitess.',
    strengths: [
      'Proven at massive scale (often sharded) at large web companies',
      'Simple, well-understood binlog replication to read replicas',
      'Huge ecosystem; offered as a managed service on every cloud'
    ],
    weaknesses: [
      'Fewer advanced SQL types and extensions than Postgres',
      'Sharding requires middleware like Vitess or app-level routing',
      'Some online schema changes on big tables need external tools (gh-ost)'
    ],
    useWhen: [
      'Web apps with read-heavy relational data',
      'Teams with existing MySQL expertise and tooling'
    ],
    avoidWhen: [
      'You need advanced types or extensions (PostGIS, rich JSON queries, vectors)',
      'Analytics-heavy workloads with large scans'
    ],
    alternatives: ['PostgreSQL', 'MariaDB', 'Amazon Aurora', 'PlanetScale']
  },
  {
    id: 'aurora',
    name: 'Amazon Aurora',
    category: 'Databases',
    unit: 'u8',
    alsoIn: ['u5', 'u1'],
    icon: 'database-zap',
    tagline: 'AWS cloud-native MySQL/PostgreSQL with shared distributed storage',
    summary:
      'Aurora is an AWS-managed relational database that speaks the MySQL or PostgreSQL protocol but replaces the storage engine with a distributed storage layer. Data is kept in six copies across three availability zones, and read replicas share that same storage, so replicas lag very little and failover is fast. It sits where you would put Postgres or MySQL, with AWS handling backups, patching and replication.',
    strengths: [
      'Drop-in MySQL/PostgreSQL compatibility for most applications',
      'Six-way replicated storage across three AZs; fast failover',
      'Read replicas share storage, so replica lag is typically very low',
      'Serverless v2 and Global Database options for spiky or multi-region loads'
    ],
    weaknesses: [
      'Still one writer per cluster: write scaling is vertical',
      'More expensive than plain RDS; I/O-heavy workloads can surprise on cost',
      'AWS-only; lags upstream engine versions'
    ],
    useWhen: [
      'You want managed Postgres/MySQL with higher availability than plain RDS',
      'Read-heavy apps that need many low-lag replicas'
    ],
    avoidWhen: [
      'Small apps where plain RDS or a single instance is cheaper',
      'Write volume beyond one large primary (consider sharding or distributed SQL)'
    ],
    alternatives: ['Amazon RDS', 'Google Cloud Spanner', 'CockroachDB', 'Neon']
  },
  {
    id: 'rds',
    name: 'Amazon RDS',
    category: 'Databases',
    unit: 'u1',
    alsoIn: ['u5', 'u8'],
    icon: 'server-cog',
    tagline: 'Managed relational databases on AWS',
    summary:
      'Amazon RDS runs standard database engines (PostgreSQL, MySQL, MariaDB, SQL Server, Oracle, Db2) on AWS-managed instances. AWS automates provisioning, patching, backups with point-in-time recovery, and Multi-AZ standby failover. You still choose instance sizes and storage, but you no longer babysit the server.',
    strengths: [
      'Automated backups and point-in-time recovery',
      'Multi-AZ synchronous standby with automatic failover',
      'Read replicas with a few clicks',
      'Stock engines, so skills and tools carry over'
    ],
    weaknesses: [
      'Limited OS/superuser access; some extensions unavailable',
      'Scaling up usually means a brief disruption to resize the instance',
      'Costs more than self-managing the same VM'
    ],
    useWhen: [
      'You want a standard relational DB without running it yourself',
      'Small teams that need reliable backups and failover by default'
    ],
    avoidWhen: [
      'You need custom engine builds or OS-level tuning',
      'Write scale beyond one primary instance'
    ],
    alternatives: ['Amazon Aurora', 'Google Cloud SQL', 'Azure Database for PostgreSQL', 'Supabase', 'Neon']
  },
  {
    id: 'sqlite',
    name: 'SQLite',
    category: 'Databases',
    unit: 'u5',
    alsoIn: ['u1'],
    icon: 'hard-drive',
    tagline: 'Embedded SQL database stored in a single file',
    summary:
      'SQLite is a library, not a server: your application links it in and reads and writes a single database file directly. It supports full SQL and ACID transactions, and it is the most widely deployed database in the world, inside phones, browsers and desktop apps. In WAL mode many readers can run alongside one writer at a time.',
    strengths: [
      'Zero setup, no network hop: queries are function calls',
      'Full SQL with ACID transactions in one portable file',
      'Extremely reliable and heavily tested',
      'Great for local-first, mobile, desktop and edge apps'
    ],
    weaknesses: [
      'Only one writer at a time per database file',
      'No built-in network access or replication (needs tools like Litestream)',
      'Hard to share between multiple app servers'
    ],
    useWhen: [
      'Mobile, desktop or embedded apps needing local storage',
      'Small single-server sites, prototypes and tests'
    ],
    avoidWhen: [
      'Many app servers need to write to the same database',
      'High concurrent write throughput'
    ],
    alternatives: ['PostgreSQL', 'DuckDB', 'Turso (libSQL)', 'Cloudflare D1']
  },
  {
    id: 'supabase',
    name: 'Supabase',
    category: 'Databases',
    unit: 'u5',
    alsoIn: ['u9'],
    icon: 'layers',
    tagline: 'Postgres-based backend platform with auth, storage and realtime',
    summary:
      'Supabase is a backend-as-a-service built around a managed PostgreSQL database. It adds auto-generated REST and GraphQL APIs, authentication, file storage, realtime change subscriptions and edge functions. Access control is usually done with Postgres row-level security, so clients can query the database fairly directly. It is open source and can be self-hosted.',
    strengths: [
      'Real Postgres underneath: SQL, extensions, no proprietary data model',
      'Auth, storage, realtime and APIs out of the box',
      'Row-level security policies enforce per-user access in the DB',
      'Open source; self-hostable to reduce lock-in'
    ],
    weaknesses: [
      'Business logic in RLS policies and DB functions can get hard to test',
      'Scaling is still bounded by one Postgres primary',
      'Self-hosting the full stack is much more work than the managed service'
    ],
    useWhen: [
      'Small teams or MVPs that want a full backend quickly',
      'Apps that want Firebase-style speed but relational data'
    ],
    avoidWhen: [
      'You need complex backend logic better kept in your own services',
      'Very high write scale beyond a single Postgres node'
    ],
    alternatives: ['Google Cloud Firestore', 'Neon', 'Amazon RDS', 'PostgreSQL']
  },
  {
    id: 'neon',
    name: 'Neon',
    category: 'Databases',
    unit: 'u5',
    alsoIn: ['u3'],
    icon: 'git-branch',
    tagline: 'Serverless Postgres with separated storage and instant branching',
    summary:
      'Neon is a managed PostgreSQL service that separates compute from storage: Postgres compute nodes are stateless and read pages from a shared, durable storage layer. That design lets compute autoscale and scale to zero when idle, and lets you create copy-on-write branches of a database in seconds. It fits serverless apps, preview environments and per-tenant databases.',
    strengths: [
      'Scale to zero and autoscaling compute: cheap for spiky or idle databases',
      'Instant copy-on-write branches for previews, tests and migrations',
      'Standard Postgres, so drivers, ORMs and extensions work',
      'Point-in-time restore from the storage history'
    ],
    weaknesses: [
      'Cold starts after scale-to-zero add latency to the first query',
      'Still a single writer per branch; not distributed SQL',
      'Managed-only in practice; storage layer is less battle-tested than RDS'
    ],
    useWhen: [
      'Serverless or edge apps with bursty traffic',
      'Per-PR preview environments that need real data copies'
    ],
    avoidWhen: [
      'Steady, latency-critical workloads that cannot tolerate cold starts',
      'Write scale beyond one Postgres primary'
    ],
    alternatives: ['Supabase', 'Amazon Aurora', 'Amazon RDS', 'PlanetScale']
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'Databases',
    unit: 'u5',
    alsoIn: ['u8'],
    icon: 'braces',
    tagline: 'Document database with flexible schemas',
    summary:
      'MongoDB stores data as JSON-like (BSON) documents grouped into collections, so a whole nested object can be read or written in one operation. Replica sets provide automatic failover, and sharding spreads collections across nodes by a shard key. It is often run as the managed Atlas service and used where records are nested and schemas evolve quickly.',
    strengths: [
      'Documents map naturally to application objects',
      'Flexible schema per document; easy to evolve',
      'Built-in replica sets and sharding',
      'Multi-document ACID transactions (since 4.0)'
    ],
    weaknesses: [
      'Joins ($lookup) are limited and slower than SQL joins',
      'Schema discipline is on you (validation rules are optional)',
      'Denormalized data means updating the same fact in several places'
    ],
    useWhen: [
      'Varied, nested records (catalogs, CMS content, user profiles)',
      'Rapidly evolving schemas early in a product'
    ],
    avoidWhen: [
      'Heavily relational data with many joins',
      'Choosing a shard key you cannot predict (it is hard to change later)'
    ],
    alternatives: ['PostgreSQL', 'Amazon DynamoDB', 'Google Cloud Firestore', 'Couchbase']
  },
  {
    id: 'dynamodb',
    name: 'Amazon DynamoDB',
    category: 'Databases',
    unit: 'u5',
    alsoIn: ['u8', 'u3'],
    icon: 'table',
    tagline: 'Serverless key-value/document DB with predictable latency at any scale',
    summary:
      'DynamoDB is a fully managed AWS key-value and document database. Items are hashed by partition key across many storage partitions and sorted by an optional sort key, which gives consistent single-digit-millisecond reads and writes regardless of table size. You design tables around known access patterns rather than normalising, and AWS handles scaling, replication and backups.',
    strengths: [
      'No servers to manage; scales automatically',
      'Single-digit ms latency at virtually any scale',
      'On-demand or provisioned capacity pricing',
      'Streams (CDC), TTL, transactions and multi-region global tables'
    ],
    weaknesses: [
      'You must know access patterns up front (partition/sort key design)',
      '400 KB item limit; Scans are slow and costly',
      'AWS lock-in; flexible queries need secondary indexes'
    ],
    useWhen: [
      'Known key-based access patterns at large scale',
      'Serverless architectures (pairs well with Lambda)'
    ],
    avoidWhen: [
      'Ad-hoc analytics or complex relational queries',
      'Access patterns that are still unclear or changing'
    ],
    alternatives: ['Apache Cassandra', 'ScyllaDB', 'MongoDB', 'Google Cloud Bigtable', 'Google Cloud Firestore']
  },
  {
    id: 'firestore',
    name: 'Google Cloud Firestore',
    category: 'Databases',
    unit: 'u5',
    icon: 'cloud',
    tagline: 'Serverless document DB with realtime sync for mobile and web',
    summary:
      'Firestore is a managed NoSQL document database from Google Cloud and Firebase. Data lives in documents inside collections, and client SDKs can subscribe to queries and receive live updates, with offline caching built in. Security rules let mobile and web clients talk to it directly, often without a custom backend.',
    strengths: [
      'Realtime listeners push changes to clients automatically',
      'Offline support in mobile and web SDKs',
      'Serverless: automatic scaling, strongly consistent reads',
      'Security rules allow direct client access'
    ],
    weaknesses: [
      'Limited query model: no joins, constrained filters, indexes required',
      'Per-operation billing can spike with chatty clients',
      'Google Cloud lock-in; sustained writes to one document are rate limited'
    ],
    useWhen: [
      'Mobile/web apps needing live sync (chat, collaboration, dashboards)',
      'Small teams that want to skip building a backend'
    ],
    avoidWhen: [
      'Relational data or complex reporting queries',
      'Very high write rates concentrated on a few documents (counters)'
    ],
    alternatives: ['Supabase', 'MongoDB', 'Amazon DynamoDB']
  },
  {
    id: 'cassandra',
    name: 'Apache Cassandra',
    category: 'Databases',
    unit: 'u5',
    alsoIn: ['u8'],
    icon: 'columns',
    tagline: 'Leaderless wide-column store for huge write volumes',
    summary:
      'Cassandra is an open-source, wide-column database originally built at Facebook. Every node is equal: data is placed on a consistent-hashing ring and replicated to several nodes, and clients choose a consistency level per query. Writes go to a commit log and memtable and are flushed to SSTables (an LSM tree), which makes writes very cheap.',
    strengths: [
      'Linear horizontal scaling with no single leader',
      'Excellent write throughput (LSM trees)',
      'Multi-datacenter replication built in',
      'Tunable consistency per query (ONE, QUORUM, ALL)'
    ],
    weaknesses: [
      'Model one table per query; no joins',
      'Ad-hoc queries are painful',
      'Tombstones, repairs and compaction make it ops-heavy (JVM tuning too)'
    ],
    useWhen: [
      'Time-series, messages, IoT and activity feeds at scale',
      'Always-on, multi-region writes'
    ],
    avoidWhen: [
      'Transactions across rows or partitions',
      'Unknown or frequently changing query patterns'
    ],
    alternatives: ['ScyllaDB', 'Amazon DynamoDB', 'Google Cloud Bigtable', 'Apache HBase']
  },
  {
    id: 'scylladb',
    name: 'ScyllaDB',
    category: 'Databases',
    unit: 'u5',
    alsoIn: ['u8'],
    icon: 'zap',
    tagline: 'Cassandra-compatible wide-column DB rewritten in C++ for speed',
    summary:
      'ScyllaDB implements the Cassandra data model and query language (CQL) in C++ with a shard-per-core architecture, avoiding JVM garbage-collection pauses. It also offers a DynamoDB-compatible API. Teams use it as a drop-in replacement for Cassandra to get lower tail latency on fewer nodes.',
    strengths: [
      'Cassandra (CQL) and DynamoDB API compatibility',
      'Shard-per-core design: high throughput and low p99 latency',
      'No JVM, so no GC pauses or heap tuning',
      'Fewer, larger nodes can replace a big Cassandra cluster'
    ],
    weaknesses: [
      'Same data-modeling limits as Cassandra (no joins, query-first tables)',
      'Smaller community and ecosystem than Cassandra',
      'Licensing moved from open source to source-available'
    ],
    useWhen: [
      'Cassandra-style workloads where tail latency or node count matters',
      'Migrating off DynamoDB while keeping its API'
    ],
    avoidWhen: [
      'Relational queries or multi-row transactions',
      'Small datasets that a single Postgres handles'
    ],
    alternatives: ['Apache Cassandra', 'Amazon DynamoDB', 'Google Cloud Bigtable']
  },
  {
    id: 'bigtable',
    name: 'Google Cloud Bigtable',
    category: 'Databases',
    unit: 'u5',
    alsoIn: ['u8'],
    icon: 'columns',
    tagline: 'Managed wide-column store for massive, low-latency workloads',
    summary:
      'Bigtable is Google’s managed wide-column database, the system described in the 2006 Bigtable paper and used internally for products like Search and Maps. Rows are sorted by a single row key and split into tablets served by nodes, with storage on Google’s distributed file system. It is designed for very high read/write throughput on huge, sparse tables.',
    strengths: [
      'Consistent low latency at terabyte-to-petabyte scale',
      'Add nodes to scale throughput, with no downtime',
      'HBase-compatible API; integrates with Dataflow and BigQuery',
      'Rows sorted by key make range scans efficient'
    ],
    weaknesses: [
      'Only one index (the row key); key design decides everything',
      'Transactions only within a single row',
      'Minimum cluster cost makes it poor value for small data; GCP lock-in'
    ],
    useWhen: [
      'Time-series, IoT, ad-tech or financial tick data at large scale',
      'Big ML feature stores and analytics pipelines on GCP'
    ],
    avoidWhen: [
      'Small datasets (under roughly a terabyte)',
      'Relational queries or multi-row transactions'
    ],
    alternatives: ['Apache HBase', 'Apache Cassandra', 'Amazon DynamoDB', 'ScyllaDB']
  },
  {
    id: 'hbase',
    name: 'Apache HBase',
    category: 'Databases',
    unit: 'u5',
    alsoIn: ['u8'],
    icon: 'columns',
    tagline: 'Open-source Bigtable clone on top of Hadoop HDFS',
    summary:
      'HBase is an open-source wide-column store modeled on Google’s Bigtable paper. Tables are split by row-key range into regions served by RegionServers, with data persisted on HDFS and coordination via ZooKeeper. Unlike Cassandra it is strongly consistent per row, with each region served by a single server.',
    strengths: [
      'Strongly consistent single-row reads and writes',
      'Scales to billions of rows on commodity hardware',
      'Tight integration with the Hadoop/Spark ecosystem',
      'Efficient row-key range scans'
    ],
    weaknesses: [
      'Heavy operations: HDFS, ZooKeeper and many JVM services to run',
      'Region failover can cause brief unavailability',
      'Declining adoption as teams move to managed services'
    ],
    useWhen: [
      'You already run a Hadoop/HDFS platform',
      'Random read/write access over huge datasets with per-row consistency'
    ],
    avoidWhen: [
      'Teams without Hadoop operational expertise',
      'New projects that can use a managed wide-column store'
    ],
    alternatives: ['Google Cloud Bigtable', 'Apache Cassandra', 'ScyllaDB']
  },
  {
    id: 'spanner',
    name: 'Google Cloud Spanner',
    category: 'Databases',
    unit: 'u8',
    alsoIn: ['u5'],
    icon: 'globe',
    tagline: 'Globally distributed SQL database with strong consistency',
    summary:
      'Spanner is Google’s managed distributed SQL database. It splits data into ranges replicated with Paxos across zones or regions, and uses TrueTime (GPS- and atomic-clock-backed time bounds) to give externally consistent transactions worldwide. To the application it looks like one relational database with SQL and ACID transactions that scales horizontally.',
    strengths: [
      'Horizontal write scaling with full ACID transactions',
      'Strong (external) consistency, even across regions',
      'Very high availability in multi-region configurations',
      'SQL with GoogleSQL and PostgreSQL dialects'
    ],
    weaknesses: [
      'Expensive, especially for small workloads',
      'Cross-region commits add write latency (consensus round trips)',
      'GCP lock-in; schema and key design needed to avoid hotspots'
    ],
    useWhen: [
      'Global apps needing consistent transactions at huge scale (payments, ledgers)',
      'Relational data that has outgrown a single primary'
    ],
    avoidWhen: [
      'Data fits comfortably on one Postgres/MySQL primary',
      'Cost-sensitive projects or teams avoiding GCP lock-in'
    ],
    alternatives: ['CockroachDB', 'YugabyteDB', 'Amazon Aurora', 'Vitess']
  },
  {
    id: 'cockroachdb',
    name: 'CockroachDB',
    category: 'Databases',
    unit: 'u8',
    alsoIn: ['u5'],
    icon: 'network',
    tagline: 'Distributed SQL database with Postgres compatibility',
    summary:
      'CockroachDB is a distributed SQL database inspired by Spanner. It splits tables into ranges, replicates each range with Raft, and rebalances them automatically across nodes, while offering serializable transactions and a PostgreSQL-compatible wire protocol. It can pin data to regions for latency or data residency, and runs self-hosted or as a managed cloud service.',
    strengths: [
      'Scale writes horizontally by adding nodes',
      'Serializable ACID transactions by default',
      'Survives node, zone or region failures automatically',
      'Postgres wire protocol, so most drivers and ORMs work'
    ],
    weaknesses: [
      'Higher per-query latency than single-node Postgres (consensus writes)',
      'Not fully Postgres-compatible (some features and extensions missing)',
      'License moved away from open source in 2024; enterprise pricing applies'
    ],
    useWhen: [
      'Relational data that must scale writes or span regions',
      'High availability requirements where failover must be automatic'
    ],
    avoidWhen: [
      'A single Postgres primary with replicas is enough',
      'Latency-critical workloads with mostly single-row operations'
    ],
    alternatives: ['Google Cloud Spanner', 'YugabyteDB', 'Citus', 'Vitess']
  },
  {
    id: 'vitess',
    name: 'Vitess',
    category: 'Databases',
    unit: 'u8',
    alsoIn: ['u5'],
    icon: 'blocks',
    tagline: 'Horizontal sharding layer for MySQL (born at YouTube)',
    summary:
      'Vitess is an open-source (CNCF graduated) system that shards MySQL horizontally. Applications connect to VTGate proxies that route queries to the right shard based on a sharding key, while each shard is an ordinary MySQL primary with replicas managed by Vitess. It was built at YouTube and is used by companies like Slack and GitHub.',
    strengths: [
      'Apps talk to it much like one big MySQL database',
      'Online resharding and schema changes without downtime',
      'Connection pooling and query routing built in'
    ],
    weaknesses: [
      'Significant operational complexity (many components to run)',
      'Cross-shard joins and transactions are limited or slow',
      'Choosing a good sharding key is critical and hard to change'
    ],
    useWhen: [
      'MySQL has outgrown a single primary for writes or data size',
      'You want to keep MySQL rather than migrate to distributed SQL'
    ],
    avoidWhen: [
      'Read replicas and vertical scaling still suffice',
      'Small teams without capacity to operate it (consider PlanetScale)'
    ],
    alternatives: ['PlanetScale', 'Citus', 'CockroachDB', 'Google Cloud Spanner']
  },
  {
    id: 'planetscale',
    name: 'PlanetScale',
    category: 'Databases',
    unit: 'u8',
    alsoIn: ['u5'],
    icon: 'git-pull-request',
    tagline: 'Managed sharded MySQL built on Vitess',
    summary:
      'PlanetScale is a managed database service built by the creators of Vitess. It gives you MySQL with Vitess-based horizontal sharding, plus a Git-like workflow where schema changes are made on database branches and merged through deploy requests as non-blocking online migrations. It has since added a managed Postgres offering as well.',
    strengths: [
      'Vitess sharding without running Vitess yourself',
      'Branching and deploy requests make schema changes safe and reviewable',
      'Non-blocking online schema migrations',
      'Built for high availability at large scale'
    ],
    weaknesses: [
      'Inherits Vitess limits on cross-shard queries and transactions',
      'No free tier anymore; costs more than a basic managed MySQL',
      'Vendor lock-in to its workflow and platform'
    ],
    useWhen: [
      'MySQL apps expected to outgrow one primary',
      'Teams that want safe, reviewed schema changes in CI'
    ],
    avoidWhen: [
      'Small projects where RDS or a single instance is enough',
      'Workloads dominated by cross-shard joins'
    ],
    alternatives: ['Vitess', 'Amazon Aurora', 'Neon', 'CockroachDB']
  },
  {
    id: 'citus',
    name: 'Citus',
    category: 'Databases',
    unit: 'u8',
    alsoIn: ['u5'],
    icon: 'split',
    tagline: 'Postgres extension that shards tables across many nodes',
    summary:
      'Citus is an open-source PostgreSQL extension (owned by Microsoft) that turns a group of Postgres servers into one distributed database. You pick a distribution column, Citus shards the table across worker nodes, and a coordinator routes or parallelises queries. Small lookup tables can be replicated to every node as reference tables, which keeps joins local.',
    strengths: [
      'Stays real Postgres: SQL, extensions and tooling still work',
      'Parallel queries across shards for fast real-time analytics',
      'Co-located tables keep joins and transactions on one node',
      'Great fit for multi-tenant SaaS sharded by tenant_id'
    ],
    weaknesses: [
      'Requires choosing a distribution column up front',
      'Cross-shard joins and transactions are slower',
      'Managed option is mainly on Azure; self-hosting is operationally heavy'
    ],
    useWhen: [
      'Multi-tenant SaaS on Postgres that outgrew one node',
      'Real-time analytics dashboards over large Postgres tables'
    ],
    avoidWhen: [
      'A single Postgres primary with replicas still fits',
      'Queries that cannot be scoped to a distribution key'
    ],
    alternatives: ['Vitess', 'CockroachDB', 'Google Cloud Spanner', 'YugabyteDB']
  },
  {
    id: 'neo4j',
    name: 'Neo4j',
    category: 'Databases',
    unit: 'u5',
    icon: 'waypoints',
    tagline: 'Graph database for highly connected data',
    summary:
      'Neo4j stores data as nodes and relationships with properties (a property graph) and queries it with Cypher, a pattern-matching language. Relationships are stored as direct pointers, so following many hops is fast compared with repeated SQL joins. It is used for social graphs, recommendations, fraud detection and knowledge graphs.',
    strengths: [
      'Multi-hop traversals stay fast as data grows',
      'Cypher makes path and pattern queries readable',
      'Flexible schema for evolving relationships',
      'ACID transactions'
    ],
    weaknesses: [
      'Scaling writes across machines is hard; usually one write leader',
      'Clustering and some features need the paid Enterprise edition',
      'Poor fit for bulk aggregations and tabular reporting'
    ],
    useWhen: [
      'Friends-of-friends, recommendations, fraud rings, access graphs',
      'Queries are about relationships and paths, not rows'
    ],
    avoidWhen: [
      'Simple CRUD or tabular data a relational DB handles',
      'Massive write throughput needing horizontal sharding'
    ],
    alternatives: ['Amazon Neptune', 'PostgreSQL', 'ArangoDB']
  },
  {
    id: 'timescaledb',
    name: 'TimescaleDB',
    category: 'Databases',
    unit: 'u5',
    alsoIn: ['u6'],
    icon: 'timer',
    tagline: 'Postgres extension for time-series data',
    summary:
      'TimescaleDB is a PostgreSQL extension that adds hypertables: tables automatically partitioned into time-based chunks. On top of that it provides columnar compression, continuous aggregates (incrementally refreshed rollups) and retention policies. You keep full SQL and can join time-series data with regular relational tables.',
    strengths: [
      'Full SQL and Postgres ecosystem for time-series',
      'Automatic time partitioning keeps inserts and recent queries fast',
      'Compression greatly shrinks old data',
      'Continuous aggregates and retention policies built in'
    ],
    weaknesses: [
      'Bound by Postgres single-primary write scaling',
      'Some features are under the source-available Timescale License',
      'Less write throughput than purpose-built TSDBs at extreme scale'
    ],
    useWhen: [
      'Metrics, IoT or financial data that also needs relational joins',
      'Teams already on Postgres wanting time-series features'
    ],
    avoidWhen: [
      'Pure metrics monitoring better served by Prometheus',
      'Huge analytical scans better suited to a columnar DB like ClickHouse'
    ],
    alternatives: ['InfluxDB', 'ClickHouse', 'PostgreSQL', 'Prometheus']
  },
  {
    id: 'influxdb',
    name: 'InfluxDB',
    category: 'Databases',
    unit: 'u5',
    icon: 'line-chart',
    tagline: 'Purpose-built time-series database for metrics and events',
    summary:
      'InfluxDB is a time-series database designed for high-rate ingestion of timestamped measurements with tags, written via a simple line protocol. It supports downsampling and retention policies so old data is rolled up or expired. Version 3 was rebuilt in Rust on Apache Arrow and Parquet with SQL support.',
    strengths: [
      'High ingest rates for timestamped points',
      'Built-in retention and downsampling',
      'Simple line protocol; integrates with Telegraf and Grafana',
      'Time-oriented functions for windows and aggregations'
    ],
    weaknesses: [
      'Major version churn changed query languages (InfluxQL, Flux, SQL)',
      'High tag cardinality hurt performance in older versions',
      'Not suited to relational joins or general-purpose data'
    ],
    useWhen: [
      'IoT sensor data, application or infrastructure metrics',
      'Dashboards over recent time windows'
    ],
    avoidWhen: [
      'You need joins with business data (consider TimescaleDB)',
      'Kubernetes metrics where Prometheus is the standard'
    ],
    alternatives: ['TimescaleDB', 'Prometheus', 'ClickHouse']
  },
  {
    id: 'clickhouse',
    name: 'ClickHouse',
    category: 'Databases',
    unit: 'u5',
    alsoIn: ['u9'],
    icon: 'bar-chart',
    tagline: 'Columnar OLAP database for real-time analytics',
    summary:
      'ClickHouse is an open-source column-oriented database built for analytical (OLAP) queries over billions of rows. It stores each column separately and compressed, and processes data in vectorized batches, so aggregations scan only the columns they need. It typically sits beside the main OLTP database, fed by events or CDC, powering dashboards, logs and product analytics.',
    strengths: [
      'Very fast aggregations over huge datasets',
      'High compression ratios from columnar storage',
      'High-rate batch ingestion of events and logs',
      'SQL interface; self-host or use ClickHouse Cloud'
    ],
    weaknesses: [
      'Point updates and deletes are expensive (mutations are async)',
      'No general multi-statement ACID transactions',
      'Many small inserts hurt; needs batching'
    ],
    useWhen: [
      'User-facing analytics dashboards and product analytics',
      'Log, event and observability data at scale'
    ],
    avoidWhen: [
      'OLTP workloads with frequent single-row updates',
      'Primary system of record for transactional data'
    ],
    alternatives: ['Google BigQuery', 'Snowflake', 'Apache Druid', 'TimescaleDB']
  },

  // ─────────────────────────── Search & vectors ───────────────────────────
  {
    id: 'elasticsearch',
    name: 'Elasticsearch',
    category: 'Search & vectors',
    unit: 'u6',
    alsoIn: ['u9'],
    icon: 'text-search',
    tagline: 'Distributed full-text search and analytics engine',
    summary:
      'Elasticsearch is a distributed search engine built on Apache Lucene. Documents are indexed into inverted indexes split across shards and replicas, enabling fast full-text search, relevance ranking and aggregations. It usually sits beside the primary database, fed by a sync or CDC pipeline, and is also the core of the ELK logging stack. Its license changed in 2021 (prompting the OpenSearch fork), and an AGPL option was added in 2024.',
    strengths: [
      'Inverted indexes: fast full-text, fuzzy and faceted search',
      'Relevance scoring and powerful aggregations',
      'Scales horizontally with shards and replicas',
      'Also supports vector (kNN) and hybrid search'
    ],
    weaknesses: [
      'Not a primary system of record (near-real-time, ~1s refresh)',
      'Memory hungry; cluster ops and shard sizing are non-trivial',
      'Must be kept in sync with your main DB'
    ],
    useWhen: [
      'Product or site search with typo tolerance and facets',
      'Log search and analytics'
    ],
    avoidWhen: [
      'Simple exact-match lookups a B-tree index handles',
      'Small datasets where Postgres full-text search is enough'
    ],
    alternatives: ['OpenSearch', 'Apache Solr', 'Meilisearch', 'Typesense', 'Algolia']
  },
  {
    id: 'opensearch',
    name: 'OpenSearch',
    category: 'Search & vectors',
    unit: 'u6',
    alsoIn: ['u9'],
    icon: 'search',
    tagline: 'Apache-licensed fork of Elasticsearch and Kibana',
    summary:
      'OpenSearch is a search and analytics engine forked by AWS from Elasticsearch 7.10 in 2021, after Elastic moved away from the Apache 2.0 license. It keeps the Lucene-based architecture (shards, replicas, inverted indexes) and is now governed by the Linux Foundation. Amazon OpenSearch Service is its managed form on AWS.',
    strengths: [
      'Apache 2.0 licensed with open governance',
      'Familiar Elasticsearch-style APIs and architecture',
      'Managed on AWS, including a serverless option',
      'Vector search, security and alerting included'
    ],
    weaknesses: [
      'APIs and features have diverged from Elasticsearch since the fork',
      'Same operational weight: memory, shard sizing, cluster tuning',
      'Not a system of record; needs syncing from the main DB'
    ],
    useWhen: [
      'You want Elasticsearch-style search without Elastic licensing',
      'Log analytics and search on AWS'
    ],
    avoidWhen: [
      'You depend on Elastic-only features or plugins',
      'Simple search a lighter engine or Postgres can handle'
    ],
    alternatives: ['Elasticsearch', 'Apache Solr', 'Meilisearch', 'Typesense']
  },
  {
    id: 'solr',
    name: 'Apache Solr',
    category: 'Search & vectors',
    unit: 'u6',
    icon: 'book-open',
    tagline: 'Mature open-source search platform built on Lucene',
    summary:
      'Solr is an Apache-licensed search server built on the same Lucene library as Elasticsearch. It offers full-text search, faceting and highlighting, and in SolrCloud mode it shards and replicates collections, coordinated by ZooKeeper. It is common in enterprise search, e-commerce and digital libraries.',
    strengths: [
      'Mature, stable and fully open source (Apache 2.0)',
      'Strong faceting, highlighting and relevance tuning',
      'SolrCloud for sharding and replication'
    ],
    weaknesses: [
      'Smaller, less active ecosystem than Elasticsearch/OpenSearch',
      'Configuration-heavy; ZooKeeper adds operational burden',
      'Weaker story for log analytics and observability'
    ],
    useWhen: [
      'Enterprise or catalog search with fine-grained relevance control',
      'Teams with existing Solr expertise'
    ],
    avoidWhen: [
      'Log analytics pipelines (ELK/OpenSearch fit better)',
      'Small teams wanting a hosted, low-config search'
    ],
    alternatives: ['Elasticsearch', 'OpenSearch', 'Algolia']
  },
  {
    id: 'algolia',
    name: 'Algolia',
    category: 'Search & vectors',
    unit: 'u6',
    icon: 'zap',
    tagline: 'Hosted search-as-a-service with instant, typo-tolerant results',
    summary:
      'Algolia is a hosted search API: you push records into its indexes and query them directly from the frontend, getting typo-tolerant, faceted results in milliseconds. It ships UI libraries (InstantSearch) and relevance tuning through a dashboard, and runs on its own globally distributed infrastructure. There are no servers or clusters to operate.',
    strengths: [
      'Very low-latency, search-as-you-type results',
      'No infrastructure to manage; globally distributed',
      'Ready-made frontend UI components',
      'Typo tolerance, synonyms and merchandising rules built in'
    ],
    weaknesses: [
      'Gets expensive as records and search volume grow',
      'Proprietary and closed; vendor lock-in',
      'Less control over ranking internals than self-hosted engines'
    ],
    useWhen: [
      'E-commerce, docs or site search where speed to ship matters',
      'Small teams without search infrastructure expertise'
    ],
    avoidWhen: [
      'Very large datasets or query volumes on a tight budget',
      'Log analytics or heavy aggregations'
    ],
    alternatives: ['Typesense', 'Meilisearch', 'Elasticsearch']
  },
  {
    id: 'meilisearch',
    name: 'Meilisearch',
    category: 'Search & vectors',
    unit: 'u6',
    icon: 'scan-search',
    tagline: 'Lightweight, developer-friendly open-source search engine',
    summary:
      'Meilisearch is an open-source search engine written in Rust that focuses on instant, typo-tolerant search with sensible defaults and almost no configuration. You send JSON documents through a REST API and get relevant results out of the box, including filters, facets and hybrid vector search. It is available self-hosted or as Meilisearch Cloud.',
    strengths: [
      'Great relevance out of the box with minimal tuning',
      'Simple REST API and quick to set up',
      'Typo tolerance, facets and filters built in',
      'Open source, self-hostable (MIT core)'
    ],
    weaknesses: [
      'Primarily single-node; horizontal scaling is limited',
      'Indexing very large or fast-changing datasets can be slow',
      'Not built for log analytics or heavy aggregations'
    ],
    useWhen: [
      'App or site search for small-to-medium datasets',
      'Teams wanting an Algolia-like experience they can self-host'
    ],
    avoidWhen: [
      'Billions of documents or cluster-scale search',
      'Log and observability analytics'
    ],
    alternatives: ['Typesense', 'Algolia', 'Elasticsearch']
  },
  {
    id: 'typesense',
    name: 'Typesense',
    category: 'Search & vectors',
    unit: 'u6',
    icon: 'search',
    tagline: 'Fast open-source in-memory search engine, an Algolia alternative',
    summary:
      'Typesense is an open-source search engine written in C++ that keeps its index in memory for very fast, typo-tolerant search. It supports facets, filters, geo search and vector search, and can run as a Raft-replicated cluster for high availability. It is self-hostable (GPL) or available as Typesense Cloud.',
    strengths: [
      'Very low query latency from in-memory indexes',
      'Typo tolerance and sensible defaults with little tuning',
      'Raft-based clustering for high availability',
      'Open source; predictable cost when self-hosted'
    ],
    weaknesses: [
      'Index must fit in RAM, which gets expensive for large datasets',
      'Replicates the whole dataset per node rather than sharding it',
      'Smaller ecosystem than Elasticsearch'
    ],
    useWhen: [
      'Instant search for product catalogs or docs',
      'Teams wanting Algolia-style UX without per-request pricing'
    ],
    avoidWhen: [
      'Datasets too large to hold in memory',
      'Log analytics or complex aggregations'
    ],
    alternatives: ['Meilisearch', 'Algolia', 'Elasticsearch']
  },
  {
    id: 'pgvector',
    name: 'pgvector',
    category: 'Search & vectors',
    unit: 'u6',
    alsoIn: ['u5'],
    icon: 'compass',
    tagline: 'Postgres extension for storing and searching vector embeddings',
    summary:
      'pgvector adds a vector column type to PostgreSQL along with distance operators (L2, cosine, inner product) and approximate nearest-neighbour indexes (HNSW and IVFFlat). It lets you store ML embeddings next to your relational data and run similarity search with ordinary SQL, including WHERE filters and joins. It is the common starting point for semantic search and RAG on Postgres.',
    strengths: [
      'Vectors live beside relational data: one DB, one backup, transactions',
      'HNSW and IVFFlat approximate nearest-neighbour indexes',
      'Combine similarity search with SQL filters and joins',
      'Available on most managed Postgres services'
    ],
    weaknesses: [
      'Large HNSW indexes need lots of memory and slow builds',
      'Filtered ANN queries can lose recall or speed',
      'Scaling past one node is on you (replicas or sharding)'
    ],
    useWhen: [
      'You already run Postgres and need semantic search or RAG',
      'Up to millions of vectors with metadata filtering'
    ],
    avoidWhen: [
      'Billions of vectors or very high query throughput',
      'You need a managed service tuned purely for vectors'
    ],
    alternatives: ['Pinecone', 'Elasticsearch', 'OpenSearch', 'Weaviate', 'Qdrant']
  },
  {
    id: 'pinecone',
    name: 'Pinecone',
    category: 'Search & vectors',
    unit: 'u6',
    alsoIn: ['u5'],
    icon: 'target',
    tagline: 'Fully managed vector database for similarity search',
    summary:
      'Pinecone is a managed, proprietary vector database: you upsert embeddings with metadata and query for the nearest neighbours. Its serverless architecture separates storage from compute and scales automatically, with namespaces for multi-tenancy and metadata filtering. It typically sits beside the primary database in AI applications such as semantic search, recommendations and RAG.',
    strengths: [
      'No infrastructure to run; scales automatically',
      'Low-latency ANN search over very large collections',
      'Metadata filtering, namespaces and hybrid (sparse + dense) search',
      'Simple API with SDKs for common languages'
    ],
    weaknesses: [
      'Proprietary and managed-only: vendor lock-in',
      'A separate store to keep in sync with your source-of-truth DB',
      'Costs can grow with large or high-traffic indexes'
    ],
    useWhen: [
      'Production RAG or semantic search at large scale',
      'Teams that do not want to operate vector infrastructure'
    ],
    avoidWhen: [
      'Modest vector counts that pgvector in your existing DB can handle',
      'Strict self-hosting or data-residency requirements'
    ],
    alternatives: ['pgvector', 'Weaviate', 'Qdrant', 'Milvus', 'OpenSearch']
  }
]
