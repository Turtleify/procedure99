import type { Unit } from '../../../../shared/types'

// ───────────────────────────── T6: POSTGRES ─────────────────────────────
export const T6_POSTGRES: Unit = {
  id: 't6',
  track: 'tools',
  requires: ['u5', 'u6'],
  teaches: ['postgres', 'rds'],
  title: 'Postgres in practice',
  subtitle: 'Schemas, transactions, EXPLAIN, indexes and running it in production',
  icon: 'database',
  color: '#4f8cc9',
  lessons: [
    {
      id: 't6-schema-tx',
      type: 'lesson',
      title: 'Schemas and transactions',
      minutes: 7,
      cards: [
        {
          title: 'Let the schema enforce the rules',
          body: `<p>Postgres is happiest when the database, not the app, guards your invariants:</p>
<pre class="diagram">CREATE TABLE orders (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id     bigint NOT NULL REFERENCES users(id),
  status      text   NOT NULL CHECK (status IN ('pending','paid','shipped')),
  total_cents bigint NOT NULL CHECK (total_cents &gt;= 0),
  created_at  timestamptz NOT NULL DEFAULT now()
);</pre>
<p><b>NOT NULL</b>, <b>CHECK</b>, <b>UNIQUE</b> and <b>REFERENCES</b> (foreign keys) reject bad data from every client, including the one-off script someone runs at 2am.</p>`
        },
        {
          title: 'Types worth knowing',
          body: `<ul><li><b>timestamptz</b>: stores an absolute instant (UTC internally). Plain <code>timestamp</code> has no zone and causes bugs across regions. Default to timestamptz.</li>
<li><b>bigint</b> identity for ids. <code>int</code> ids run out at about 2.1 billion.</li>
<li><b>text</b>: no speed difference vs <code>varchar(n)</code> in Postgres.</li>
<li><b>numeric</b> or integer cents for money, never <code>float</code>.</li>
<li><b>jsonb</b>: binary JSON you can index and query (<code>payload-&gt;&gt;'type'</code>, <code>@&gt;</code>). Good for flexible attributes, bad as an excuse to skip modeling.</li>
<li><b>uuid</b>: handy for ids generated outside the DB.</li></ul>`
        },
        {
          title: 'Foreign key gotcha',
          body: `<p>Postgres automatically indexes <b>primary keys</b> and <b>UNIQUE</b> columns. It does <b>not</b> index the referencing side of a foreign key.</p>
<p>So <code>orders.user_id REFERENCES users(id)</code> has no index on <code>orders.user_id</code> unless you add one. Without it, <code>WHERE user_id = 42</code> is a full scan, and deleting a user scans <code>orders</code> to check for children.</p>
<pre class="diagram">CREATE INDEX orders_user_id_idx ON orders (user_id);</pre>`
        },
        {
          title: 'Isolation levels',
          body: `<ul><li><b>Read committed</b> (default): each <i>statement</i> sees data committed before it started. Two reads in one transaction can see different values.</li>
<li><b>Repeatable read</b>: the whole transaction sees one snapshot. If you try to update a row someone else changed and committed, you get a serialization error.</li>
<li><b>Serializable</b>: results are as if transactions ran one at a time. Postgres detects conflicts and aborts one transaction with SQLSTATE <code>40001</code>.</li></ul>
<p>At the stricter levels your app <b>must retry</b> on serialization failures.</p>`
        },
        {
          title: 'The lost update and how to stop it',
          body: `<p>Two requests both read <code>balance = 100</code>, both subtract 30 in app code, both write 70. One withdrawal vanished. Read committed does not prevent this.</p>
<p>Fixes, simplest first:</p>
<ol><li><b>Atomic update</b>: <code>UPDATE accounts SET balance = balance - 30 WHERE id = 1 AND balance &gt;= 30;</code></li>
<li><b>Pessimistic lock</b>: <code>SELECT balance FROM accounts WHERE id = 1 FOR UPDATE;</code> then update. Other writers wait until you commit.</li>
<li><b>Optimistic</b>: a <code>version</code> column, <code>UPDATE ... WHERE id = 1 AND version = 7</code>, retry if 0 rows changed.</li></ol>`
        }
      ],
      quiz: [
        {
          q: 'What is Postgres’s default transaction isolation level?',
          options: ['Read uncommitted', 'Repeatable read', 'Serializable', 'Read committed'],
          answer: 3,
          explain: 'Postgres defaults to read committed: each statement sees a fresh snapshot of committed data.'
        },
        {
          q: 'Two requests run this concurrently at the default isolation level, both reading the same starting stock of 10. What can happen?',
          code: `BEGIN;
SELECT stock FROM products WHERE id = 7;   -- app sees 10
-- app computes 10 - 1 = 9
UPDATE products SET stock = 9 WHERE id = 7;
COMMIT;`,
          options: [
            'Postgres serializes them, so stock ends at 8',
            'Both write 9, so one sale is lost',
            'The second transaction fails with a deadlock',
            'The second SELECT blocks until the first commits'
          ],
          answer: 1,
          explain: 'This is the classic lost update. Plain SELECT takes no row lock, so both see 10 and both write 9. Use SET stock = stock - 1, FOR UPDATE, or a version check.'
        },
        {
          q: 'What does SELECT ... FOR UPDATE do?',
          options: [
            'Locks the selected rows so other writers and FOR UPDATE readers wait until you commit',
            'Locks the entire table for the rest of the transaction',
            'Switches the transaction to serializable isolation',
            'Blocks all plain SELECTs on those rows'
          ],
          answer: 0,
          explain: 'It takes row-level locks. Plain SELECTs still read without blocking thanks to MVCC; only conflicting writers and locking reads wait.'
        },
        {
          q: 'You run a transaction at SERIALIZABLE and it fails with SQLSTATE 40001. What should the app do?',
          options: [
            'Log it and give up, the data is corrupt',
            'Drop to read uncommitted and try again',
            'Retry the whole transaction from the beginning',
            'Retry only the last statement'
          ],
          answer: 2,
          explain: 'A serialization failure means Postgres aborted the transaction to keep results serializable. The fix is to rerun the full transaction.'
        },
        {
          q: 'Which column type should you use for "when this event happened" in a global app?',
          options: ['timestamp', 'timestamptz', 'text in ISO format', 'bigint seconds stored as float'],
          answer: 1,
          explain: 'timestamptz represents an absolute instant and converts correctly across session time zones. Plain timestamp has no zone information.'
        }
      ]
    },
    {
      id: 't6-explain-indexes',
      type: 'lesson',
      title: 'EXPLAIN and indexes',
      minutes: 8,
      cards: [
        {
          title: 'EXPLAIN vs EXPLAIN ANALYZE',
          body: `<p><code>EXPLAIN</code> shows the plan the planner <i>would</i> use, with estimated costs and row counts. <code>EXPLAIN ANALYZE</code> <b>actually runs the query</b> and adds real timings and row counts.</p>
<pre class="diagram">EXPLAIN (ANALYZE, BUFFERS)
SELECT * FROM orders WHERE user_id = 42;</pre>
<p>Because it executes, wrap an ANALYZE of an <code>UPDATE</code> or <code>DELETE</code> in <code>BEGIN; ... ROLLBACK;</code>. Read plans from the most indented node outward.</p>`
        },
        {
          title: 'Scan types',
          body: `<ul><li><b>Seq Scan</b>: reads the whole table. Fine for small tables or when you need most rows.</li>
<li><b>Index Scan</b>: walks the index, then fetches each matching row from the table. Great for a few rows.</li>
<li><b>Index Only Scan</b>: all needed columns are in the index, so the table is mostly skipped.</li>
<li><b>Bitmap Index Scan + Bitmap Heap Scan</b>: collects matching row locations first, then reads table pages in order. Used for "medium" result sizes or to combine indexes.</li></ul>`
        },
        {
          title: 'Estimates vs actuals',
          body: `<pre class="diagram">Seq Scan on orders (cost=0.00..21500.00 rows=1 width=48)
  (actual time=0.03..142.10 rows=8120 loops=1)
  Filter: (status = 'pending')
  Rows Removed by Filter: 991880</pre>
<p>Two red flags: a <b>Seq Scan</b> that throws away 99% of rows (missing index), and <b>rows=1</b> estimated vs <b>8120</b> actual. Bad estimates lead to bad plans. Run <code>ANALYZE orders;</code> to refresh statistics. Autovacuum normally does this, but it can lag after big loads.</p>`
        },
        {
          title: 'B-tree and composite indexes',
          body: `<p>The default index type is <b>B-tree</b>: equality, ranges, <code>ORDER BY</code>, prefix <code>LIKE 'abc%'</code>.</p>
<p>In a composite index, <b>column order matters</b>. An index on <code>(user_id, created_at)</code> serves:</p>
<ul><li><code>WHERE user_id = 42</code></li><li><code>WHERE user_id = 42 AND created_at &gt; now() - interval '7 days'</code></li><li><code>WHERE user_id = 42 ORDER BY created_at DESC LIMIT 20</code></li></ul>
<p>It generally does not help <code>WHERE created_at &gt; ...</code> alone. Rule of thumb: equality columns first, then the range or sort column.</p>`
        },
        {
          title: 'Partial, GIN, and building safely',
          body: `<pre class="diagram">-- only index the rows you query
CREATE INDEX orders_pending_idx ON orders (created_at)
  WHERE status = 'pending';

-- jsonb containment: payload @&gt; '{"type":"click"}'
CREATE INDEX events_payload_idx ON events USING gin (payload);

-- full-text search
CREATE INDEX docs_fts_idx ON docs USING gin (to_tsvector('english', body));</pre>
<p>On a live table use <code>CREATE INDEX CONCURRENTLY</code>. It does not block writes, but it is slower, cannot run inside a transaction block, and leaves an <b>INVALID</b> index to drop if it fails. Every index also slows writes, so don't add them blindly.</p>`
        }
      ],
      quiz: [
        {
          q: 'What does this plan tell you?',
          code: `Seq Scan on users (cost=0.00..35811.00 rows=1 width=72)
  (actual time=210.4..388.9 rows=1 loops=1)
  Filter: (lower(email) = 'ana@example.com')
  Rows Removed by Filter: 1499999`,
          options: [
            'The query is optimal; one row was returned',
            'Postgres is missing statistics, so run ANALYZE',
            'An index on email exists but is corrupt',
            'No usable index; an expression index on lower(email) would turn this into an index scan'
          ],
          answer: 3,
          explain: 'It scanned 1.5M rows to find one. A plain index on email does not match lower(email); you need CREATE INDEX ON users (lower(email)).'
        },
        {
          q: 'You have an index on (tenant_id, created_at). Which query benefits least?',
          options: [
            'WHERE tenant_id = 5',
            'WHERE created_at > now() - interval \'1 day\'',
            'WHERE tenant_id = 5 ORDER BY created_at DESC LIMIT 50',
            'WHERE tenant_id = 5 AND created_at > now() - interval \'1 day\''
          ],
          answer: 1,
          explain: 'The index is sorted by tenant_id first. Filtering only on the second column generally cannot use it efficiently.'
        },
        {
          q: 'Why should you be careful running EXPLAIN ANALYZE on a DELETE?',
          options: [
            'It actually executes the DELETE',
            'It takes a lock on the whole database',
            'It ignores indexes for write statements',
            'It cannot show plans for writes'
          ],
          answer: 0,
          explain: 'ANALYZE runs the statement to measure it. Wrap it in BEGIN ... ROLLBACK if you do not want the change.'
        },
        {
          q: 'Which index fits this query best?',
          code: `SELECT * FROM events
WHERE payload @> '{"type": "purchase"}';`,
          options: [
            'A B-tree index on payload',
            'A hash index on payload',
            'A GIN index on payload',
            'A partial index WHERE payload IS NOT NULL'
          ],
          answer: 2,
          explain: 'GIN indexes the keys and values inside jsonb and supports the @> containment operator. B-tree only compares whole values.'
        },
        {
          q: 'What is the main reason to use CREATE INDEX CONCURRENTLY on a production table?',
          options: [
            'It builds the index faster',
            'It does not block inserts, updates and deletes while building',
            'It can run inside a transaction and be rolled back',
            'It produces a smaller index'
          ],
          answer: 1,
          explain: 'A normal CREATE INDEX blocks writes for the whole build. CONCURRENTLY avoids that, at the cost of a slower build that cannot run in a transaction block.'
        }
      ]
    },
    {
      id: 't6-production',
      type: 'lesson',
      title: 'Pooling and managed Postgres',
      minutes: 7,
      cards: [
        {
          title: 'Why too many connections hurt',
          body: `<p>Each Postgres connection is a separate <b>backend process</b> with its own memory. Thousands of mostly idle connections waste RAM and add contention, and throughput often <i>drops</i> past a few hundred active ones.</p>
<p><code>max_connections</code> is a hard cap. Hit it and new clients get <i>"too many clients already"</i>.</p>
<p>The trap: 50 app pods × a pool of 20 each = 1,000 connections. Autoscaling the app can take down the database.</p>`
        },
        {
          title: 'PgBouncer',
          body: `<p>A lightweight pooler between apps and Postgres. Many client connections share a small set of server connections.</p>
<pre class="diagram">[databases]
app = host=10.0.1.5 port=5432 dbname=app

[pgbouncer]
listen_port = 6432
pool_mode = transaction
max_client_conn = 5000
default_pool_size = 40</pre>
<p><b>transaction</b> mode gives the best reuse: a server connection is yours only for one transaction. Session state does not survive between transactions, so session <code>SET</code>, session advisory locks and <code>LISTEN</code> break. Check prepared statement support for your setup. AWS offers <b>RDS Proxy</b> as a managed alternative.</p>`
        },
        {
          title: 'Managed Postgres (RDS): what AWS runs for you',
          body: `<p><b>Amazon RDS for PostgreSQL</b> is still plain Postgres, but AWS runs the machine under it:</p>
<ul><li><b>Patching</b>: OS and minor-version updates applied in a weekly maintenance window you choose.</li>
<li><b>Automated backups</b> with a retention you set (up to 35 days), and point-in-time restore.</li>
<li><b>Sizing</b>: you pick an instance class (vCPU and RAM) and storage, which can autoscale. Moving to a bigger class is a setting change, with a short restart.</li>
<li><b>Config</b> via parameter groups instead of editing <code>postgresql.conf</code>. No SSH and no true superuser.</li></ul>
<p>You still own schema, indexes, queries and connection counts. Copies and failover come in Unit 08.</p>`
        },
        {
          title: 'Backups and point-in-time recovery',
          body: `<p>Postgres writes every change to its <b>WAL</b> (write-ahead log) before applying it. RDS takes daily snapshots plus continuous WAL archiving, so you can restore to <b>any second</b> within the retention window. A restore creates a <b>new instance</b>; you then repoint the app.</p>
<p>Copies are not backups: a bad <code>DELETE</code> is copied instantly. Self-hosted, tools like pgBackRest or WAL-G do the same job. Test restores, because an untested backup is a hope.</p>`
        }
      ],
      quiz: [
        {
          q: 'What is the effect of this PgBouncer setting?',
          code: `[pgbouncer]
pool_mode = transaction
max_client_conn = 5000
default_pool_size = 40`,
          options: [
            'Up to 5,000 clients share about 40 Postgres connections per database/user pair, each held only for a transaction',
            'Postgres max_connections is raised to 5,000',
            'Each client gets a dedicated Postgres connection for its whole session',
            'Each SQL statement can run on a different server connection, even inside a transaction'
          ],
          answer: 0,
          explain: 'Transaction pooling multiplexes many client connections onto a small server pool, giving a server connection back after each transaction.'
        },
        {
          q: 'Which job does RDS take off your hands compared with running Postgres yourself on EC2?',
          options: [
            'Choosing indexes for slow queries',
            'Designing the schema',
            'Patching the OS and Postgres minor versions, and taking automated backups',
            'Keeping app connection counts under max_connections'
          ],
          answer: 2,
          explain: 'RDS runs the machine: patching, backups and point-in-time restore. Schema, indexes, queries and connection counts are still yours.'
        },
        {
          q: 'Your app runs 40 pods, each with a connection pool of 25. Postgres has max_connections = 500. What happens when all pods are busy?',
          options: [
            'Postgres queues the extra connections until a slot frees up',
            'New connections fail with "too many clients already", since 40 x 25 = 1,000 is above 500',
            'Postgres raises max_connections automatically',
            'Nothing; idle connections do not count toward the limit'
          ],
          answer: 1,
          explain: 'max_connections is a hard cap on open connections, idle or not. Put PgBouncer in front or shrink per-pod pools.'
        },
        {
          q: 'Which feature breaks under PgBouncer transaction pooling?',
          options: [
            'Multi-statement transactions with BEGIN/COMMIT',
            'SELECT ... FOR UPDATE inside a transaction',
            'Foreign key checks',
            'A session-level SET search_path that later transactions rely on'
          ],
          answer: 3,
          explain: 'Your next transaction may run on a different server connection, so session state like SET does not carry over. Work inside one transaction is fine.'
        },
        {
          q: 'Someone runs a DELETE without a WHERE on production. What gets the data back?',
          options: [
            'Restart the instance so the transaction rolls back',
            'Restore last week’s manual snapshot over the live database',
            'Run VACUUM to recover the dead rows',
            'Point-in-time restore to just before the DELETE, into a new instance'
          ],
          answer: 3,
          explain: 'A committed DELETE survives restarts. PITR replays WAL up to a chosen moment before the mistake, losing nothing earlier, unlike an old snapshot.'
        }
      ]
    },
    {
      id: 't6-byte-backfill',
      type: 'byte',
      title: 'Interview Byte: zero-downtime backfill',
      minutes: 6,
      prompt:
        'You need to add a new NOT NULL column "region" to a 500M-row orders table in Postgres and backfill it from existing data, with zero downtime. Walk the interviewer through the exact steps.',
      hints: [
        'Which ALTER TABLE forms take a long lock or rewrite the table?',
        'How do you update 500M rows without one giant transaction?',
        'How do you add NOT NULL without a long blocking scan?'
      ],
      model: `<ol><li><b>Add the column nullable</b>: <code>ALTER TABLE orders ADD COLUMN region text;</code> Metadata-only, but set <code>lock_timeout</code> (e.g. 5s) and retry so a long-running query can't queue everyone behind your lock.</li>
<li><b>Deploy app code</b> that writes <code>region</code> on every new and updated row.</li>
<li><b>Backfill in batches</b> by primary key range (say 5–10k rows per transaction), with pauses. Watch CPU, I/O and lock waits, and slow down if they climb. Make the job resumable.</li>
<li><b>Index if needed</b> with <code>CREATE INDEX CONCURRENTLY</code>.</li>
<li><b>Enforce NOT NULL safely</b>: <code>ADD CONSTRAINT region_nn CHECK (region IS NOT NULL) NOT VALID;</code> then <code>VALIDATE CONSTRAINT</code>, which doesn't block writes. Modern Postgres can then <code>SET NOT NULL</code> using that check without a full scan.</li>
<li><b>Verify</b> and then rely on it in reads. Keep each step reversible.</li></ol>`,
      points: [
        'Added the column as nullable first (no table rewrite)',
        'Used lock_timeout or otherwise avoided lock queue pile-ups',
        'Dual-wrote from the app before backfilling',
        'Backfilled in small, resumable batches while watching database load',
        'Used CONCURRENTLY for any new index',
        'Added NOT NULL via NOT VALID check plus VALIDATE, not a blocking scan'
      ]
    }
  ]
}

