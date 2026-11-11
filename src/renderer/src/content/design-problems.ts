import type { Diagram } from '../../../shared/types'
import {
  APPS,
  CLIENTS,
  DBS,
  dbReplicated,
  everyReaches,
  hasEdge,
  hasPath,
  instances,
  layoutDiagram,
  nodesOf,
  targets,
  type Check,
  type Graph
} from '../lib/design'
import { AcronymScope } from '../lib/acronyms'

export type Difficulty = 'Easy' | 'Medium' | 'Hard'

export const DIFFICULTY_XP: Record<Difficulty, number> = { Easy: 40, Medium: 70, Hard: 120 }

export interface DesignProblem {
  id: string
  title: string
  difficulty: Difficulty
  /** concept units this problem practises */
  units: string[]
  /** one line for the problem list */
  summary: string
  prompt: string
  requirements: string[]
  scale?: string[]
  checks: Check[]
  /** a design that passes every check */
  reference: Diagram
  /** why the reference design looks the way it does */
  notes: string[]
}

// ───────── shared checks ─────────

const balanced = (min = 2, what = 'app servers'): Check => ({
  label: `Traffic is load-balanced across ${min}+ ${what}`,
  hint: `Put a load balancer between the clients and the servers, and run at least ${min} copies (draw more, or set the server's copies to ×${min}).`,
  test: (g) => hasPath(g, CLIENTS, ['lb'], APPS) && instances(g, APPS) >= min
})

const savesTo = (label: string): Check => ({
  label,
  hint: 'Draw an arrow from the app server to a database. Data that lives only on an app server disappears when it restarts.',
  test: (g) => hasPath(g, APPS, DBS)
})

const noClientTo = (kinds: Graph['nodes'][number]['kind'][], label: string, hint: string): Check => ({
  label,
  hint,
  test: (g) => !hasEdge(g, CLIENTS, kinds)
})

const NO_CLIENT_DB = noClientTo(
  DBS,
  'Clients never talk to the database directly',
  'Browsers and phones can’t be trusted with database credentials. Requests go to your app, and the app talks to the database.'
)

