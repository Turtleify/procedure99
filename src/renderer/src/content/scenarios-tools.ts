import type { Scenario } from '../../../shared/types'

/** Tool-specific Arena / Daily Incident scenarios (Tools track). Exactly one option per scenario is correct. */
export const TOOL_SCENARIOS: Scenario[] = [
  // ── u1
  {
    id: 'tool-s3-public-bucket',
    unit: 'u1',
    title: 'The bucket anyone can read',
    prompt: 'A security scanner flags that your S3 bucket of customer invoices has a bucket policy granting s3:GetObject to "Principal": "*". Anyone with a URL can download any invoice.',
    options: [
      { text: 'Turn on S3 server access logging', why: 'Logging tells you who downloaded what. It doesn’t stop anyone.' },
      { text: 'Rename the bucket to something random and unguessable', why: 'Security by obscurity. Old URLs and leaked links still work against the new name once found.' },
      { text: 'Remove the public policy, enable S3 Block Public Access (bucket and account level), and serve files via signed URLs or CloudFront with OAC', correct: true, why: 'Block Public Access overrides any future public policy or ACL, and signed URLs or OAC give controlled access.' },
      { text: 'Enable versioning on the bucket', why: 'Versioning protects against overwrites and deletes, not against public reads.' }
    ]
  },
  {
    id: 'tool-rds-pitr',
    unit: 'u1',
    title: 'DROP TABLE on RDS',
    prompt: 'Someone dropped the invoices table on your RDS Postgres instance at 14:02. Automated backups are on with 7-day retention, and there’s one read replica.',
    options: [
      { text: 'Promote the read replica', why: 'The DROP replicated to it within seconds. The table is gone there too.' },
      { text: 'Use point-in-time restore to 14:01. RDS creates a new instance, so copy the table back from it (or repoint the app)', correct: true, why: 'RDS PITR always restores into a new DB instance. You then recover the data from that instance.' },
      { text: 'Run point-in-time restore in place on the existing instance', why: 'RDS has no in-place restore. Restores always create a new instance.' },
      { text: 'Restore last night’s automated snapshot over the current instance', why: 'Snapshots also restore to a new instance, and you’d lose everything since the snapshot.' }
    ]
  },
  // ── u3
  {
    id: 'tool-sqs-double-process',
    unit: 'u3',
    title: 'Every SQS job runs twice',
    prompt: 'Your SQS worker takes about 90 seconds to process each video job. Customers are getting charged twice, and logs show a second worker picking up the same message while the first is still running. The queue uses the default visibility timeout.',
    options: [
      { text: 'Switch to a FIFO queue', why: 'FIFO deduplicates sends, but a message still reappears if it isn’t deleted before its visibility timeout ends.' },
      { text: 'Enable long polling with WaitTimeSeconds', why: 'Long polling cuts empty receives. It doesn’t change when an in-flight message becomes visible again.' },
      { text: 'Add a dead-letter queue with maxReceiveCount = 1', why: 'That moves the job to the DLQ on the second receive instead of fixing why it was redelivered.' },
      { text: 'Raise the visibility timeout above the worst-case processing time (or extend it with ChangeMessageVisibility), and make the handler idempotent', correct: true, why: 'The default is 30 seconds, so the message reappears mid-job. A longer timeout plus idempotency stops the double charge.' }
    ]
  },
  {
    id: 'tool-k8s-liveness-cascade',
    unit: 'u3',
    title: 'Kubernetes kills every pod',
    prompt: 'Your database got slow for two minutes. During that window Kubernetes restarted every API pod over and over, turning a slowdown into a full outage. The liveness probe calls /health, which runs a query against the database.',
    options: [
      { text: 'Make liveness check only the process itself, and put dependency checks (if any) in the readiness probe', correct: true, why: 'A failed liveness probe restarts the container. Restarting can’t fix a slow database, so liveness should only detect a stuck process.' },
      { text: 'Add a startupProbe', why: 'A startup probe only covers the boot phase. Liveness takes over afterwards and still restarts the pods.' },
      { text: 'Double the number of replicas', why: 'Every replica runs the same probe against the same slow database. You just get more restarts.' },
      { text: 'Set restartPolicy: Never on the Deployment', why: 'Deployments only allow restartPolicy: Always, and you do want crashed pods restarted.' }
    ]
  },
  {
    id: 'tool-apigw-lambda-timeout',
    unit: 'u3',
    title: '504 but the Lambda succeeded',
    prompt: 'A report endpoint is API Gateway (REST) → Lambda. The Lambda timeout is 5 minutes and logs show reports finishing in about 45 seconds, but clients always get a 504 around the 29-second mark.',
    options: [
      { text: 'Raise the Lambda timeout to 15 minutes', why: 'The Lambda isn’t timing out. API Gateway’s integration timeout is what cuts the request off.' },
      { text: 'Enable provisioned concurrency', why: 'That removes cold starts, which add a second or two at most. The 45-second job still exceeds the limit.' },
      { text: 'Return 202 with a job ID, run the report asynchronously (SQS or Step Functions), and let the client poll or get notified', correct: true, why: 'API Gateway’s integration timeout (29 seconds by default) caps synchronous requests. Long work belongs off the request path.' },
      { text: 'Give the Lambda more memory', why: 'It might shave some seconds, but it doesn’t remove the timeout and breaks again when reports grow.' }
    ]
  },
  {
    id: 'tool-pg-serverless-connections',
    unit: 'u3',
    title: 'Too many clients already',
    prompt: 'After a marketing push, your Lambda functions start failing with Postgres "FATAL: sorry, too many clients already". Each concurrent Lambda instance opens its own connection, and concurrency spiked to 2,000.',
    options: [
      { text: 'Set max_connections to 5000', why: 'Every Postgres connection is a backend process with its own memory. Thousands of them hurt performance or crash the server.' },
      { text: 'Put a connection pooler in front, such as RDS Proxy or PgBouncer, so many function instances share a few database connections', correct: true, why: 'Poolers multiplex short-lived serverless clients onto a small, stable set of real connections.' },
      { text: 'Add read replicas', why: 'Writes still go to the primary, and each replica has its own connection limit.' },
      { text: 'Open and close a new connection inside every handler call', why: 'Connection churn costs more, and 2,000 concurrent handlers still need 2,000 connections at once.' }
    ]
  },
  // ── u4
  {
    id: 'tool-nginx-504',
    unit: 'u4',
    title: 'Nginx gives up at 60s',
    prompt: 'A CSV export takes about 90 seconds. Users get "504 Gateway Timeout" from Nginx at exactly 60 seconds, even though app logs show the export finishing.',
    options: [
      { text: 'Raise client_max_body_size', why: 'That limits request upload size and produces a 413, not a 504.' },
      { text: 'Raise keepalive_timeout', why: 'That controls idle client keep-alive connections, not how long Nginx waits for the upstream.' },
      { text: 'Increase worker_connections', why: 'That raises concurrency limits. This request isn’t being refused; it’s timing out.' },
      { text: 'Raise proxy_read_timeout for that location (or better, make the export async)', correct: true, why: 'proxy_read_timeout defaults to 60s. Nginx gives up waiting for the upstream response and returns 504.' }
    ]
  },
  {
    id: 'tool-cdn-stale-html',
    unit: 'u4',
    title: 'Deployed, but nobody sees it',
    prompt: 'You deployed a new frontend an hour ago. Some users still get the old site, and some get a blank page because the old index.html references JS bundles you deleted. Everything is served through a CDN with Cache-Control: max-age=86400 on all files.',
    options: [
      { text: 'Give index.html a short TTL or no-cache, give hashed assets long immutable caching, keep old bundles for a while, and invalidate HTML on deploy', correct: true, why: 'HTML is the entry point and must revalidate. Content-hashed bundles can be cached forever because their names change.' },
      { text: 'Turn off the CDN', why: 'This fixes staleness by throwing away global caching and origin protection.' },
      { text: 'Tell users to hard-refresh', why: 'The stale copy is on CDN edges too, not just in browsers. And you can’t reach every user.' },
      { text: 'Rename index.html on every deploy', why: 'Users reach the site at “/”, which still maps to whatever the CDN has cached.' }
    ]
  },
  {
    id: 'tool-jwt-revocation',
    unit: 'u4',
    title: 'Leaked JWT signing key',
    prompt: 'Your HS256 JWT signing secret was committed to a public repo. Access tokens are valid for 7 days and your API verifies them statelessly, with no session lookup.',
    options: [
      { text: 'Clear the sessions table', why: 'Stateless JWTs aren’t stored there. The API never checks it, so the tokens stay valid.' },
      { text: 'Force every user to reset their password', why: 'Tokens already issued (or forged with the leaked key) stay valid until they expire.' },
      { text: 'Lower the token lifetime setting to 15 minutes', why: 'Existing tokens carry their own exp claim. Attackers can also mint new tokens with any exp they like.' },
      { text: 'Rotate the signing key right away (everyone signs in again), then move to short-lived access tokens with revocable refresh tokens', correct: true, why: 'A new key makes every forged or stolen token fail verification. Short-lived tokens shrink the damage next time.' }
    ]
  },
  // ── u5
  {
    id: 'tool-dynamo-hot-partition',
    unit: 'u5',
    title: 'Throttled at 10% capacity',
    prompt: 'Your DynamoDB orders table uses status ("PENDING", "SHIPPED", "DONE") as its partition key. Writes are being throttled even though CloudWatch shows the table using a small fraction of its provisioned capacity.',
    options: [
      { text: 'Raise provisioned WCU', why: 'Capacity spreads across partitions, but all PENDING writes still hit one partition’s limit.' },
      { text: 'Use a high-cardinality partition key such as orderId (or add a random suffix to spread writes)', correct: true, why: 'Three key values means at most three hot partitions. Many distinct keys spread the load evenly.' },
      { text: 'Switch the table to on-demand mode', why: 'On-demand still has per-partition throughput limits, so one hot key still throttles.' },
      { text: 'Add a GSI keyed on status', why: 'The GSI has the same three-value key, so it gets hot partitions too and can throttle the base table.' }
    ]
  },
  {
    id: 'tool-dynamo-scan-filter',
    unit: 'u5',
    title: 'The $4,000 Scan',
    prompt: 'The "my orders" page runs a DynamoDB Scan with FilterExpression customerId = :c on a 200 GB table. It’s slow and your read bill has exploded, even though each call returns only a handful of items.',
    options: [
      { text: 'Add a ProjectionExpression to return fewer attributes', why: 'Read capacity is charged on the items read, before projection. The cost barely changes.' },
      { text: 'Use parallel Scan with more segments', why: 'Faster, but it reads the whole table even quicker and burns capacity faster.' },
      { text: 'Use eventually consistent reads', why: 'That halves the per-read cost, but you still read all 200 GB every time.' },
      { text: 'Add a GSI with customerId as the partition key and Query it', correct: true, why: 'FilterExpression is applied after items are read and charged. A Query on the right key reads only that customer’s items.' }
    ]
  },
  {
    id: 'tool-mongo-16mb',
    unit: 'u5',
    title: 'The viral post stops saving',
    prompt: 'Your MongoDB posts collection embeds every comment in a comments array inside the post document. A post goes viral and new comments start failing because the document has grown too large.',
    options: [
      { text: 'Raise MongoDB’s maximum document size in config', why: 'The 16 MB BSON document limit is fixed and can’t be configured.' },
      { text: 'Shard the posts collection', why: 'Sharding splits documents across servers. One document still has to fit the 16 MB limit.' },
      { text: 'Move comments to their own collection referencing postId (or use the bucket pattern), indexed for paging', correct: true, why: 'Unbounded arrays are a MongoDB anti-pattern. Separate documents grow without limit and page efficiently.' },
      { text: 'Store comments in GridFS', why: 'GridFS is for large binary files. You lose querying and paging of individual comments.' }
    ]
  },
  // ── u6
  {
    id: 'tool-es-refresh',
    unit: 'u6',
    title: 'Indexed, but not searchable',
    prompt: 'A test indexes a product into Elasticsearch and immediately searches for it: zero hits. A GET by the document’s ID right after returns it fine. In production, a newly created listing sometimes doesn’t show up in search for a second.',
    options: [
      { text: 'Add more replica shards', why: 'Replicas add redundancy and read throughput. They don’t make new documents searchable any sooner.' },
      { text: 'This is near-real-time search: new docs become searchable after the next refresh. In tests, index with refresh=wait_for', correct: true, why: 'Search sees only refreshed segments (refresh_interval defaults to 1s). GET by ID reads real-time, which is why it works.' },
      { text: 'Set refresh_interval to -1', why: 'That disables periodic refresh, so new docs never show up in search until an explicit refresh.' },
      { text: 'Switch the search from match to term', why: 'The query type doesn’t matter. The document isn’t in a searchable segment yet.' }
    ]
  },
  {
    id: 'tool-es-text-keyword',
    unit: 'u6',
    title: 'The term query finds nothing',
    prompt: 'Documents clearly have status: "In Progress", but a term query for "In Progress" on the status field returns nothing. The index used dynamic mapping.',
    options: [
      { text: 'Query status.keyword (or map status as keyword), because the text field was analyzed into lowercase tokens', correct: true, why: 'Dynamic mapping makes strings text with a .keyword subfield. term doesn’t analyze its input, so it only matches the exact keyword value.' },
      { text: 'Increase index.max_result_window', why: 'That limits deep paging. Here zero documents match.' },
      { text: 'Use a wildcard query *In Progress*', why: 'It’s slow and still runs against tokens like "in" and "progress", so the exact phrase with a capital and a space won’t match.' },
      { text: 'Reindex into more primary shards', why: 'Shard count affects scale, not how the field was analyzed.' }
    ]
  },
  // ── u7
  {
    id: 'tool-redis-noeviction',
    unit: 'u7',
    title: 'Redis refuses all writes',
    prompt: 'Your Redis cache hit maxmemory and every SET now fails with "OOM command not allowed when used memory > \'maxmemory\'". Reads still work. maxmemory-policy was never changed from its default.',
    options: [
      { text: 'Enable AOF persistence', why: 'Persistence is about durability. It frees no memory.' },
      { text: 'Add a read replica', why: 'Replicas copy the full dataset and hit the same limit. Writes still go to the full primary.' },
      { text: 'Disable RDB snapshots', why: 'Fork overhead is temporary. The dataset itself still fills maxmemory.' },
      { text: 'Set maxmemory-policy to allkeys-lru (or allkeys-lfu) and give cache keys TTLs', correct: true, why: 'The default policy is noeviction, which rejects writes when memory is full. A cache should evict old keys instead.' }
    ]
  },
  {
    id: 'tool-redis-keys',
    unit: 'u7',
    title: 'One command froze Redis',
    prompt: 'An engineer ran KEYS session:* on a production Redis with 30M keys to count sessions. Every app request to Redis timed out for several seconds.',
    options: [
      { text: 'Raise io-threads so other clients keep being served', why: 'I/O threads handle network reads and writes. Commands still run one at a time on the main thread.' },
      { text: 'Use SCAN with MATCH and COUNT to walk the keyspace incrementally (and disable KEYS through ACLs)', correct: true, why: 'KEYS is O(N) and blocks the single command thread. SCAN does small chunks of work between other clients’ commands.' },
      { text: 'Wrap KEYS in MULTI/EXEC', why: 'A transaction still runs the same O(N) command atomically, and it still blocks.' },
      { text: 'Run FLUSHALL to reset the keyspace', why: 'That deletes every session and logs out all users.' }
    ]
  },
  {
    id: 'tool-redis-crossslot',
    unit: 'u7',
    title: 'CROSSSLOT after migration',
    prompt: 'After moving from a single Redis to Redis Cluster, MGET user:42:profile user:42:prefs fails with a CROSSSLOT error. The same code worked fine before.',
    options: [
      { text: 'Add more shards to the cluster', why: 'More shards make it more likely that keys land in different slots.' },
      { text: 'Switch to a Lua script that reads both keys', why: 'Scripts in Cluster mode have the same rule: all keys must hash to one slot.' },
      { text: 'Use hash tags like user:{42}:profile and user:{42}:prefs so related keys share a slot', correct: true, why: 'Only the part inside {} is hashed, so both keys land in the same slot and multi-key commands work.' },
      { text: 'Turn off cluster mode on the client', why: 'Then the client can’t follow MOVED redirects, and most commands fail.' }
    ]
  },
  // ── u8
  {
    id: 'tool-kafka-idle-consumers',
    unit: 'u8',
    title: 'Twelve consumers, six working',
    prompt: 'Consumer lag on the orders topic keeps growing. You scaled the consumer group from 6 to 12 instances, but lag didn’t move and 6 instances sit idle. The topic has 6 partitions.',
    options: [
      { text: 'Add even more consumer instances', why: 'Within a group, each partition goes to at most one consumer. Extra consumers sit idle.' },
      { text: 'Raise the topic’s replication factor', why: 'Replication is for durability. Followers don’t serve the consumer group in parallel.' },
      { text: 'Lower the topic’s retention period', why: 'That deletes unread data. It doesn’t speed up consumption.' },
      { text: 'Increase the partition count (keeping in mind that keyed messages will map to new partitions)', correct: true, why: 'Partitions cap consumer parallelism. More partitions let the extra consumers take work.' }
    ]
  },
  {
    id: 'tool-kafka-ordering',
    unit: 'u8',
    title: '"Shipped" before "paid"',
    prompt: 'Your consumers sometimes see OrderShipped before OrderPaid for the same order. The producer sends events to a 12-partition topic without setting a message key.',
    options: [
      { text: 'Set acks=all on the producer', why: 'That improves durability. It says nothing about which partition events go to.' },
      { text: 'Use the orderId as the message key so all events for an order go to the same partition', correct: true, why: 'Kafka only guarantees order within a partition. Same key means same partition, so per-order order holds.' },
      { text: 'Add more consumers to the group', why: 'More parallelism, but events for one order are still spread across partitions.' },
      { text: 'Reduce the topic to one partition', why: 'That gives global order but caps the topic at a single consumer, which is far more than you need.' }
    ]
  },
  {
    id: 'tool-debezium-wal',
    unit: 'u8',
    title: 'Postgres disk fills over the weekend',
    prompt: 'Your Debezium CDC connector crashed on Friday. By Sunday, the Postgres primary’s disk is 95% full and pg_wal is enormous. Write traffic is normal.',
    options: [
      { text: 'Delete old files from pg_wal by hand', why: 'Postgres still needs those files. Deleting them can corrupt the database or prevent recovery.' },
      { text: 'Run VACUUM FULL on the biggest tables', why: 'That reclaims table bloat, takes heavy locks, and does nothing about retained WAL.' },
      { text: 'Bring the connector back (or drop its replication slot if it’s abandoned), and set max_slot_wal_keep_size as a safety cap', correct: true, why: 'An inactive logical replication slot keeps every WAL segment its consumer hasn’t confirmed, so it grows without limit.' },
      { text: 'Make checkpoints more frequent', why: 'Checkpoints can’t recycle WAL that a replication slot still holds.' }
    ]
  },
  // ── u9
  {
    id: 'tool-terraform-lock',
    unit: 'u9',
    title: 'Error acquiring the state lock',
    prompt: 'A CI runner was killed in the middle of terraform apply. Now every plan and apply fails with "Error acquiring the state lock", showing a lock ID and the dead runner’s info.',
    options: [
      { text: 'Delete the state file from the backend and re-import', why: 'Destroying state to clear a lock is wildly out of proportion and risks orphaned or duplicated resources.' },
      { text: 'Add -lock=false to the pipeline permanently', why: 'Concurrent applies can then corrupt state. Locking exists for exactly that reason.' },
      { text: 'Confirm no apply is actually running, run terraform force-unlock <LOCK_ID>, then plan to check for a half-applied change', correct: true, why: 'The lock is stale because its holder died. force-unlock releases it, and a fresh plan shows what the killed apply left behind.' },
      { text: 'Run terraform init -upgrade', why: 'That updates providers and modules. The lock stays in the backend.' }
    ]
  },
  {
    id: 'tool-prometheus-cardinality',
    unit: 'u9',
    title: 'Prometheus ran out of RAM',
    prompt: 'A developer added a user_id label to http_requests_total. Within a day, Prometheus memory went up 20x and queries time out. You have 3M users.',
    options: [
      { text: 'Remove the user_id label (drop it with metric_relabel_configs right away) and put per-user detail in logs or traces', correct: true, why: 'Each unique label value creates a new time series. Unbounded IDs blow up cardinality.' },
      { text: 'Scrape less often', why: 'The number of series stays the same. You just get fewer samples per series.' },
      { text: 'Shorten the retention period', why: 'Active series live in memory no matter how long history is kept.' },
      { text: 'Give Prometheus more RAM', why: 'It buys a little time until more users show up. Cardinality grows without limit.' }
    ]
  },
  {
    id: 'tool-gha-secret-leak',
    unit: 'u9',
    title: 'The secret is in the logs',
    prompt: 'A debug step in your public repo’s GitHub Actions workflow printed the base64 of your AWS secret key. Actions masked the raw secret but not the encoded copy, and the log has been public for 3 hours.',
    options: [
      { text: 'Delete the workflow run logs', why: 'Good cleanup, but anyone could have copied the key in those 3 hours. It still works.' },
      { text: 'Re-run the job with ::add-mask:: on the encoded value', why: 'This only masks future logs. The exposed copy is already out.' },
      { text: 'Make the repository private', why: 'The key was already exposed and is still valid.' },
      { text: 'Revoke and rotate the AWS key now, check CloudTrail for its use, then delete the logs and move to OIDC short-lived credentials', correct: true, why: 'A leaked credential is only safe once it no longer works. Masking only catches exact matches, so transformed values slip through.' }
    ]
  },
  {
    id: 'tool-docker-layer-cache',
    unit: 'u9',
    title: 'Six-minute npm install, every time',
    prompt: 'Your Dockerfile does COPY . . and then RUN npm ci. Every CI build, even a one-line CSS change, reinstalls all dependencies and takes 6 minutes.',
    options: [
      { text: 'Build with --no-cache for consistency', why: 'That throws away all layer caching and makes every build slow.' },
      { text: 'Copy package.json and package-lock.json first, run npm ci, then COPY the rest of the source', correct: true, why: 'Docker reuses a cached layer only while its inputs are unchanged. Dependencies then rebuild only when the lockfile changes.' },
      { text: 'Use a bigger CI runner', why: 'It might be a bit faster, but you still reinstall every dependency on every build.' },
      { text: 'Switch to an Alpine base image', why: 'A smaller image doesn’t fix the cache-busting order of the Dockerfile steps.' }
    ]
  }
]
