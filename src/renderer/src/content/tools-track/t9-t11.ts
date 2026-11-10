import type { Unit } from '../../../../shared/types'

// ───────────────────────── T9: Redis deep dive ─────────────────────────

export const T9_REDIS: Unit = {
  id: 't9',
  track: 'tools',
  requires: ['u7'],
  teaches: ['redis', 'valkey', 'elasticache'],
  title: 'Redis deep dive',
  subtitle: 'Data structures, TTLs, and the patterns interviewers ask about',
  icon: 'zap',
  color: '#7ab814',
  lessons: [
    {
      id: 't9-structures',
      type: 'lesson',
      title: 'Data structures, TTLs and eviction',
      minutes: 8,
      cards: [
        {
          title: 'Strings, counters and the single thread',
          body: `<p>Redis runs commands one at a time on a single thread, so <b>every command is atomic</b>. That is why counters are safe without locks:</p>
<pre class="diagram">SET page:home "&lt;html&gt;..." EX 300
INCR views:post:42        -> (integer) 1
INCRBY views:post:42 10   -> (integer) 11
EXPIRE views:post:42 3600</pre>
<p>The flip side: one slow command blocks everyone. Never run <code>KEYS *</code> in production; use <code>SCAN</code>, which walks the keyspace in small batches.</p>`
        },
        {
          title: 'Hashes, lists and sets',
          body: `<ul><li><b>Hash</b>: a small map under one key. <code>HSET user:42 name Ada plan pro</code>, <code>HINCRBY user:42 logins 1</code>. Good for objects you update field by field.</li>
<li><b>List</b>: ordered, push/pop at both ends. <code>LPUSH feed:42 post:9</code> then <code>LTRIM feed:42 0 99</code> keeps the latest 100. <code>BRPOP</code> makes a simple blocking work queue.</li>
<li><b>Set</b>: unique members. <code>SADD online user:42</code>, <code>SISMEMBER</code>, <code>SINTER</code> for "friends in common".</li></ul>`
        },
        {
          title: 'Sorted sets: leaderboards',
          body: `<p>A sorted set stores members with a numeric <b>score</b>, kept in order. Updates and rank lookups are O(log N).</p>
<pre class="diagram">ZINCRBY lb:weekly 50 player:7
ZREVRANGE lb:weekly 0 9 WITHSCORES   # top 10
ZREVRANK lb:weekly player:7          # my rank (0-based)</pre>
<p>Also used for <b>delay queues</b> (score = run-at timestamp) and <b>sliding-window rate limits</b> (score = request time). If an interviewer says "leaderboard" or "top K", reach for a sorted set.</p>`
        },
        {
          title: 'Streams',
          body: `<p>A <b>stream</b> is an append-only log with IDs, plus Kafka-like <b>consumer groups</b>:</p>
<pre class="diagram">XADD orders * id 991 total 42.50
XREADGROUP GROUP mailer w1 COUNT 10 STREAMS orders &gt;
XACK orders mailer 1731150000000-0</pre>
<p>Unacked entries stay in a <b>pending entries list</b>, so a crashed worker's messages can be claimed by another. Streams are handy when you already run Redis and need a light queue. For high-volume, long-retention event logs, Kafka is still the usual answer.</p>`
        },
        {
          title: 'TTLs and eviction policies',
          body: `<p><code>TTL key</code> returns seconds left, <b>-1</b> if no expiry, <b>-2</b> if the key is gone. A plain <code>SET</code> on an existing key <b>clears its TTL</b> unless you pass <code>EX</code> or <code>KEEPTTL</code>.</p>
<p>When memory hits <code>maxmemory</code>, <code>maxmemory-policy</code> decides:</p>
<ul><li><b>noeviction</b> (open-source default): writes fail with an OOM error. Right for queues and data you can't lose.</li>
<li><b>allkeys-lru</b>: evict any least-recently-used key. Right for a pure cache.</li>
<li><b>volatile-lru</b>: evict only keys that have a TTL. Keys without one are never evicted.</li></ul>`
        }
      ],
      quiz: [
        {
          q: 'What does the last command print?',
          code: `127.0.0.1:6379> SET session:ab12 "v1" EX 1800
OK
127.0.0.1:6379> TTL session:ab12
(integer) 1800
127.0.0.1:6379> SET session:ab12 "v2"
OK
127.0.0.1:6379> TTL session:ab12`,
          options: ['(integer) 1800', '(integer) about 1799', '(integer) -2', '(integer) -1'],
          answer: 3,
          explain: 'A plain SET replaces the value and removes the expiry, so TTL returns -1 (no expiry). Use EX again or KEEPTTL.'
        },
        {
          q: 'Memory reaches 2gb. Every key was written with plain SET and no TTL. What happens on the next write?',
          code: `# redis.conf
maxmemory 2gb
maxmemory-policy volatile-lru`,
          options: ['The least-recently-used key is evicted', 'The write fails with an OOM error because no key has a TTL to evict', 'Redis spills the oldest keys to disk', 'Redis raises maxmemory automatically'],
          answer: 1,
          explain: 'volatile-* policies only evict keys with an expiry. With none, Redis behaves like noeviction and rejects writes. A pure cache should use allkeys-lru.'
        },
        {
          q: 'You need a real-time game leaderboard showing the top 10 and each player’s rank. Which structure?',
          options: ['Sorted set with ZINCRBY and ZREVRANGE', 'List with LPUSH and LRANGE', 'Hash of player to score, sorted in the app', 'Set with SADD'],
          answer: 0,
          explain: 'Sorted sets keep members ordered by score, so updates, top-N and rank lookups are all O(log N).'
        },
        {
          q: 'An engineer runs KEYS user:* on a production instance with 50M keys. What is the main risk?',
          options: ['It returns stale data', 'It evicts the matched keys', 'It blocks the single command thread, stalling every other client', 'It only scans one replica'],
          answer: 2,
          explain: 'Commands run one at a time. KEYS walks the whole keyspace in one go. SCAN does the same job in small cursor-based batches.'
        },
        {
          q: 'Which policy fits a Redis instance used only as a cache in front of Postgres?',
          options: ['noeviction', 'volatile-ttl', 'volatile-lru', 'allkeys-lru'],
          answer: 3,
          explain: 'Everything in a pure cache can be rebuilt, so evicting any least-recently-used key is the right trade.'
        }
      ]
    },
    {
      id: 't9-patterns',
      type: 'lesson',
      title: 'Patterns: cache, lock, rate limit, sessions',
      minutes: 8,
      cards: [
        {
          title: 'Cache-aside in real commands',
          body: `<pre class="diagram">GET product:42                       -> (nil)
# app reads Postgres, then:
SET product:42 '{"name":"Lamp"}' EX 600
# on product update, after the DB commit:
DEL product:42</pre>
<p>Set the value and TTL in <b>one command</b> (<code>EX</code>), not <code>SET</code> then <code>EXPIRE</code>: a crash in between leaves a key that never expires. Add jitter to TTLs so hot keys don't all expire together.</p>`
        },
        {
          title: 'Distributed lock: SET NX PX',
          body: `<pre class="diagram">SET lock:invoice:42 &lt;random-token&gt; NX PX 30000</pre>
<p><code>NX</code> = only if absent, <code>PX</code> = auto-expire in ms so a dead holder can't block forever. Release with a small Lua script that deletes the key <b>only if the token still matches</b>.</p>
<p>Caveats interviewers probe: a GC pause longer than the TTL lets two workers hold the "lock". Replication is async, so a failover can lose it. For correctness, pass a <b>fencing token</b> (increasing number) to the resource and reject stale ones. Use Redis locks for efficiency, not safety.</p>`
        },
        {
          title: 'Rate limiter: fixed window',
          body: `<p>One counter per client per window:</p>
<pre class="diagram">INCR rl:user42:202611091530    -> (integer) 7
EXPIRE rl:user42:202611091530 60   # when count == 1
# reject if count &gt; 100</pre>
<p>Cheap: one key, O(1). Wrap INCR and EXPIRE in a Lua script or <code>MULTI</code> so the TTL is always set.</p>
<p>Weakness: <b>boundary bursts</b>. A client can send 100 at 15:30:59 and 100 at 15:31:00, so 200 in two seconds.</p>`
        },
        {
          title: 'Rate limiter: sliding window with a sorted set',
          body: `<p>Store each request's timestamp as a score, drop old ones, count the rest:</p>
<pre class="diagram">ZREMRANGEBYSCORE rl:user42 0 &lt;now-60000&gt;
ZADD rl:user42 &lt;now&gt; &lt;request-id&gt;
ZCARD rl:user42          # allow if &lt;= 100
PEXPIRE rl:user42 60000</pre>
<p>Run it as one Lua script so it's atomic. Exact, no boundary burst, but memory grows with requests per window. A middle ground is the <b>sliding window counter</b> (weighted average of the current and previous fixed windows) or a <b>token bucket</b> stored in a hash.</p>`
        },
        {
          title: 'Session store',
          body: `<p>Keep sessions in Redis so any app server can handle any request (stateless servers behind the load balancer):</p>
<pre class="diagram">HSET sess:9f3c user_id 42 role admin
EXPIRE sess:9f3c 1800        # refresh on activity</pre>
<p>Losing sessions logs users out, so enable a replica and persistence. Sessions should not be evicted under memory pressure: put them on an instance with <code>noeviction</code> or <code>volatile-lru</code> sized with headroom, separate from the throwaway cache.</p>`
        }
      ],
      quiz: [
        {
          q: 'Worker A runs this and its job sometimes takes 15 seconds. What can go wrong?',
          code: `SET lock:invoice:42 "worker-A" NX PX 10000
# ... process invoice 42 ...
DEL lock:invoice:42`,
          options: ['Nothing, NX guarantees mutual exclusion', 'The lock expires at 10s, worker B acquires it, then A’s DEL deletes B’s lock', 'SET fails because PX and NX can’t be combined', 'The key never expires because DEL is missing a TTL'],
          answer: 1,
          explain: 'The TTL ran out while A still worked, so two workers ran at once, and the blind DEL removed someone else’s lock. Check the token before deleting and use fencing tokens.'
        },
        {
          q: 'Why use SET key value EX 600 instead of SET followed by EXPIRE?',
          options: ['EXPIRE is deprecated', 'EX is faster to parse', 'A crash between the two commands leaves a key with no expiry', 'EXPIRE only works on hashes'],
          answer: 2,
          explain: 'One command is atomic. Two commands leave a window where the TTL is never set.'
        },
        {
          q: 'A fixed-window limiter allows 100 req/min. What is the worst-case burst a client can get through?',
          options: ['About 200 requests within a couple of seconds around a window boundary', 'Exactly 100 in any 60 seconds', '101 requests', 'Unlimited, because INCR is not atomic'],
          answer: 0,
          explain: 'The counter resets at each boundary, so the end of one window and the start of the next can both be used fully.'
        },
        {
          q: 'Which Redis structure does the sliding-window-log rate limiter use, and what is its cost?',
          options: ['A string with INCR; memory is constant', 'A list with LPUSH; requires a lock', 'A set with SADD; cannot expire', 'A sorted set of timestamps; memory grows with requests per window'],
          answer: 3,
          explain: 'Each request is a member scored by time. It is exact but stores one entry per request in the window.'
        },
        {
          q: 'An interviewer asks if your Redis lock makes payment processing safe from double charges. Best answer?',
          options: ['Yes, SET NX is atomic', 'Yes, if you use Redis Cluster', 'Not on its own: pauses and failover can break it, so also use fencing tokens or idempotency keys at the payment layer', 'No, Redis cannot store locks'],
          answer: 2,
          explain: 'A lease-based lock improves efficiency but can be held by two clients. Correctness has to come from the resource side.'
        }
      ]
    },
    {
      id: 't9-ops',
      type: 'lesson',
      title: 'Persistence, replication, Cluster and licensing',
      minutes: 7,
      cards: [
        {
          title: 'Persistence: RDB vs AOF',
          body: `<ul><li><b>RDB</b>: point-in-time snapshots (<code>BGSAVE</code> forks a child that writes a compact file). Fast restarts, small backups, but you lose everything since the last snapshot.</li>
<li><b>AOF</b>: append every write to a log. <code>appendfsync everysec</code> (the usual choice) loses at most about a second. <code>always</code> is safest and slowest. The log is rewritten in the background to stay small.</li></ul>
<p>Many setups run both. Neither makes Redis a ledger: replication is still async.</p>`
        },
        {
          title: 'Replication and Sentinel',
          body: `<p>A primary streams writes to replicas <b>asynchronously</b>. Replicas can serve reads (slightly stale) and stand by for failover.</p>
<p><b>Sentinel</b> is a separate set of processes (run at least 3) that monitor the primary, agree it's down, promote a replica and tell clients the new address. Clients connect via Sentinel, not a fixed IP.</p>
<p>Gotcha: writes acknowledged by the old primary but not yet replicated are <b>lost on failover</b>. <code>WAIT</code> can reduce this but doesn't make Redis strongly consistent.</p>`
        },
        {
          title: 'Redis Cluster: hash slots',
          body: `<p>Cluster shards data across primaries. The keyspace is split into <b>16384 hash slots</b>: <code>slot = CRC16(key) mod 16384</code>, and each primary owns a range. Each primary has replicas, and failover is built in (no Sentinel).</p>
<p>Clients get <code>MOVED</code> redirects and cache the slot map. Multi-key commands and transactions only work if all keys are in one slot. Force that with <b>hash tags</b>: <code>{user:42}:cart</code> and <code>{user:42}:profile</code> hash only the part in braces.</p>
<p>Sentinel = HA for one dataset. Cluster = HA <i>and</i> sharding.</p>`
        },
        {
          title: 'Valkey and the license change',
          body: `<p>In 2024 Redis moved from the BSD license to source-available licenses (RSAL/SSPL), which stops cloud providers offering it as a service without a deal. Redis later added AGPL as an option.</p>
<p>The Linux Foundation forked the last BSD version as <b>Valkey</b>, backed by AWS, Google Cloud and others. It speaks the same protocol, so clients and commands work unchanged.</p>
<p>In an interview, "Redis" usually means the pattern. Saying "Redis or Valkey" shows you know the landscape.</p>`
        },
        {
          title: 'ElastiCache and managed options',
          body: `<p><b>Amazon ElastiCache</b> runs Valkey, Redis OSS or Memcached for you: patching, replicas across AZs, automatic failover, backups, and cluster mode for sharding. AWS prices the Valkey engine below Redis OSS. A serverless option scales capacity for you.</p>
<p>Other clouds: Google <b>Memorystore</b>, Azure Cache for Redis, and Redis Cloud from Redis Inc.</p>
<p>Design answer: "Managed Valkey/Redis, cluster mode with replicas in two AZs, <code>allkeys-lru</code> for the cache, separate instance for sessions and rate limits."</p>`
        }
      ],
      quiz: [
        {
          q: 'What does this error mean and how do you fix it?',
          code: `127.0.0.1:7000> MGET user:1:name user:1:email
(error) CROSSSLOT Keys in request don't hash to the same slot`,
          options: ['The cluster is down; restart a node', 'The keys hash to different slots; use a hash tag like {user:1}:name so related keys share a slot', 'MGET is disabled in Cluster; use KEYS', 'The client needs a longer timeout'],
          answer: 1,
          explain: 'Multi-key commands require one slot. Hash tags make Redis hash only the braced part, so related keys land together.'
        },
        {
          q: 'With appendfsync everysec, roughly how much acknowledged data can you lose if the server loses power?',
          options: ['None', 'Everything since the last RDB snapshot', 'About one second of writes', 'Everything since the last restart'],
          answer: 2,
          explain: 'The AOF is fsynced once per second, so up to about a second of writes may not be on disk.'
        },
        {
          q: 'What is the difference between Sentinel and Redis Cluster?',
          options: ['Sentinel provides failover for one primary’s dataset; Cluster shards data across primaries and handles failover itself', 'Sentinel shards data; Cluster only does backups', 'They are the same feature with different names', 'Cluster requires Sentinel to elect leaders'],
          answer: 0,
          explain: 'Sentinel monitors and promotes replicas for a single dataset. Cluster splits keys over 16384 slots and has built-in failover.'
        },
        {
          q: 'A primary acknowledges a write, then crashes before replicating it. Sentinel promotes a replica. What happens to the write?',
          options: ['Sentinel replays it from its own log', 'The new primary fetches it from the old one on restart', 'Clients automatically retry it', 'It is lost, because replication is asynchronous'],
          answer: 3,
          explain: 'Async replication means an acknowledged write can vanish on failover. This is why Redis is not a source of truth for critical data.'
        },
        {
          q: 'Why does Valkey exist?',
          options: ['It was forked from the last BSD-licensed Redis after Redis changed its license in 2024', 'It is AWS’s proprietary rewrite of Redis in Rust', 'It is a Redis client library', 'It replaced Memcached in ElastiCache'],
          answer: 0,
          explain: 'The Linux Foundation forked Redis to keep a permissively licensed, protocol-compatible version.'
        }
      ]
    },
    {
      id: 't9-byte-rate-limit',
      type: 'byte',
      title: 'Interview Byte: rate limiter with Redis',
      minutes: 6,
      prompt: 'Design a rate limiter for a public API using Redis. Limits are per API key (e.g. 1,000 requests per minute), the API runs on many stateless servers, and it must add very little latency.',
      hints: ['Where does the check run, and what is the key?', 'Fixed window, sliding window or token bucket: what are the trade-offs?', 'What happens when Redis is slow or down?'],
      model: `<p><b>Where:</b> middleware in the API gateway or each server, all sharing one Redis/Valkey cluster so limits are global.</p>
<p><b>Algorithm:</b> sliding window counter or token bucket, run as a <b>single Lua script</b> so read-check-update is atomic. Key: <code>rl:{apiKey}</code>, with a TTL so idle keys clean up. Fixed window (<code>INCR</code> + <code>EXPIRE</code>) is fine if boundary bursts are acceptable. A sorted-set log is exact but costs memory per request.</p>
<p><b>Response:</b> <code>429 Too Many Requests</code> with <code>Retry-After</code> and remaining-quota headers.</p>
<p><b>Scale:</b> Redis Cluster shards by key; one key per client keeps each check in one slot. Sub-millisecond per call.</p>
<p><b>Failure:</b> short timeout. If Redis is down, <b>fail open</b> with a coarse local in-memory limit, so the limiter never takes the API down.</p>
<p><b>Ops:</b> limits per plan in config, metrics on 429 rate and Redis latency.</p>`,
      points: [
        'Shared Redis so limits are global across servers',
        'Named an algorithm and its trade-off (boundary burst vs memory)',
        'Atomic check via Lua script or MULTI',
        'Keys per client with a TTL',
        'Returned 429 with Retry-After',
        'Fail-open (or fail-closed) decision with a timeout'
      ]
    }
  ]
}