export const DESIGN_PROBLEMS: DesignProblem[] = explainProblems([
  // ───────────────────────── Easy ─────────────────────────
  {
    id: 'blog',
    title: 'Personal blog',
    difficulty: 'Easy',
    units: ['u1'],
    summary: 'The smallest design that works: client, server, database.',
    prompt:
      'You are launching a blog. Readers open posts in their browser, and you publish a new post a few times a week. Start with the simplest design that works. You can grow it later.',
    requirements: ['Readers can load posts', 'The author can publish new posts', 'Posts are kept safely after a restart'],
    scale: ['~1,000 readers a day', 'A few writes a week'],
    checks: [
      {
        label: 'Readers have a client',
        hint: 'Every design starts with who is making requests. Drag in a Web Client.',
        test: (g) => instances(g, CLIENTS) >= 1
      },
      {
        label: 'Requests reach an app server',
        hint: 'Draw an arrow from the client to an App Server that runs the blog code.',
        test: (g) => hasPath(g, CLIENTS, APPS)
      },
      savesTo('Posts are saved in a database'),
      NO_CLIENT_DB
    ],
    reference: layoutDiagram(
      [
        ['c', 'client', 0, 0, 'Readers'],
        ['s', 'server', 1, 0, 'Blog Server'],
        ['d', 'sql', 2, 0, 'Posts DB']
      ],
      [
        ['c', 's', { label: 'HTTPS' }],
        ['s', 'd']
      ]
    ),
    notes: [
      'One server and one database is the normal starting point (Unit 01). It’s cheap and easy to reason about.',
      'The database keeps posts safe when the server restarts. App servers should hold nothing you can’t lose.',
      'Its weak spot is that every box is a single point of failure. The next problems fix that.'
    ]
  },
  {
    id: 'static-site',
    title: 'Worldwide portfolio site',
    difficulty: 'Easy',
    units: ['u4', 'u7'],
    summary: 'Static files, global visitors: no servers needed.',
    prompt:
      'Your portfolio is plain HTML, CSS and images. There are no logins or forms. Visitors come from every continent and it should feel instant everywhere, while costing almost nothing to run.',
    requirements: ['Visitors find the site by its domain name', 'Pages and images load fast worldwide', 'Nothing to patch or keep running'],
    scale: ['~5,000 visits a day from 40+ countries', 'Content changes once a month'],
    checks: [
      {
        label: 'Visitors look up your domain in DNS',
        hint: 'Every request journey starts with DNS turning the name into an address. Draw client → DNS.',
        test: (g) => hasEdge(g, CLIENTS, ['dns'])
      },
      {
        label: 'Files are served from a CDN',
        hint: 'A CDN keeps copies of your files in cities near your visitors. Draw client → CDN.',
        test: (g) => hasEdge(g, CLIENTS, ['cdn'])
      },
      {
        label: 'The CDN pulls files from object storage',
        hint: 'The CDN needs an origin to fetch from on a miss. Static files belong in object storage (like S3).',
        test: (g) => hasPath(g, ['cdn'], ['storage'])
      },
      {
        label: 'No app servers for static files',
        hint: 'Nothing here needs code to run per request. A server just adds cost and one more thing to break.',
        test: (g) => instances(g, [...APPS, 'worker']) === 0
      }
    ],
    reference: layoutDiagram(
      [
        ['c', 'client', 0, 1, 'Visitors'],
        ['dns', 'dns', 1, 0],
        ['cdn', 'cdn', 1, 1],
        ['s3', 'storage', 2, 1, 'Site files']
      ],
      [
        ['c', 'dns', { label: 'lookup' }],
        ['c', 'cdn'],
        ['cdn', 's3', { label: 'on a miss', dashed: true }]
      ]
    ),
    notes: [
      'DNS points your domain at the CDN, so visitors are sent to the nearest edge location.',
      'The CDN serves cached copies. Only a cache miss goes back to object storage (Unit 07: cache layers).',
      'No servers means nothing to scale or patch. Static hosting is the cheapest, most reliable design there is.'
    ]
  },
  {
    id: 'server-crash',
    title: 'Survive a server crash',
    difficulty: 'Easy',
    units: ['u1', 'u3', 'u4'],
    summary: 'Remove the single point of failure in the app tier.',
    prompt:
      'A bakery’s ordering site runs on one server. It crashed twice this month and orders stopped for hours each time. Redesign it so one server dying doesn’t take the site down, and customers don’t notice.',
    requirements: ['Customers can place orders', 'One app server can die without an outage', 'Orders are never lost'],
    scale: ['~20,000 orders a day', 'Lunchtime peaks at 5× normal traffic'],
    checks: [
      balanced(2),
      noClientTo(
        APPS,
        'Clients don’t connect straight to a server',
        'If users are sent to one specific server, they’re stuck when it dies. Send them to the load balancer instead.'
      ),
      {
        label: 'Every app server can reach the database',
        hint: 'Each server copy needs the same data. Connect every App Server to the database.',
        test: (g) => everyReaches(g, APPS, DBS)
      },
      NO_CLIENT_DB
    ],
    reference: layoutDiagram(
      [
        ['c', 'client', 0, 0, 'Customers'],
        ['lb', 'lb', 1, 0],
        ['app', 'server', 2, 0, 'App Server', 3],
        ['db', 'sql', 3, 0, 'Orders DB']
      ],
      [
        ['c', 'lb'],
        ['lb', 'app'],
        ['app', 'db']
      ]
    ),
    notes: [
      'Horizontal scaling (Unit 03): several identical, stateless servers instead of one big one.',
      'The load balancer health-checks the servers and stops sending traffic to a dead one within seconds (Unit 04).',
      'All servers share one database, so it doesn’t matter which server handles an order.'
    ]
  },
  {
    id: 'catalog',
    title: 'Read-heavy product catalog',
    difficulty: 'Easy',
    units: ['u4', 'u7'],
    summary: 'The database is drowning in repeat reads. Add a cache.',
    prompt:
      'An online store’s product pages are viewed 100 times for every edit. The database is at 90% CPU answering the same product lookups over and over, and pages are getting slow.',
    requirements: ['Product pages load in under 100 ms', 'Price edits show up within a minute', 'Handle traffic spikes during sales'],
    scale: ['~3,000 page views a second', 'Read:write ratio of 100:1'],
    checks: [
      balanced(2),
      {
        label: 'App servers check a cache before the database',
        hint: 'Cache-aside (Unit 07): the app asks the cache first and only goes to the database on a miss. Draw app → cache.',
        test: (g) => hasEdge(g, APPS, ['cache'])
      },
      savesTo('The database is still the source of truth'),
      noClientTo(['cache'], 'Clients don’t read the cache directly', 'The cache sits beside your app servers. Clients only ever talk to your front door.'),
      NO_CLIENT_DB
    ],
    reference: layoutDiagram(
      [
        ['c', 'client', 0, 1, 'Shoppers'],
        ['lb', 'lb', 1, 1],
        ['app', 'server', 2, 1, 'App Server', 3],
        ['cache', 'cache', 3, 0, 'Redis'],
        ['db', 'sql', 3, 2, 'Products DB']
      ],
      [
        ['c', 'lb'],
        ['lb', 'app'],
        ['app', 'cache', { label: 'read first' }],
        ['app', 'db', { label: 'on a miss' }]
      ]
    ),
    notes: [
      'With a 100:1 read ratio, most reads hit the cache and the database load drops sharply.',
      'A short TTL (say 60 s) keeps prices fresh enough. Deleting the key on edit makes them fresher (Unit 07: invalidation).',
      'The database is still the source of truth. If the cache is wiped, the app just refills it.'
    ]
  },

  // ───────────────────────── Medium ─────────────────────────
  {
    id: 'url-shortener',
    title: 'URL shortener',
    difficulty: 'Medium',
    units: ['u2', 'u4', 'u7', 'u8'],
    summary: 'The classic: fast redirects, links never lost.',
    prompt:
      'Build a service like bit.ly. People create short links, and far more people click them. Every click must redirect almost instantly, and a link must keep working for years.',
    requirements: ['Create a short link for a long URL', 'Redirect a short link to the long URL', 'Links never disappear, even if a machine dies'],
    scale: ['1M new links a day (~12 writes/s)', '100M redirects a day (~1,200 reads/s, 3× at peak)', 'Read:write ratio of 100:1'],
    checks: [
      balanced(2),
      {
        label: 'Redirects are answered from a cache',
        hint: 'Popular links get clicked millions of times. Keep short-code → URL in a cache next to the app.',
        test: (g) => hasEdge(g, APPS, ['cache'])
      },
      savesTo('Links are stored in a database'),
      {
        label: 'The database has a replica so links are never lost',
        hint: 'One database machine is a single point of failure. Add a replica (draw a second database with an arrow to it, or set ×2).',
        test: (g) => dbReplicated(g)
      },
      noClientTo([...DBS, 'cache'], 'Clients never touch the data layer directly', 'Clients talk to the load balancer. Caches and databases are private.')
    ],
    reference: layoutDiagram(
      [
        ['c', 'client', 0, 1, 'Users'],
        ['lb', 'lb', 1, 1],
        ['app', 'server', 2, 1, 'App Server', 3],
        ['cache', 'cache', 3, 0, 'Link cache'],
        ['db', 'nosql', 3, 2, 'Links DB'],
        ['rep', 'nosql', 4, 2, 'Replica']
      ],
      [
        ['c', 'lb'],
        ['lb', 'app'],
        ['app', 'cache', { label: 'code → URL' }],
        ['app', 'db'],
        ['db', 'rep', { label: 'replicates', dashed: true }]
      ]
    ),
    notes: [
      'The access pattern is one key lookup (code → URL), which suits a key-value store. SQL works fine at this scale too.',
      'The cache absorbs the 100:1 read load. Hot links stay in memory.',
      'A replica keeps a live copy, so a dead primary means failover in seconds instead of lost links (Unit 08).'
    ]
  },
  {
    id: 'photos',
    title: 'Photo sharing',
    difficulty: 'Medium',
    units: ['u4', 'u7', 'u9'],
    summary: 'Big files, slow thumbnail jobs, global viewers.',
    prompt:
      'Users upload photos and scroll through other people’s photos. Every upload needs a thumbnail, which takes a few seconds to make. Viewers are all over the world.',
    requirements: ['Upload a photo and see it posted right away', 'Thumbnails appear a few seconds later', 'Photos load fast for viewers everywhere'],
    scale: ['500k uploads a day, ~3 MB each', '50M photo views a day'],
    checks: [
      balanced(2),
      {
        label: 'Photo files go to object storage, not the database',
        hint: 'Databases are bad at storing big binary files. Put the bytes in object storage and keep only the file’s URL in the database.',
        test: (g) => hasPath(g, APPS, ['storage'])
      },
      savesTo('Photo details (owner, caption, URL) live in a database'),
      {
        label: 'Thumbnails are made in the background (app → queue → worker)',
        hint: 'Don’t make the uploader wait for slow work. The app drops a job on a queue and a worker does it later.',
        test: (g) => hasPath(g, APPS, ['queue'], ['worker'])
      },
      {
        label: 'Workers save thumbnails to storage',
        hint: 'The worker’s output has to land somewhere. Draw worker → object storage.',
        test: (g) => hasPath(g, ['worker'], ['storage'])
      },
      {
        label: 'Viewers load photos through a CDN',
        hint: 'Serve the image files from edge locations near viewers: client → CDN → object storage.',
        test: (g) => hasPath(g, CLIENTS, ['cdn'], ['storage'])
      }
    ],
    reference: layoutDiagram(
      [
        ['c', 'client', 0, 1, 'Users'],
        ['cdn', 'cdn', 1, 0],
        ['s3', 'storage', 4, 0, 'Photo files'],
        ['lb', 'lb', 1, 1],
        ['app', 'server', 2, 1, 'App Server', 3],
        ['q', 'queue', 3, 1, 'Resize jobs'],
        ['w', 'worker', 4, 1, 'Thumbnailer', 2],
        ['db', 'sql', 2, 2, 'Photos DB']
      ],
      [
        ['c', 'cdn', { label: 'view' }],
        ['cdn', 's3'],
        ['c', 'lb', { label: 'upload' }],
        ['lb', 'app'],
        ['app', 's3', { label: 'original' }],
        ['app', 'db', { label: 'metadata' }],
        ['app', 'q', { dashed: true }],
        ['q', 'w'],
        ['w', 's3', { label: 'thumbnail' }]
      ]
    ),
    notes: [
      'Bytes go to object storage and metadata goes to the database. Each store does what it’s good at.',
      'The queue lets the upload request return immediately. If thumbnailing falls behind, jobs wait in the queue instead of failing.',
      'Viewing is a separate path through the CDN, so heavy viewing traffic never touches your app servers.'
    ]
  },
  {
    id: 'notifications',
    title: 'Slow email, fast comments',
    difficulty: 'Medium',
    units: ['u4', 'u9'],
    summary: 'Move slow, flaky work out of the request.',
    prompt:
      'When someone comments, the app emails and push-notifies the post’s author. The email provider sometimes takes 5 seconds or fails outright, and right now the commenter waits for it before their comment posts.',
    requirements: ['Comments post instantly', 'Notifications still go out, retried if the provider fails', 'A crashed sender doesn’t lose notifications'],
    scale: ['~200 comments a second at peak'],
    checks: [
      balanced(2),
      savesTo('Comments are saved in a database'),
      {
        label: 'Sending is handed to a queue',
        hint: 'The app should drop a “send notification” job on a queue and reply to the user right away.',
        test: (g) => hasEdge(g, APPS, ['queue'])
      },
      {
        label: 'Workers pull jobs from the queue',
        hint: 'Something has to do the sending. Draw queue → worker.',
        test: (g) => hasEdge(g, ['queue'], ['worker'])
      },
      {
        label: 'More than one worker',
        hint: 'With one worker, a crash stops all notifications. Run 2+ (set ×2 or draw another).',
        test: (g) => instances(g, ['worker']) >= 2
      },
      {
        label: 'App servers don’t call workers directly',
        hint: 'If the app calls a worker directly, it waits again and loses the job if the worker is down. The queue is the buffer between them.',
        test: (g) => !hasEdge(g, APPS, ['worker'])
      }
    ],
    reference: layoutDiagram(
      [
        ['c', 'client', 0, 1, 'Users'],
        ['lb', 'lb', 1, 1],
        ['app', 'server', 2, 1, 'App Server', 2],
        ['db', 'sql', 2, 2, 'Comments DB'],
        ['q', 'queue', 3, 1, 'Notify jobs'],
        ['w', 'worker', 4, 1, 'Sender', 3]
      ],
      [
        ['c', 'lb'],
        ['lb', 'app'],
        ['app', 'db', { label: 'save comment' }],
        ['app', 'q', { label: 'enqueue', dashed: true }],
        ['q', 'w', { label: 'pull' }]
      ]
    ),
    notes: [
      'The request only does the fast part (save the comment), so users never wait on the email provider.',
      'The queue keeps jobs until a worker confirms it’s done. If a worker crashes mid-send, the job is retried.',
      'Workers scale on their own. If notifications back up, add workers without touching the app tier.'
    ]
  },
  {
    id: 'microservices',
    title: 'Split the monolith',
    difficulty: 'Medium',
    units: ['u3', 'u5'],
    summary: 'Services behind one front door, each owning its data.',
    prompt:
      'A food-delivery monolith now has 60 engineers. The Orders, Payments and Restaurants teams keep blocking each other’s deploys. Split it into services that each team can ship on its own, behind one entry point for the apps.',
    requirements: [
      'Apps call one public endpoint',
      'Orders, Payments and Restaurants deploy independently',
      'One team’s schema change can’t break another team'
    ],
    checks: [
      {
        label: 'Clients enter through an API gateway',
        hint: 'One front door handles auth and routing so apps don’t need to know every service. Draw client → API Gateway.',
        test: (g) => hasPath(g, CLIENTS, ['gateway'])
      },
      {
        label: 'The gateway routes to at least 3 services',
        hint: 'Use the Microservice shape: one each for Orders, Payments and Restaurants, with an arrow from the gateway to each.',
        test: (g) => nodesOf(g, ['gateway']).some((gw) => targets(g, gw.id, ['service']).length >= 3)
      },
      {
        label: 'Each service owns its own database',
        hint: 'Shared tables tie teams back together. Give every service its own database, and don’t connect two services to the same one.',
        test: (g) => {
          const services = nodesOf(g, ['service'])
          if (services.length < 3) return false
          const owners: Record<string, number> = {}
          for (const s of services) for (const d of targets(g, s.id, DBS)) owners[d.id] = (owners[d.id] ?? 0) + 1
          return services.every((s) => targets(g, s.id, DBS).length > 0) && Object.values(owners).every((n) => n === 1)
        }
      },
      noClientTo(
        ['service'],
        'Clients don’t call services directly',
        'If apps call services directly, every service has to handle auth and you can’t move things around. Route through the gateway.'
      ),
      NO_CLIENT_DB
    ],
    reference: layoutDiagram(
      [
        ['c', 'mobile', 0, 1, 'Apps'],
        ['gw', 'gateway', 1, 1],
        ['orders', 'service', 2, 0, 'Orders'],
        ['pay', 'service', 2, 1, 'Payments'],
        ['rest', 'service', 2, 2, 'Restaurants'],
        ['odb', 'sql', 3, 0, 'Orders DB'],
        ['pdb', 'sql', 3, 1, 'Payments DB'],
        ['rdb', 'nosql', 3, 2, 'Menus DB']
      ],
      [
        ['c', 'gw'],
        ['gw', 'orders'],
        ['gw', 'pay'],
        ['gw', 'rest'],
        ['orders', 'odb'],
        ['pay', 'pdb'],
        ['rest', 'rdb']
      ]
    ),
    notes: [
      'Split along team and business lines, which is when microservices pay off (Unit 03).',
      'Database-per-service means each team can change its schema freely. Other services ask through the API instead of reading the tables.',
      'Each service can pick the store that fits its access pattern. Menus are read-heavy documents, so NoSQL fits (Unit 05).'
    ]
  },
  {
    id: 'search',
    title: 'Product search',
    difficulty: 'Medium',
    units: ['u5', 'u6', 'u9'],
    summary: 'LIKE "%shoes%" is too slow. Add a search index.',
    prompt:
      'Shoppers type “red running shoes” and expect relevant results in under 200 ms. Right now a SQL LIKE "%red%" query scans the whole products table and takes seconds. Indexes on the table don’t help a search in the middle of a word.',
    requirements: ['Relevant full-text results in < 200 ms', 'New and edited products become searchable within a minute', 'Orders still use the main database'],
    scale: ['10M products', '~2,000 searches a second'],
    checks: [
      balanced(2),
      {
        label: 'Searches go to a search index',
        hint: 'A search engine (Elasticsearch, OpenSearch) builds an inverted index for text. Draw app → Search Index.',
        test: (g) => hasEdge(g, APPS, ['search'])
      },
      savesTo('Products are still stored in a database'),
      {
        label: 'The index is fed from the database',
        hint: 'The index is a copy built for searching. Something has to keep it updated: draw the database (or a queue + worker it feeds) into the index.',
        test: (g) => hasPath(g, DBS, ['search'])
      },
      noClientTo(
        ['search'],
        'Clients don’t query the index directly',
        'The index is internal. Searches go through your app, which can check permissions and shape results.'
      )
    ],
    reference: layoutDiagram(
      [
        ['c', 'client', 0, 1, 'Shoppers'],
        ['lb', 'lb', 1, 1],
        ['app', 'server', 2, 1, 'App Server', 3],
        ['idx', 'search', 3, 0, 'Search Index'],
        ['db', 'sql', 2, 2, 'Products DB'],
        ['q', 'queue', 3, 2, 'Change feed'],
        ['w', 'worker', 4, 1, 'Indexer']
      ],
      [
        ['c', 'lb'],
        ['lb', 'app'],
        ['app', 'idx', { label: 'search' }],
        ['app', 'db', { label: 'writes' }],
        ['db', 'q', { label: 'changes', dashed: true }],
        ['q', 'w'],
        ['w', 'idx', { label: 'update' }]
      ]
    ),
    notes: [
      'The database stays the source of truth. The search index is a read-optimized copy, just like a cache.',
      'A change feed plus an indexer worker keeps the index a few seconds behind. That’s fine for search, and it means search load never hits the database.',
      'B-tree indexes (Unit 06) can’t speed up a match in the middle of text. Inverted indexes are built for exactly that.'
    ]
  },

  // ───────────────────────── Hard ─────────────────────────
  {
    id: 'news-feed',
    title: 'News feed',
    difficulty: 'Hard',
    units: ['u7', 'u8', 'u9'],
    summary: 'Precompute timelines with fan-out workers.',
    prompt:
      'Design a home feed like Twitter’s. Hundreds of millions of people open the app several times a day to see recent posts from everyone they follow. Feeds must load fast. A new post may take a few seconds to show up for followers.',
    requirements: ['Post text, images and video', 'See a feed of posts from people you follow', 'Feeds load in < 300 ms', 'Media loads fast worldwide'],
    scale: ['200M daily users × 10 feed loads a day', '~400M new posts a day', 'Average user has 200 followers'],
    checks: [
      balanced(3),
      {
        label: 'Posts are saved in a replicated database',
        hint: 'Posts are your core data. Store them in a database with a replica.',
        test: (g) => hasPath(g, APPS, DBS) && dbReplicated(g)
      },
      {
        label: 'New posts fan out in the background (queue → worker)',
        hint: 'Copying a post into 200 followers’ feeds is slow work. Hand it to a queue and fan-out workers.',
        test: (g) => hasPath(g, APPS, ['queue'], ['worker'])
      },
      {
        label: 'Workers write ready-made feeds into a cache',
        hint: 'Precompute each user’s timeline: the worker pushes post ids into each follower’s feed in the cache.',
        test: (g) => hasEdge(g, ['worker'], ['cache'])
      },
      {
        label: 'Feed reads come straight from the cache',
        hint: 'Loading a feed should be one cache read, not a query across everyone you follow. Draw app → cache.',
        test: (g) => hasEdge(g, APPS, ['cache'])
      },
      {
        label: 'Images and video come from a CDN',
        hint: 'Media is most of the bytes. Serve it client → CDN → object storage.',
        test: (g) => hasPath(g, CLIENTS, ['cdn'], ['storage'])
      }
    ],
    reference: layoutDiagram(
      [
        ['c', 'mobile', 0, 1, 'Users'],
        ['cdn', 'cdn', 1, 0],
        ['s3', 'storage', 2, 0, 'Media'],
        ['lb', 'lb', 1, 1],
        ['app', 'server', 2, 1, 'App Server', 4],
        ['cache', 'cache', 3, 1, 'Feed cache'],
        ['db', 'nosql', 2, 2, 'Posts DB'],
        ['rep', 'nosql', 1, 2, 'Replica'],
        ['q', 'queue', 3, 2, 'New posts'],
        ['w', 'worker', 4, 2, 'Fan-out', 3]
      ],
      [
        ['c', 'cdn', { label: 'media' }],
        ['cdn', 's3'],
        ['c', 'lb'],
        ['lb', 'app'],
        ['app', 'cache', { label: 'read feed' }],
        ['app', 'db', { label: 'save post' }],
        ['db', 'rep', { dashed: true }],
        ['app', 'q', { dashed: true }],
        ['q', 'w'],
        ['w', 'cache', { label: 'push to followers' }]
      ]
    ),
    notes: [
      'Fan-out on write: do the expensive work once per post so the much more common feed read is a single cache lookup.',
      'Celebrities with millions of followers are the exception. Their posts are merged in at read time instead (a hot-key problem, Unit 07).',
      'Media goes through the CDN, so the app tier only handles small JSON requests.'
    ]
  },
  {
    id: 'chat',
    title: 'Chat app',
    difficulty: 'Hard',
    units: ['u4', 'u5', 'u8', 'u9'],
    summary: 'Long-lived connections across many servers.',
    prompt:
      'Design one-on-one and group chat like WhatsApp. Every phone keeps a WebSocket connection open to one of your chat servers. A message to someone connected to a different server must still arrive instantly. Store every message, and show who’s online.',
    requirements: [
      'Send and receive messages in real time',
      'Message history is never lost',
      'Online / last-seen status',
      'Offline users get a push notification'
    ],
    scale: ['50M users connected at peak', '~1M messages a second'],
    checks: [
      balanced(2, 'chat servers'),
      {
        label: 'Messages go to a NoSQL store built for heavy writes',
        hint: 'Chat is billions of small writes, read back one conversation at a time. That access pattern fits a wide-column / NoSQL store (Unit 05).',
        test: (g) => hasPath(g, APPS, ['nosql'])
      },
      {
        label: 'Servers relay messages through a pub/sub queue',
        hint: 'The sender is on server A and the receiver on server B. Draw app → queue and queue → app (or one two-way arrow) so A can publish and B can receive.',
        test: (g) => hasEdge(g, APPS, ['queue']) && hasEdge(g, ['queue'], APPS)
      },
      {
        label: 'Online status lives in a cache',
        hint: 'Presence changes constantly and is fine to lose. Keep it in an in-memory cache with a short TTL.',
        test: (g) => hasEdge(g, APPS, ['cache'])
      },
      {
        label: 'A worker sends push notifications to offline users',
        hint: 'When the receiver isn’t connected, hand the message to a worker that calls the push provider: queue → worker.',
        test: (g) => hasPath(g, ['queue'], ['worker'])
      },
      {
        label: 'Message storage is replicated',
        hint: 'Losing chat history is unacceptable. Give the message store replicas (×3 or a replica arrow).',
        test: (g) => dbReplicated(g)
      }
    ],
    reference: layoutDiagram(
      [
        ['c', 'mobile', 0, 1, 'Phones'],
        ['lb', 'lb', 1, 1],
        ['app', 'server', 2, 1, 'Chat Server', 3],
        ['presence', 'cache', 2, 0, 'Presence'],
        ['ps', 'queue', 3, 1, 'Pub/Sub'],
        ['db', 'nosql', 2, 2, 'Messages', 3],
        ['w', 'worker', 4, 1, 'Push sender', 2]
      ],
      [
        ['c', 'lb', { label: 'WebSocket', both: true }],
        ['lb', 'app', { both: true }],
        ['app', 'presence'],
        ['app', 'ps', { label: 'publish / subscribe', both: true }],
        ['app', 'db', { label: 'store' }],
        ['ps', 'w', { label: 'offline', dashed: true }]
      ]
    ),
    notes: [
      'The connection is stateful (Unit 04): each phone is pinned to one chat server, so servers need pub/sub to reach each other’s users.',
      'Messages are partitioned by conversation id, so one conversation’s history is read from one shard in order (Unit 08).',
      'Presence is high-churn and disposable. It goes in the cache, never the message store.'
    ]
  },
  {
    id: 'video',
    title: 'Video platform',
    difficulty: 'Hard',
    units: ['u4', 'u7', 'u9'],
    summary: 'Huge uploads, minutes of transcoding, global streaming.',
    prompt:
      'Design a video platform like YouTube. Creators upload large files that must be converted into several resolutions, which takes minutes per video. Viewers around the world stream without buffering.',
    requirements: [
      'Upload videos of up to 10 GB',
      'Convert each upload into 240p–4K',
      'Stream smoothly worldwide',
      'Titles, views and channels stored reliably'
    ],
    scale: ['500 hours of video uploaded a minute', '1B hours watched a day'],
    checks: [
      balanced(2),
      {
        label: 'Raw uploads land in object storage',
        hint: 'Video files are huge. They go to object storage, never the database.',
        test: (g) => hasPath(g, APPS, ['storage'])
      },
      {
        label: 'Transcoding runs in background workers via a queue',
        hint: 'Converting takes minutes. The upload request queues a job and returns.',
        test: (g) => hasPath(g, APPS, ['queue'], ['worker'])
      },
      {
        label: 'Several workers share the transcoding load',
        hint: 'One transcoder would fall hours behind. Run a fleet (×2 or more).',
        test: (g) => instances(g, ['worker']) >= 2
      },
      {
        label: 'Workers save the converted videos to storage',
        hint: 'Each resolution is written back to object storage: worker → storage.',
        test: (g) => hasPath(g, ['worker'], ['storage'])
      },
      {
        label: 'Viewers stream from a CDN',
        hint: 'Streaming from your own servers would never keep up. Viewers fetch video chunks from CDN edges: client → CDN → storage.',
        test: (g) => hasPath(g, CLIENTS, ['cdn'], ['storage'])
      },
      {
        label: 'Video metadata lives in a replicated database',
        hint: 'Titles, owners and view counts need a database, with a replica for failover.',
        test: (g) => hasPath(g, APPS, DBS) && dbReplicated(g)
      }
    ],
    reference: layoutDiagram(
      [
        ['c', 'client', 0, 1, 'Creators & viewers'],
        ['cdn', 'cdn', 1, 0],
        ['s3', 'storage', 3, 0, 'Video files'],
        ['lb', 'lb', 1, 1],
        ['app', 'server', 2, 1, 'Upload API', 3],
        ['q', 'queue', 3, 1, 'Transcode jobs'],
        ['w', 'worker', 4, 1, 'Transcoder', 4],
        ['db', 'sql', 2, 2, 'Video metadata', 2]
      ],
      [
        ['c', 'cdn', { label: 'watch' }],
        ['cdn', 's3'],
        ['c', 'lb', { label: 'upload' }],
        ['lb', 'app'],
        ['app', 's3', { label: 'raw file' }],
        ['app', 'db'],
        ['app', 'q', { dashed: true }],
        ['q', 'w'],
        ['w', 's3', { label: 'renditions' }]
      ]
    ),
    notes: [
      'The write path (upload → queue → transcode) and the read path (CDN → storage) are completely separate, so each scales on its own.',
      'Video is split into small chunks at each resolution, so the player can switch quality mid-stream as bandwidth changes.',
      'The CDN serves almost every byte. Your servers only handle uploads and metadata.'
    ]
  },
  {
    id: 'flash-sale',
    title: 'Concert ticket rush',
    difficulty: 'Hard',
    units: ['u5', 'u7', 'u8', 'u9'],
    summary: 'A traffic spike where overselling is not an option.',
    prompt:
      '10,000 concert tickets go on sale at noon and 2 million fans hit refresh at the same moment. The site must stay up, the “seats left” number must load fast, and the same seat must never be sold twice.',
    requirements: ['Pages stay up through a 100× spike', 'Show seats left in near real time', 'Never sell a seat twice', 'Every purchase is recorded'],
    scale: ['2M users in the first minute', '10,000 seats'],
    checks: [
      {
        label: 'Static pages are served from a CDN',
        hint: 'The event page is the same for everyone. Let the CDN absorb those millions of loads: client → CDN.',
        test: (g) => hasEdge(g, CLIENTS, ['cdn'])
      },
      balanced(3),
      {
        label: 'Seat counts are read from a cache',
        hint: 'Millions of “how many left?” reads would melt the database. Keep the count in a cache.',
        test: (g) => hasEdge(g, APPS, ['cache'])
      },
      {
        label: 'Purchases are queued so the database isn’t flooded',
        hint: 'Put buy requests on a queue. Workers process them at a pace the database can handle: app → queue → worker → database.',
        test: (g) => hasPath(g, APPS, ['queue'], ['worker'], DBS)
      },
      {
        label: 'Orders are written to a SQL database',
        hint: 'A transaction with a row lock (or a unique constraint on the seat) is what guarantees one buyer per seat. Workers should write to a SQL database.',
        test: (g) => hasPath(g, ['worker'], ['sql'])
      },
      {
        label: 'The orders database has a replica for failover',
        hint: 'If the database dies mid-sale, you need a live copy to fail over to.',
        test: (g) => dbReplicated(g, ['sql'])
      }
    ],
    reference: layoutDiagram(
      [
        ['c', 'client', 0, 1, 'Fans'],
        ['cdn', 'cdn', 1, 0],
        ['lb', 'lb', 1, 1],
        ['app', 'server', 2, 1, 'App Server', 6],
        ['cache', 'cache', 3, 0, 'Seat counts'],
        ['q', 'queue', 3, 1, 'Purchases'],
        ['w', 'worker', 4, 1, 'Order worker', 3],
        ['db', 'sql', 4, 2, 'Orders DB'],
        ['rep', 'sql', 3, 2, 'Replica']
      ],
      [
        ['c', 'cdn', { label: 'event page' }],
        ['c', 'lb'],
        ['lb', 'app'],
        ['app', 'cache', { label: 'seats left?' }],
        ['app', 'q', { label: 'buy', dashed: true }],
        ['q', 'w'],
        ['w', 'db', { label: 'transaction' }],
        ['w', 'cache', { label: 'update count' }],
        ['db', 'rep', { dashed: true }]
      ]
    ),
    notes: [
      'The CDN and cache take nearly all the read traffic. Only real purchase attempts reach the queue.',
      'The queue turns a burst of 2M clicks into a steady stream the database can handle, and users see “you’re in line”.',
      'Correctness comes from the SQL transaction, not the cache. The cached count is only a hint for the UI.'
    ]
  }
])

/** Spell out acronyms (CDN → "CDN (content delivery network)") once per problem. */
function explainProblems(list: DesignProblem[]): DesignProblem[] {
  return list.map((p) => {
    const sc = new AcronymScope([
      p.summary,
      p.prompt,
      ...p.requirements,
      ...(p.scale ?? []),
      ...p.checks.flatMap((c) => [c.label, c.hint]),
      ...p.notes
    ])
    return {
      ...p,
      summary: sc.text(p.summary),
      prompt: sc.text(p.prompt),
      requirements: sc.list(p.requirements),
      scale: p.scale && sc.list(p.scale),
      checks: p.checks.map((c) => ({ ...c, label: sc.text(c.label), hint: sc.text(c.hint) })),
      notes: sc.list(p.notes)
    }
  })
}

export const PROBLEM_BY_ID: Record<string, DesignProblem> = Object.fromEntries(DESIGN_PROBLEMS.map((p) => [p.id, p]))
