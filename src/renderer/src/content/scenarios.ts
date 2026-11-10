import type { Scenario } from '../../../shared/types'
import { TOOL_SCENARIOS } from './scenarios-tools'

/** Tradeoff Arena + Daily Incident pool. Exactly one option per scenario is correct. */
const CONCEPT_SCENARIOS: Scenario[] = [
  // ── u1
  {
    id: 'cpu-spike',
    unit: 'u1',
    title: 'Black Friday meltdown',
    prompt: 'Your single app server is pegged at 100% CPU during a sale. The database is idling at 20%. Requests are timing out.',
    options: [
      { text: 'Put a load balancer in front and add more app servers', correct: true, why: 'The bottleneck is app compute. Spreading requests across more servers fixes exactly that.' },
      { text: 'Add database read replicas', why: 'The DB is at 20%. Scaling it does nothing for a CPU-bound app tier.' },
      { text: 'Shard the database', why: 'Massive complexity aimed at a component that isn’t the bottleneck.' },
      { text: 'Take more frequent backups', why: 'Backups help recovery, not throughput.' }
    ]
  },
  {
    id: 'oops-delete',
    unit: 'u1',
    title: 'DELETE without WHERE',
    prompt: 'An engineer ran DELETE FROM orders; on production 10 minutes ago. You have two synchronous replicas and nightly backups with transaction-log archiving.',
    options: [
      { text: 'Promote one of the replicas', why: 'The delete already replicated to both replicas within milliseconds.' },
      { text: 'Restore the last backup and replay logs up to just before the DELETE (point-in-time recovery)', correct: true, why: 'Backups + log replay are the only way back to the state before the mistake.' },
      { text: 'Rebuild the table from the Redis cache', why: 'Caches hold partial, possibly stale copies, so this is not a source of truth.' },
      { text: 'Wait for replication to reverse the change', why: 'Replication only moves forward. It will never undo the delete.' }
    ]
  },
  {
    id: 'dc-fire',
    unit: 'u1',
    title: 'The disk is gone',
    prompt: 'Your database server’s disk failed at 3am. Uptime matters: the business wants to be back within a minute, losing as little data as possible.',
    options: [
      { text: 'Restore last night’s backup to a new machine', why: 'Recovers data, but takes a long time and loses everything since the backup.' },
      { text: 'Have a replica already running and fail over to it automatically', correct: true, why: 'A live replica + automated failover restores service in seconds. This is what replication is for.' },
      { text: 'Buy a bigger server', why: 'Bigger is still one machine that can die.' },
      { text: 'Serve everything from cache until morning', why: 'Writes fail and cache misses fail. This is not a recovery plan.' }
    ]
  },
  // ── u2
  {
    id: 'nines',
    unit: 'u2',
    title: 'Four nines',
    prompt: 'Your SLA promises 99.99% availability per 30-day month. How much downtime can you afford this month?',
    options: [
      { text: '~43 minutes', why: 'That is 99.9% (three nines).' },
      { text: '~4.3 minutes', correct: true, why: '0.01% × 43,200 minutes ≈ 4.3 minutes. That barely covers one manual failover.' },
      { text: '~7 hours', why: 'That is 99% (two nines).' },
      { text: '~26 seconds', why: 'That is 99.999% (five nines).' }
    ]
  },
  {
    id: 'qps',
    unit: 'u2',
    title: 'Napkin math',
    prompt: '50M daily active users each make ~20 requests per day. Peak traffic is about 3x the average. Roughly what peak QPS do you design for?',
    options: [
      { text: '~3,500', why: 'Off by 10x. Average alone is ~11,600.' },
      { text: '~35,000', correct: true, why: '1B requests / 86,400s ≈ 11.6k average; ×3 ≈ 35k peak.' },
      { text: '~350,000', why: 'Off by 10x on the high side.' },
      { text: '~3.5M', why: 'Way too high: that would be ~300B requests/day.' }
    ]
  },
  {
    id: 'requirements-first',
    unit: 'u2',
    title: 'Interview opener',
    prompt: 'Interviewer: "Design Instagram." What is your best first move?',
    options: [
      { text: 'Draw Kafka, Cassandra and a microservice per feature', why: 'Choosing tech before requirements is the #1 interview red flag.' },
      { text: 'Clarify core features, scale, read/write ratio and latency/availability needs', correct: true, why: 'Requirements and estimates shape every later decision.' },
      { text: 'Start writing the SQL schema for every table', why: 'Too detailed too early. You don’t know the access patterns yet.' },
      { text: 'Ask what programming language to use', why: 'Language is irrelevant to HLD.' }
    ]
  },
  // ── u3
  {
    id: 'split-monolith',
    unit: 'u3',
    title: 'Startup architecture',
    prompt: '6 engineers, one product, still finding product-market fit. The monolith deploys fine. A new hire proposes 12 microservices.',
    options: [
      { text: 'Keep a modular monolith with clean internal boundaries', correct: true, why: 'Small team and fast-changing domain: microservices would add network, ops and consistency costs with no pain to solve.' },
      { text: 'Split into 12 microservices now to be ready for scale', why: 'Premature: you pay the distributed-systems tax before having the problem.' },
      { text: 'Rewrite in a faster language', why: 'Nothing indicates language is the bottleneck.' },
      { text: 'One serverless function per endpoint', why: 'Same fragmentation costs, plus cold starts and harder local dev.' }
    ]
  },
  {
    id: 'video-encoding',
    unit: 'u3',
    title: 'The noisy neighbor',
    prompt: 'In your monolith, video transcoding eats all the CPU and makes the checkout API slow. Transcoding needs 10x more compute at night.',
    options: [
      { text: 'Extract transcoding into its own worker service fed by a queue', correct: true, why: 'Very different scaling needs and fault isolation are the textbook reasons to split one component out.' },
      { text: 'Scale the whole monolith vertically', why: 'Wastes money scaling checkout to feed transcoding, and they still compete for CPU.' },
      { text: 'Split the entire app into microservices at once', why: 'Big-bang rewrite; only one component has the problem.' },
      { text: 'Cache the checkout API', why: 'Checkout is write-heavy and personalized. Caching doesn’t address CPU contention.' }
    ]
  },
  {
    id: 'db-vertical',
    unit: 'u3',
    title: 'Growing database',
    prompt: 'Postgres runs at 70% CPU on 8 vCPUs with 200 GB of data, growing ~5%/month. What is the simplest sensible next step?',
    options: [
      { text: 'Shard into 16 databases', why: 'Huge complexity for a problem a bigger box solves for years.' },
      { text: 'Scale up to a larger instance (and add read replicas if read-heavy)', correct: true, why: 'Vertical scaling is cheap and simple for databases until you hit real limits.' },
      { text: 'Migrate to Cassandra', why: 'Changing data models is a massive project with no clear need.' },
      { text: 'Split into microservices', why: 'Doesn’t reduce database CPU.' }
    ]
  },
  // ── u4
  {
    id: 'lb-algo',
    unit: 'u4',
    title: 'Uneven requests',
    prompt: 'Most requests take 10ms, but report exports take 30s. With round robin, some servers drown in exports while others idle.',
    options: [
      { text: 'Least connections', correct: true, why: 'Routes new work to servers with the fewest in-flight requests, accounting for long jobs.' },
      { text: 'Keep round robin', why: 'It assumes all requests cost the same, which is the cause of the problem.' },
      { text: 'IP hash', why: 'Pins clients to servers regardless of load; can make it worse.' },
      { text: 'Random', why: 'Statistically like round robin; ignores in-flight load.' }
    ]
  },
  {
    id: 'health-check',
    unit: 'u4',
    title: 'Alive but broken',
    prompt: 'One server’s process is running but its DB connection pool is exhausted, so it returns 500s. The LB keeps sending it traffic because its port accepts connections.',
    options: [
      { text: 'An HTTP /health endpoint that checks dependencies, used as an L7 health check', correct: true, why: 'Checks that the server can actually do its job, so the LB ejects it.' },
      { text: 'Run the TCP check more often', why: 'The port is open, so a TCP check will keep passing.' },
      { text: 'Enable sticky sessions', why: 'Pins users to the broken server. Worse.' },
      { text: 'Increase LB timeouts', why: 'It fails fast with 500s; timeouts are irrelevant.' }
    ]
  },
  {
    id: 'sticky',
    unit: 'u4',
    title: 'The vanishing cart',
    prompt: 'After adding a third app server, users’ shopping carts randomly empty. Carts are stored in server memory.',
    options: [
      { text: 'Store carts/sessions in a shared store like Redis so servers are stateless', correct: true, why: 'Any server can serve any request; deploys and crashes don’t lose carts.' },
      { text: 'Enable sticky sessions and move on', why: 'Hides the bug, but carts still vanish when a server restarts or scales in.' },
      { text: 'Go back to one big server', why: 'Throws away horizontal scaling and availability.' },
      { text: 'Increase the cookie expiry', why: 'The cookie isn’t the problem; the server-local storage is.' }
    ]
  },
  {
    id: 'managed-lb',
    unit: 'u4',
    title: 'Small team on AWS',
    prompt: 'A 3-person team on AWS needs HTTPS termination and path-based routing (/api vs /app). They don’t want to run LB servers.',
    options: [
      { text: 'AWS Application Load Balancer (ALB)', correct: true, why: 'Managed, redundant L7 LB with TLS and path routing. No servers to patch.' },
      { text: 'Self-managed HAProxy on EC2', why: 'Capable, but they explicitly don’t want to operate and make it highly available themselves.' },
      { text: 'AWS Network Load Balancer (NLB)', why: 'L4: can’t route by HTTP path.' },
      { text: 'DNS round robin across instances', why: 'No health checks, no path routing, clients cache dead IPs.' }
    ]
  },
  {
    id: 'l4-game',
    unit: 'u4',
    title: 'Custom game protocol',
    prompt: 'You need to balance millions of long-lived TCP connections using a custom binary game protocol (not HTTP) with minimal added latency.',
    options: [
      { text: 'A Layer 4 load balancer (e.g. NLB, HAProxy TCP mode)', correct: true, why: 'L4 forwards TCP without parsing it: protocol-agnostic and very fast.' },
      { text: 'A Layer 7 HTTP load balancer', why: 'It expects HTTP; your protocol isn’t.' },
      { text: 'A CDN', why: 'CDNs cache content. They don’t balance stateful game connections.' },
      { text: 'An API gateway', why: 'HTTP-oriented and adds per-request overhead.' }
    ]
  },
  {
    id: 'cdn',
    unit: 'u4',
    title: 'Slow down under',
    prompt: 'Users in Australia complain that images and JS bundles load slowly. Everything is served from us-east-1.',
    options: [
      { text: 'Serve static assets through a CDN', correct: true, why: 'Edge caches near users remove the ~200ms cross-Pacific round trips.' },
      { text: 'Add more app servers in us-east-1', why: 'The problem is distance, not capacity.' },
      { text: 'Add a Redis cache', why: 'Still in us-east-1, so the round trip remains.' },
      { text: 'Compress the database', why: 'Unrelated to static asset latency.' }
    ]
  },
  // ── u5
  {
    id: 'payments-db',
    unit: 'u5',
    title: 'Money moves',
    prompt: 'You’re building a payments ledger. Transfers must be atomic and balances must never be inconsistent, even briefly.',
    options: [
      { text: 'PostgreSQL', correct: true, why: 'ACID transactions, constraints, and strong consistency are exactly what ledgers need.' },
      { text: 'Cassandra', why: 'Tunable/eventual consistency and no multi-partition ACID transactions: risky for money.' },
      { text: 'Redis as the primary store', why: 'In-memory with async persistence options; not a system of record for money.' },
      { text: 'Memcached', why: 'A volatile cache: data can be evicted at any time.' }
    ]
  },
  {
    id: 'chat-store',
    unit: 'u5',
    title: 'Billions of messages',
    prompt: 'A chat app stores billions of messages, is very write-heavy, and always reads "the latest 50 messages in conversation X".',
    options: [
      { text: 'Cassandra: partition by conversation_id, cluster by timestamp', correct: true, why: 'Wide-column + LSM storage handles huge write volume; each read hits one partition in order.' },
      { text: 'One Postgres table with joins on every read', why: 'Can work for a while, but write volume and table size become painful at billions.' },
      { text: 'Neo4j', why: 'Graph traversal isn’t the access pattern.' },
      { text: 'Memcached', why: 'Not durable. You’d lose messages.' }
    ]
  },
  {
    id: 'catalog',
    unit: 'u5',
    title: 'Shoes vs laptops',
    prompt: 'An e-commerce catalog: shoes have sizes, laptops have RAM/CPU, sofas have fabrics. Read-heavy, attributes vary wildly by category.',
    options: [
      { text: 'A document store like MongoDB (Postgres JSONB is also strong)', correct: true, why: 'Flexible per-product attributes map naturally to documents.' },
      { text: 'One SQL table with 300 nullable columns', why: 'Sparse, unmaintainable, and every new category needs a migration.' },
      { text: 'Cassandra', why: 'Built for write-heavy, known-pattern workloads, not flexible catalog querying.' },
      { text: 'Redis only', why: 'Memory-bound and poor at ad-hoc filtering as a primary store.' }
    ]
  },
  {
    id: 'dynamo-keys',
    unit: 'u5',
    title: 'Key design',
    prompt: 'DynamoDB orders table. The hottest query: "all orders for customer X, newest first".',
    options: [
      { text: 'Partition key = customerId, sort key = orderDate', correct: true, why: 'One partition per customer, already sorted by date. A single efficient Query.' },
      { text: 'Partition key = orderId only', why: 'Fetching a customer’s orders would require a full table Scan.' },
      { text: 'Partition key = orderDate', why: 'Hot partition for "today" and still can’t look up by customer.' },
      { text: 'Scan with a filter expression', why: 'Reads the entire table every time: slow and expensive.' }
    ]
  },
  // ── u6
  {
    id: 'seq-scan',
    unit: 'u6',
    title: 'Seq Scan of doom',
    prompt: 'SELECT * FROM orders WHERE user_id = ? takes 4s on 50M rows. EXPLAIN shows a sequential scan.',
    options: [
      { text: 'CREATE INDEX on orders(user_id)', correct: true, why: 'Turns an O(n) scan into an O(log n) lookup: the cheapest huge win.' },
      { text: 'Put Redis in front of it', why: 'Hides the problem on hits; every miss still takes 4s.' },
      { text: 'Shard the orders table', why: 'Enormous effort when a missing index is the cause.' },
      { text: 'Add read replicas', why: 'Each replica would do the same slow scan.' }
    ]
  },
  {
    id: 'composite',
    unit: 'u6',
    title: 'Leftmost prefix',
    prompt: 'You have an index on (country, city). Which query can NOT use it efficiently?',
    options: [
      { text: "WHERE city = 'Paris'", correct: true, why: 'Skips the leading column, so the index order is useless.' },
      { text: "WHERE country = 'FR'", why: 'Uses the leading column: fine.' },
      { text: "WHERE country = 'FR' AND city = 'Paris'", why: 'Uses both columns in order: ideal.' },
      { text: "WHERE country = 'FR' ORDER BY city", why: 'Rows within a country are already sorted by city.' }
    ]
  },
  {
    id: 'too-many-indexes',
    unit: 'u6',
    title: 'Index hoarder',
    prompt: 'A write-heavy event log table has 9 indexes. Inserts have become slow; most queries use only 2 of the indexes.',
    options: [
      { text: 'Drop the unused indexes', correct: true, why: 'Every index must be updated on every write. Unused ones are pure cost.' },
      { text: 'Add a few more indexes', why: 'Makes writes even slower.' },
      { text: 'Add a cache', why: 'Caches help reads; this is a write problem.' },
      { text: 'Add read replicas', why: 'Replicas apply the same writes with the same index cost.' }
    ]
  },
  {
    id: 'full-text',
    unit: 'u6',
    title: 'Search that feels smart',
    prompt: 'Users need fuzzy, typo-tolerant full-text search with relevance ranking over 100M product descriptions.',
    options: [
      { text: 'Elasticsearch / OpenSearch', correct: true, why: 'Inverted indexes, analyzers, fuzzy matching and scoring are its core job.' },
      { text: "LIKE '%term%' with a B-tree index", why: 'A leading wildcard can’t use the B-tree, so it scans everything, with no ranking.' },
      { text: 'Redis', why: 'Not a full-text relevance engine (without add-on modules).' },
      { text: 'More Postgres replicas', why: 'Each still runs the same unindexable LIKE.' }
    ]
  },
  // ── u7
  {
    id: 'redis-vs-memcached',
    unit: 'u7',
    title: 'Pick a cache',
    prompt: 'You need a cache for sessions with TTLs, plus a real-time leaderboard sorted by score.',
    options: [
      { text: 'Redis', correct: true, why: 'TTLs plus sorted sets (ZADD/ZRANGE) make leaderboards trivial; optional persistence and replication.' },
      { text: 'Memcached', why: 'Great simple KV cache, but only strings: no sorted sets for the leaderboard.' },
      { text: 'PostgreSQL', why: 'Works, but you asked for a fast in-memory cache.' },
      { text: 'A CDN', why: 'CDNs cache HTTP responses at the edge, not per-user sessions.' }
    ]
  },
  {
    id: 'stampede',
    unit: 'u7',
    title: 'Thundering herd',
    prompt: 'The homepage cache key expires. 20,000 req/s miss simultaneously, all query the DB, and it falls over.',
    options: [
      { text: 'Single-flight lock / request coalescing + stale-while-revalidate + jittered TTLs', correct: true, why: 'Only one request rebuilds, others get stale data, and expirations are spread out.' },
      { text: 'Shorten the TTL', why: 'More frequent expirations make stampedes more frequent.' },
      { text: 'Remove the cache', why: 'Now every request hits the DB all the time.' },
      { text: 'Add more app servers', why: 'More servers send even more simultaneous DB queries.' }
    ]
  },
  {
    id: 'stale-price',
    unit: 'u7',
    title: 'The wrong price',
    prompt: 'After updating a product’s price, customers keep seeing the old price for an hour. TTL is 1 hour.',
    options: [
      { text: 'Delete the cache key on write (and consider a shorter TTL)', correct: true, why: 'Invalidation makes the next read fetch fresh data immediately.' },
      { text: 'Switch to write-back caching', why: 'Addresses write speed, not stale reads, and risks data loss.' },
      { text: 'Increase the TTL', why: 'Stale for even longer.' },
      { text: 'Add more cache memory', why: 'Size isn’t the issue; staleness is.' }
    ]
  },
  {
    id: 'counters',
    unit: 'u7',
    title: 'Like counters',
    prompt: 'Millions of like/view increments per second. Losing a few seconds of counts on a crash is acceptable.',
    options: [
      { text: 'Write-back: INCR in Redis, flush aggregates to the DB periodically', correct: true, why: 'Batching turns millions of DB writes into a few, and the small loss window is acceptable.' },
      { text: 'Write-through: update SQL on every increment', why: 'Millions of row updates/sec on hot rows means lock contention and a melted DB.' },
      { text: 'No cache, just more DB replicas', why: 'Replicas don’t scale writes.' },
      { text: 'Read-through cache', why: 'Helps reads; the problem is write volume.' }
    ]
  },
  // ── u8
  {
    id: 'read-heavy',
    unit: 'u8',
    title: 'Read flood',
    prompt: 'Read:write ratio is 100:1. The primary DB is at 85% CPU, almost entirely from reads. Data size is fine.',
    options: [
      { text: 'Add read replicas (and cache hot reads)', correct: true, why: 'Replicas multiply read capacity without sharding complexity.' },
      { text: 'Shard the database', why: 'Overkill: sharding targets write volume and data size.' },
      { text: 'Multi-leader replication', why: 'Adds write conflict complexity to solve a read problem.' },
      { text: 'Make replication synchronous', why: 'Slows writes; doesn’t add read capacity.' }
    ]
  },
  {
    id: 'ryw',
    unit: 'u8',
    title: 'Did my save work?',
    prompt: 'A user edits their bio, refreshes, and sees the old bio. Reads go to async replicas a few hundred ms behind.',
    options: [
      { text: 'Read-your-writes: serve that user’s reads from the primary for a short window after they write', correct: true, why: 'Hides replication lag from the person who just wrote, while other reads stay on replicas.' },
      { text: 'Add more replicas', why: 'More replicas, same lag.' },
      { text: 'Turn off replication', why: 'Loses read scaling and failover.' },
      { text: 'Increase the cache TTL', why: 'Makes staleness worse.' }
    ]
  },
  {
    id: 'shard-key',
    unit: 'u8',
    title: 'Choose the shard key',
    prompt: 'You must shard a multi-tenant SaaS database. Almost every query is scoped to a single tenant.',
    options: [
      { text: 'tenant_id', correct: true, why: 'Each query hits one shard; tenants are naturally isolated. Plan for very large tenants.' },
      { text: 'created_at', why: 'All new writes hit the newest shard (hotspot), and tenant queries span shards.' },
      { text: 'Random UUID per row', why: 'Even spread, but every tenant query becomes scatter-gather across all shards.' },
      { text: 'Country', why: 'Low cardinality and very uneven shard sizes.' }
    ]
  },
  {
    id: 'celebrity',
    unit: 'u8',
    title: 'The celebrity problem',
    prompt: 'Posts are sharded by user_id. A celebrity with 100M followers posts, and their shard melts under read traffic.',
    options: [
      { text: 'Cache the hot keys aggressively and replicate/split that hot data', correct: true, why: 'Hot-key mitigation: serve from cache/replicas or split the key so one shard isn’t the bottleneck.' },
      { text: 'Re-shard everything by post timestamp', why: 'Creates a write hotspot on the newest shard and breaks per-user queries.' },
      { text: 'Rate-limit the celebrity’s followers', why: 'Punishes users for a design problem.' },
      { text: 'Vertical scale every shard', why: 'Pays for 100 shards to fix one.' }
    ]
  },
  {
    id: 'consistent-hash',
    unit: 'u8',
    title: 'Adding a cache node',
    prompt: 'You add a 5th node to a cache cluster that uses hash(key) % N. Suddenly ~80% of lookups miss and the DB is hammered.',
    options: [
      { text: 'Use consistent hashing (with virtual nodes)', correct: true, why: 'Only ~1/N of keys move when the cluster changes size.' },
      { text: 'Never add nodes', why: 'Not a scaling strategy.' },
      { text: 'Use range partitioning by key name', why: 'Uneven and still requires big reshuffles.' },
      { text: 'Increase TTLs', why: 'Keys are missing because they moved, not because they expired.' }
    ]
  },
  // ── u9
  {
    id: 'async-email',
    unit: 'u9',
    title: 'Slow signups',
    prompt: 'The signup endpoint sends a welcome email synchronously. The email provider is slow, so signups take 5 seconds.',
    options: [
      { text: 'Publish a job to a queue; a worker sends the email asynchronously', correct: true, why: 'Slow, non-critical work moves off the request path, and retries happen in the background.' },
      { text: 'Bigger app servers', why: 'They’d still wait 5s on the provider.' },
      { text: 'Cache the email', why: 'Each email is sent once; nothing to cache.' },
      { text: 'Shard the users table', why: 'The database isn’t the bottleneck.' }
    ]
  },
  {
    id: 'kafka-vs-rabbit',
    unit: 'u9',
    title: 'Events for everyone',
    prompt: 'Clickstream events must flow to 5 independent consumers (analytics, ML, audit…), each reading at its own pace, with the ability to replay last week.',
    options: [
      { text: 'Kafka', correct: true, why: 'A retained, partitioned log: each consumer group tracks its own offset and can rewind.' },
      { text: 'RabbitMQ classic queues', why: 'Messages are removed once acked; replay and many independent readers are awkward.' },
      { text: 'Redis pub/sub', why: 'Fire-and-forget with no persistence; offline consumers miss events.' },
      { text: 'A nightly cron export', why: 'Not real-time.' }
    ]
  },
  {
    id: 'task-queue',
    unit: 'u9',
    title: 'Image thumbnails',
    prompt: 'Each uploaded image needs thumbnails. Jobs need per-message acknowledgement, retries and a dead-letter queue. Volume is moderate.',
    options: [
      { text: 'RabbitMQ (or SQS) task queue with workers', correct: true, why: 'Classic work queue: per-message ack, retries, DLQ, simple to run.' },
      { text: 'Kafka', why: 'Works, but per-message retry/DLQ semantics are more DIY; it shines for event streams.' },
      { text: 'Process thumbnails inside the upload request', why: 'Slow uploads, and failures lose the work.' },
      { text: 'Memcached', why: 'A cache is not a queue.' }
    ]
  }
]

/** Concept scenarios plus tool-specific ones (Tools track). */
export const SCENARIOS: Scenario[] = [...CONCEPT_SCENARIOS, ...TOOL_SCENARIOS]
