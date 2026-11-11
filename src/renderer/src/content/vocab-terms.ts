/**
 * Concepts & terms deck for Review. One card per term: the learner sees `def`
 * and has to name the term, or sees the term and picks its definition.
 *
 * Rules for writing one:
 * - `def` must not contain the term itself (tests/vocab.test.ts checks).
 * - `unit` is where it is taught (concept unit u1–u9 or tools module t1–t13);
 *   the card joins the deck once that unit is reached.
 * - `aka` = other answers accepted when typing.
 */
export interface Term {
  id: string
  term: string
  aka?: string[]
  unit: string
  def: string
}

export const TERMS: Term[] = [
  // ── u1 Foundations ──
  { id: 'server', term: 'Server', unit: 'u1', def: 'A computer running a program that listens for requests on a network port and sends back responses.' },
  { id: 'client', term: 'Client', unit: 'u1', def: 'The browser or mobile app that sends requests and shows the responses to a person.' },
  { id: 'spof', term: 'Single point of failure', unit: 'u1', def: 'One component whose failure takes the whole system down, because nothing else can take over its work.' },
  { id: 'latency', term: 'Latency', unit: 'u1', def: 'How long one request takes from the moment it is sent until the response comes back.' },
  { id: 'throughput', term: 'Throughput', unit: 'u1', def: 'How much work a system finishes per unit of time, for example requests per second.' },
  { id: 'availability', term: 'Availability', unit: 'u1', def: 'The share of time a system is up and answering correctly, often written as "nines" like 99.9%.' },
  { id: 'scalability', term: 'Scalability', unit: 'u1', def: 'A system’s ability to handle more load by adding resources, without a redesign.' },
  { id: 'hld', term: 'High-level design', unit: 'u1', def: 'The big-picture view of a system: which boxes exist (servers, databases, caches, queues) and how requests flow between them.' },
  { id: 'lld', term: 'Low-level design', unit: 'u1', def: 'The inside of one component: its classes, interfaces, data structures and method signatures.' },
  { id: 'bottleneck', term: 'Bottleneck', unit: 'u1', def: 'The slowest or most limited part of a system, which caps how fast everything else can go.' },

  // ── u2 Requirements ──
  { id: 'fr', term: 'Functional requirement', unit: 'u2', def: 'Something the system must do for its users, such as "users can upload a photo".' },
  { id: 'nfr', term: 'Non-functional requirement', unit: 'u2', def: 'A quality the system must have rather than a feature: how fast, how available, how secure, how much load.' },
  { id: 'rw-ratio', term: 'Read/write ratio', aka: ['read write ratio', 'read-to-write ratio'], unit: 'u2', def: 'How many reads happen for every write. A high value suggests caching and read replicas.' },
  { id: 'estimate', term: 'Back-of-the-envelope estimate', aka: ['back of the envelope', 'capacity estimate'], unit: 'u2', def: 'A quick rough calculation of traffic, storage or bandwidth that tells you roughly what scale you are designing for.' },
  { id: 'peak', term: 'Peak traffic', aka: ['peak load'], unit: 'u2', def: 'The highest load a system sees, often several times the daily average, which is what capacity must be planned for.' },
  { id: 'strong-consistency', term: 'Strong consistency', unit: 'u2', def: 'Every read returns the most recent successful write, as if there were only one copy of the data.' },
  { id: 'eventual-consistency', term: 'Eventual consistency', unit: 'u2', def: 'Copies of the data may briefly disagree, but if writes stop they all converge on the same value.' },
  { id: 'durability', term: 'Durability', unit: 'u2', def: 'Once a write is confirmed, it survives crashes and restarts and is not lost.' },

  // ── u3 Architecture & scaling ──
  { id: 'monolith', term: 'Monolith', unit: 'u3', def: 'One codebase deployed as a single unit, where every feature runs in the same process.' },
  { id: 'microservices', term: 'Microservices', aka: ['microservice architecture'], unit: 'u3', def: 'An architecture of many small services, each owning its own data and deployed on its own, talking over the network.' },
  { id: 'modular-monolith', term: 'Modular monolith', unit: 'u3', def: 'A single deployable app with strict internal module boundaries, so parts can be split out later if needed.' },
  { id: 'vertical', term: 'Vertical scaling', aka: ['scaling up', 'scale up'], unit: 'u3', def: 'Handling more load by moving to a bigger machine with more CPU, memory or disk.' },
  { id: 'horizontal', term: 'Horizontal scaling', aka: ['scaling out', 'scale out'], unit: 'u3', def: 'Handling more load by adding more machines and spreading the work across them.' },

  // ── u4 Traffic ──
  { id: 'lb', term: 'Load balancer', unit: 'u4', def: 'A component that sits in front of a group of servers and spreads incoming requests across the healthy ones.' },
  { id: 'health-check', term: 'Health check', unit: 'u4', def: 'A periodic probe that tells the traffic distributor whether a server is fit to receive requests.' },
  { id: 'round-robin', term: 'Round robin', unit: 'u4', def: 'A distribution strategy that hands each new request to the next server in a fixed rotation.' },
  { id: 'least-conn', term: 'Least connections', unit: 'u4', def: 'A distribution strategy that sends each request to the server with the fewest active connections. Good when request durations vary.' },
  { id: 'sticky', term: 'Sticky sessions', aka: ['session affinity'], unit: 'u4', def: 'Pinning each user to the same backend server so in-memory session data keeps working. Uneven and fragile.' },
  { id: 'stateless', term: 'Stateless service', aka: ['stateless'], unit: 'u4', def: 'A server that keeps nothing between requests, so any copy can answer any request and copies can be added or killed freely.' },
  { id: 'stateful', term: 'Stateful service', aka: ['stateful'], unit: 'u4', def: 'A server that remembers data between requests, such as sessions in memory, so requests must reach the right copy.' },
  { id: 'reverse-proxy', term: 'Reverse proxy', unit: 'u4', def: 'A server that receives requests on behalf of backend servers and forwards them, often adding TLS, caching or routing.' },
  { id: 'session-store', term: 'Session store', unit: 'u4', def: 'A shared place (often Redis or a database) where login sessions live so every app server can read them.' },
  { id: 'draining', term: 'Connection draining', aka: ['draining', 'deregistration delay'], unit: 'u4', def: 'Letting a server finish its in-flight requests before it is removed from rotation, so nobody gets cut off.' },

  // ── u5 Data modeling ──
  { id: 'access-pattern', term: 'Access pattern', unit: 'u5', def: 'A specific way the app reads or writes data, such as "get the 20 newest posts for a user". The schema should follow these.' },
  { id: 'relational', term: 'Relational database', aka: ['SQL database'], unit: 'u5', def: 'A database that stores data in tables of rows and columns, linked by keys, queried with joins and protected by transactions.' },
  { id: 'document-db', term: 'Document database', aka: ['document store'], unit: 'u5', def: 'A NoSQL database that stores each record as a self-contained JSON-like object with nested fields.' },
  { id: 'kv-store', term: 'Key-value store', unit: 'u5', def: 'The simplest kind of NoSQL database: look a value up by its exact key, very fast, with little or no querying beyond that.' },
  { id: 'wide-column', term: 'Wide-column store', aka: ['wide column database'], unit: 'u5', def: 'A NoSQL database (like Cassandra) that groups rows by a partition key and sorts them within it, built for huge write volumes.' },
  { id: 'schema', term: 'Schema', unit: 'u5', def: 'The defined structure of the data: which tables or collections exist, their fields, types and constraints.' },
  { id: 'normalization', term: 'Normalization', unit: 'u5', def: 'Storing each fact in exactly one place and linking to it by key, which avoids duplicate data getting out of sync.' },
  { id: 'denormalization', term: 'Denormalization', unit: 'u5', def: 'Deliberately copying data into several places so common reads need no joins, at the cost of more work on writes.' },
  { id: 'transaction', term: 'Transaction', unit: 'u5', def: 'A group of database writes that either all happen or none happen, even if something crashes halfway.' },
  { id: 'join', term: 'Join', unit: 'u5', def: 'Combining rows from two tables in one query by matching a shared key, such as orders with their customers.' },

  // ── u6 Indexes ──
  { id: 'index', term: 'Index', aka: ['database index'], unit: 'u6', def: 'A separate sorted structure that lets the database find rows by a column without reading the whole table. Speeds reads, slows writes.' },
  { id: 'btree', term: 'B-tree', aka: ['btree', 'b+ tree'], unit: 'u6', def: 'The balanced, sorted tree structure most databases use for indexes, good for both exact lookups and ranges.' },
  { id: 'composite-index', term: 'Composite index', aka: ['compound index', 'multi-column index'], unit: 'u6', def: 'An index over several columns in a set order. It helps queries that filter on its leftmost columns.' },
  { id: 'full-scan', term: 'Full table scan', aka: ['sequential scan', 'seq scan', 'table scan'], unit: 'u6', def: 'Reading every row of a table to answer a query, because no usable index exists.' },
  { id: 'covering-index', term: 'Covering index', unit: 'u6', def: 'An index that contains every column a query needs, so the database never has to visit the table itself.' },
  { id: 'query-plan', term: 'Query plan', aka: ['execution plan'], unit: 'u6', def: 'The step-by-step strategy the database picks to run a query, such as which index to use. Shown by EXPLAIN.' },
  { id: 'selectivity', term: 'Selectivity', unit: 'u6', def: 'How few rows a filter matches. The fewer rows it matches, the more an index on that column helps.' },

  // ── u7 Caching ──
  { id: 'cache-hit', term: 'Cache hit', unit: 'u7', def: 'The requested data was already in the fast store, so it is returned without touching the database.' },
  { id: 'cache-miss', term: 'Cache miss', unit: 'u7', def: 'The requested data was not in the fast store, so it has to be fetched from the slower source of truth.' },
  { id: 'cache-aside', term: 'Cache-aside', aka: ['lazy loading', 'cache aside'], unit: 'u7', def: 'The app checks the cache first; on a miss it reads the database and puts the result in the cache itself.' },
  { id: 'write-through', term: 'Write-through', aka: ['write through'], unit: 'u7', def: 'Every write goes to the cache and the database at the same time, so the cache is never stale but writes are slower.' },
  { id: 'write-behind', term: 'Write-behind', aka: ['write-back', 'write behind', 'write back'], unit: 'u7', def: 'Writes land in the cache first and are flushed to the database later. Fast, but data can be lost if the cache dies.' },
  { id: 'eviction', term: 'Eviction', unit: 'u7', def: 'Removing entries from a full cache to make room for new ones, chosen by a policy such as least recently used.' },
  { id: 'invalidation', term: 'Cache invalidation', unit: 'u7', def: 'Removing or updating a cached value when the underlying data changes, so readers do not see stale data.' },
  { id: 'stampede', term: 'Cache stampede', aka: ['thundering herd', 'dogpile'], unit: 'u7', def: 'A popular cached entry expires and many requests hit the database at once to rebuild it.' },
  { id: 'hot-key', term: 'Hot key', unit: 'u7', def: 'One key that gets a huge share of traffic (a celebrity’s profile), overloading the single node that holds it.' },
  { id: 'stale', term: 'Stale data', aka: ['stale read'], unit: 'u7', def: 'A copy of data that is out of date because the original has changed since it was copied.' },

  // ── u8 Replication & sharding ──
  { id: 'replication', term: 'Replication', unit: 'u8', def: 'Keeping live copies of the same data on several machines, for read scaling and for surviving a machine failure.' },
  { id: 'primary', term: 'Primary', aka: ['leader', 'master', 'primary node'], unit: 'u8', def: 'The one database node that accepts writes and streams its changes to the copies.' },
  { id: 'replica', term: 'Read replica', aka: ['replica', 'follower', 'secondary'], unit: 'u8', def: 'A copy of the database that applies the main node’s changes and serves read traffic.' },
  { id: 'lag', term: 'Replication lag', unit: 'u8', def: 'The delay between a write landing on the main node and it showing up on the copies.' },
  { id: 'failover', term: 'Failover', unit: 'u8', def: 'Promoting a copy to take over when the main database node dies, and pointing traffic at it.' },
  { id: 'sharding', term: 'Sharding', aka: ['partitioning', 'horizontal partitioning'], unit: 'u8', def: 'Splitting one dataset across several databases by key, so each holds only part of the data and part of the writes.' },
  { id: 'shard-key', term: 'Shard key', aka: ['partition key'], unit: 'u8', def: 'The field used to decide which piece of a split dataset a row lives on. A bad choice creates hotspots.' },
  { id: 'consistent-hashing', term: 'Consistent hashing', unit: 'u8', def: 'Placing nodes and keys on a ring so that adding or removing a node moves only a small share of the keys.' },
  { id: 'quorum', term: 'Quorum', unit: 'u8', def: 'The minimum number of replicas that must agree for a read or write to count. With W + R > N, reads see the latest write.' },
  { id: 'split-brain', term: 'Split brain', unit: 'u8', def: 'Two nodes both believe they are the leader after a network split and accept conflicting writes.' },
  { id: 'ryw', term: 'Read-your-writes', aka: ['read your writes', 'read-after-write consistency'], unit: 'u8', def: 'A guarantee that after you save something, your own next read shows it, even if other users might briefly see older data.' },

  // ── u9 Capstone ──
  { id: 'rate-limiting', term: 'Rate limiting', aka: ['rate limiter', 'throttling'], unit: 'u9', def: 'Capping how many requests a client may make in a time window, to protect the system from abuse and overload.' },
  { id: 'base62', term: 'Base62 encoding', aka: ['base62'], unit: 'u9', def: 'Turning a number into a short string using 0–9, a–z and A–Z, as used for short links.' },

  // ── t1 Cloud ──
  { id: 'region', term: 'Region', aka: ['cloud region'], unit: 't1', def: 'A geographic area where a cloud provider runs a cluster of data centers, such as us-east-1.' },
  { id: 'object-storage', term: 'Object storage', unit: 't1', def: 'Storage for whole files (objects) addressed by key over HTTP, nearly unlimited and very durable, like S3.' },
  { id: 'bucket', term: 'Bucket', unit: 't1', def: 'A named top-level container for files in object storage, with its own access rules.' },
  { id: 'least-privilege', term: 'Least privilege', aka: ['principle of least privilege'], unit: 't1', def: 'Giving every person and service only the permissions it actually needs, and nothing more.' },
  { id: 'iam-role', term: 'Role', aka: ['IAM role'], unit: 't1', def: 'A set of permissions that a service or person can temporarily take on, instead of using long-lived keys.' },
  { id: 'presigned-url', term: 'Presigned URL', aka: ['signed URL', 'pre-signed URL'], unit: 't1', def: 'A time-limited link that lets a browser upload or download one private file directly, without your server in the middle.' },

  // ── t2 Containers ──
  { id: 'container', term: 'Container', unit: 't2', def: 'A packaged app plus everything it needs to run, isolated from other processes but sharing the host’s kernel.' },
  { id: 'image', term: 'Container image', aka: ['image', 'docker image'], unit: 't2', def: 'The read-only template a container starts from, built in stacked layers from a recipe file.' },
  { id: 'layer', term: 'Image layer', aka: ['layer'], unit: 't2', def: 'One cached step of an image build. Ordering steps so rarely-changing ones come first makes rebuilds fast.' },
  { id: 'dockerfile', term: 'Dockerfile', unit: 't2', def: 'A text recipe of build steps (base image, copy files, install, start command) that produces a container image.' },
  { id: 'registry', term: 'Container registry', aka: ['registry', 'image registry'], unit: 't2', def: 'A server that stores and serves container images, such as Docker Hub, so clusters can pull them.' },
  { id: 'compose', term: 'Docker Compose', aka: ['compose'], unit: 't2', def: 'A tool that starts several containers together (app, database, cache) from one YAML file, mostly for local development.' },

  // ── t3 Orchestration ──
  { id: 'pod', term: 'Pod', unit: 't3', def: 'The smallest unit Kubernetes runs: one or more containers that share a network address and storage.' },
  { id: 'k8s-deployment', term: 'Deployment', aka: ['kubernetes deployment'], unit: 't3', def: 'A Kubernetes object that keeps a set number of identical pods running and rolls out new versions gradually.' },
  { id: 'k8s-service', term: 'Service', aka: ['kubernetes service'], unit: 't3', def: 'A Kubernetes object that gives a changing set of pods one stable name and address, and spreads traffic across them.' },
  { id: 'readiness', term: 'Readiness probe', unit: 't3', def: 'A Kubernetes check that decides whether a pod should receive traffic yet. Failing it removes the pod from rotation without restarting it.' },
  { id: 'liveness', term: 'Liveness probe', unit: 't3', def: 'A Kubernetes check that decides whether a container is stuck. Failing it makes Kubernetes restart the container.' },
  { id: 'rolling-update', term: 'Rolling update', aka: ['rolling deployment'], unit: 't3', def: 'Replacing old copies of an app with new ones a few at a time, so it stays available throughout the release.' },
  { id: 'autoscaling', term: 'Autoscaling', aka: ['autoscaler', 'auto scaling'], unit: 't3', def: 'Automatically adding or removing copies of a service based on load, such as CPU use or queue length.' },
  { id: 'serverless', term: 'Serverless function', aka: ['serverless', 'function as a service', 'faas'], unit: 't3', def: 'Code the cloud runs only when an event arrives, billed per call, with no servers for you to manage.' },
  { id: 'cold-start', term: 'Cold start', unit: 't3', def: 'The extra delay when a function or container has to be started from scratch before it can handle a request.' },

  // ── t4 Traffic tools ──
  { id: 'listener', term: 'Listener', unit: 't4', def: 'The port and protocol a cloud load balancer accepts traffic on, such as HTTPS on 443, where TLS is terminated.' },
  { id: 'target-group', term: 'Target group', unit: 't4', def: 'The set of backends (instances, IP addresses or functions) a cloud load balancer sends traffic to, plus their health check.' },
  { id: 'dns-record', term: 'DNS record', aka: ['dns entry'], unit: 't4', def: 'One entry in a domain’s zone file that maps a hostname to an IP address or to another hostname.' },
  { id: 'alias-record', term: 'Alias record', aka: ['alias'], unit: 't4', def: 'A Route 53 record that points a name at an AWS resource, works at the bare domain and follows the resource’s IP changes.' },
  { id: 'api-gateway', term: 'API gateway', aka: ['gateway'], unit: 't4', def: 'The single front door for many backend services, handling routing, auth, rate limits and request shaping.' },
  { id: 'tls-termination', term: 'TLS termination', aka: ['ssl termination'], unit: 't4', def: 'Decrypting HTTPS traffic at the edge (usually the load balancer) so backends can talk plain HTTP inside the network.' },

  // ── t5 Auth ──
  { id: 'session-cookie', term: 'Session cookie', unit: 't5', def: 'A browser cookie holding a random ID that the server looks up in its store to find who is logged in.' },
  { id: 'access-token', term: 'Access token', unit: 't5', def: 'A short-lived credential sent with each API call to prove what the caller is allowed to do.' },
  { id: 'refresh-token', term: 'Refresh token', unit: 't5', def: 'A long-lived credential used only to get new short-lived tokens, so users stay logged in without re-entering a password.' },
  { id: 'oauth', term: 'OAuth 2.0', aka: ['oauth', 'oauth2'], unit: 't5', def: 'The standard for letting an app act on a user’s behalf by getting a token from an authorization server, without seeing their password.' },
  { id: 'auth-code', term: 'Authorization code flow', aka: ['authorization code grant', 'auth code flow'], unit: 't5', def: 'The login flow where the browser is redirected back with a one-time code that the app swaps for tokens.' },
  { id: 'idp', term: 'Identity provider', aka: ['idp'], unit: 't5', def: 'The service that actually checks who a user is (Okta, Google, Entra ID) and vouches for them to other apps.' },
  { id: 'authn-authz', term: 'Authorization', aka: ['authz'], unit: 't5', def: 'Deciding what an already-identified user is allowed to do, as opposed to checking who they are.' },
  { id: 'authentication', term: 'Authentication', aka: ['authn'], unit: 't5', def: 'Checking who a user is, for example with a password, passkey or one-time code.' },

  // ── t6 Postgres ──
  { id: 'foreign-key', term: 'Foreign key', unit: 't6', def: 'A column that must match a row in another table, so the database refuses orphaned references.' },
  { id: 'isolation-level', term: 'Isolation level', unit: 't6', def: 'How much concurrent transactions can see of each other’s unfinished work, from read committed up to serializable.' },
  { id: 'pooler', term: 'Connection pooler', aka: ['connection pool', 'pooler', 'pgbouncer'], unit: 't6', def: 'A layer that keeps a few database connections open and shares them among many app requests, since each Postgres connection is costly.' },
  { id: 'migration', term: 'Schema migration', aka: ['migration'], unit: 't6', def: 'A versioned script that changes the database structure, such as adding a column, applied in order across environments.' },
  { id: 'backfill', term: 'Backfill', unit: 't6', def: 'Filling a new column or table with values for existing rows, usually in small batches to avoid locking production.' },

  // ── t7 NoSQL ──
  { id: 'sort-key', term: 'Sort key', aka: ['range key'], unit: 't7', def: 'In DynamoDB, the second part of the key that orders items within one partition, enabling range queries like "newest first".' },
  { id: 'item-collection', term: 'Item collection', unit: 't7', def: 'All DynamoDB items that share the same partition key, stored together and fetched with one query.' },
  { id: 'hot-partition', term: 'Hot partition', unit: 't7', def: 'One slice of a partitioned table receiving far more traffic than the others, so it gets throttled while the rest sit idle.' },
  { id: 'single-table', term: 'Single-table design', aka: ['single table design'], unit: 't7', def: 'Storing many entity types in one DynamoDB table with generic keys, shaped around the access patterns.' },
  { id: 'tunable-consistency', term: 'Tunable consistency', unit: 't7', def: 'Choosing per query how many replicas must answer (ONE, QUORUM, ALL), trading speed for freshness, as in Cassandra.' },

  // ── t8 Search ──
  { id: 'inverted-index', term: 'Inverted index', unit: 't8', def: 'A map from each word to the list of documents that contain it, the structure that makes full-text search fast.' },
  { id: 'analyzer', term: 'Analyzer', aka: ['tokenizer', 'text analysis'], unit: 't8', def: 'The step that breaks text into searchable tokens: splitting words, lowercasing, removing stop words and stemming.' },
  { id: 'relevance', term: 'Relevance score', aka: ['relevance', 'score'], unit: 't8', def: 'A number a search engine gives each match to rank results, based on things like term frequency and rarity (BM25).' },
  { id: 'fuzzy', term: 'Fuzzy matching', aka: ['fuzzy search', 'fuzziness'], unit: 't8', def: 'Matching words that are a small number of edits away, so typos like "iphnoe" still find results.' },
  { id: 'autocomplete', term: 'Autocomplete', aka: ['search-as-you-type', 'typeahead', 'prefix search'], unit: 't8', def: 'Suggesting results from the first few letters a user types, refreshed on each keystroke.' },

  // ── t9 Redis & CDN ──
  { id: 'sorted-set', term: 'Sorted set', aka: ['zset'], unit: 't9', def: 'A Redis structure of unique members, each with a score, kept in order. Perfect for leaderboards and time windows.' },
  { id: 'dist-lock', term: 'Distributed lock', unit: 't9', def: 'A lock held in a shared store, with an expiry, so only one of many servers does a piece of work at a time.' },
  { id: 'token-bucket', term: 'Token bucket', unit: 't9', def: 'A rate-limiting algorithm: tokens refill at a steady rate, each request spends one, and bursts are allowed up to the bucket size.' },
  { id: 'cache-control', term: 'Cache-Control header', aka: ['cache-control', 'cache control'], unit: 't9', def: 'The HTTP response header that tells browsers and CDNs whether and how long they may keep a response.' },
  { id: 'origin', term: 'Origin', aka: ['origin server'], unit: 't9', def: 'The real backend a CDN fetches from when it does not have a fresh copy at the edge.' },
  { id: 'edge', term: 'Edge location', aka: ['edge', 'point of presence', 'pop'], unit: 't9', def: 'A CDN data center close to users, where copies of content are kept to cut latency.' },

  // ── t10 Messaging ──
  { id: 'queue', term: 'Message queue', aka: ['queue'], unit: 't10', def: 'A buffer where producers drop jobs and workers pick them up later, each job handled by one worker.' },
  { id: 'pubsub', term: 'Publish/subscribe', aka: ['pub/sub', 'pubsub', 'fan-out'], unit: 't10', def: 'A messaging style where each message is delivered to every interested subscriber, not just one worker.' },
  { id: 'topic', term: 'Topic', unit: 't10', def: 'A named stream of events in Kafka that producers write to and consumers read from.' },
  { id: 'partition', term: 'Partition', aka: ['kafka partition'], unit: 't10', def: 'An ordered, append-only slice of a Kafka stream. Ordering is guaranteed only inside one of these.' },
  { id: 'offset', term: 'Offset', unit: 't10', def: 'A message’s position number within a Kafka partition. Consumers save it to remember how far they have read.' },
  { id: 'consumer-group', term: 'Consumer group', unit: 't10', def: 'A set of Kafka readers that split a topic’s partitions between them, so each message is handled once per set.' },
  { id: 'at-least-once', term: 'At-least-once delivery', aka: ['at least once'], unit: 't10', def: 'A delivery promise that no message is lost, but some may arrive more than once, so handlers must cope with duplicates.' },
  { id: 'idempotency', term: 'Idempotency', aka: ['idempotent'], unit: 't10', def: 'Doing the same operation twice has the same effect as doing it once, which makes retries safe.' },
  { id: 'outbox', term: 'Outbox pattern', aka: ['transactional outbox', 'outbox'], unit: 't10', def: 'Writing an event into a table in the same transaction as the business change, then publishing it from there, so the two never disagree.' },
  { id: 'visibility-timeout', term: 'Visibility timeout', unit: 't10', def: 'In SQS, how long a received message stays hidden from other workers. If not deleted in time, it reappears for a retry.' },
  { id: 'backpressure', term: 'Backpressure', aka: ['back pressure'], unit: 't10', def: 'Slowing producers down when consumers can’t keep up, instead of letting work pile up without limit.' },

  // ── t11 Scaling data ──
  { id: 'sync-rep', term: 'Synchronous replication', unit: 't11', def: 'The main node waits for a copy to confirm before acknowledging a write. No data loss on failover, but slower writes.' },
  { id: 'async-rep', term: 'Asynchronous replication', unit: 't11', def: 'The main node acknowledges writes immediately and ships them to copies afterwards. Fast, but recent writes can be lost on failover.' },
  { id: 'distributed-sql', term: 'Distributed SQL', aka: ['newsql'], unit: 't11', def: 'Databases like CockroachDB and Spanner that keep SQL and transactions while splitting data across many nodes automatically.' },
  { id: 'resharding', term: 'Resharding', aka: ['rebalancing'], unit: 't11', def: 'Moving data between pieces of a split database when you add capacity or a piece gets too hot.' },

  // ── t12 Shipping ──
  { id: 'pipeline', term: 'Pipeline', aka: ['ci pipeline', 'build pipeline'], unit: 't12', def: 'The automated sequence that runs on every change: build, test, scan, then deploy.' },
  { id: 'blue-green', term: 'Blue-green deployment', aka: ['blue green'], unit: 't12', def: 'Running the new version beside the old one and switching all traffic at once, with an instant switch back if needed.' },
  { id: 'canary', term: 'Canary release', aka: ['canary', 'canary deployment'], unit: 't12', def: 'Sending a small share of traffic to the new version first and watching its metrics before rolling it out to everyone.' },
  { id: 'gitops', term: 'GitOps', unit: 't12', def: 'Keeping the desired state of your clusters in a Git repo and letting an agent continuously make reality match it.' },
  { id: 'iac', term: 'Infrastructure as code', aka: ['iac'], unit: 't12', def: 'Defining servers, networks and databases in versioned config files (like Terraform) instead of clicking in a console.' },
  { id: 'feature-flag', term: 'Feature flag', aka: ['feature toggle', 'flag'], unit: 't12', def: 'A runtime switch that turns code paths on or off for some or all users without a new deploy.' },
  { id: 'rollback', term: 'Rollback', unit: 't12', def: 'Returning production to the last known good version after a bad release.' },

  // ── t13 Operating ──
  { id: 'metric', term: 'Metric', aka: ['metrics'], unit: 't13', def: 'A number measured over time, such as request rate or memory use, cheap to store and good for dashboards and alerts.' },
  { id: 'trace', term: 'Distributed trace', aka: ['trace', 'tracing'], unit: 't13', def: 'The record of one request’s path through every service it touched, with timings for each step.' },
  { id: 'span', term: 'Span', unit: 't13', def: 'One timed operation inside a request’s end-to-end record, such as a single database call.' },
  { id: 'structured-log', term: 'Structured logging', aka: ['structured logs', 'structured log'], unit: 't13', def: 'Writing log lines as key-value data (usually JSON) instead of free text, so they can be searched and filtered.' },
  { id: 'p99', term: 'p99 latency', aka: ['p99', '99th percentile', 'tail latency'], unit: 't13', def: 'The response time that 99% of requests beat. It shows what your slowest users experience, which averages hide.' },
  { id: 'error-budget', term: 'Error budget', unit: 't13', def: 'The amount of unreliability an objective allows (0.1% for 99.9%). While it lasts you ship; when it runs out you fix.' },
  { id: 'alert-fatigue', term: 'Alert fatigue', unit: 't13', def: 'So many noisy, unactionable pages that on-call engineers start ignoring them, including the real ones.' },
  { id: 'runbook', term: 'Runbook', aka: ['playbook'], unit: 't13', def: 'A written step-by-step guide for handling a specific alert or incident.' },
  { id: 'postmortem', term: 'Postmortem', aka: ['post-mortem', 'incident review', 'retrospective'], unit: 't13', def: 'A blameless write-up after an incident: what happened, why, and what will change so it does not happen again.' }
]