// ───────────────────────────── T7: NOSQL ─────────────────────────────
export const T7_NOSQL: Unit = {
  id: 't7',
  track: 'tools',
  requires: ['u5'],
  teaches: ['dynamodb', 'mongodb', 'cassandra'],
  title: 'NoSQL in practice',
  subtitle: 'DynamoDB, MongoDB and Cassandra: model for your queries',
  icon: 'boxes',
  color: '#e0a03a',
  lessons: [
    {
      id: 't7-dynamodb',
      type: 'lesson',
      title: 'DynamoDB',
      minutes: 8,
      cards: [
        {
          title: 'Keys are everything',
          body: `<p>DynamoDB is a fully managed AWS key-value and document store. Every item has a <b>primary key</b>:</p>
<ul><li><b>Partition key</b> (PK): DynamoDB spreads a table over many storage chunks called <b>partitions</b>, and hashes the PK to choose one. Equality lookups only.</li>
<li><b>Sort key</b> (SK, optional): orders items <i>within</i> a partition. Supports <code>=</code>, <code>&lt;</code>, <code>&gt;</code>, <code>BETWEEN</code>, <code>begins_with</code>.</li></ul>
<p>Items with the same PK form an <b>item collection</b>, stored together and sorted by SK. Items max out at 400 KB. There are no joins and no ad-hoc queries, so you design keys around access patterns up front.</p>`
        },
        {
          title: 'Query vs Scan',
          body: `<pre class="diagram">aws dynamodb query \\
  --table-name App \\
  --key-condition-expression "PK = :u AND begins_with(SK, :o)" \\
  --expression-attribute-values '{":u":{"S":"USER#42"},":o":{"S":"ORDER#"}}' \\
  --no-scan-index-forward --limit 20</pre>
<p><b>Query</b> targets one partition key and reads a sorted slice. Fast and cheap. <b>Scan</b> reads the <i>whole table</i>. Fine for a one-off export, a red flag in a request path.</p>
<p>Gotcha: a <b>FilterExpression</b> is applied <i>after</i> items are read. You still pay for every item read, and <code>Limit</code> applies before the filter.</p>`
        },
        {
          title: 'Secondary indexes',
          body: `<ul><li><b>GSI</b> (global secondary index): a different PK and SK, effectively a copy of the data re-keyed. Can be added any time. Reads are <b>eventually consistent</b> only. Has its own throughput, and a throttled GSI can throttle writes to the base table.</li>
<li><b>LSI</b> (local secondary index): same PK, different SK. Must be defined <b>at table creation</b>. Supports strongly consistent reads. Caps each item collection at 10 GB.</li></ul>
<p>In practice, reach for GSIs. Project only the attributes you need to keep them cheap.</p>`
        },
        {
          title: 'Single-table design',
          body: `<p>Store several entity types in one table with generic <code>PK</code>/<code>SK</code> attributes, so one Query fetches related items together:</p>
<pre class="diagram">PK          SK                 data
USER#42     PROFILE            name, email
USER#42     ORDER#2025-06-01#9 total, status
USER#42     ORDER#2025-06-03#4 total, status
ORDER#9     ITEM#1             sku, qty</pre>
<p>"Get user and recent orders" is one Query on <code>PK = USER#42</code>. Start by <b>listing every access pattern</b>, then design keys and GSIs to serve each one. Downside: it is hard to read and hard to change when new patterns appear.</p>`
        },
        {
          title: 'Capacity and hot partitions',
          body: `<ul><li><b>On-demand</b>: pay per request, no planning. Good for spiky or unknown traffic.</li>
<li><b>Provisioned</b>: set read/write capacity units, optionally with auto scaling. Cheaper for steady, predictable load.</li></ul>
<p>A <b>partition</b> is a slice of storage on its own servers; every item lives in the slice its partition key hashes to. Each slice handles only so many reads and writes per second. If one key gets most traffic (a celebrity user, today's date as PK), that one slice is throttled while the rest of the table sits idle. Fixes: keys with many distinct values, or <b>write sharding</b> (<code>EVENTS#2025-06-01#7</code> with a random suffix 0–9) so one logical key spreads over several slices.</p>`
        }
      ],
      quiz: [
        {
          q: 'What does this command return?',
          code: `aws dynamodb query \\
  --table-name Chat \\
  --key-condition-expression "PK = :c" \\
  --expression-attribute-values '{":c":{"S":"CONV#7"}}' \\
  --no-scan-index-forward \\
  --limit 50`,
          options: [
            'The 50 items in CONV#7 with the highest sort keys, newest first if SK is a timestamp',
            'The first 50 items in the whole table',
            'A random sample of 50 items from CONV#7',
            'An error, because Query requires a sort key condition'
          ],
          answer: 0,
          explain: '--no-scan-index-forward reads the partition in descending sort key order, and --limit 50 stops after 50 items. The sort key condition is optional.'
        },
        {
          q: 'A Query with Limit 20 and a FilterExpression status = "OPEN" returns only 3 items. Why?',
          options: [
            'Filters only work with Scan',
            'There are only 3 open items in the table',
            'Limit caps items read before filtering; 17 of the 20 read were filtered out',
            'DynamoDB caps filtered results at 3 per page'
          ],
          answer: 2,
          explain: 'Limit applies to items evaluated, and the filter runs afterward. Paginate with LastEvaluatedKey, or put status into a key so the Query does the work.'
        },
        {
          q: 'You need to look up orders by customer email, which is not part of the table key. What is the usual approach?',
          options: [
            'Add an LSI on email to the existing table',
            'Add a GSI with email as its partition key',
            'Scan with a FilterExpression on email',
            'Store email in the sort key of every item'
          ],
          answer: 1,
          explain: 'GSIs can be added to existing tables and give a new partition key. LSIs must be created with the table and keep the same partition key.'
        },
        {
          q: 'An IoT table uses the current date as partition key. Writes are throttled even though total capacity looks unused. What is happening?',
          options: [
            'The table needs a sort key',
            'On-demand mode does not allow that many writes',
            'The items are larger than 400 KB',
            'All of today’s writes hit one partition (a hot partition)'
          ],
          answer: 3,
          explain: 'One partition key value lands on one partition, which has its own limit. Spread writes with a higher-cardinality key or a sharding suffix.'
        },
        {
          q: 'Which statement about GSIs is true?',
          options: [
            'GSI reads are eventually consistent',
            'GSIs must be created with the table',
            'GSIs share the partition key of the base table',
            'GSIs support strongly consistent reads if you ask for them'
          ],
          answer: 0,
          explain: 'GSIs are updated asynchronously from the base table, so they only offer eventually consistent reads.'
        }
      ]
    },
    {
      id: 't7-mongodb',
      type: 'lesson',
      title: 'MongoDB',
      minutes: 7,
      cards: [
        {
          title: 'Documents and collections',
          body: `<p>MongoDB stores <b>BSON documents</b> (JSON-like, with types like dates and ObjectIds) in <b>collections</b>. Documents in one collection can have different fields. Max document size is 16 MB.</p>
<pre class="diagram">db.orders.insertOne({
  userId: 42,
  status: "paid",
  items: [ { sku: "A1", qty: 2 }, { sku: "B7", qty: 1 } ],
  createdAt: new Date()
})</pre>
<p>Run it yourself or use <b>Atlas</b>, the managed service. Licensing note: the server is under the SSPL, which is not an OSI-approved open source license.</p>`
        },
        {
          title: 'Embed or reference?',
          body: `<p><b>Embed</b> when data is read together and owned by the parent: order line items, a user's addresses. One read, and single-document writes are atomic.</p>
<p><b>Reference</b> (store an id) when the child is large, shared, or grows without bound: comments on a viral post, products shared across orders.</p>
<p>Rule of thumb: never embed an array that can grow forever. You'll hit the 16 MB limit and rewrite huge documents. Multi-document transactions exist but cost more, so design so most writes touch one document.</p>`
        },
        {
          title: 'Indexes and explain',
          body: `<pre class="diagram">db.orders.createIndex({ userId: 1, createdAt: -1 })
db.orders.find({ userId: 42 }).sort({ createdAt: -1 })
  .explain("executionStats")</pre>
<p>In the output, <b>IXSCAN</b> means an index was used. <b>COLLSCAN</b> means every document was read. Compare <code>totalDocsExamined</code> with <code>nReturned</code>.</p>
<p>For compound indexes, follow the <b>ESR rule</b>: <b>E</b>quality fields first, then <b>S</b>ort fields, then <b>R</b>ange fields.</p>`
        },
        {
          title: 'Aggregation pipeline',
          body: `<p>Documents flow through stages, each transforming the stream:</p>
<pre class="diagram">db.orders.aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: "$userId", spent: { $sum: "$total" } } },
  { $sort: { spent: -1 } },
  { $limit: 10 }
])</pre>
<p>Put <code>$match</code> early so it can use an index and shrink the stream. <code>$lookup</code> does a join-like step, but if you need it on every hot query, rethink your model.</p>`
        },
        {
          title: 'Where MongoDB fits',
          body: `<p>Good fits: data that is <b>read and written as a whole object</b> and varies in shape. Product catalogs where each category has different attributes, content and CMS pages, user profiles and settings, event payloads.</p>
<p>Weaker fits: data with many relationships you join in different ways, or workflows where most writes must change several records atomically. Postgres (with <code>jsonb</code> for the flexible parts) often covers both worlds.</p>
<p>In production MongoDB runs as a <b>replica set</b> of copies on 3 servers; the Scaling data module covers how that works.</p>`
        }
      ],
      quiz: [
        {
          q: 'What does this pipeline produce?',
          code: `db.orders.aggregate([
  { $match: { status: "paid" } },
  { $group: { _id: "$userId", spent: { $sum: "$total" } } },
  { $sort: { spent: -1 } },
  { $limit: 5 }
])`,
          options: [
            'The 5 largest paid orders',
            'The 5 users with the highest total spend on paid orders',
            'The first 5 paid orders sorted by user',
            'The total spend of all users, split into 5 groups'
          ],
          answer: 1,
          explain: '$group sums total per userId, then $sort and $limit keep the top 5 spenders.'
        },
        {
          q: 'A blog post document embeds all its comments. A post goes viral with 200,000 comments. What is the main problem?',
          options: [
            'MongoDB cannot index arrays',
            'Embedded arrays are not returned by find()',
            'The document grows toward the 16 MB limit and every new comment rewrites a huge document',
            'Comments become eventually consistent'
          ],
          answer: 2,
          explain: 'Unbounded arrays are the classic embedding mistake. Store comments in their own collection referencing the post id.'
        },
        {
          q: 'explain("executionStats") shows COLLSCAN with totalDocsExamined: 4000000 and nReturned: 12. What do you do?',
          options: [
            'Add an index matching the query’s filter and sort fields',
            'Embed the matching documents in a parent document',
            'Move the filter into a $group stage',
            'Use $lookup instead of find'
          ],
          answer: 0,
          explain: 'COLLSCAN means no index was used. A compound index following equality, sort, range order fixes it.'
        },
        {
          q: 'Which workload is the most natural fit for MongoDB?',
          options: [
            'A ledger where every transfer updates two accounts atomically and is audited with ad-hoc joins',
            'A reporting warehouse that joins ten tables in new ways every week',
            'A key-value counter incremented millions of times per second',
            'A product catalog where each category has different attributes and pages read one whole product at a time'
          ],
          answer: 3,
          explain: 'Varying shapes read as whole documents is MongoDB’s sweet spot. Multi-record atomic writes and ad-hoc joins favor a relational database.'
        }
      ]
    },
    {
      id: 't7-cassandra',
      type: 'lesson',
      title: 'Cassandra',
      minutes: 7,
      cards: [
        {
          title: 'The model: partitions and clustering',
          body: `<pre class="diagram">CREATE TABLE messages_by_conversation (
  conversation_id uuid,
  sent_at         timeuuid,
  sender_id       uuid,
  body            text,
  PRIMARY KEY ((conversation_id), sent_at)
) WITH CLUSTERING ORDER BY (sent_at DESC);</pre>
<p>The <b>partition key</b> (<code>conversation_id</code>) is hashed, and the hash decides which nodes store the row. <b>Clustering columns</b> (<code>sent_at</code>) sort rows <i>inside</i> the partition. "Latest 50 messages in a conversation" is one sequential read on one partition.</p>`
        },
        {
          title: 'Query-first modeling',
          body: `<p>In SQL you model entities, then write queries. In Cassandra you <b>list queries first</b> and build <b>one table per query</b>.</p>
<ul><li><code>messages_by_conversation</code></li><li><code>conversations_by_user</code></li></ul>
<p>The same data is written to several tables. Denormalization is normal here. Writes are cheap: they append to a commit log and memtable, and get flushed to SSTables (an LSM tree).</p>
<p>Filtering on a non-key column fails unless you add <code>ALLOW FILTERING</code>, which scans and should stay out of production paths.</p>`
        },
        {
          title: 'Why no joins',
          body: `<p>Data is spread across many nodes by partition key. A join would fan out to the whole cluster and give up the predictable single-partition latency Cassandra exists for, so CQL doesn't offer joins.</p>
<p>Instead you <b>denormalize at write time</b>: when a message arrives, write it to the conversation table and update each member's <code>conversations_by_user</code> row. Logged batches can keep multi-table writes together, at a cost.</p>
<p>Watch <b>partition size</b>: a partition that grows forever gets slow. Bucket by time, e.g. <code>PRIMARY KEY ((conversation_id, month), sent_at)</code>.</p>`
        },
        {
          title: 'Data is spread by partition key',
          body: `<p>A Cassandra cluster is a group of <b>equal nodes</b> with no leader. Think of the possible hash values as a circle cut into slices, with each node owning some slices.</p>
<pre class="diagram">hash(conv_17) -&gt; slice owned by node B  (a neighbour keeps a copy too)
hash(conv_42) -&gt; slice owned by node E</pre>
<p>So a query that names the partition key goes <b>straight to the right node</b>. One that doesn't would have to ask every node, which is why Cassandra refuses it without <code>ALLOW FILTERING</code>. Add nodes and each takes over some slices, so capacity grows. Copies and consistency are covered in the Scaling data module.</p>`
        },
        {
          title: 'Where it fits',
          body: `<p>Pick Cassandra for <b>huge write volume</b>, clusters spread over <b>several datacenters</b>, and queries known in advance: messaging, time series, activity feeds, IoT.</p>
<p>Avoid it for ad-hoc analytics, multi-row transactions, or fast-changing query patterns.</p>
<p>Ops are heavy (compaction, repairs, cleaning up deleted data). Managed options include DataStax Astra and Amazon Keyspaces. ScyllaDB is a compatible C++ reimplementation.</p>`
        }
      ],
      quiz: [
        {
          q: 'Given this table, which query is efficient?',
          code: `CREATE TABLE messages_by_conversation (
  conversation_id uuid,
  sent_at timeuuid,
  sender_id uuid,
  body text,
  PRIMARY KEY ((conversation_id), sent_at)
) WITH CLUSTERING ORDER BY (sent_at DESC);`,
          options: [
            'SELECT * FROM messages_by_conversation WHERE sender_id = ?',
            'SELECT * FROM messages_by_conversation WHERE sent_at > ?',
            'SELECT * FROM messages_by_conversation WHERE conversation_id = ? LIMIT 50',
            'SELECT * FROM messages_by_conversation WHERE body = ?'
          ],
          answer: 2,
          explain: 'It names the partition key, so it reads one partition already sorted newest first. The others lack the partition key and need ALLOW FILTERING.'
        },
        {
          q: 'Your 6-node Cassandra cluster is near its write limit. You add 3 nodes. What happens?',
          options: [
            'Nothing until you elect one of the new nodes as leader',
            'Only new partitions go to the new nodes; old data stays put forever',
            'You must rebuild every table with a new partition key',
            'The new nodes take over some hash slices, data for those slices moves to them, and write capacity grows'
          ],
          answer: 3,
          explain: 'Nodes are equal and each owns slices of the hash range. New nodes take over slices, so load spreads across more machines.'
        },
        {
          q: 'Why does Cassandra modeling use one table per query?',
          options: [
            'CQL has no joins, and efficient reads must hit a single partition by key',
            'Each table can only have one index',
            'Cassandra limits each table to one query',
            'It saves disk space'
          ],
          answer: 0,
          explain: 'Without joins, each query needs its own table keyed for that access pattern. You trade disk and write work for fast reads.'
        },
        {
          q: 'A chat partition keyed only by conversation_id has grown to millions of rows and reads are slow. What fixes it?',
          options: [
            'Add more nodes so the partition is split across them',
            'Add a time bucket to the partition key, e.g. (conversation_id, month)',
            'Add a secondary index on sent_at',
            'Switch to ALLOW FILTERING'
          ],
          answer: 1,
          explain: 'Bucketing caps how large any one partition gets. Reads for recent messages hit the current bucket.'
        }
      ]
    },
    {
      id: 't7-byte-chat',
      type: 'byte',
      title: 'Interview Byte: chat messages in DynamoDB',
      minutes: 6,
      prompt:
        'Model a chat app in DynamoDB. It must support: send a message, list the latest 50 messages in a conversation, and list a user\'s conversations sorted by most recent activity. Give the table keys, any indexes, and the exact operations.',
      hints: [
        'List the access patterns first, then pick PK and SK for each',
        'Which sort key makes "latest 50" a single Query?',
        'How do you keep a user\'s conversation list ordered by recent activity?'
      ],
      model: `<p><b>Table</b> (single table, generic PK/SK):</p>
<ul><li>Message: <code>PK = CONV#&lt;id&gt;</code>, <code>SK = MSG#&lt;timestamp&gt;#&lt;msgId&gt;</code></li>
<li>Membership: <code>PK = USER#&lt;id&gt;</code>, <code>SK = CONV#&lt;id&gt;</code>, attribute <code>lastMessageAt</code></li></ul>
<p><b>GSI1</b> on memberships: <code>GSI1PK = USER#&lt;id&gt;</code>, <code>GSI1SK = lastMessageAt</code>.</p>
<ol><li><b>Send</b>: PutItem the message, then update <code>lastMessageAt</code> on each member's row (TransactWriteItems for small groups, async fan-out for big ones).</li>
<li><b>Latest 50</b>: Query <code>PK = CONV#id</code>, <code>ScanIndexForward=false</code>, <code>Limit=50</code>. Page with <code>LastEvaluatedKey</code>.</li>
<li><b>User's conversations</b>: Query GSI1 by user, descending.</li></ol>
<p>A time-sortable id (ULID/KSUID) avoids SK collisions. Huge group chats are hot partitions; bucket by day if needed. GSI reads are eventually consistent, which is fine for an inbox.</p>`,
      points: [
        'Listed the access patterns before choosing keys',
        'Messages keyed by conversation with a time-sortable sort key',
        'Latest 50 via Query, descending, Limit 50 (no Scan)',
        'GSI or separate items to list a user\'s conversations by recency',
        'Explained how send updates the conversation list (transaction or fan-out)',
        'Mentioned hot partitions or pagination'
      ]
    }
  ]
}