// ───────────────────────── T10: Messaging ─────────────────────────

export const T10_MESSAGING: Unit = {
  id: 't10',
  track: 'tools',
  requires: ['u3', 'u8'],
  teaches: ['kafka', 'sqs', 'sns', 'rabbitmq'],
  title: 'Messaging',
  subtitle: 'Kafka, SQS and RabbitMQ: how they deliver, and how they fail',
  icon: 'send',
  color: '#2f9e8f',
  lessons: [
    {
      id: 't10-kafka',
      type: 'lesson',
      title: 'Kafka: partitions, offsets, consumer groups',
      minutes: 8,
      cards: [
        {
          title: 'The model: a partitioned log',
          body: `<p>A Kafka <b>topic</b> is split into <b>partitions</b>. Each partition is an append-only log on disk, and each message gets an increasing <b>offset</b>.</p>
<pre class="diagram">orders-0: [0][1][2][3][4] ...
orders-1: [0][1][2] ...
orders-2: [0][1][2][3] ...</pre>
<p>Consumers don't delete messages. They just track how far they've read (their committed offset). That's the key difference from a queue: <b>many independent readers</b> can read the same data, each at its own pace.</p>`
        },
        {
          title: 'Keys and ordering',
          body: `<p>The producer picks a partition by <b>hashing the message key</b>. Same key, same partition, so <b>ordering is guaranteed per partition, not per topic</b>.</p>
<p>Key by the entity whose events must stay in order: <code>order_id</code>, <code>user_id</code>. No key spreads messages around.</p>
<p>Gotchas: a hot key (one huge tenant) overloads one partition. Adding partitions later changes which partition a key maps to, so ordering breaks across the change. Pick a partition count with growth in mind.</p>`
        },
        {
          title: 'Consumer groups and rebalancing',
          body: `<p>Consumers with the same <code>group.id</code> share the work: each partition goes to <b>exactly one consumer</b> in the group. Different groups (email, analytics) each get every message.</p>
<p>So partitions cap parallelism: 6 partitions, 10 consumers means 4 sit idle.</p>
<p>A <b>rebalance</b> reassigns partitions when a consumer joins, leaves, or misses heartbeats or <code>max.poll.interval.ms</code> (slow processing). Frequent rebalances stall consumption. The cooperative-sticky assignor reduces the pause.</p>`
        },
        {
          title: 'Retention and replay',
          body: `<p>Messages stay for the retention period (<code>retention.ms</code>, often days) whether or not anyone read them. With <code>cleanup.policy=compact</code>, Kafka keeps the latest value per key instead, which is good for "current state" topics.</p>
<p>Because data stays, you can <b>replay</b>: fix a bug, then rewind the group's offsets:</p>
<pre class="diagram">kafka-consumer-groups.sh --bootstrap-server kafka:9092 \\
  --group analytics --topic orders \\
  --reset-offsets --to-earliest --execute</pre>
<p>The group must be stopped while you reset. A new group's start point is set by <code>auto.offset.reset</code> (<code>earliest</code> or <code>latest</code>).</p>`
        },
        {
          title: 'Durability: replication factor and acks',
          body: `<p>Each partition has a leader and followers on other brokers. <b>Replication factor 3</b> is the common production choice.</p>
<ul><li><code>acks=0</code>: fire and forget.</li><li><code>acks=1</code>: leader wrote it; lost if the leader dies before followers copy it.</li><li><code>acks=all</code>: every in-sync replica has it.</li></ul>
<p>Pair <code>acks=all</code> with topic setting <code>min.insync.replicas=2</code>: if fewer than 2 replicas are in sync, writes are <b>rejected</b> rather than silently under-replicated. Newer Kafka runs its own metadata quorum (KRaft) instead of ZooKeeper.</p>`
        }
      ],
      quiz: [
        {
          q: 'What does this output tell you?',
          code: `$ kafka-consumer-groups.sh --bootstrap-server kafka:9092 \\
    --describe --group email-service
GROUP          TOPIC   PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
email-service  orders  0          10450           10452           2
email-service  orders  1          8120            8121            1
email-service  orders  2          3005            91877           88872`,
          options: ['The whole group is too slow; add more partitions immediately', 'The broker for partition 0 is down', 'Partition 2 is stuck or overloaded: maybe a poison message, a hot key, or a slow consumer on that partition', 'Lag is normal; offsets are reset nightly'],
          answer: 2,
          explain: 'Two partitions are caught up and one is far behind. That points at that partition’s consumer or its data, not overall capacity.'
        },
        {
          q: 'A brand-new consumer group starts with this config. The topic holds 7 days of orders. What does it process first?',
          code: `group.id=fraud-check
enable.auto.commit=false
auto.offset.reset=latest`,
          options: ['The oldest retained message', 'Only messages produced after it joins', 'The last committed offset of other groups', 'Nothing until an admin sets an offset'],
          answer: 1,
          explain: 'With no committed offset, latest starts at the end of the log. Use earliest to process the backlog.'
        },
        {
          q: 'A topic has 6 partitions. You scale the consumer group from 6 to 12 instances. Throughput…',
          options: ['Stays about the same; 6 consumers sit idle', 'Doubles', 'Halves because of rebalancing', 'Doubles, but ordering breaks'],
          answer: 0,
          explain: 'Each partition goes to one consumer in a group, so partitions cap parallelism.'
        },
        {
          q: 'The payments topic has replication.factor=3 and min.insync.replicas=2. Two brokers holding a partition go down. What happens to produces with acks=all?',
          options: ['They succeed on the remaining broker', 'They are buffered on the producer forever', 'They succeed but are flagged as unsafe', 'They fail with a not-enough-replicas error until a replica returns'],
          answer: 3,
          explain: 'Only one in-sync replica remains, below the minimum of 2, so Kafka rejects the write instead of risking loss.'
        },
        {
          q: 'All events for an order must be processed in order. What do you do?',
          options: ['Use a single-partition topic', 'Use order_id as the message key', 'Set acks=all', 'Use a separate topic per order'],
          answer: 1,
          explain: 'Same key goes to the same partition, which preserves order, while other orders still spread across partitions.'
        }
      ]
    },
    {
      id: 't10-queues',
      type: 'lesson',
      title: 'SQS and RabbitMQ',
      minutes: 8,
      cards: [
        {
          title: 'SQS: standard vs FIFO',
          body: `<p><b>Amazon SQS</b> is a fully managed queue. No brokers to run.</p>
<ul><li><b>Standard</b>: nearly unlimited throughput, <b>at-least-once</b> delivery, best-effort ordering. Expect occasional duplicates and reordering.</li>
<li><b>FIFO</b>: strict order within a <code>MessageGroupId</code>, deduplication within a short window (via <code>MessageDeduplicationId</code> or content-based dedup). Lower throughput limits.</li></ul>
<p>Unlike Kafka, a message is gone once a consumer deletes it. No replay, one logical consumer per queue. For fan-out, put <b>SNS</b> in front: one topic, one SQS queue per subscriber.</p>`
        },
        {
          title: 'Visibility timeout and the receive loop',
          body: `<pre class="diagram">aws sqs receive-message --queue-url "$Q" \\
  --max-number-of-messages 10 --wait-time-seconds 20
# process, then:
aws sqs delete-message --queue-url "$Q" \\
  --receipt-handle "$HANDLE"</pre>
<p>Receiving <b>hides</b> a message for the <b>visibility timeout</b> (default 30s). Delete it when done. If you don't (crash or too slow), it reappears for another consumer. Set the timeout above your worst processing time, or extend it with <code>ChangeMessageVisibility</code>.</p>
<p><code>--wait-time-seconds 20</code> is <b>long polling</b>: wait for messages instead of returning empty, which cuts cost and empty responses.</p>`
        },
        {
          title: 'Dead-letter queues',
          body: `<p>A <b>poison message</b> fails every time and loops forever. A redrive policy moves it aside after N receives:</p>
<pre class="diagram">{
  "deadLetterTargetArn": "arn:aws:sqs:us-east-1:123456789012:orders-dlq",
  "maxReceiveCount": "5"
}</pre>
<p>Alarm on DLQ depth, inspect the messages, fix the bug, then redrive them back to the source queue. Every queue in a design answer should have a DLQ. Kafka has no built-in DLQ; consumers write failures to a separate topic themselves.</p>`
        },
        {
          title: 'RabbitMQ: exchanges, queues, bindings',
          body: `<p>Producers publish to an <b>exchange</b> with a <b>routing key</b>. <b>Bindings</b> route copies into <b>queues</b>:</p>
<ul><li><b>direct</b>: exact routing-key match.</li><li><b>fanout</b>: every bound queue gets a copy.</li><li><b>topic</b>: patterns. <code>*</code> = exactly one word, <code>#</code> = zero or more words. <code>order.*.created</code>, <code>order.#</code>.</li></ul>
<p>Flexible routing is RabbitMQ's strength. Use <b>quorum queues</b> (Raft-replicated) for durability. You run it yourself or use a managed service such as Amazon MQ.</p>`
        },
        {
          title: 'RabbitMQ: acks and prefetch',
          body: `<p>With manual acks, a message stays <b>unacked</b> until the consumer acks it. If the consumer's channel closes first, RabbitMQ redelivers it. A <code>nack</code> with requeue off can route it to a dead-letter exchange.</p>
<p><b>Prefetch</b> (<code>basic.qos</code>) caps unacked messages per consumer. Without it, RabbitMQ pushes as fast as it can, and one consumer can hoard thousands while others idle. Start with a small prefetch (tens) for slow jobs and raise it for fast ones.</p>`
        }
      ],
      quiz: [
        {
          q: 'Jobs take up to 90 seconds. The queue uses the default 30-second visibility timeout. What happens?',
          options: ['SQS waits for the job to finish', 'Long jobs reappear and are processed again by another worker, causing duplicates', 'Messages move to the DLQ immediately', 'The job is killed after 30 seconds'],
          answer: 1,
          explain: 'Once the timeout passes without a delete, the message becomes visible again. Raise the timeout or extend it while working.'
        },
        {
          q: 'What does this redrive policy do?',
          code: `{
  "deadLetterTargetArn": "arn:aws:sqs:us-east-1:123456789012:orders-dlq",
  "maxReceiveCount": "5"
}`,
          options: ['Retries every message 5 times per second', 'Copies every message to orders-dlq as a backup', 'Deletes messages after 5 minutes', 'After a message has been received 5 times without being deleted, SQS moves it to orders-dlq'],
          answer: 3,
          explain: 'maxReceiveCount counts receives. Exceeding it shunts the message to the dead-letter queue so it stops blocking work.'
        },
        {
          q: 'Which routing keys reach a queue bound with this key?',
          code: `exchange: events (type: topic)
binding:  queue=eu-orders  key=order.eu.*`,
          options: ['order.eu.created and order.eu.shipped, but not order.eu.vip.created', 'Any key starting with order', 'Only the literal key order.eu.*', 'order.eu, order.eu.created and order.eu.vip.created'],
          answer: 0,
          explain: 'In topic exchanges * matches exactly one word. # would match zero or more words.'
        },
        {
          q: 'A team needs ordered, exactly-processed-once-per-customer billing events and is choosing SQS standard. Main concern?',
          options: ['Standard queues cannot hold JSON', 'Standard queues require a VPC', 'Standard queues are at-least-once with best-effort ordering; use FIFO with MessageGroupId per customer and idempotent consumers', 'Standard queues lose messages after 30 seconds'],
          answer: 2,
          explain: 'FIFO gives order within a message group and dedup within a window. Consumers should still be idempotent.'
        },
        {
          q: 'One RabbitMQ consumer has 5,000 unacked messages while three others are idle. Likely fix?',
          options: ['Switch to a fanout exchange', 'Set a prefetch (basic.qos) limit on the consumers', 'Disable acks', 'Add more queues with the same binding'],
          answer: 1,
          explain: 'Without prefetch, the broker pushes everything to whoever is connected. A prefetch limit spreads work fairly.'
        }
      ]
    },
    {
      id: 't10-semantics',
      type: 'lesson',
      title: 'Delivery semantics and the outbox',
      minutes: 7,
      cards: [
        {
          title: 'At-most, at-least, exactly once',
          body: `<ul><li><b>At-most-once</b>: ack before processing. A crash loses the message. Fine for metrics you can drop.</li>
<li><b>At-least-once</b>: process, then ack. A crash after processing but before the ack means a <b>redelivery</b>. This is the default for SQS, RabbitMQ and Kafka consumers that commit after processing.</li>
<li><b>Exactly-once</b>: Kafka offers it <i>inside Kafka</i> (idempotent producer + transactions + <code>read_committed</code>). Once you call an email API or another database, you're back to at-least-once.</li></ul>
<p>The practical answer: <b>at-least-once delivery + idempotent consumers</b>.</p>`
        },
        {
          title: 'Idempotent consumers',
          body: `<p>Processing the same message twice must have the same effect as once.</p>
<pre class="diagram">BEGIN;
INSERT INTO processed_messages (id) VALUES ('evt-77');
  -- fails on duplicate primary key: skip
UPDATE inventory SET qty = qty - 1 WHERE sku = 'A1';
COMMIT;</pre>
<p>Other tools: natural idempotency (<code>SET status = 'shipped'</code> instead of increments), upserts, or an idempotency key passed to the downstream API (most payment APIs accept one). Every message needs a stable unique ID for this to work.</p>`
        },
        {
          title: 'The dual-write problem',
          body: `<p>Checkout does this:</p>
<pre class="diagram">db.commit(order)
kafka.send("order.created", order)   # crash here?</pre>
<p>If the process dies between the two, the order exists but no event is sent. Flip the order and you can send an event for an order that rolled back. You <b>cannot</b> atomically write to a database and a broker without a distributed transaction, and those are slow and rarely supported. Interviewers love asking about this.</p>`
        },
        {
          title: 'The transactional outbox',
          body: `<p>Write the event to an <b>outbox table in the same database transaction</b> as the business change:</p>
<pre class="diagram">BEGIN;
INSERT INTO orders ...;
INSERT INTO outbox (id, topic, payload) VALUES (...);
COMMIT;</pre>
<p>A separate relay publishes outbox rows to the broker: either a poller, or <b>CDC</b> (Debezium reading the database log). The event is published <b>if and only if</b> the order committed. The relay may publish twice, so consumers stay idempotent.</p>`
        }
      ],
      quiz: [
        {
          q: 'A consumer acks a message, then crashes before writing the result. Which semantics is that?',
          options: ['At-least-once', 'Exactly-once', 'At-most-once', 'Effectively-once'],
          answer: 2,
          explain: 'Acking before processing means a crash loses the message: at most one delivery.'
        },
        {
          q: 'What is wrong with this checkout code?',
          code: `def checkout(order):
    db.insert(order)
    db.commit()
    producer.send("order.created", order.to_json())
    return 201`,
          options: ['Nothing, the commit happens first', 'A crash or broker error after commit leaves an order with no event; use an outbox in the same transaction', 'send() must be called before insert()', 'Kafka cannot accept JSON'],
          answer: 1,
          explain: 'Two separate systems cannot be written atomically. The outbox puts the event in the same commit as the order.'
        },
        {
          q: 'Kafka supports exactly-once semantics. Does that make your email sender exactly-once?',
          options: ['No: Kafka’s guarantee covers reads and writes within Kafka, not side effects like calling an email API', 'Yes, with acks=all', 'Yes, if enable.auto.commit=true', 'Only on FIFO topics'],
          answer: 0,
          explain: 'External side effects can still repeat after a crash. Make them idempotent, e.g. with an idempotency key.'
        },
        {
          q: 'Which consumer update is naturally idempotent?',
          options: ['UPDATE accounts SET balance = balance + 10', 'INSERT INTO emails_sent (to) VALUES (...) with no unique key', 'Calling the SMS API to send a code', 'UPDATE orders SET status = ’shipped’ WHERE id = 42'],
          answer: 3,
          explain: 'Setting an absolute value gives the same result no matter how many times it runs. Increments and sends do not.'
        },
        {
          q: 'In the outbox pattern, why must consumers still be idempotent?',
          options: ['Because the outbox table may lose rows', 'Because the relay can publish a row, crash before marking it sent, and publish it again', 'Because outbox requires at-most-once', 'They don’t need to be'],
          answer: 1,
          explain: 'The relay is itself at-least-once. Outbox guarantees the event is not lost, not that it is sent only once.'
        }
      ]
    },
    {
      id: 't10-byte-order-events',
      type: 'byte',
      title: 'Interview Byte: order events',
      minutes: 6,
      prompt: 'Orders must trigger email, inventory and analytics without the checkout service knowing about them. Design it.',
      hints: ['How does checkout publish without the dual-write problem?', 'Kafka topic or SNS + SQS fan-out? What does each consumer need?', 'What happens when a consumer fails or sees a duplicate?'],
      model: `<ol><li><b>Publish:</b> checkout writes the order and an <code>outbox</code> row in one transaction. A relay (Debezium CDC or a poller) publishes <code>OrderPlaced</code> with a unique event ID.</li>
<li><b>Transport:</b> a Kafka topic <code>orders</code> keyed by <code>order_id</code> (per-order ordering, replay for analytics, RF 3, <code>acks=all</code>). On AWS, SNS fanning out to one SQS queue per consumer also works.</li>
<li><b>Consumers:</b> email, inventory and analytics are separate consumer groups (or queues), so each gets every event and scales and fails independently. Checkout never knows they exist.</li>
<li><b>Reliability:</b> at-least-once delivery, idempotent consumers (processed-ID table, idempotency key to the email provider), retries with backoff, then a DLQ or dead-letter topic with alerts.</li>
<li><b>Evolution:</b> versioned event schema (schema registry) so new consumers can be added without touching checkout.</li>
<li><b>Monitor:</b> consumer lag, DLQ depth, outbox backlog.</li></ol>`,
      points: [
        'Used an outbox (or CDC) to avoid the dual write',
        'Chose Kafka or SNS+SQS fan-out and justified it',
        'Separate consumer group or queue per downstream service',
        'Keyed by order_id for per-order ordering',
        'Idempotent consumers with unique event IDs',
        'Retries, DLQ and lag monitoring'
      ]
    }
  ]
}

