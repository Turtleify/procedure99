import type { Unit } from '../../../shared/types'

export const CURRICULUM: Unit[] = [
  // ───────────────────────────── UNIT 1 ─────────────────────────────
  {
    id: 'u1',
    title: 'Foundations',
    subtitle: 'Servers, and the three ways they fail',
    icon: 'server',
    color: '#6c8cff',
    lessons: [
      {
        id: 'u1-servers',
        type: 'lesson',
        title: 'What is a server?',
        minutes: 4,
        cards: [
          {
            title: 'A server is just a computer',
            body: `<p>A <b>server</b> is a computer running a program that <b>listens for requests</b> on a network port and <b>sends back responses</b>. Your laptop running <code>npm run dev</code> is a server.</p>
<p>In production the "computer" is usually a <b>virtual machine or container</b> in someone's data center (AWS, GCP, Azure), but the idea is identical.</p>`
          },
          {
            title: 'Where does your code live?',
            body: `<pre class="diagram">  Browser / App  ──HTTP──▶  App server (your code)  ──SQL──▶  Database
     (client)                 (stateless logic)                (the truth)</pre>
<ul><li><b>Client</b>: the browser or mobile app that sends requests.</li>
<li><b>App server</b>: runs your business logic (Node, Java, Go…).</li>
<li><b>Database</b>: durably stores data. Ideally on its <i>own</i> machine.</li></ul>`
          },
          {
            title: 'The single-server starting point',
            body: `<p>Every system starts small: app + database on <b>one machine</b>. It's cheap and simple, and that's fine for a prototype.</p>
<div class="callout">But it is a <b>single point of failure (SPOF)</b>: one machine dying takes down everything, and its CPU/RAM are finite.</div>`
          },
          {
            title: 'So what is "system design"?',
            body: `<p>System design is deciding <b>which pieces to use and how to connect them</b> so the system stays:</p>
<ul><li><b>Scalable</b>: handles more users without falling over</li><li><b>Available</b>: stays up when parts fail</li><li><b>Fast</b>: low latency</li><li><b>Correct & durable</b>: doesn't lose or corrupt data</li></ul>
<p>Almost every concept in this course exists to fix one specific failure of the simple setup.</p>`
          }
        ],
        quiz: [
          {
            q: 'What is a server, fundamentally?',
            options: [
              'Special hardware that only cloud providers own',
              'A computer running a program that listens for requests and responds',
              'Another name for a database',
              'A network cable standard'
            ],
            answer: 1,
            explain: 'Any computer can be a server: it is a role (listening and responding), not a kind of hardware.'
          },
          {
            q: 'Why is running everything on one machine risky?',
            options: [
              'It is too expensive',
              'Databases cannot run on the same machine as code',
              'It is a single point of failure with finite CPU/RAM',
              'Browsers refuse to connect to single servers'
            ],
            answer: 2,
            explain: 'One machine = one thing that can die (SPOF), and a hard ceiling on resources.'
          },
          {
            q: 'Where should data that must survive a restart live?',
            options: ['In the app server’s memory', 'In a database / durable storage', 'In the browser tab', 'In the load balancer'],
            answer: 1,
            explain: 'App server memory is wiped on restart or crash. Durable data belongs in a database or storage service.'
          },
          {
            q: 'Which is NOT one of the core goals system design trades off?',
            options: ['Scalability', 'Availability', 'Latency', 'Which IDE the team uses'],
            answer: 3,
            explain: 'Scalability, availability, latency, consistency/durability are the core qualities. Tooling preferences are not architecture.'
          }
        ]
      },
      {
        id: 'u1-failures',
        type: 'lesson',
        title: 'The three failures',
        minutes: 5,
        cards: [
          {
            title: 'Failure #1: CPU and RAM run out',
            body: `<p>Traffic grows; one app server is pegged at 100% CPU. Requests queue and time out.</p>
<p><b>Fix:</b> run <b>multiple app servers</b> and put a <b>load balancer</b> in front to spread requests across them.</p>
<pre class="diagram">          ┌──▶ app-1
client ─▶ LB ──▶ app-2 ──▶ DB
          └──▶ app-3</pre>`
          },
          {
            title: 'Failure #2: the database is overloaded',
            body: `<p>Now many app servers all hammer one database, mostly with the <b>same reads</b> (the homepage, popular products).</p>
<p><b>Fix:</b> add a <b>cache</b> (e.g. Redis), an in-memory store that answers repeat reads in ~1ms so most never reach the DB.</p>
<div class="callout">Memory is ~100–1000x faster than a disk-backed DB query, and a cache hit costs the DB nothing.</div>`
          },
          {
            title: 'Failure #3: the machine dies',
            body: `<p>Disks fail, data centers lose power. Two complementary fixes:</p>
<ul><li><b>Replication</b>: keep live copies of the DB on other machines. If the primary dies, promote a replica (<i>failover</i>). This is about <b>availability</b>.</li>
<li><b>Backups</b>: periodic snapshots (+ logs for point-in-time recovery) stored elsewhere (e.g. S3). This is about <b>recoverability</b>.</li></ul>`
          },
          {
            title: 'Replication ≠ backup',
            body: `<p>If someone runs <code>DELETE FROM users;</code>, replication <b>faithfully copies the delete</b> to every replica within milliseconds.</p>
<div class="callout">Replicas protect against <b>machine</b> failure.<br/>Backups protect against <b>human/software</b> failure (bad deploys, corruption, deletes).<br/>You need both.</div>`
          }
        ],
        quiz: [
          {
            q: 'Your app server is at 100% CPU at peak; the database is at 20%. What is the first fix in this mental model?',
            options: ['Add a cache', 'Add a load balancer and more app servers', 'Add database replicas', 'Take nightly backups'],
            answer: 1,
            explain: 'The bottleneck is app compute, not the DB. Spread load across more app servers behind a load balancer.'
          },
          {
            q: 'The DB is overwhelmed by thousands of identical reads of the same product page. Best fix?',
            options: ['Put a cache in front of the database', 'Add more app servers', 'Increase the backup frequency', 'Switch to a monolith'],
            answer: 0,
            explain: 'Repeated identical reads are the textbook case for caching. More app servers would only send the DB more traffic.'
          },
          {
            q: 'Why is replication alone not a backup strategy?',
            options: [
              'Replicas are always out of date',
              'Accidental deletes and corruption replicate to every copy too',
              'Replicas cannot be read from',
              'Replication is too slow'
            ],
            answer: 1,
            explain: 'Replication copies every change, including the bad ones. Backups let you go back in time.'
          },
          {
            q: 'You need to restore the database to exactly how it was at 2:14pm yesterday. What makes that possible?',
            options: [
              'A read replica',
              'A larger cache',
              'Point-in-time recovery: a base snapshot plus replayed transaction logs (WAL/binlog)',
              'A load balancer health check'
            ],
            answer: 2,
            explain: 'PITR restores the last snapshot then replays logged changes up to a chosen timestamp.'
          },
          {
            q: 'Which failure is replication (with failover) primarily designed to handle?',
            options: ['A database machine dying', 'A slow SQL query', 'A bad deploy deleting data', 'Too many identical reads'],
            answer: 0,
            explain: 'Replication keeps a live copy ready to take over when hardware fails: availability.'
          }
        ]
      },
      {
        id: 'u1-hld-lld',
        type: 'lesson',
        title: 'HLD vs LLD',
        minutes: 3,
        cards: [
          {
            title: 'High-Level Design (HLD)',
            body: `<p>The <b>boxes and arrows</b>: which services, databases, caches, queues and load balancers exist, and how data flows between them.</p>
<p>Answers: <i>"What are the components and how do they talk?"</i></p>
<p>Example: <i>"Design YouTube"</i> → upload service, object storage, transcoding workers, CDN, metadata DB.</p>`
          },
          {
            title: 'Low-Level Design (LLD)',
            body: `<p>What happens <b>inside one box</b>: classes, interfaces, database schemas, API signatures, design patterns.</p>
<p>Answers: <i>"How is this component built?"</i></p>
<p>Example: <i>"Design a parking lot"</i> → <code>ParkingLot</code>, <code>Spot</code>, <code>Ticket</code> classes, the strategy for assigning spots.</p>`
          },
          {
            title: 'In interviews',
            body: `<ul><li><b>"Design Twitter / Uber / a URL shortener"</b> → usually HLD.</li>
<li><b>"Design a parking lot / elevator / chess game"</b> → usually LLD (OOP).</li></ul>
<div class="callout">This course focuses on <b>HLD</b>: the architecture-level decisions and their tradeoffs.</div>`
          }
        ],
        quiz: [
          {
            q: 'Deciding that video uploads go to object storage and are processed by a pool of transcoding workers is…',
            options: ['HLD', 'LLD', 'Neither', 'Both equally'],
            answer: 0,
            explain: 'Choosing components and data flow between them is high-level design.'
          },
          {
            q: 'Defining a `Vehicle` interface with `Car` and `Truck` subclasses for a parking system is…',
            options: ['HLD', 'LLD', 'Capacity planning', 'Networking'],
            answer: 1,
            explain: 'Class hierarchies and interfaces live inside a component: low-level design.'
          },
          {
            q: '"Design a URL shortener" in a system design interview most likely expects…',
            options: ['A class diagram only', 'HLD: APIs, storage, caching, scaling', 'A sorting algorithm', 'UI mockups'],
            answer: 1,
            explain: 'Classic HLD question: discuss components, data model, scale and tradeoffs.'
          }
        ]
      },
      {
        id: 'u1-byte',
        type: 'byte',
        title: 'Interview Byte: 100x traffic',
        minutes: 5,
        prompt:
          'Your side project runs on a single server (app + database together). It suddenly gets 100x more traffic. Walk the interviewer through how you would evolve the architecture, step by step.',
        hints: ['Find the first bottleneck before fixing anything', 'Think about the three failures', 'What happens if a machine dies?'],
        model: `<ol><li><b>Separate</b> the database onto its own machine so app and DB don't fight for resources.</li>
<li><b>Measure</b> where the bottleneck is (CPU on app? DB?).</li>
<li>App CPU bound → run <b>multiple app servers</b> behind a <b>load balancer</b>; make them <b>stateless</b>.</li>
<li>DB read-heavy → add a <b>cache</b> (Redis) for hot reads, then <b>read replicas</b>.</li>
<li>Remove SPOFs: <b>replication with failover</b> for the DB, redundant LBs, plus <b>backups</b> with point-in-time recovery.</li>
<li>Static assets → <b>CDN</b>. Only much later, if writes outgrow one DB → <b>sharding</b>.</li></ol>`,
        points: [
          'Split the DB from the app server',
          'Identify the bottleneck before fixing',
          'Load balancer + multiple app servers',
          'Cache for hot reads',
          'Replication / failover AND backups',
          'Mention CDN or sharding as later steps'
        ]
      }
    ]
  },

  // ───────────────────────────── UNIT 2 ─────────────────────────────
  {
    id: 'u2',
    title: 'Requirements',
    subtitle: 'Know what you are building before you build it',
    icon: 'clipboard',
    color: '#4fc3f7',
    lessons: [
      {
        id: 'u2-fr-nfr',
        type: 'lesson',
        title: 'Functional vs non-functional',
        minutes: 5,
        cards: [
          {
            title: 'Functional requirements: WHAT it does',
            body: `<p>Features and behaviors a user can observe.</p>
<ul><li>Users can post a photo</li><li>Users can follow other users</li><li>Users see a feed of people they follow</li></ul>
<p>Usually phrased <i>"Users can…"</i>.</p>`
          },
          {
            title: 'Non-functional requirements: HOW WELL',
            body: `<p>Qualities of the system:</p>
<ul><li><b>Latency</b>: feed loads in &lt; 200ms (p99)</li><li><b>Availability</b>: 99.99% uptime</li><li><b>Scalability</b>: 100M daily users</li>
<li><b>Consistency</b>: is it OK if a like shows up 2s late?</li><li><b>Durability</b>: never lose an uploaded photo</li><li><b>Security / compliance</b></li></ul>`
          },
          {
            title: 'The nines',
            body: `<table class="mini"><tr><th>Availability</th><th>Downtime / year</th><th>/ 30-day month</th></tr>
<tr><td>99%</td><td>~3.65 days</td><td>~7.2 h</td></tr>
<tr><td>99.9%</td><td>~8.76 h</td><td>~43 min</td></tr>
<tr><td>99.99%</td><td>~52.6 min</td><td>~4.3 min</td></tr>
<tr><td>99.999%</td><td>~5.3 min</td><td>~26 s</td></tr></table>
<p>Each extra nine costs dramatically more: redundancy everywhere, automated failover, multi-region.</p>`
          },
          {
            title: 'NFRs drive the architecture',
            body: `<p>The <i>same feature</i> ("show a feed") is a single SQL query at 1k users and a fan-out pipeline with caches and queues at 100M users.</p>
<div class="callout">Functional requirements tell you <b>what boxes</b> you need. Non-functional requirements tell you <b>how big, how many, and how redundant</b> they are.</div>`
          }
        ],
        quiz: [
          {
            q: '"Users can reset their password via email" is a…',
            options: ['Functional requirement', 'Non-functional requirement', 'Capacity estimate', 'Deployment detail'],
            answer: 0,
            explain: 'It describes a behavior the user can observe, so it is functional.'
          },
          {
            q: '"The checkout API must respond within 300ms at p99" is a…',
            options: ['Functional requirement', 'Non-functional requirement', 'Data model', 'Access pattern'],
            answer: 1,
            explain: 'Latency targets describe how well the system works, so it is non-functional.'
          },
          {
            q: 'Roughly how much downtime per year does 99.9% availability allow?',
            options: ['~5 minutes', '~52 minutes', '~8.8 hours', '~3.6 days'],
            answer: 2,
            explain: '0.1% of 8,760 hours ≈ 8.76 hours.'
          },
          {
            q: 'Why ask about non-functional requirements early in an interview?',
            options: [
              'They are the easiest to answer',
              'They determine scale, redundancy and which tradeoffs are acceptable',
              'Interviewers only care about NFRs',
              'They replace functional requirements'
            ],
            answer: 1,
            explain: 'NFRs (scale, latency, consistency, availability) decide the shape of the architecture.'
          }
        ]
      },
      {
        id: 'u2-five-questions',
        type: 'lesson',
        title: '5 questions before you design',
        minutes: 6,
        cards: [
          {
            title: 'Never start drawing immediately',
            body: `<p>Spend the first minutes asking questions. A solid five:</p>
<ol><li><b>Who are the users and what are the core features?</b> (scope it down to 2–3)</li>
<li><b>How many users / requests?</b> (DAU, peak QPS)</li>
<li><b>Read-heavy or write-heavy?</b> (read:write ratio)</li>
<li><b>How much data, growing how fast?</b> (storage)</li>
<li><b>What are latency, availability & consistency needs?</b></li></ol>`
          },
          {
            title: 'Back-of-envelope: QPS',
            body: `<p>One day ≈ <b>86,400 s</b> ≈ <b>10<sup>5</sup> s</b> (round it in your head).</p>
<pre class="diagram">10M DAU × 10 requests/day = 100M requests/day
100M / ~100k s            ≈ 1,000 QPS average
peak ≈ 2–3× average       ≈ 2,000–3,000 QPS</pre>
<p>The point is the <b>order of magnitude</b>: 1k QPS fits on a few servers; 1M QPS is a very different system.</p>`
          },
          {
            title: 'Back-of-envelope: storage',
            body: `<pre class="diagram">1M new photos/day × 500 KB ≈ 500 GB/day
× 365                       ≈ ~180 TB/year</pre>
<p>That instantly tells you: photos go to <b>object storage</b> (S3), metadata goes in a DB.</p>`
          },
          {
            title: 'Read:write ratio changes everything',
            body: `<ul><li><b>Read-heavy</b> (social feed, product catalog, 100:1): caches, read replicas, CDNs.</li>
<li><b>Write-heavy</b> (logging, IoT sensors, chat): write-optimized stores (Cassandra, LSM-trees), queues, batching, sharding.</li></ul>`
          }
        ],
        quiz: [
          {
            q: '20M DAU each make 5 requests/day. Average QPS is roughly…',
            options: ['~100', '~1,000', '~10,000', '~100,000'],
            answer: 1,
            explain: '100M requests / ~86,400 s ≈ 1,157 QPS, so ~1,000.'
          },
          {
            q: 'A system with a 100:1 read:write ratio benefits most from…',
            options: ['Caching and read replicas', 'Write batching', 'Sharding by timestamp', 'Synchronous replication everywhere'],
            answer: 0,
            explain: 'Read-dominated workloads are served by copying data closer and in more places: caches, replicas, CDNs.'
          },
          {
            q: '500K uploads/day at 2 MB each. About how much new storage per year?',
            options: ['~365 GB', '~3.6 TB', '~365 TB', '~36 PB'],
            answer: 2,
            explain: '500K × 2 MB = 1 TB/day → ~365 TB/year.'
          },
          {
            q: 'Why scope features down to 2–3 in an interview?',
            options: [
              'Interviewers hate features',
              'So you can go deep on the hard parts in limited time',
              'Because systems only ever have 3 features',
              'It is required by HLD rules'
            ],
            answer: 1,
            explain: 'Depth beats breadth: pick the core flows and design them properly.'
          }
        ]
      },
      {
        id: 'u2-byte',
        type: 'byte',
        title: 'Interview Byte: the first 5 minutes',
        minutes: 5,
        prompt: 'The interviewer says: "Design a URL shortener." Write out exactly what you would ask and estimate in your first five minutes before drawing any boxes.',
        hints: ['Functional: what are the core features?', 'Non-functional: scale, latency, availability', 'Do quick math for QPS and storage'],
        model: `<p><b>Functional:</b> shorten a long URL → short code; redirect short → long. Custom aliases? Expiry? Analytics? (Confirm which are in scope.)</p>
<p><b>Non-functional:</b> redirects must be fast (&lt;50ms) and highly available. Short links must never break (durability). Reads ≫ writes.</p>
<p><b>Estimates:</b> e.g. 100M new URLs/month ≈ 40 writes/s. With 100:1 reads ≈ 4,000 redirects/s. 500 bytes/record × 100M × 12 × 5 years ≈ 3 TB.</p>
<p><b>Conclusion:</b> read-heavy → cache aggressively; key-value access pattern (code → URL) → simple KV/NoSQL or SQL with an index.</p>`,
        points: [
          'Clarified core features (shorten + redirect)',
          'Asked about optional features (expiry, custom alias, analytics)',
          'Stated latency / availability needs',
          'Identified read-heavy ratio',
          'Estimated QPS',
          'Estimated storage'
        ]
      }
    ]
  },

  // ───────────────────────────── UNIT 3 ─────────────────────────────
  {
    id: 'u3',
    title: 'Architecture & Scaling',
    subtitle: 'Monoliths, microservices, up vs out',
    icon: 'layers',
    color: '#a06cff',
    lessons: [
      {
        id: 'u3-monolith',
        type: 'lesson',
        title: 'Monolith vs microservices',
        minutes: 6,
        cards: [
          {
            title: 'The monolith',
            body: `<p>One codebase, <b>one deployable unit</b>. All features (users, orders, payments) run in the same process.</p>
<ul><li>+ Simple to develop, test, debug and deploy</li><li class="pro">Function calls instead of network calls</li><li class="pro">Easy ACID transactions across features</li>
<li class="con">Scales as one unit: can't scale just the hot part</li><li class="con">Big teams step on each other; one bug can take down everything</li></ul>`
          },
          {
            title: 'Microservices',
            body: `<p>Many small services, each owning <b>one business capability and its own data</b>, deployed independently and talking over the network (HTTP/gRPC/queues).</p>
<ul><li class="pro">Independent deploys, scaling and tech choices per service</li><li class="pro">Teams own services end-to-end</li><li class="pro">Fault isolation (if done well)</li>
<li class="con">Network latency and partial failures everywhere</li><li class="con">Distributed transactions (sagas), data consistency is hard</li><li class="con">Heavy ops: service discovery, tracing, CI/CD per service</li></ul>`
          },
          {
            title: 'When to split',
            body: `<p>Split <b>when you feel a specific pain</b>, not because it's trendy:</p>
<ul><li>Teams block each other's releases</li><li>One component has <b>very different scaling needs</b> (e.g. video transcoding)</li><li>Different release cadence or reliability requirements</li><li>Clear, stable domain boundaries</li></ul>
<div class="callout">Common advice: start with a <b>modular monolith</b> (clean internal boundaries), and extract services along those seams later.</div>`
          }
        ],
        quiz: [
          {
            q: 'A 5-person startup still searching for product-market fit should usually start with…',
            options: ['20 microservices', 'A modular monolith', 'A service mesh', 'One serverless function per endpoint'],
            answer: 1,
            explain: 'Small team, changing requirements: a monolith maximizes speed. Keep modules clean so you can split later.'
          },
          {
            q: 'Which is a genuine cost of microservices?',
            options: ['Cannot use databases', 'Network calls fail and add latency; distributed transactions get hard', 'Cannot deploy independently', 'Must all be written in one language'],
            answer: 1,
            explain: 'In-process calls become network calls: partial failures, retries, latency, and consistency across services.'
          },
          {
            q: 'Best signal that a component should be extracted into its own service:',
            options: [
              'It has very different scaling needs from the rest (e.g. CPU-heavy video encoding)',
              'It was written last',
              'It has the most lines of code',
              'A blog post said so'
            ],
            answer: 0,
            explain: 'Different scaling / reliability / release needs are the classic reasons to split.'
          },
          {
            q: 'In a microservices architecture, each service should ideally…',
            options: ['Share one big database with all others', 'Own its own data and expose it via an API', 'Have no database', 'Write directly into other services’ tables'],
            answer: 1,
            explain: 'A shared database couples services tightly. Owning your data keeps services independently deployable.'
          }
        ]
      },
      {
        id: 'u3-scaling',
        type: 'lesson',
        title: 'Vertical vs horizontal scaling',
        minutes: 5,
        cards: [
          {
            title: 'Vertical scaling (scale UP)',
            body: `<p>Buy a <b>bigger machine</b>: more CPU, RAM, faster disk.</p>
<ul><li class="pro">No code changes, simple</li><li class="pro">Great for databases (no distribution headaches)</li>
<li class="con">Hard ceiling (the biggest box money can buy)</li><li class="con">Cost grows faster than capacity at the high end</li><li class="con">Still a single point of failure; resizing often means downtime</li></ul>`
          },
          {
            title: 'Horizontal scaling (scale OUT)',
            body: `<p>Add <b>more machines</b> and spread the work.</p>
<ul><li class="pro">Practically unlimited, uses cheap commodity machines</li><li class="pro">Fault tolerant: lose one, the rest carry on</li><li class="pro">Elastic: autoscale up and down with traffic</li>
<li class="con">Needs a load balancer and <b>stateless</b> servers</li><li class="con">Much harder for stateful systems like databases (replication, sharding)</li></ul>`
          },
          {
            title: 'What real systems do',
            body: `<ul><li><b>App tier</b>: stateless → scale <b>horizontally</b> (autoscaling groups, Kubernetes).</li>
<li><b>Database</b>: scale <b>vertically</b> as far as is reasonable, add <b>read replicas</b>, and shard only when you must.</li></ul>
<div class="callout">Tools: <b>Docker</b> packages the app so any machine can run it; <b>Kubernetes</b> runs and autoscales many copies.</div>`
          }
        ],
        quiz: [
          {
            q: 'Main limitation of vertical scaling?',
            options: ['Requires rewriting the app', 'A hard ceiling and it is still a single point of failure', 'Cannot run databases', 'Needs a load balancer'],
            answer: 1,
            explain: 'There is always a biggest machine, and one machine is still one point of failure.'
          },
          {
            q: 'What does horizontal scaling of app servers require?',
            options: ['Stateless servers behind a load balancer', 'A single huge server', 'Sharding the codebase', 'Synchronous replication'],
            answer: 0,
            explain: 'Any server must be able to handle any request, so state lives elsewhere and a LB distributes traffic.'
          },
          {
            q: 'Your Postgres DB is at 70% CPU on 8 vCPUs and growing slowly. Simplest reasonable next step?',
            options: ['Shard into 16 databases', 'Scale vertically to a larger instance', 'Rewrite to microservices', 'Move to a CDN'],
            answer: 1,
            explain: 'For a DB with modest growth, a bigger box is cheap and simple compared to sharding complexity.'
          },
          {
            q: 'Which tool runs and autoscales many copies of a containerized service?',
            options: ['Kubernetes', 'Memcached', 'PostgreSQL', 'DNS'],
            answer: 0,
            explain: 'Kubernetes schedules containers, restarts failures, and autoscales replicas.'
          }
        ]
      },
      {
        id: 'u3-byte',
        type: 'byte',
        title: 'Interview Byte: "Let’s do microservices"',
        minutes: 5,
        prompt: 'Your company’s monolith is getting slow and deploys are painful. The CTO wants to rewrite everything as microservices. What do you say, and what would you actually do?',
        hints: ['Diagnose before prescribing', 'What problem does each option actually solve?', 'Incremental vs big-bang'],
        model: `<p>First <b>diagnose</b>: is "slow" a performance problem (queries, missing indexes, no caching) or an organizational one (teams blocking deploys)? Microservices fix the second, not the first.</p>
<p>Performance → profile, add indexes/caches, scale the monolith horizontally.</p>
<p>Deploy pain → improve CI/CD and modularize the monolith. Then <b>extract services incrementally</b> (strangler-fig pattern) along clear domain boundaries, starting with the part with the most distinct scaling/release needs.</p>
<p>Avoid a big-bang rewrite: it stalls feature work and imports all the distributed-systems costs at once.</p>`,
        points: [
          'Diagnose the actual bottleneck first',
          'Distinguish performance problems from team/deploy problems',
          'Mention cheaper fixes (indexes, caching, horizontal scaling)',
          'Incremental extraction (strangler fig) over big-bang rewrite',
          'Named a cost of microservices (network, consistency, ops)'
        ]
      }
    ]
  },

  // ───────────────────────────── UNIT 4 ─────────────────────────────
  {
    id: 'u4',
    title: 'Traffic',
    subtitle: 'Requests, load balancers, and state',
    icon: 'network',
    color: '#3ddc97',
    lessons: [
      {
        id: 'u4-request',
        type: 'lesson',
        title: 'How a request actually travels',
        minutes: 6,
        cards: [
          {
            title: '1. DNS: name → IP',
            body: `<p>You type <code>shop.com</code>. The browser checks its cache, then the OS, then a <b>recursive resolver</b> (your ISP / 1.1.1.1), which walks <b>root → .com TLD → shop.com's authoritative server</b> and returns an IP.</p>
<p>That IP is often a <b>CDN edge</b> or a <b>load balancer</b>, not an app server. Results are cached per their <b>TTL</b>.</p>`
          },
          {
            title: '2. Connect: TCP + TLS',
            body: `<p>The browser opens a <b>TCP</b> connection (3-way handshake) and does a <b>TLS</b> handshake to agree on encryption keys. That's 1–3 round trips before any HTTP is sent, which is why connection reuse (keep-alive, HTTP/2, HTTP/3) matters.</p>`
          },
          {
            title: '3. Edge → LB → app → data',
            body: `<pre class="diagram">browser ─▶ CDN edge ─(miss)─▶ Load balancer ─▶ App server ─▶ Cache ─(miss)─▶ DB
   ◀──────────────────────── response travels back ◀────────────────────────</pre>
<ul><li><b>CDN</b> answers static files (images, JS) near the user.</li><li><b>LB</b> terminates TLS and picks a healthy app server.</li><li><b>App</b> runs logic, checks the <b>cache</b>, then the <b>DB</b>.</li></ul>`
          },
          {
            title: 'Latency numbers to remember',
            body: `<table class="mini"><tr><th>Operation</th><th>~Time</th></tr>
<tr><td>Read from RAM</td><td>~100 ns</td></tr>
<tr><td>SSD random read</td><td>~100 µs</td></tr>
<tr><td>Round trip within a data center</td><td>~0.5 ms</td></tr>
<tr><td>Round trip US ↔ Europe</td><td>~80–150 ms</td></tr></table>
<p>Every network hop costs time. Physical distance is why CDNs and multi-region deployments exist.</p>`
          }
        ],
        quiz: [
          {
            q: 'What does DNS resolution return to the browser?',
            options: ['The HTML page', 'An IP address (often a CDN or load balancer)', 'A TLS certificate', 'A database connection'],
            answer: 1,
            explain: 'DNS maps names to IP addresses, frequently pointing at an edge or LB rather than an app server.'
          },
          {
            q: 'Why do HTTP keep-alive and HTTP/2 connection reuse matter?',
            options: ['They encrypt data', 'They avoid repeating TCP+TLS handshakes (extra round trips) per request', 'They compress images', 'They replace DNS'],
            answer: 1,
            explain: 'Handshakes cost round trips. Reusing a connection skips them.'
          },
          {
            q: 'Which is fastest?',
            options: ['Cross-continent round trip', 'SSD random read', 'Reading from RAM', 'Round trip within a data center'],
            answer: 2,
            explain: 'RAM ~100ns ≪ SSD ~100µs ≪ in-DC RTT ~0.5ms ≪ cross-continent ~100ms.'
          },
          {
            q: 'Users in Australia load images slowly from a US-only server. Fix?',
            options: ['Add DB replicas in the US', 'Serve images through a CDN with edges near users', 'Increase DNS TTL', 'Use a bigger app server'],
            answer: 1,
            explain: 'Physics: distance = latency. A CDN caches the bytes physically close to users.'
          }
        ]
      },
      {
        id: 'u4-lb',
        type: 'lesson',
        title: 'Load balancers: health checks & distribution',
        minutes: 7,
        cards: [
          {
            title: 'Distribution algorithms',
            body: `<ul><li><b>Round robin</b>: next server in turn. Simple; assumes equal servers and equal requests.</li>
<li><b>Weighted round robin</b>: bigger servers get proportionally more.</li>
<li><b>Least connections</b>: send to the server with fewest active connections. Great when request durations vary.</li>
<li><b>IP hash / consistent hashing</b>: the same client or key always lands on the same server (affinity, cache locality).</li></ul>`
          },
          {
            title: 'Health checks',
            body: `<p>The LB must stop sending traffic to dead servers.</p>
<ul><li><b>Active</b>: LB calls <code>GET /health</code> every N seconds; after K failures the server is marked unhealthy and removed; after M successes it's added back.</li>
<li><b>Passive</b>: LB watches real traffic (timeouts, 5xx) and ejects misbehaving servers.</li></ul>
<div class="callout">A good <code>/health</code> checks what the server <i>needs</i> (e.g. can it reach the DB?), not just "process is alive". But beware: if the shared DB is down, <i>every</i> server fails health checks at once.</div>`
          },
          {
            title: 'L4 vs L7',
            body: `<ul><li><b>Layer 4 (transport)</b>: routes by IP/port, doesn't read HTTP. Very fast, any TCP/UDP protocol. e.g. AWS NLB, HAProxy TCP mode.</li>
<li><b>Layer 7 (application)</b>: reads HTTP: routes by path/host/header, terminates TLS, rewrites, rate limits. e.g. Nginx, HAProxy HTTP mode, AWS ALB, Envoy.</li></ul>`
          },
          {
            title: 'Who balances the balancer?',
            body: `<p>A single LB is itself a SPOF. Options:</p>
<ul><li>Two LBs in <b>active-passive</b> with a floating IP (keepalived/VRRP)</li><li>DNS pointing at multiple LBs</li><li>A <b>managed LB</b> (AWS ELB, GCP LB) that is redundant behind the scenes</li></ul>`
          }
        ],
        quiz: [
          {
            q: 'Some requests take 10ms and others 30s. Which algorithm avoids piling work onto busy servers?',
            options: ['Round robin', 'Least connections', 'Random', 'Alphabetical'],
            answer: 1,
            explain: 'Least connections accounts for in-flight work. Round robin blindly sends the next request to a server still stuck on 30s jobs.'
          },
          {
            q: 'A server’s process is up but it returns 500s because its DB pool is exhausted. A TCP port check says "healthy". Better approach?',
            options: ['Check more often over TCP', 'An HTTP /health endpoint that verifies dependencies and returns 503 when broken', 'Sticky sessions', 'Increase timeouts'],
            answer: 1,
            explain: 'L7 health checks that exercise real dependencies detect "alive but broken" servers.'
          },
          {
            q: 'You need to route /api/* to one pool and /images/* to another. You need a…',
            options: ['Layer 4 load balancer', 'Layer 7 load balancer', 'DNS round robin', 'Database replica'],
            answer: 1,
            explain: 'Path-based routing requires reading HTTP: Layer 7.'
          },
          {
            q: 'How do you avoid the load balancer itself being a single point of failure?',
            options: ['Make it bigger', 'Run redundant LBs (active-passive / floating IP) or use a managed LB', 'Add a cache', 'Use least connections'],
            answer: 1,
            explain: 'Redundancy at the LB tier itself, or let a cloud provider handle it.'
          },
          {
            q: 'Which algorithm keeps the same user on the same server?',
            options: ['Round robin', 'Least connections', 'IP hash / consistent hashing', 'Weighted round robin'],
            answer: 2,
            explain: 'Hashing a stable key (client IP, user id) to a server gives affinity.'
          }
        ]
      },
      {
        id: 'u4-state',
        type: 'lesson',
        title: 'Stateless vs stateful',
        minutes: 5,
        cards: [
          {
            title: 'The problem with state in servers',
            body: `<p>If server A stores your login session <b>in its own memory</b>, then:</p>
<ul><li>Your next request hitting server B → B doesn't know you → logged out.</li><li>Server A restarts or dies → every session on it is gone.</li><li>You can't freely add/remove servers.</li></ul>`
          },
          {
            title: 'Sticky sessions: a band-aid',
            body: `<p>The LB pins each user to one server (cookie or IP hash). It works, but:</p>
<ul><li>Load becomes uneven (power users pile up)</li><li>Server death still loses those sessions</li><li>Scaling down/deploying kicks users out</li></ul>`
          },
          {
            title: 'Stateless servers',
            body: `<p>Move state <b>out of the app server</b>:</p>
<ul><li>Sessions → a shared store like <b>Redis</b> or the DB</li><li>Or a signed token the client carries (<b>JWT</b>)</li><li>Files → object storage (S3), not local disk</li></ul>
<div class="callout">Now <b>any</b> server can handle <b>any</b> request. That's what makes load balancing, autoscaling and rolling deploys trivial.</div>`
          },
          {
            title: 'Where state is unavoidable',
            body: `<p>State doesn't disappear. It moves to systems <b>designed</b> to be stateful: databases, caches, queues. Those get scaled with replication and sharding (units 7–8). Some workloads (WebSocket connections, game servers) are inherently stateful and use affinity on purpose.</p>`
          }
        ],
        quiz: [
          {
            q: 'After adding a second app server, users get randomly logged out. Most likely cause?',
            options: ['DNS is broken', 'Sessions are stored in each server’s memory', 'The DB is too slow', 'TLS expired'],
            answer: 1,
            explain: 'Requests alternate between servers; only one has the session in memory.'
          },
          {
            q: 'The most robust fix for that problem is…',
            options: ['Sticky sessions', 'Store sessions in a shared store (Redis) or a signed token', 'Use one server again', 'Increase cookie expiry'],
            answer: 1,
            explain: 'Shared/session-less state makes servers interchangeable. Sticky sessions still lose sessions when a server dies.'
          },
          {
            q: 'Why are stateless app servers easy to scale horizontally?',
            options: ['They use less RAM', 'Any server can handle any request, so you just add/remove copies', 'They do not need a load balancer', 'They never crash'],
            answer: 1,
            explain: 'Interchangeable servers = trivial to add, remove, replace, autoscale.'
          },
          {
            q: 'User-uploaded files saved to the app server’s local disk cause what problem?',
            options: ['None', 'Other servers can’t see the file and it’s lost if the server dies', 'Files load too fast', 'It breaks DNS'],
            answer: 1,
            explain: 'Local disk is server state. Put files in shared object storage like S3.'
          }
        ]
      },
      {
        id: 'u4-byte',
        type: 'byte',
        title: 'Interview Byte: the logout bug',
        minutes: 5,
        prompt: 'You scaled from 1 to 3 app servers behind a round-robin load balancer. Users now report being randomly logged out and carts emptying. Explain why it happens and walk through your fix options with tradeoffs.',
        hints: ['Where does the session live?', 'Option 1 is quick; option 2 is right', 'What happens on deploys?'],
        model: `<p><b>Why:</b> sessions/carts live in each server's memory. Round robin sends consecutive requests to different servers, which don't have that state.</p>
<p><b>Quick fix: sticky sessions</b> (LB cookie affinity). Works immediately, but load gets uneven, and a server crash or deploy still wipes its users' sessions.</p>
<p><b>Real fix: make servers stateless.</b> Store sessions/carts in <b>Redis</b> (fast, TTLs, replicated) or the DB, or use signed tokens (JWT) for auth. Then any server handles any request, and autoscaling and rolling deploys are safe.</p>
<p>Make sure the session store itself is highly available (Redis replica + failover).</p>`,
        points: [
          'Root cause: in-memory session state per server',
          'Sticky sessions as a quick fix',
          'Downsides of sticky sessions',
          'Shared session store (Redis/DB) or JWT',
          'Session store must be highly available'
        ]
      },
      {
        id: 'u4-lab',
        type: 'lab',
        title: 'Lab 1: Load balancer with Nginx',
        minutes: 15,
        intro: 'Run two tiny web servers behind Nginx with Docker, watch requests alternate, then kill a server and watch Nginx route around it. You need Docker Desktop.',
        steps: [
          {
            title: 'Create a folder with an nginx.conf',
            body: 'Make a new folder (e.g. lb-lab) and save this as nginx.conf. The upstream block is the pool of servers being balanced.',
            code: `events {}
http {
  upstream app {
    # default algorithm: round robin
    server app1:5678 max_fails=1 fail_timeout=10s;
    server app2:5678 max_fails=1 fail_timeout=10s;
  }
  server {
    listen 80;
    location / {
      proxy_pass http://app;
      proxy_connect_timeout 1s;
    }
  }
}`
          },
          {
            title: 'Add docker-compose.yml',
            body: 'Two echo servers that print their own name, plus Nginx on port 8080.',
            code: `services:
  app1:
    image: hashicorp/http-echo
    command: ["-text=hello from app1"]
  app2:
    image: hashicorp/http-echo
    command: ["-text=hello from app2"]
  lb:
    image: nginx:alpine
    ports: ["8080:80"]
    volumes: ["./nginx.conf:/etc/nginx/nginx.conf:ro"]
    depends_on: [app1, app2]`
          },
          {
            title: 'Start it and send requests',
            body: 'Run these from the folder. On Windows PowerShell use curl.exe (plain "curl" is an alias for Invoke-WebRequest). You should see app1 and app2 alternate.',
            code: `docker compose up -d
for ($i=0; $i -lt 6; $i++) { curl.exe -s localhost:8080 }`
          },
          {
            title: 'Kill a server',
            body: 'Stop app2 and send more requests. Open-source Nginx uses passive health checks: the first request to the dead server fails over, then the server is skipped for fail_timeout. All responses come from app1.',
            code: `docker compose stop app2
for ($i=0; $i -lt 6; $i++) { curl.exe -s localhost:8080 }`
          },
          {
            title: 'Bring it back, try another algorithm',
            body: 'Start app2 again. Add "least_conn;" as the first line inside the upstream block, then reload Nginx. (Active health checks that poll /health need NGINX Plus, HAProxy, or a cloud LB.)',
            code: `docker compose start app2
docker compose exec lb nginx -s reload`
          },
          {
            title: 'Clean up',
            body: 'Tear everything down.',
            code: 'docker compose down'
          }
        ],
        outro: 'You just built horizontal scaling: a load balancer distributing traffic across interchangeable, stateless servers, and routing around a failure.'
      }
    ]
  },

  // ───────────────────────────── UNIT 5 ─────────────────────────────
  {
    id: 'u5',
    title: 'Data Modeling',
    subtitle: 'Access patterns, SQL vs NoSQL',
    icon: 'database',
    color: '#ffb74d',
    lessons: [
      {
        id: 'u5-access',
        type: 'lesson',
        title: 'Identify access patterns first',
        minutes: 6,
        cards: [
          {
            title: 'Start from the queries, not the tables',
            body: `<p>Before choosing a database, list <b>how data will be read and written</b>:</p>
<ul><li>"Get user by id": point lookup</li><li>"Get a user's latest 20 posts": range by user, sorted by time</li><li>"Get the feed for a user": many users' posts merged</li><li>"Insert a like": high-volume small write</li></ul>
<p>For each: <b>frequency, latency target, read vs write, filters, sort order</b>.</p>`
          },
          {
            title: 'Relational approach',
            body: `<p>Model entities and relationships, <b>normalize</b> (each fact stored once), then add <b>indexes</b> for your access patterns. Ad-hoc queries and joins work later, even for patterns you didn't predict.</p>
<pre class="diagram">users(id, name)  posts(id, user_id, created_at, body)  follows(follower_id, followee_id)
INDEX posts(user_id, created_at)</pre>`
          },
          {
            title: 'NoSQL approach: design per query',
            body: `<p>Key-value / wide-column stores (DynamoDB, Cassandra) make you design tables <b>around each query</b>:</p>
<ul><li><b>Partition key</b> decides which machine holds the data (e.g. <code>user_id</code>)</li><li><b>Sort/clustering key</b> orders data within it (e.g. <code>created_at</code>)</li><li>Data is often <b>denormalized</b>: duplicated so each query hits one partition.</li></ul>
<div class="callout">Rule: if you don't know your access patterns yet, NoSQL is risky. If they're known and huge-scale, it shines.</div>`
          }
        ],
        quiz: [
          {
            q: 'What should you identify before picking a database?',
            options: ['The ORM', 'The access patterns: what queries run, how often, how fast', 'The primary key color', 'The CDN provider'],
            answer: 1,
            explain: 'The shape and frequency of reads/writes determine the right store and schema.'
          },
          {
            q: 'In DynamoDB, the most common query is "all orders for customer X, newest first". Good key design?',
            options: ['PK = orderId only', 'PK = customerId, SK = orderDate', 'PK = orderDate', 'Scan the table with a filter'],
            answer: 1,
            explain: 'Partition by customer so one partition holds their orders, sorted by date. Scans read the whole table.'
          },
          {
            q: 'What does denormalization trade?',
            options: ['Extra storage and harder updates for faster reads', 'Faster writes for slower reads', 'Security for speed', 'Nothing'],
            answer: 0,
            explain: 'Duplicating data makes reads one-hop but means updating multiple copies on change.'
          },
          {
            q: 'Main advantage of a normalized relational model when requirements are still changing?',
            options: ['Infinite write scaling', 'Flexible ad-hoc queries and joins for patterns you didn’t predict', 'No schema needed', 'No indexes needed'],
            answer: 1,
            explain: 'SQL lets you ask new questions of the data later without remodeling.'
          }
        ]
      },
      {
        id: 'u5-sql-nosql',
        type: 'lesson',
        title: 'SQL vs NoSQL',
        minutes: 7,
        cards: [
          {
            title: 'SQL (relational)',
            body: `<p><b>Tables, schemas, joins, ACID transactions.</b> PostgreSQL, MySQL.</p>
<ul><li class="pro">Strong consistency & multi-row transactions (money!)</li><li class="pro">Powerful queries, joins, constraints</li><li class="pro">Mature tooling</li>
<li class="con">Schema changes need migrations</li><li class="con">Scaling <i>writes</i> beyond one primary means sharding, which is manual or needs extra tooling (Vitess, Citus)</li></ul>`
          },
          {
            title: 'NoSQL families',
            body: `<table class="mini"><tr><th>Type</th><th>Examples</th><th>Good for</th></tr>
<tr><td>Key-value</td><td>Redis, DynamoDB</td><td>Lookups by key, sessions, caching</td></tr>
<tr><td>Document</td><td>MongoDB</td><td>Flexible JSON-like records, catalogs</td></tr>
<tr><td>Wide-column</td><td>Cassandra, HBase</td><td>Huge write volume, time-series, messages</td></tr>
<tr><td>Graph</td><td>Neo4j</td><td>Relationship traversal (social graphs, fraud)</td></tr></table>`
          },
          {
            title: 'How to choose',
            body: `<p><b>Pick SQL</b> when: data is relational, you need transactions/integrity, queries are varied or unknown. <i>This is the default for most apps.</i></p>
<p><b>Pick NoSQL</b> when: massive scale with simple, known access patterns; very high write throughput; flexible or sparse schema; built-in horizontal scaling matters most.</p>`
          },
          {
            title: 'Myths',
            body: `<ul><li class="con">"NoSQL is faster." It's faster <i>for the access patterns it was modeled for</i>, and painful for others.</li>
<li class="con">"SQL doesn't scale." Postgres/MySQL on big hardware plus replicas handles enormous load; sharded MySQL powers YouTube-scale systems.</li>
<li class="con">"NoSQL has no transactions." MongoDB and DynamoDB support transactions, with limits.</li></ul>`
          }
        ],
        quiz: [
          {
            q: 'A payments ledger where transfers must be atomic and never leave balances inconsistent. Best default?',
            options: ['PostgreSQL', 'Memcached', 'Cassandra with eventual consistency', 'A CDN'],
            answer: 0,
            explain: 'ACID transactions and constraints make relational DBs the safe choice for money.'
          },
          {
            q: 'Billions of chat messages, write-heavy, always read as "latest N messages in conversation X". Good fit?',
            options: ['Neo4j', 'Cassandra partitioned by conversation_id, clustered by time', 'A single MySQL table with no indexes', 'Memcached'],
            answer: 1,
            explain: 'Wide-column stores excel at high-volume writes and partition-scoped, time-ordered reads.'
          },
          {
            q: 'Which data model is built for traversing relationships like "friends of friends"?',
            options: ['Key-value', 'Graph', 'Wide-column', 'Object storage'],
            answer: 1,
            explain: 'Graph databases store edges as first-class data for efficient traversal.'
          },
          {
            q: 'Which statement is most accurate?',
            options: [
              'NoSQL is always faster than SQL',
              'SQL databases cannot scale',
              'Each model is fast for the access patterns it is designed around',
              'NoSQL databases never support transactions'
            ],
            answer: 2,
            explain: 'Performance depends on matching the model to the access pattern.'
          },
          {
            q: 'Product catalog where shoes, laptops and sofas have totally different attributes. A natural fit is…',
            options: ['A document store (or Postgres JSONB)', 'A graph DB', 'One SQL table with 300 nullable columns', 'Memcached as primary store'],
            answer: 0,
            explain: 'Flexible per-item attributes map well to documents. Postgres JSONB is also a strong option.'
          }
        ]
      },
      {
        id: 'u5-byte',
        type: 'byte',
        title: 'Interview Byte: two databases',
        minutes: 5,
        prompt: 'You are designing a ride-sharing app. Which database would you pick for (a) trips and payments and (b) the high-frequency stream of driver GPS location pings? Justify each choice.',
        hints: ['Which one needs transactions?', 'What is the write rate of GPS pings?', 'What queries hit each?'],
        model: `<p><b>(a) Trips & payments → relational (PostgreSQL).</b> Money needs ACID transactions and integrity constraints (a trip has exactly one payment). Access patterns vary (support tools, reporting). Write volume is moderate. Scale with vertical sizing + read replicas, and shard by city/region later.</p>
<p><b>(b) GPS pings → write-optimized / in-memory.</b> Millions of tiny writes per minute, mostly "latest position" reads. Current location in <b>Redis</b> (GEO commands for "drivers near me"), history in a wide-column/time-series store like <b>Cassandra</b> partitioned by driver + time bucket. Losing an occasional ping is acceptable.</p>
<p>Point: <b>polyglot persistence</b>. Use the right store per access pattern.</p>`,
        points: [
          'SQL for payments because of ACID transactions',
          'Recognized GPS is write-heavy / high volume',
          'In-memory or geo store for current location',
          'Wide-column/time-series for location history',
          'Justified via access patterns, not hype'
        ]
      }
    ]
  },

  // ───────────────────────────── UNIT 6 ─────────────────────────────
  {
    id: 'u6',
    title: 'Indexes',
    subtitle: 'Making queries fast',
    icon: 'search',
    color: '#f06292',
    lessons: [
      {
        id: 'u6-indexes',
        type: 'lesson',
        title: 'Database indexes',
        minutes: 7,
        cards: [
          {
            title: 'Without an index',
            body: `<p><code>SELECT * FROM users WHERE email = 'a@b.com'</code> on 10M rows with no index → a <b>full table scan</b>: read every row, O(n).</p>
<p>An <b>index</b> is a separate, sorted data structure mapping column values → row locations. Like the index at the back of a book.</p>`
          },
          {
            title: 'B-trees',
            body: `<p>Most relational indexes are <b>B-trees</b> (B+trees): balanced, shallow trees. A lookup is O(log n): a few page reads even for billions of rows.</p>
<ul><li class="pro">Equality: <code>WHERE email = ?</code></li><li class="pro">Ranges: <code>WHERE created_at &gt; ?</code></li><li class="pro">Sorting: <code>ORDER BY created_at</code></li>
<li class="con"><code>LIKE '%term'</code> (leading wildcard) can't use it</li></ul>`
          },
          {
            title: 'Composite indexes: leftmost prefix',
            body: `<p>An index on <code>(country, city)</code> is sorted by country, then city within each country.</p>
<ul><li class="pro"><code>WHERE country = 'FR'</code></li><li class="pro"><code>WHERE country = 'FR' AND city = 'Paris'</code></li><li class="pro"><code>WHERE country = 'FR' ORDER BY city</code></li><li class="con"><code>WHERE city = 'Paris'</code> alone (like looking up a phone book by first name)</li></ul>`
          },
          {
            title: 'Indexes are not free',
            body: `<ul><li><b>Writes slow down</b>: every INSERT/UPDATE/DELETE must update every index.</li><li><b>Storage</b>: each index is extra data.</li>
<li><b>Low-selectivity</b> columns (e.g. a boolean) often aren't worth indexing.</li></ul>
<div class="callout">Index the columns in your hot <code>WHERE</code>, <code>JOIN</code> and <code>ORDER BY</code> clauses. Verify with <code>EXPLAIN ANALYZE</code>. Drop unused indexes.</div>`
          },
          {
            title: 'Beyond B-trees',
            body: `<ul><li><b>Hash index</b>: O(1) equality only, no ranges.</li><li><b>LSM trees</b> (Cassandra, RocksDB): buffer writes in memory and flush sorted files. Very fast writes, reads may check several files.</li>
<li><b>Inverted index</b> (Elasticsearch): word → documents, which is what powers full-text search.</li></ul>`
          }
        ],
        quiz: [
          {
            q: 'A query on 50M rows filters by user_id and takes 4s; EXPLAIN shows "Seq Scan". First fix?',
            options: ['Add an index on user_id', 'Add a cache', 'Shard the table', 'Add read replicas'],
            answer: 0,
            explain: 'A sequential scan on a selective filter is exactly what an index fixes. Cheap and huge win.'
          },
          {
            q: 'Index on (country, city). Which query can NOT use it efficiently?',
            options: ["WHERE country = 'FR'", "WHERE country = 'FR' AND city = 'Paris'", "WHERE city = 'Paris'", "WHERE country = 'FR' ORDER BY city"],
            answer: 2,
            explain: 'Leftmost-prefix rule: without the leading column the sorted order is useless.'
          },
          {
            q: 'A write-heavy logging table has 9 indexes and inserts are slow. Likely fix?',
            options: ['Add more indexes', 'Drop indexes that queries don’t use', 'Add a cache', 'Use a CDN'],
            answer: 1,
            explain: 'Every index costs write work. Keep only what serves real queries.'
          },
          {
            q: 'Users need fuzzy full-text search with relevance ranking over 100M descriptions. Best tool?',
            options: ["LIKE '%term%' with a B-tree", 'Elasticsearch / OpenSearch (inverted index)', 'Redis strings', 'More read replicas'],
            answer: 1,
            explain: "Search engines use inverted indexes, tokenization and scoring. LIKE '%x%' can't use a B-tree."
          },
          {
            q: 'Which structure gives very fast writes by buffering in memory and flushing sorted files?',
            options: ['B-tree', 'LSM tree', 'Hash map in the app', 'Bitmap'],
            answer: 1,
            explain: 'Log-structured merge trees power write-heavy stores like Cassandra and RocksDB.'
          }
        ]
      },
      {
        id: 'u6-lab',
        type: 'lab',
        title: 'Lab 2: Watch an index work (Postgres)',
        minutes: 15,
        intro: 'Load a million rows into Postgres, time a lookup, add an index, and time it again. See the plan change from Seq Scan to Index Scan.',
        steps: [
          {
            title: 'Start Postgres',
            body: 'Run Postgres 16 in Docker and open a psql shell.',
            code: `docker run -d --name pg -e POSTGRES_PASSWORD=pass postgres:16
docker exec -it pg psql -U postgres`
          },
          {
            title: 'Create and fill a table',
            body: 'Inside psql: a million users in a few seconds via generate_series. Turn on timing.',
            code: `\\timing on
CREATE TABLE users (id serial PRIMARY KEY, email text, age int);
INSERT INTO users (email, age)
SELECT 'user' || g || '@example.com', (random()*80)::int
FROM generate_series(1, 1000000) AS g;
ANALYZE users;`
          },
          {
            title: 'Query without an index',
            body: 'Look for "Seq Scan" and the execution time (likely tens of ms).',
            code: `EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user777777@example.com';`
          },
          {
            title: 'Add an index and query again',
            body: 'Now look for "Index Scan using idx_users_email" and an execution time well under 1ms.',
            code: `CREATE INDEX idx_users_email ON users(email);
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'user777777@example.com';`
          },
          {
            title: 'See the cost side',
            body: 'Check how big the index is, and try a low-selectivity column: the planner may ignore an index on age because ~1/80 of the table matches.',
            code: `SELECT pg_size_pretty(pg_relation_size('idx_users_email'));
CREATE INDEX idx_users_age ON users(age);
EXPLAIN ANALYZE SELECT * FROM users WHERE age = 30;`
          },
          {
            title: 'Clean up',
            body: 'Exit psql with \\q, then remove the container.',
            code: 'docker rm -f pg'
          }
        ],
        outro: 'You saw O(n) vs O(log n) in real numbers, and that indexes cost space and that the planner decides when they are worth using.'
      }
    ]
  },

  // ───────────────────────────── UNIT 7 ─────────────────────────────
  {
    id: 'u7',
    title: 'Caching',
    subtitle: 'Fast answers and their sharp edges',
    icon: 'zap',
    color: '#ff8a3d',
    lessons: [
      {
        id: 'u7-caching',
        type: 'lesson',
        title: 'Caching patterns',
        minutes: 7,
        cards: [
          {
            title: 'Caches are everywhere',
            body: `<p>A cache keeps <b>copies of hot data in fast storage</b> (usually RAM) closer to whoever needs it.</p>
<p>Layers: <b>browser</b> → <b>CDN</b> → <b>app in-process</b> → <b>distributed cache</b> (Redis/Memcached) → <b>DB buffer pool</b>.</p>
<p>Key metric: <b>hit ratio</b> = hits / (hits + misses). 95% hits means the DB sees 1 in 20 reads.</p>`
          },
          {
            title: 'Cache-aside (lazy loading)',
            body: `<p>The most common pattern. The <b>app</b> manages the cache:</p>
<pre class="diagram">value = cache.get(key)
if miss:
    value = db.query(...)
    cache.set(key, value, ttl=300)
return value</pre>
<p><b>Pro:</b> only caches what's actually requested; cache failure ≠ outage. <b>Con:</b> first request is slow; data can go stale until TTL/invalidation.</p>`
          },
          {
            title: 'Read-through & write strategies',
            body: `<ul><li><b>Read-through</b>: like cache-aside but the cache library loads from the DB itself.</li>
<li><b>Write-through</b>: write to cache <i>and</i> DB synchronously. Cache always fresh, writes slower.</li>
<li><b>Write-back (write-behind)</b>: write to cache, flush to DB later in batches. Very fast writes, but you <b>risk losing data</b> if the cache dies.</li>
<li><b>Write-around</b>: write only to DB; cache fills on read. Avoids caching data nobody reads.</li></ul>`
          },
          {
            title: 'Eviction & TTL',
            body: `<p>RAM is limited, so something must be evicted:</p>
<ul><li><b>LRU</b>: least recently used (most common default)</li><li><b>LFU</b>: least frequently used</li><li><b>FIFO</b>: oldest first</li></ul>
<p><b>TTL</b> (time-to-live) expires entries automatically, which bounds staleness.</p>`
          }
        ],
        quiz: [
          {
            q: 'In cache-aside, what happens on a cache miss?',
            options: ['Return an error', 'App reads the DB, stores the result in the cache, returns it', 'Cache reads the DB by itself', 'Request is dropped'],
            answer: 1,
            explain: 'The application lazily populates the cache after reading from the DB.'
          },
          {
            q: 'Which write strategy risks losing recent writes if the cache node crashes?',
            options: ['Write-through', 'Write-around', 'Write-back (write-behind)', 'Cache-aside'],
            answer: 2,
            explain: 'Write-back acknowledges before the DB has the data, so unflushed writes vanish on crash.'
          },
          {
            q: 'A cache with a 90% hit ratio receiving 10,000 reads/s sends how many reads/s to the DB?',
            options: ['~100', '~1,000', '~9,000', '~10,000'],
            answer: 1,
            explain: '10% misses × 10,000 = 1,000 reads/s.'
          },
          {
            q: 'Most common eviction policy for general-purpose caches?',
            options: ['LRU', 'Random', 'Largest first', 'Never evict'],
            answer: 0,
            explain: 'Least-recently-used keeps the working set of recently accessed data.'
          },
          {
            q: 'Analytics counters get millions of increments/sec and losing a few seconds of counts is acceptable. Best fit?',
            options: ['Write-through each increment to SQL', 'Write-back: increment in Redis, flush periodically to the DB', 'No cache', 'Read-through'],
            answer: 1,
            explain: 'Batching writes in memory massively reduces DB load when small loss is tolerable.'
          }
        ]
      },
      {
        id: 'u7-cache-problems',
        type: 'lesson',
        title: 'When caches bite back',
        minutes: 7,
        cards: [
          {
            title: 'Invalidation: stale data',
            body: `<p>"There are only two hard things in computer science: cache invalidation and naming things."</p>
<p>When the DB changes, the cached copy is wrong. Strategies:</p>
<ul><li><b>TTL</b>: accept up to N seconds of staleness</li><li><b>Delete on write</b>: after updating the DB, <code>DEL</code> the key so the next read reloads</li><li><b>Update on write</b> (write-through)</li></ul>
<p>Prefer <i>delete</i> over <i>set</i> on write: it avoids racing writers leaving an old value in the cache.</p>`
          },
          {
            title: 'Thundering herd / cache stampede',
            body: `<p>A <b>hot key expires</b>. 20,000 concurrent requests miss at once and all query the DB → DB falls over.</p>
<ul><li><b>Request coalescing / lock</b>: only one request rebuilds; others wait or get stale data</li><li><b>Stale-while-revalidate</b>: serve the old value while refreshing in the background</li><li><b>Jittered TTLs</b>: so keys don't all expire at the same moment</li></ul>`
          },
          {
            title: 'Penetration & hot keys',
            body: `<ul><li><b>Cache penetration</b>: requests for keys that don't exist always miss and hit the DB (often an attack). Fix: cache "not found" briefly, or use a <b>Bloom filter</b>.</li>
<li><b>Hot key</b>: one key (a celebrity's profile) overwhelms a single cache node. Fix: replicate the key across nodes, add a local in-process cache layer.</li></ul>`
          },
          {
            title: 'What not to cache',
            body: `<ul><li>Data where staleness is unacceptable (account balance at checkout)</li><li>Highly personalized, rarely re-read data (low hit ratio)</li><li>Things that are already fast enough</li></ul>
<div class="callout">Every cache adds a consistency problem. Add one when the numbers justify it.</div>`
          }
        ],
        quiz: [
          {
            q: 'After updating a product’s price, users see the old price for an hour. Best fix?',
            options: ['Increase the TTL', 'Delete the cache key when the price is written (and/or shorter TTL)', 'Use write-back', 'Add more cache memory'],
            answer: 1,
            explain: 'Invalidate on write so the next read fetches fresh data.'
          },
          {
            q: 'A hot homepage key expires and 20k req/s hit the DB at once. This is…',
            options: ['Cache penetration', 'A cache stampede / thundering herd', 'Replication lag', 'A hot shard'],
            answer: 1,
            explain: 'Many concurrent misses for the same key on expiry = stampede.'
          },
          {
            q: 'Which mitigates a cache stampede?',
            options: ['Shorter TTL on all keys', 'Request coalescing / single-flight lock plus jittered TTLs', 'Removing the cache', 'Adding app servers'],
            answer: 1,
            explain: 'Let one request rebuild while others wait or get stale data, and spread expirations out.'
          },
          {
            q: 'Attackers request random non-existent IDs, so every request misses the cache. Fix?',
            options: ['Cache negative results briefly or use a Bloom filter', 'Increase cache size', 'Use LFU', 'Disable the DB'],
            answer: 0,
            explain: 'Remember "doesn’t exist" so the DB isn’t hit repeatedly. Bloom filters reject impossible keys cheaply.'
          },
          {
            q: 'Why prefer deleting a cache key over setting the new value on writes?',
            options: ['Deleting is faster in Redis', 'It avoids races where an older write overwrites a newer cached value', 'It saves memory forever', 'It is required by HTTP'],
            answer: 1,
            explain: 'Concurrent writers can set values out of order. Delete lets the next read load the truth.'
          }
        ]
      },
      {
        id: 'u7-byte',
        type: 'byte',
        title: 'Interview Byte: add a cache',
        minutes: 5,
        prompt: 'Product pages take 800ms and the database is at 90% CPU, mostly from product reads. Walk through adding a cache: what you cache, the pattern, TTL/invalidation, and what could go wrong.',
        hints: ['Which pattern?', 'How do updates propagate?', 'What happens when a hot key expires?', 'How do you know it worked?'],
        model: `<p><b>What:</b> the product detail object keyed by <code>product:{id}</code>. Read-heavy, rarely changes, same for all users.</p>
<p><b>Where:</b> Redis cluster (with a replica) between app and DB; static images on a CDN.</p>
<p><b>Pattern:</b> cache-aside. Read cache → on miss read DB → set with TTL (e.g. 10 min + jitter).</p>
<p><b>Invalidation:</b> on product update, write DB then <code>DEL product:{id}</code>.</p>
<p><b>Risks:</b> stampede on hot keys (single-flight lock / stale-while-revalidate), cache penetration (cache not-found), Redis outage (fall back to DB with rate limiting; don't let it cascade).</p>
<p><b>Measure:</b> hit ratio, p99 latency, DB CPU before vs after.</p>`,
        points: [
          'Chose what to cache and the key format',
          'Cache-aside pattern',
          'TTL with jitter',
          'Invalidate (delete) on write',
          'Stampede mitigation',
          'Plan for cache failure',
          'Metrics: hit ratio / latency / DB load'
        ]
      },
      {
        id: 'u7-lab',
        type: 'lab',
        title: 'Lab 3: Cache-aside with Redis',
        minutes: 15,
        intro: 'Run Redis, poke at keys and TTLs by hand, then write a tiny Node cache-aside function and time a miss vs a hit.',
        steps: [
          {
            title: 'Start Redis',
            body: 'Run Redis 7 and open the CLI.',
            code: `docker run -d --name redis -p 6379:6379 redis:7
docker exec -it redis redis-cli`
          },
          {
            title: 'Keys and TTLs by hand',
            body: 'SET with EX gives the key a time-to-live. Run TTL again a few seconds later and watch it count down.',
            code: `SET product:42 '{"name":"Lamp","price":30}' EX 60
GET product:42
TTL product:42`
          },
          {
            title: 'Write cache-aside in Node',
            body: 'In a new folder run "npm init -y && npm i redis", then save this as cache.mjs. The fake DB takes 500ms.',
            code: `import { createClient } from 'redis'

const redis = createClient()
await redis.connect()

async function slowDb(id) {
  await new Promise((r) => setTimeout(r, 500))
  return { id, name: 'Lamp', price: 30 }
}

async function getProduct(id) {
  const key = \`product:\${id}\`
  const hit = await redis.get(key)
  if (hit) return JSON.parse(hit)              // cache hit
  const product = await slowDb(id)            // miss → database
  await redis.set(key, JSON.stringify(product), { EX: 60 })
  return product
}

await redis.del('product:7')
console.time('miss'); await getProduct(7); console.timeEnd('miss')
console.time('hit');  await getProduct(7); console.timeEnd('hit')
process.exit(0)`
          },
          {
            title: 'Run it',
            body: 'Expect ~500ms for the miss and ~1ms for the hit.',
            code: 'node cache.mjs'
          },
          {
            title: 'Invalidate',
            body: 'Pretend the price changed: delete the key in redis-cli, and note that the next read is a miss again. That is delete-on-write invalidation.',
            code: `docker exec -it redis redis-cli DEL product:7`
          },
          {
            title: 'Clean up',
            body: 'Remove the container.',
            code: 'docker rm -f redis'
          }
        ],
        outro: 'You measured the payoff of a cache hit (~500x) and practiced the invalidation step that keeps the cache honest.'
      }
    ]
  },

  // ───────────────────────────── UNIT 8 ─────────────────────────────
  {
    id: 'u8',
    title: 'Replication & Sharding',
    subtitle: 'More copies, more pieces',
    icon: 'copy',
    color: '#5cc8ff',
    lessons: [
      {
        id: 'u8-replication',
        type: 'lesson',
        title: 'Replication',
        minutes: 7,
        cards: [
          {
            title: 'Leader-follower (primary-replica)',
            body: `<pre class="diagram">writes ─▶ PRIMARY ──replicates──▶ replica-1 ◀─ reads
                     └──────────────▶ replica-2 ◀─ reads</pre>
<ul><li>All <b>writes</b> go to the primary; it streams changes to replicas.</li><li><b>Reads</b> can be spread across replicas → scale read-heavy workloads.</li><li>If the primary dies, <b>promote</b> a replica (failover).</li></ul>`
          },
          {
            title: 'Synchronous vs asynchronous',
            body: `<ul><li><b>Synchronous</b>: primary waits for a replica to confirm before acknowledging the write. <b>Pro:</b> no data loss on failover. <b>Con:</b> slower writes; a slow replica stalls writes.</li>
<li><b>Asynchronous</b>: primary acknowledges immediately, replicates after. <b>Pro:</b> fast. <b>Con:</b> recent writes can be <b>lost</b> on failover; replicas <b>lag</b>.</li></ul>
<p>Common compromise: <b>semi-sync</b>, where at least one replica must confirm and the rest are async.</p>`
          },
          {
            title: 'Replication lag bites',
            body: `<p>User updates their profile (write → primary), refreshes (read → lagging replica) → sees the <b>old</b> value. "Did my save fail?!"</p>
<p><b>Read-your-writes</b> fixes: read from the primary for a short window after a user writes, or read from a replica only once it has caught up to the user's last write position.</p>`
          },
          {
            title: 'Other topologies',
            body: `<ul><li><b>Multi-leader</b>: several nodes accept writes (e.g. one per region). Needs <b>conflict resolution</b>.</li>
<li><b>Leaderless</b> (Dynamo-style, Cassandra): write to N replicas, succeed after W acks; read from R. If <b>W + R &gt; N</b>, reads overlap the latest write.</li>
<li><b>Failover risk</b>: <b>split brain</b>, where two nodes both think they're primary. Needs fencing/consensus.</li></ul>`
          }
        ],
        quiz: [
          {
            q: 'Read:write is 100:1 and the primary DB is at 85% CPU from reads. Next step?',
            options: ['Shard the database', 'Add read replicas (and/or a cache)', 'Switch to multi-leader', 'Make replication synchronous'],
            answer: 1,
            explain: 'Read replicas scale reads without the complexity of sharding.'
          },
          {
            q: 'Which replication mode can lose acknowledged writes when the primary dies?',
            options: ['Synchronous', 'Asynchronous', 'Neither', 'Both equally'],
            answer: 1,
            explain: 'Async acknowledges before replicas have the data. If the primary dies, those writes are gone.'
          },
          {
            q: 'A user saves a profile change, refreshes, and sees the old value. Reads go to async replicas. Fix?',
            options: ['Add more replicas', 'Read-your-writes: route that user’s reads to the primary briefly after a write', 'Disable replication', 'Increase cache TTL'],
            answer: 1,
            explain: 'Replication lag makes replicas stale. Read-your-writes consistency hides it from the writer.'
          },
          {
            q: 'Leaderless replication with N=3. Which (W, R) guarantees reads overlap the latest write?',
            options: ['W=1, R=1', 'W=2, R=2', 'W=1, R=2', 'W=0, R=3'],
            answer: 1,
            explain: 'W + R > N → 2 + 2 = 4 > 3, so the read set and write set overlap in at least one node.'
          },
          {
            q: 'Two nodes both believe they are the primary after a network partition. This is…',
            options: ['Replication lag', 'Split brain', 'Cache stampede', 'A hot shard'],
            answer: 1,
            explain: 'Split brain risks divergent, conflicting writes. Consensus/fencing prevents it.'
          }
        ]
      },
      {
        id: 'u8-sharding',
        type: 'lesson',
        title: 'Sharding',
        minutes: 8,
        cards: [
          {
            title: 'Why shard',
            body: `<p>Replication copies <b>all</b> data to each node, which helps reads but not <b>writes</b> or <b>total size</b>. When one primary can't take the writes or hold the data, <b>split the data</b> across machines: each <b>shard</b> owns a subset.</p>
<pre class="diagram">user_id → hash → shard 0 | shard 1 | shard 2 | shard 3</pre>`
          },
          {
            title: 'Strategies',
            body: `<ul><li><b>Range</b> (A–F, G–M…; or by date): range queries are easy, but you risk <b>hotspots</b> (all new writes hit the "latest" shard).</li>
<li><b>Hash</b> (hash(key) mod N): even distribution, but range queries must hit all shards.</li>
<li><b>Directory / lookup</b>: a mapping service says where each key lives. Flexible, but an extra hop and component.</li>
<li><b>Geo</b>: by region, for latency and data residency.</li></ul>`
          },
          {
            title: 'Consistent hashing',
            body: `<p>With <code>hash(key) % N</code>, changing N from 4 to 5 <b>remaps ~80% of keys</b>, which means massive data movement or a cache miss storm.</p>
<p><b>Consistent hashing</b> places nodes and keys on a ring; each key belongs to the next node clockwise. Adding a node only moves ~1/N of keys. <b>Virtual nodes</b> smooth out the distribution.</p>`
          },
          {
            title: 'Choosing a shard key',
            body: `<p>Good shard key: <b>high cardinality</b>, <b>even access</b>, and <b>most queries include it</b> (so they hit one shard).</p>
<p>e.g. multi-tenant SaaS → <code>tenant_id</code>; chat → <code>conversation_id</code>.</p>
<div class="callout">Hot shard (celebrity problem): one key gets massive traffic. Mitigate with caching, splitting that key further (key + suffix), or dedicated shards.</div>`
          },
          {
            title: 'The costs: shard last',
            body: `<ul><li>Cross-shard <b>joins</b> and <b>transactions</b> become hard or impossible</li><li><b>Rebalancing</b> as data grows</li><li>Operational complexity (backups, migrations ×N)</li></ul>
<p>Try first: indexes → caching → vertical scaling → read replicas. Tools that help: <b>Vitess</b> (MySQL), <b>Citus</b> (Postgres), or natively sharded stores (Cassandra, DynamoDB, MongoDB).</p>`
          }
        ],
        quiz: [
          {
            q: 'What does sharding scale that read replicas do not?',
            options: ['Read throughput only', 'Write throughput and total data size', 'DNS lookups', 'TLS handshakes'],
            answer: 1,
            explain: 'Each shard owns a subset, so writes and storage are divided across machines.'
          },
          {
            q: 'Sharding a time-series table by date range causes what problem?',
            options: ['Even load', 'All new writes land on the newest shard (hotspot)', 'Impossible range queries', 'Data loss'],
            answer: 1,
            explain: 'Range keys that increase monotonically concentrate writes on one shard.'
          },
          {
            q: 'Multi-tenant SaaS where nearly every query is scoped to one customer. Shard key?',
            options: ['created_at', 'tenant_id', 'random UUID per row', 'country'],
            answer: 1,
            explain: 'Queries carry tenant_id, so each hits one shard. Watch for very large tenants.'
          },
          {
            q: 'Adding a 5th node with hash(key) % N remaps most keys. What minimizes movement?',
            options: ['Range sharding', 'Consistent hashing', 'Bigger nodes', 'Longer TTLs'],
            answer: 1,
            explain: 'On a hash ring only ~1/N keys move when a node is added.'
          },
          {
            q: 'Which should you usually try BEFORE sharding?',
            options: ['Indexes, caching, vertical scaling, read replicas', 'Rewriting in another language', 'Multi-leader replication', 'Removing all indexes'],
            answer: 0,
            explain: 'Sharding is powerful but expensive in complexity. Exhaust simpler options first.'
          }
        ]
      },
      {
        id: 'u8-lab',
        type: 'lab',
        title: 'Lab 4: Replication & failover (Redis)',
        minutes: 15,
        intro: 'Run a Redis primary and replica, watch writes replicate, see the replica refuse writes, then kill the primary and promote the replica by hand.',
        steps: [
          {
            title: 'Start a primary and a replica',
            body: 'A shared Docker network lets the replica reach the primary by name.',
            code: `docker network create lab
docker run -d --name primary --network lab redis:7
docker run -d --name replica --network lab redis:7 redis-server --replicaof primary 6379`
          },
          {
            title: 'Write to primary, read from replica',
            body: 'The value appears on the replica almost instantly (asynchronous replication).',
            code: `docker exec primary redis-cli SET greeting hello
docker exec replica redis-cli GET greeting`
          },
          {
            title: 'Replicas are read-only',
            body: 'Expect: (error) READONLY You can\'t write against a read only replica. Then inspect the replication status: role, link status, offset.',
            code: `docker exec replica redis-cli SET x 1
docker exec replica redis-cli INFO replication`
          },
          {
            title: 'Kill the primary',
            body: 'The replica keeps serving reads (available, possibly stale) but nothing can accept writes. That is an outage for writes.',
            code: `docker stop primary
docker exec replica redis-cli GET greeting`
          },
          {
            title: 'Manual failover: promote the replica',
            body: 'REPLICAOF NO ONE turns it into a primary. Writes work again. In production, Redis Sentinel/Cluster or your cloud provider automates this (and must avoid split brain).',
            code: `docker exec replica redis-cli REPLICAOF NO ONE
docker exec replica redis-cli SET x 1`
          },
          {
            title: 'Clean up',
            body: 'Remove containers and the network.',
            code: `docker rm -f primary replica
docker network rm lab`
          }
        ],
        outro: 'You saw replication, read-only replicas, the write outage a dead primary causes, and failover by promotion: what managed databases automate for you.'
      }
    ]
  },

  // ───────────────────────────── UNIT 9 ─────────────────────────────
  {
    id: 'u9',
    title: 'Capstone',
    subtitle: 'The design we made so far',
    icon: 'landmark',
    color: '#ffd166',
    lessons: [
      {
        id: 'u9-design',
        type: 'lesson',
        title: 'The design so far',
        minutes: 7,
        cards: [
          {
            title: 'The full picture',
            body: `<pre class="diagram">            DNS
             │
 users ─▶  CDN (static assets)
             │
      Load balancers (redundant, L7, health checks)
             │
   Stateless app servers (autoscaled, containers)
        │            │              │
   Redis cache    Message queue ─▶ Workers
        │                            │
  DB primary ──▶ read replicas       │
   (sharded when needed)  ◀──────────┘
        │
  Backups / object storage (S3)</pre>`
          },
          {
            title: 'Every box fixes a failure',
            body: `<table class="mini"><tr><th>Component</th><th>Problem it solves</th></tr>
<tr><td>Load balancer + more servers</td><td>CPU/RAM exhausted, server failure</td></tr>
<tr><td>Stateless servers</td><td>Scaling, deploys, lost sessions</td></tr>
<tr><td>Cache</td><td>DB overloaded by repeated reads, latency</td></tr>
<tr><td>Indexes</td><td>Slow queries</td></tr>
<tr><td>Replicas + failover</td><td>Read scale, machine death</td></tr>
<tr><td>Backups</td><td>Human error, corruption</td></tr>
<tr><td>Sharding</td><td>Write volume and data size</td></tr>
<tr><td>CDN</td><td>Distance latency for static content</td></tr></table>`
          },
          {
            title: 'Bonus: queues for slow work',
            body: `<p>Don't make users wait for slow, non-critical work (emails, thumbnails, notifications). Put a message on a <b>queue</b> and let <b>workers</b> process it asynchronously.</p>
<ul><li><b>RabbitMQ / SQS</b>: task queues, per-message ack and routing</li><li><b>Kafka</b>: durable event log, many consumers, replay</li></ul>
<p>Queues also absorb traffic spikes (buffering) and decouple services.</p>`
          },
          {
            title: 'How to present it',
            body: `<ol><li>Requirements (functional + NFR) and estimates</li><li>API + data model (from access patterns)</li><li>Simple design end-to-end first</li><li>Find bottlenecks/SPOFs → evolve with the tools above</li><li><b>State tradeoffs out loud</b> for every choice</li></ol>`
          }
        ],
        quiz: [
          {
            q: 'Signup sends a welcome email synchronously; the email provider is slow, so signup takes 5s. Fix?',
            options: ['Bigger app servers', 'Enqueue an email job and let a worker send it asynchronously', 'Cache the email', 'Shard the users table'],
            answer: 1,
            explain: 'Non-critical slow work belongs off the request path in a queue + worker.'
          },
          {
            q: 'Which component primarily protects against an engineer accidentally dropping a table?',
            options: ['Read replicas', 'Backups (with point-in-time recovery)', 'Load balancer', 'CDN'],
            answer: 1,
            explain: 'Replicas copy the mistake. Backups let you restore.'
          },
          {
            q: 'Five independent teams need to consume the same clickstream events and replay history. Best fit?',
            options: ['Kafka', 'Memcached', 'A cron job', 'Redis pub/sub'],
            answer: 0,
            explain: 'Kafka retains an ordered log that many consumer groups can read and re-read independently.'
          },
          {
            q: 'What is the right order to present a design in an interview?',
            options: [
              'Draw sharded Kafka first, then ask questions',
              'Requirements → estimates → API/data model → simple design → scale & tradeoffs',
              'Pick technologies, then requirements',
              'Only talk about databases'
            ],
            answer: 1,
            explain: 'Start with clarity, build simple, then evolve while naming the tradeoffs.'
          }
        ]
      },
      {
        id: 'u9-byte',
        type: 'byte',
        title: 'Final Byte: design a URL shortener',
        minutes: 10,
        prompt: 'Design a URL shortener end to end (like bit.ly) at 100M new links/month and ~4k redirects/sec. Cover requirements, API, data model, short-code generation, the architecture, and how it scales and survives failures.',
        hints: ['Reuse your estimates from Unit 2', 'How do you generate unique short codes?', 'Which path is hot: create or redirect?', 'What happens when a DB node dies?'],
        model: `<p><b>API:</b> <code>POST /urls {longUrl} → {code}</code>; <code>GET /{code} → 301/302 redirect</code>.</p>
<p><b>Data:</b> <code>code → long_url, created_at, owner</code>. Pure key-value access pattern → DynamoDB/Cassandra, or Postgres with a primary key on code (both work at this scale, ~3 TB over 5 years).</p>
<p><b>Codes:</b> base62 of a unique ID (7 chars = 62⁷ ≈ 3.5 trillion). Get IDs from a counter service handing out ranges to each app server (no collisions, no DB check), or hash + collision retry.</p>
<p><b>Architecture:</b> DNS → CDN/edge → L7 LB → stateless app servers → Redis cache (hot codes, very high hit ratio) → DB with replicas.</p>
<p><b>Scale & failure:</b> reads ≫ writes, so caching + replicas handle redirects; shard by code hash if writes/data outgrow one node; replicas + failover for availability; backups for recovery. Analytics clicks go async via a queue (Kafka) so redirects stay fast.</p>
<p><b>Tradeoffs:</b> 301 (cacheable by browsers, fewer hits, loses analytics) vs 302 (every click reaches you).</p>`,
        points: [
          'Requirements + estimates stated',
          'Clear API for create and redirect',
          'Key-value data model and DB choice justified',
          'Unique short-code generation strategy',
          'Cache for the hot redirect path',
          'Replication/failover + backups',
          'Async analytics via queue',
          'At least one explicit tradeoff (e.g. 301 vs 302)'
        ]
      }
    ]
  }
]