// ───────────────────────────── T8: SEARCH ─────────────────────────────
export const T8_SEARCH: Unit = {
  id: 't8',
  track: 'tools',
  requires: ['u6'],
  teaches: ['elasticsearch', 'opensearch', 'algolia', 'meilisearch'],
  title: 'Search',
  subtitle: 'Inverted indexes, Elasticsearch, relevance and keeping search in sync',
  icon: 'search',
  color: '#2bb5a8',
  lessons: [
    {
      id: 't8-inverted-index',
      type: 'lesson',
      title: 'How search engines index text',
      minutes: 7,
      cards: [
        {
          title: 'The inverted index',
          body: `<p>A B-tree finds rows by value. Full-text search needs the reverse: <b>which documents contain this word?</b></p>
<pre class="diagram">doc 1: "red running shoes"
doc 2: "red dress"

red     -&gt; [1, 2]
run     -&gt; [1]
shoe    -&gt; [1]
dress   -&gt; [2]</pre>
<p>Each term maps to a <b>postings list</b> of document ids (plus positions and frequencies). A query for "red shoes" intersects or merges two short lists instead of scanning every document. That is why <code>LIKE '%shoe%'</code> on a big table loses to a search engine.</p>`
        },
        {
          title: 'Analyzers',
          body: `<p>Before indexing, text runs through an <b>analyzer</b>: character filters, then a <b>tokenizer</b> (split into words), then <b>token filters</b> (lowercase, stop words, stemming, synonyms).</p>
<pre class="diagram">POST _analyze
{ "analyzer": "english", "text": "Running Shoes" }

-&gt; tokens: "run", "shoe"</pre>
<p>The same analyzer runs on the <b>query</b>, so "shoe" matches "Shoes". Most "why doesn't this match?" bugs are analyzer mismatches. Test with <code>_analyze</code>.</p>`
        },
        {
          title: 'Elasticsearch and OpenSearch vocabulary',
          body: `<ul><li><b>Index</b>: a collection of documents, roughly a table.</li>
<li><b>Document</b>: a JSON object with an <code>_id</code>.</li>
<li><b>Mapping</b>: the schema. <code>text</code> fields are analyzed for full-text. <code>keyword</code> fields are stored exactly, for filters, sorting and aggregations.</li></ul>
<p>Changing an existing field's type means <b>reindexing</b> into a new index. Point the app at an <b>alias</b> so you can swap indexes without a deploy.</p>
<p><b>OpenSearch</b> is the Apache-2.0 fork of Elasticsearch that AWS started after Elastic changed its license. The core concepts are the same.</p>`
        },
        {
          title: 'Shards and replicas',
          body: `<pre class="diagram">PUT products
{
  "settings": {
    "number_of_shards": 3,
    "number_of_replicas": 1
  }
}</pre>
<p>A big index doesn't fit on one machine, so Elasticsearch <b>splits it into pieces called shards</b> and spreads them across nodes. A search asks every shard and merges the results. Each shard also gets <b>replicas</b>: copies on other nodes, kept for safety and to share search load.</p>
<p>The practical gotcha: pick the number of shards when you create the index. Changing it later means building a new index. The replica count can change any time. Unit 08 and the Scaling data module go deeper.</p>`
        },
        {
          title: 'Near-real-time: the refresh interval',
          body: `<p>A newly indexed document is <b>not searchable immediately</b>. It becomes visible after a <b>refresh</b>, which opens a new Lucene segment. By default that happens about every second.</p>
<pre class="diagram">PUT products/_settings
{ "index": { "refresh_interval": "30s" } }</pre>
<p>Longer intervals mean better indexing throughput. For a big bulk load, set it to <code>"-1"</code> (and replicas to 0), then restore. Search is <b>near-real-time</b>. Don't use it to read your own writes in the same request; read from the primary DB.</p>`
        }
      ],
      quiz: [
        {
          q: 'What will this return?',
          code: `POST _analyze
{
  "analyzer": "english",
  "text": "The Foxes Jumped"
}`,
          options: [
            'Tokens "The", "Foxes", "Jumped", unchanged',
            'One token "the foxes jumped"',
            'Lowercased, stemmed tokens with the stop word removed, like "fox" and "jump"',
            'An error, because _analyze requires an index name'
          ],
          answer: 2,
          explain: 'The english analyzer lowercases, drops stop words like "the", and stems. _analyze also works without an index when you name a built-in analyzer.'
        },
        {
          q: 'You index a product and search for it immediately in the same request. It is not found. Most likely cause?',
          options: [
            'The document has not been refreshed into a searchable segment yet',
            'The mapping rejected the document',
            'Replicas are out of sync',
            'The query needs a term clause instead of match'
          ],
          answer: 0,
          explain: 'Elasticsearch and OpenSearch are near-real-time: new documents appear after the next refresh, roughly a second by default.'
        },
        {
          q: 'Your products index has 3 primary shards and you want 6. What do you do?',
          options: [
            'PUT _settings with number_of_shards: 6',
            'Increase number_of_replicas to 2',
            'Restart the cluster with more nodes',
            'Create a new index with 6 shards, reindex into it, then move the alias'
          ],
          answer: 3,
          explain: 'The shard count is fixed when the index is created. Replicas can be changed live, but they are copies, not more pieces.'
        },
        {
          q: 'Which mapping type should a "brand" field use if you filter and aggregate on exact values?',
          options: ['text', 'keyword', 'match_only_text', 'object'],
          answer: 1,
          explain: 'keyword stores the exact value without analysis, which is what filters, sorting and aggregations need.'
        },
        {
          q: 'What does an inverted index map?',
          options: [
            'Document ids to their full text',
            'Terms to the list of documents containing them',
            'Primary keys to disk pages',
            'Queries to cached results'
          ],
          answer: 1,
          explain: 'Each term points to a postings list of matching documents, which makes word lookups fast.'
        }
      ]
    },
    {
      id: 't8-queries-relevance',
      type: 'lesson',
      title: 'Queries and relevance',
      minutes: 7,
      cards: [
        {
          title: 'match vs term',
          body: `<ul><li><b>match</b>: analyzes the query text with the field's analyzer, then searches. Use it on <code>text</code> fields.</li>
<li><b>term</b>: looks up the exact value with no analysis. Use it on <code>keyword</code>, numbers, booleans and dates.</li></ul>
<p>Classic bug: <code>{"term": {"name": "Running Shoes"}}</code> on a text field finds nothing, because the index holds lowercase tokens like <code>run</code> and <code>shoe</code>, not the original string.</p>`
        },
        {
          title: 'bool: must vs filter',
          body: `<pre class="diagram">GET products/_search
{
  "query": {
    "bool": {
      "must":   [{ "match": { "name": "running shoes" } }],
      "filter": [{ "term":  { "brand": "acme" } },
                 { "range": { "price": { "lte": 100 } } }]
    }
  }
}</pre>
<p><b>must</b> clauses affect the relevance score. <b>filter</b> clauses are yes/no, skip scoring, and can be cached. Put facets like brand, price, and in-stock in <code>filter</code>.</p>`
        },
        {
          title: 'BM25 in one minute',
          body: `<p>The default scoring function is <b>BM25</b>. A document scores higher when:</p>
<ul><li>the term appears <b>more often</b> in it (with diminishing returns, so spamming a word doesn't win),</li>
<li>the term is <b>rare</b> across the index (inverse document frequency: "titanium" counts more than "the"),</li>
<li>the field is <b>short</b> (a match in a 5-word title beats one in a 2,000-word description).</li></ul>
<p>Scores are relative within one query. Don't compare them across queries.</p>`
        },
        {
          title: 'Boosting and business signals',
          body: `<pre class="diagram">"multi_match": {
  "query": "trail shoes",
  "fields": ["name^3", "brand^2", "description"]
}</pre>
<p><code>^3</code> weights matches in <code>name</code> three times as much. Real product search also mixes in signals text can't see: popularity, ratings, margin, stock. Use <code>function_score</code> to blend them in, for example by multiplying by log(sales).</p>
<p>Tune relevance with a set of real queries and expected results, not gut feel.</p>`
        },
        {
          title: 'Search-as-you-type',
          body: `<p>Prefix matching on every keystroke needs special indexing:</p>
<ul><li><b>edge n-grams</b> at index time: "shoe" becomes <code>s, sh, sho, shoe</code>. Fast prefix queries, bigger index.</li>
<li>the <b>search_as_you_type</b> field type, queried with a <code>multi_match</code> of type <code>bool_prefix</code>.</li>
<li>the <b>completion suggester</b>: an in-memory structure for very fast prefix suggestions.</li></ul>
<p>Add <b>fuzziness</b> for typo tolerance. On the client, debounce keystrokes (around 100–200 ms) and cancel stale requests.</p>`
        }
      ],
      quiz: [
        {
          q: 'Why does this query return no hits even though a product is named "Running Shoes"?',
          code: `GET products/_search
{
  "query": {
    "term": { "name": "Running Shoes" }
  }
}
// mapping: "name": { "type": "text", "analyzer": "english" }`,
          options: [
            'term queries only work on numeric fields',
            'The index has not been refreshed',
            'term is case-sensitive but otherwise analyzes the input',
            'term skips analysis, but the indexed tokens are lowercased and stemmed ("run", "shoe")'
          ],
          answer: 3,
          explain: 'term looks for the exact string "Running Shoes", which was never indexed. Use match on text fields.'
        },
        {
          q: 'In a bool query, where should a "price <= 100" condition go, and why?',
          options: [
            'filter: it is yes/no, needs no scoring, and can be cached',
            'must: so that cheaper items score higher',
            'should: so that it is optional',
            'must_not: to exclude expensive items'
          ],
          answer: 0,
          explain: 'Filters do not contribute to the score and are cacheable, which is exactly what facet-style constraints need.'
        },
        {
          q: 'Under BM25, which document likely ranks higher for the query "titanium"?',
          options: [
            'A 3,000-word article mentioning titanium once',
            'A document that repeats "titanium" 500 times',
            'A 6-word product title containing "titanium"',
            'They score the same; BM25 only checks presence'
          ],
          answer: 2,
          explain: 'Length normalization favors short fields, and term frequency saturates, so repeating the word gives diminishing returns.'
        },
        {
          q: 'What does "name^3" do in this query?',
          code: `"multi_match": {
  "query": "trail shoes",
  "fields": ["name^3", "description"]
}`,
          options: [
            'Requires the term to appear 3 times in name',
            'Weights matches in name three times more than in description',
            'Returns only the top 3 names',
            'Allows 3 typos in the name field'
          ],
          answer: 1,
          explain: 'The ^ operator is a per-field boost that multiplies that field’s score contribution.'
        }
      ]
    },
    {
      id: 't8-sync-options',
      type: 'lesson',
      title: 'Syncing search and choosing a tool',
      minutes: 7,
      cards: [
        {
          title: 'Search is a secondary index',
          body: `<p>Keep the <b>primary database as the source of truth</b> and treat the search cluster as a derived, rebuildable copy. Don't store anything only in Elasticsearch.</p>
<p>That gives you two jobs: keep it <b>in sync</b> as data changes, and be able to <b>rebuild it</b> from scratch: create a new index, bulk load, catch up, then switch the alias.</p>`
        },
        {
          title: 'Dual writes and why they drift',
          body: `<pre class="diagram">db.save(product)       // succeeds
search.index(product)  // times out -&gt; now out of sync</pre>
<p>Writing to the DB and the search index from app code looks simple, but:</p>
<ul><li>There is no atomicity. One write can succeed and the other fail.</li>
<li>Two concurrent updates can reach the index in the opposite order, so an older version wins.</li></ul>
<p>Retries and a nightly reconcile job help, but drift is built into the approach.</p>`
        },
        {
          title: 'Keeping search in sync, simply',
          body: `<p>Two simple approaches, often used together:</p>
<ul><li><b>Periodic sync</b>: every few minutes, a job fetches rows changed since its last run and bulk-indexes them.</li>
<li><b>Update right after the write</b>: after the DB commit, index the product (inline or in a background job) and accept brief drift when it fails.</li></ul>
<pre class="diagram">SELECT id, name, description, price, updated_at
FROM products
WHERE updated_at &gt; :last_sync
ORDER BY updated_at LIMIT 1000;</pre>
<p>The sweep repairs anything the immediate update missed. Gotcha: hard-deleted rows never show up, so use a <code>deleted_at</code> soft delete. The Messaging and Scaling data modules show more robust approaches.</p>`
        },
        {
          title: 'Postgres full-text: the simpler option',
          body: `<pre class="diagram">ALTER TABLE products ADD COLUMN search tsvector
  GENERATED ALWAYS AS (to_tsvector('english',
    coalesce(name,'') || ' ' || coalesce(description,''))) STORED;
CREATE INDEX products_search_idx ON products USING gin (search);

SELECT id, name FROM products
WHERE search @@ websearch_to_tsquery('english', 'red shoes')
LIMIT 20;</pre>
<p>No extra cluster and no sync problem. It is always consistent with your data. It works well up to millions of rows with basic ranking (<code>ts_rank</code>). Add <code>pg_trgm</code> for fuzzy matching. Move to a dedicated engine when you need advanced relevance tuning, facets at scale, or heavy query load.</p>`
        },
        {
          title: 'Managed and lighter engines',
          body: `<ul><li><b>Algolia</b>: hosted search-as-a-service. Very fast, typo-tolerant, easy instant search UIs. You push records via API. Pricing scales with records and requests.</li>
<li><b>Meilisearch</b> and <b>Typesense</b>: open-source, simple, typo-tolerant engines you can self-host or buy as cloud. Good for product and site search without Elasticsearch-level ops.</li>
<li><b>Amazon OpenSearch Service</b> and <b>Elastic Cloud</b>: managed clusters when you need the full feature set (aggregations, logs, complex scoring).</li></ul>
<p>Interview line: "Postgres FTS first. A dedicated engine when relevance or scale demands it."</p>`
        }
      ],
      quiz: [
        {
          q: 'What can go wrong with this code?',
          code: `def update_product(p):
    db.execute("UPDATE products SET name=%s WHERE id=%s",
               (p.name, p.id))
    db.commit()
    es.index(index="products", id=p.id, document=p.to_dict())`,
          options: [
            'Nothing; the commit makes both writes atomic',
            'The DB commit can succeed while the es.index call fails, leaving search stale',
            'es.index will block DB writes until it finishes',
            'Elasticsearch will reject the document because the DB already committed'
          ],
          answer: 1,
          explain: 'This is a dual write. The two systems have no shared transaction, so a failure leaves search stale. Back it with a periodic sync that repairs drift.'
        },
        {
          q: 'A job runs this every 5 minutes and bulk-indexes the rows it returns. What is the main gap?',
          code: `SELECT id, name, price, updated_at
FROM products
WHERE updated_at > :last_sync
ORDER BY updated_at
LIMIT 1000;`,
          options: [
            'It indexes products twice, corrupting the index',
            'It cannot use an index, so it scans the whole table every run',
            'Search can be ~5 minutes stale, and rows deleted from the table never appear, so they stay searchable',
            'It locks the products table while it runs'
          ],
          answer: 2,
          explain: 'A sweep only sees rows that still exist. Use a deleted_at soft delete so deletions show up as changes, and accept minutes of lag.'
        },
        {
          q: 'A startup has 200k products in Postgres and wants basic keyword search. Best first step?',
          options: [
            'Postgres full-text search with a tsvector column and a GIN index',
            'A 6-node Elasticsearch cluster with its own sync pipeline',
            'LIKE \'%term%\' queries on name and description',
            'A vector database'
          ],
          answer: 0,
          explain: 'Postgres FTS handles this size well, with no new infrastructure and no sync problem. LIKE with a leading wildcard cannot use a B-tree index.'
        },
        {
          q: 'Your Elasticsearch cluster lost its data after a bad upgrade. Postgres is fine. What do you do?',
          options: [
            'Restore the products table from the search index',
            'Rebuild: create a new index, bulk-load it from Postgres, catch up recent changes, then point the alias at it',
            'Wait for replicas to copy the data back from Postgres automatically',
            'Tell users search is gone until next quarter'
          ],
          answer: 1,
          explain: 'Search is a derived copy of the database. Because Postgres is the source of truth, you can always rebuild the index from it.'
        }
      ]
    },
    {
      id: 't8-byte-typeahead',
      type: 'byte',
      title: 'Interview Byte: search-as-you-type for 50M products',
      minutes: 6,
      prompt:
        'Add search-as-you-type to an e-commerce site with 50M products. Results should appear while the user types, tolerate typos, and rank popular items first. Product data lives in Postgres. Walk through your design.',
      hints: [
        'How does a prefix like "nik" match "Nike" quickly?',
        'How do product changes get from Postgres into the search index?',
        'What can you do on the client and in caches to cut load?'
      ],
      model: `<ol><li><b>Engine</b>: Elasticsearch/OpenSearch (or Algolia if buying). 50M docs: several primary shards, 1+ replica, behind an alias.</li>
<li><b>Mapping</b>: <code>name</code> as <code>search_as_you_type</code> (or edge n-grams), <code>brand</code>/<code>category</code> as keyword, plus <code>popularity</code> and <code>in_stock</code>.</li>
<li><b>Query</b>: <code>multi_match</code> <code>bool_prefix</code> with fuzziness, <code>name^3</code>, in-stock as a <code>filter</code>, <code>function_score</code> on popularity. Return ~10 hits with a small <code>_source</code>.</li>
<li><b>Sync</b>: Postgres stays the source of truth. A background job indexes each product right after it changes, and a sweep on <code>updated_at</code> (with soft deletes) every minute repairs anything missed. A minute of lag is fine for a catalog. At larger scale, CDC or an outbox (later modules) makes this robust.</li>
<li><b>Load</b>: debounce in the client, minimum 2 characters, cancel stale requests, keep results for the most popular prefixes ready.</li>
<li><b>Rebuilds</b>: reindex into a new index, then swap the alias. Track latency p99 and zero-result rate.</li></ol>`,
      points: [
        'Chose a dedicated search engine and justified it over Postgres at this scale',
        'Used prefix indexing (edge n-grams, search_as_you_type or completion suggester)',
        'Handled typos (fuzziness) and popularity in ranking',
        'Kept Postgres as the source of truth with a sync that repairs drift (sweep, background job, or CDC)',
        'Reduced load with debounce, a minimum prefix length and popular-prefix results',
        'Mentioned shards/replicas or alias-based reindexing'
      ]
    }
  ]
}