// ───────────────────────── T11: Scaling data ─────────────────────────

export const T11_SCALING_DATA: Unit = {
  id: 't11',
  track: 'tools',
  requires: ['u8'],
  teaches: ['postgres', 'patroni', 'vitess', 'citus', 'spanner', 'cockroachdb', 'debezium'],
  title: 'Scaling data',
  subtitle: 'Replicas, failover, sharding tools and change data capture',
  icon: 'split',
  color: '#8a5cf6',
  lessons: [
    {
      id: 't11-replication',
      type: 'lesson',
      title: 'Postgres replication and failover',
      minutes: 8,
      cards: [
        {
          title: 'Streaming replication',
          body: `<p>Every Postgres change is first written to the <b>WAL</b> (write-ahead log). A standby connects to the primary and <b>streams WAL</b>, replaying it to stay a near-exact copy.</p>
<p>A standby is set up from a base backup (<code>pg_basebackup</code>), a <code>standby.signal</code> file, and <code>primary_conninfo</code> pointing at the primary. With <code>hot_standby = on</code> it serves read-only queries.</p>
<p>Default is <b>asynchronous</b>: the primary commits without waiting. <code>synchronous_standby_names</code> makes commits wait for a standby: no data loss on failover, but higher write latency.</p>`
        },
        {
          title: 'Read replicas and replica lag',
          body: `<p>Send read-heavy traffic (feeds, search pages, reports) to replicas. Writes still go to one primary, so <b>replicas don't help write load</b>.</p>
<p>Replicas are behind by some <b>lag</b>, usually milliseconds, but seconds or minutes under heavy writes or long queries. Check it on the primary:</p>
<pre class="diagram">SELECT application_name, state, replay_lag
FROM pg_stat_replication;</pre>
<p>Gotcha: long queries on a replica can conflict with replay. Postgres either cancels the query or delays replay (<code>max_standby_streaming_delay</code>, <code>hot_standby_feedback</code>).</p>`
        },
        {
          title: 'Read-your-writes',
          body: `<p>A user updates their profile, the page reloads from a lagging replica, and the change "disappears". Fixes:</p>
<ul><li>Read from the <b>primary for a short window</b> (e.g. 10s) after that user writes.</li>
<li>Always read <b>the user's own data</b> from the primary; others' data from replicas.</li>
<li>Track the WAL position (LSN) of the write and only use a replica that has replayed past it.</li></ul>
<p>Name this problem in any design that adds read replicas.</p>`
        },
        {
          title: 'Automatic failover with Patroni',
          body: `<p>Postgres has no built-in failover. <b>Patroni</b> is the common open-source answer. A Patroni agent runs beside each Postgres node and uses a <b>DCS</b> (etcd, Consul or ZooKeeper) for leader election.</p>
<p>The primary holds a <b>leader key with a TTL</b> and renews it every loop. If it can't renew (crash, partition), the key expires, the healthiest replica takes it and is promoted.</p>
<pre class="diagram">$ patronictl -c /etc/patroni.yml list
$ patronictl -c /etc/patroni.yml switchover</pre>
<p>Clients find the primary through HAProxy health-checking Patroni's REST API (<code>/primary</code>), or a DNS/VIP update.</p>`
        },
        {
          title: 'Fencing: avoiding split brain',
          body: `<p>The danger in failover is <b>two primaries</b> accepting writes. Patroni fences by design: a primary that can't reach the DCS to renew its lock <b>demotes itself</b> to read-only.</p>
<p>A <b>watchdog</b> (Linux softdog) can reset a node whose Patroni process hangs, so it can't keep acting as primary. The old primary rejoins as a replica, often via <code>pg_rewind</code>.</p>
<p>Managed alternatives (RDS Multi-AZ, Aurora, Cloud SQL HA) do this for you. Self-host with Patroni when you need control or run on Kubernetes (operators often use Patroni under the hood).</p>`
        }
      ],
      quiz: [
        {
          q: 'Reading this output on the primary, what should worry you?',
          code: `postgres=# SELECT application_name, state, sync_state, replay_lag
           FROM pg_stat_replication;
 application_name |   state   | sync_state |   replay_lag
------------------+-----------+------------+-----------------
 replica-a        | streaming | async      | 00:00:00.004
 replica-b        | streaming | async      | 00:02:41.337`,
          options: ['replica-a is too fast and will diverge', 'replica-b is almost 3 minutes behind, so reads from it are stale and it is a poor failover candidate', 'Both replicas should be sync for reads to work', 'Nothing; replay_lag only matters for backups'],
          answer: 1,
          explain: 'Minutes of replay lag mean stale reads and, if promoted, lost recent transactions. Investigate long queries, I/O or network on replica-b.'
        },
        {
          q: 'What does maximum_lag_on_failover do in this Patroni config?',
          code: `scope: pg-main
bootstrap:
  dcs:
    ttl: 30
    loop_wait: 10
    retry_timeout: 10
    maximum_lag_on_failover: 1048576`,
          options: ['Caps how long a failover may take, in ms', 'Sets the WAL retention size', 'Throttles writes on the primary when replicas lag', 'A replica lagging by more than this many bytes of WAL won’t be promoted automatically'],
          answer: 3,
          explain: 'It stops Patroni from promoting a replica that would lose too much data. The value is in bytes (1 MB here).'
        },
        {
          q: 'A user edits their bio and the reloaded page shows the old bio. Replicas are used for reads. Best fix?',
          options: ['Route that user’s reads to the primary for a short time after they write', 'Add more replicas', 'Increase the cache TTL', 'Switch to synchronous replication for all replicas'],
          answer: 0,
          explain: 'Read-your-writes only needs the writer to see their own change. Pinning their reads to the primary briefly solves it cheaply.'
        },
        {
          q: 'The primary loses network access to etcd but is otherwise healthy. What does Patroni do on that node?',
          options: ['Keeps serving writes until an operator intervenes', 'Promotes itself again with a new timeline', 'Demotes it, because it can no longer renew the leader key', 'Deletes its data directory'],
          answer: 2,
          explain: 'Without the leader lock, the node must assume another node may be promoted, so it stops accepting writes to avoid split brain.'
        },
        {
          q: 'Your primary is CPU-bound on writes. Will adding three read replicas help?',
          options: ['Yes, writes are spread across all four nodes', 'Yes, if replicas are synchronous', 'Yes, replicas take over vacuum', 'No: every replica still replays every write, and only the primary accepts writes'],
          answer: 3,
          explain: 'Replication scales reads. Write scaling needs less write work, bigger hardware, or sharding.'
        }
      ]
    },
    {
      id: 't11-sharding',
      type: 'lesson',
      title: 'Sharding tools and distributed SQL',
      minutes: 8,
      cards: [
        {
          title: 'Before you shard',
          body: `<p>Sharding is a one-way door: cross-shard joins, transactions and schema changes all get harder. Exhaust cheaper steps first:</p>
<ol><li>Find the expensive queries (<code>pg_stat_statements</code>), add or drop indexes.</li>
<li>Connection pooling (PgBouncer), batch writes.</li>
<li>Bigger instance, faster disks.</li>
<li>Move reads to replicas and caches.</li>
<li>Move write-heavy side data (events, logs) to a better-fitting store; archive cold rows; partition big tables.</li></ol>
<p>Then shard, ideally with a tool rather than by hand.</p>`
        },
        {
          title: 'Vitess (MySQL)',
          body: `<p>Vitess shards MySQL behind a proxy. It came from YouTube; PlanetScale is a managed version.</p>
<ul><li><b>vtgate</b>: stateless proxy that speaks the MySQL protocol and routes queries.</li>
<li><b>vttablet</b>: sidecar beside each MySQL instance.</li>
<li><b>Keyspace</b>: a logical database, split into shards by key range.</li>
<li><b>Vindex</b>: maps a column to a shard. The <b>primary vindex</b> (e.g. hash of <code>customer_id</code>) decides where each row lives. <b>Lookup vindexes</b> route queries on other columns.</li></ul>
<p>Resharding runs online: Vitess copies and catches up data, then cuts traffic over.</p>`
        },
        {
          title: 'Citus (Postgres)',
          body: `<p>Citus is a Postgres extension. A <b>coordinator</b> node holds metadata and plans queries; <b>worker</b> nodes hold shards.</p>
<pre class="diagram">SELECT create_distributed_table('orders', 'customer_id');
SELECT create_distributed_table('payments', 'customer_id',
                                colocate_with =&gt; 'orders');
SELECT create_reference_table('countries');</pre>
<p>The <b>distribution column</b> is the big choice. Tables distributed on the same column are <b>co-located</b>, so joins on it stay on one node. Small lookup tables become <b>reference tables</b> copied to every worker. Great fit for multi-tenant SaaS keyed by <code>tenant_id</code>.</p>`
        },
        {
          title: 'Distributed SQL: Spanner and CockroachDB',
          body: `<p>Instead of sharding a single-node database, use one built to be distributed. Data is split into ranges, each replicated with consensus (Paxos/Raft). The system splits and moves ranges for you, and supports <b>cross-shard ACID transactions</b>.</p>
<ul><li><b>Spanner</b> (Google Cloud): uses TrueTime clocks for externally consistent transactions, scales globally.</li>
<li><b>CockroachDB</b>: speaks the Postgres wire protocol, serializable by default. No longer open source; check its license.</li></ul>
<p>Trade-offs: higher per-write latency (consensus, sometimes across regions), cost, and Postgres-compatible is not identical to Postgres.</p>`
        },
        {
          title: 'Picking a shard key',
          body: `<p>A good key:</p>
<ul><li>Appears in <b>almost every query</b>, so queries hit one shard.</li>
<li>Has <b>high cardinality</b> and even load. Avoid keys like <code>country</code> or <code>created_at</code> (all new writes land on one shard).</li>
<li>Keeps related data together: <code>tenant_id</code> or <code>customer_id</code> keeps a customer's orders, items and payments co-located.</li></ul>
<p>Queries without the key become <b>scatter-gather</b> across all shards. Watch for one giant tenant: you may need to isolate it on its own shard.</p>`
        }
      ],
      quiz: [
        {
          q: 'With this VSchema, what happens to SELECT * FROM orders WHERE id = 7?',
          code: `{
  "sharded": true,
  "vindexes": { "hash": { "type": "hash" } },
  "tables": {
    "orders": {
      "column_vindexes": [{ "column": "customer_id", "name": "hash" }]
    }
  }
}`,
          options: ['vtgate routes it to exactly one shard', 'It fails; Vitess requires the vindex column in every query', 'vtgate scatters it to every shard, because id is not a vindex column', 'It is served from the vtgate cache'],
          answer: 2,
          explain: 'Only customer_id maps to a shard. Without it (or a lookup vindex on id), vtgate must ask all shards.'
        },
        {
          q: 'What does colocate_with achieve here?',
          code: `SELECT create_distributed_table('orders', 'customer_id');
SELECT create_distributed_table('payments', 'customer_id',
                                colocate_with => 'orders');`,
          options: ['Rows of both tables for the same customer_id live on the same worker, so joins on customer_id stay local', 'It copies payments to every worker', 'It merges the two tables into one', 'It makes payments read-only'],
          answer: 0,
          explain: 'Co-located tables share shard placement, so a join on the distribution column needs no network shuffle.'
        },
        {
          q: 'Why is created_at a poor shard key for an orders table?',
          options: ['Timestamps can’t be hashed', 'It makes reads slower on replicas', 'Citus forbids timestamp columns', 'With range sharding, all new writes hit the newest shard, and most queries don’t filter by it alone'],
          answer: 3,
          explain: 'Time-ordered keys create a hot shard for current writes. Keys like customer_id spread load and match query patterns.'
        },
        {
          q: 'What is the main thing distributed SQL (Spanner, CockroachDB) gives you over hand-rolled sharding?',
          options: ['Lower single-row write latency', 'Automatic range splitting and rebalancing plus ACID transactions across shards', 'Full compatibility with every Postgres extension', 'No need for a primary key'],
          answer: 1,
          explain: 'The database manages placement and offers cross-shard transactions. You pay in latency, cost and compatibility gaps.'
        },
        {
          q: 'In Vitess, what is vtgate?',
          options: ['A stateless proxy that speaks the MySQL protocol and routes queries to the right shards', 'A backup tool', 'The MySQL storage engine Vitess uses', 'A sidecar running next to each MySQL instance'],
          answer: 0,
          explain: 'Apps connect to vtgate as if it were MySQL. vttablet is the per-instance sidecar.'
        }
      ]
    },
    {
      id: 't11-cdc',
      type: 'lesson',
      title: 'Change data capture with Debezium',
      minutes: 7,
      cards: [
        {
          title: 'What CDC is',
          body: `<p><b>Change data capture</b> reads the database's own change log and turns every insert, update and delete into an event. The app doesn't publish anything.</p>
<ul><li><b>Postgres</b>: logical decoding of the WAL. Needs <code>wal_level = logical</code>, a <b>replication slot</b> and an output plugin (<code>pgoutput</code> is built in).</li>
<li><b>MySQL</b>: reads the <b>binlog</b> in row format.</li></ul>
<p>Because it reads committed changes from the log, CDC avoids the dual-write problem: if it committed, it gets captured.</p>`
        },
        {
          title: 'Debezium on Kafka Connect',
          body: `<p><b>Debezium</b> is an open-source set of CDC connectors, usually run on <b>Kafka Connect</b>. Each captured table becomes a Kafka topic, by default <code>&lt;topic.prefix&gt;.&lt;schema&gt;.&lt;table&gt;</code>.</p>
<p>Each event carries <code>before</code>, <code>after</code>, <code>source</code> metadata and <code>op</code>: <code>c</code> create, <code>u</code> update, <code>d</code> delete, <code>r</code> read (from the initial snapshot).</p>
<p>On first start it <b>snapshots</b> existing rows, then streams changes. Debezium Server can also send to other sinks (Kinesis, Pub/Sub) without Kafka.</p>`
        },
        {
          title: 'What you feed with it',
          body: `<pre class="diagram">Postgres --WAL--&gt; Debezium --&gt; Kafka --+--&gt; cache invalidator (DEL keys)
                                     +--&gt; search indexer (Elasticsearch)
                                     +--&gt; warehouse (Snowflake / BigQuery)
                                     +--&gt; other services (outbox events)</pre>
<p>One source of truth, many derived views, all kept in sync without changing app code. With the <b>outbox</b> pattern, Debezium reads the outbox table and routes rows as proper domain events, so you don't leak your internal table schema.</p>`
        },
        {
          title: 'Gotchas',
          body: `<ul><li><b>Replication slots hold WAL</b> until the consumer confirms it. If the connector is down for days, WAL piles up and can <b>fill the primary's disk</b>. Monitor slot lag and alert.</li>
<li><b>Schema changes</b> flow downstream: renaming a column can break consumers. Use a schema registry and compatible changes.</li>
<li>Delivery is <b>at-least-once</b>: after a restart some events repeat. Consumers must be idempotent.</li>
<li>Initial snapshots of big tables take time and load. Plan them.</li></ul>`
        }
      ],
      quiz: [
        {
          q: 'With this connector, which Kafka topic receives changes to the orders table?',
          code: `{
  "name": "orders-cdc",
  "config": {
    "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
    "database.hostname": "pg-primary",
    "database.dbname": "shop",
    "plugin.name": "pgoutput",
    "slot.name": "debezium_orders",
    "table.include.list": "public.orders",
    "topic.prefix": "shop"
  }
}`,
          options: ['orders', 'debezium_orders', 'orders-cdc', 'shop.public.orders'],
          answer: 3,
          explain: 'Debezium names topics topic.prefix.schema.table by default.'
        },
        {
          q: 'The Debezium connector has been down all weekend and the Postgres primary’s disk is nearly full. Why?',
          options: ['Debezium writes snapshots to the primary’s disk', 'Kafka is replicating into Postgres', 'The replication slot keeps WAL until the connector confirms it, so WAL accumulated', 'Logical decoding doubles table sizes'],
          answer: 2,
          explain: 'Slots guarantee no change is missed by retaining WAL. An abandoned or stalled slot is a classic outage cause, so alert on slot lag.'
        },
        {
          q: 'A Debezium event has "op": "d". What does the payload look like?',
          options: ['before holds the deleted row, after is null', 'after holds the deleted row, before is null', 'Both are null', 'Both hold the same row'],
          answer: 0,
          explain: 'A delete has the old row state in before and nothing in after.'
        },
        {
          q: 'Why use CDC to update Elasticsearch instead of writing to Postgres and Elasticsearch from the app?',
          options: ['Elasticsearch cannot accept writes from apps', 'CDC reads committed changes from the log, so the index can’t miss a write or index one that rolled back', 'CDC is exactly-once end to end', 'It removes the need for Kafka'],
          answer: 1,
          explain: 'App-level dual writes can diverge on crashes. The database log is the single ordered record of what actually committed.'
        }
      ]
    },
    {
      id: 't11-byte-write-scaling',
      type: 'byte',
      title: 'Interview Byte: the primary is running hot',
      minutes: 6,
      prompt: 'Your single Postgres primary is at 80% CPU from writes and growing 3x a year. What do you do, in order?',
      hints: ['At 3x a year, how long until you hit the wall?', 'What cheap fixes reduce write work before adding machines?', 'If you must shard, what key and which tool?'],
      model: `<ol><li><b>Measure:</b> <code>pg_stat_statements</code> for the top write queries, plus index count and WAL volume. At 3x/year you have months, so act now but in order.</li>
<li><b>Cut write work:</b> drop unused indexes, batch inserts, fix update-heavy hot rows, add PgBouncer, tune autovacuum and checkpoints.</li>
<li><b>Buy time:</b> scale up the instance and disks. Move reads to replicas and a cache so the primary only does writes.</li>
<li><b>Move data out:</b> send append-heavy data (events, logs, metrics) to Kafka, ClickHouse or a time-series store; archive cold rows; partition big tables.</li>
<li><b>Shard:</b> pick a key like <code>tenant_id</code> or <code>customer_id</code>. Citus keeps you on Postgres; distributed SQL (CockroachDB, Spanner) if you need cross-shard transactions. Migrate with CDC dual-run, then cut over.</li>
<li><b>Safety:</b> Patroni or managed HA, and capacity alerts well before 100%.</li></ol>`,
      points: [
        'Estimated runway from the growth rate',
        'Found expensive writes before adding hardware',
        'Noted that read replicas do not fix write load',
        'Vertical scaling as a time-buyer, not the plan',
        'Moved write-heavy side data or partitioned',
        'Sharding with a justified key and a named tool'
      ]
    }
  ]
}
