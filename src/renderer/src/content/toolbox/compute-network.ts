import type { Tool } from '../../../../shared/types'

export const COMPUTE_NETWORK_TOOLS: Tool[] = [
  // ───────────────────────── Compute & hosting ─────────────────────────
  {
    id: 'ec2',
    name: 'Amazon EC2',
    category: 'Compute & hosting',
    unit: 'u1',
    alsoIn: ['u3'],
    icon: 'server',
    tagline: 'Rent virtual machines in the cloud by the second',
    summary:
      'EC2 gives you virtual servers ("instances") in AWS data centers, with a choice of CPU, memory, GPU and storage profiles. You pick an OS image, install your software and are responsible for patching and scaling it. Auto Scaling groups add or remove identical instances behind a load balancer, which is the classic way to scale a stateless tier horizontally.',
    strengths: [
      'Full control over OS, runtime and networking',
      'Huge range of instance types, including GPU and memory-optimized',
      'Auto Scaling groups replace unhealthy instances and track load',
      'Spot and reserved pricing can cut cost sharply for the right workloads'
    ],
    weaknesses: [
      'You own patching, hardening, and capacity planning',
      'Slower to scale than containers or functions (minutes to boot)',
      'Idle instances still cost money'
    ],
    useWhen: [
      'You need custom software, long-running processes or special hardware',
      'Steady, predictable load where reserved capacity is cheapest',
      'Lifting an existing server app into the cloud'
    ],
    avoidWhen: [
      'A small team wants zero server maintenance (use a PaaS or Fargate)',
      'Traffic is very spiky or near-zero most of the time (consider Lambda)'
    ],
    alternatives: ['Google Compute Engine', 'Azure Virtual Machines', 'AWS ECS & Fargate', 'AWS Lambda']
  },
  {
    id: 'aws-lambda',
    name: 'AWS Lambda',
    category: 'Compute & hosting',
    unit: 'u3',
    alsoIn: ['u4'],
    icon: 'zap',
    tagline: 'Run functions on demand without managing servers',
    summary:
      'Lambda runs your code in response to events (HTTP requests via API Gateway, queue messages, file uploads) and bills per request and execution time. AWS handles servers, scaling and patching. It scales from zero to many concurrent executions automatically, which makes it a natural fit for spiky or event-driven work.',
    strengths: [
      'Scales to zero: no cost when nothing is running',
      'Automatic scaling per request with no capacity planning',
      'Native triggers from S3, SQS, DynamoDB Streams, EventBridge and more',
      'No OS or server patching'
    ],
    weaknesses: [
      'Cold starts add latency, worse for heavy runtimes like JVM',
      'Hard execution time limit (15 minutes) and stateless by design',
      'Per-request cost overtakes containers at sustained high load; AWS lock-in'
    ],
    useWhen: [
      'Event-driven glue: image resizing on upload, queue consumers, webhooks',
      'Spiky or low, unpredictable traffic',
      'Small team that wants to ship without running servers'
    ],
    avoidWhen: [
      'Long-running jobs or persistent connections (e.g. WebSocket servers)',
      'Latency-critical paths that can’t tolerate cold starts',
      'Sustained heavy traffic where always-on containers are cheaper'
    ],
    alternatives: ['Google Cloud Run', 'Cloudflare Workers', 'Azure Functions', 'Google Cloud Functions']
  },
  {
    id: 'ecs-fargate',
    name: 'AWS ECS & Fargate',
    category: 'Compute & hosting',
    unit: 'u3',
    icon: 'boxes',
    tagline: 'AWS’s own container orchestrator, optionally serverless',
    summary:
      'Amazon ECS (Elastic Container Service) runs Docker containers as "tasks" and "services" on AWS, keeping a desired count running and wiring them to load balancers. With the Fargate launch type, AWS also manages the underlying machines, so you only define CPU and memory per task. It is a simpler, AWS-native alternative to Kubernetes.',
    strengths: [
      'Much simpler than Kubernetes; fewer concepts to learn',
      'Fargate removes server management entirely',
      'Deep integration with ALB, IAM roles, CloudWatch and autoscaling',
      'No control-plane fee for ECS itself'
    ],
    weaknesses: [
      'AWS-only; task definitions don’t port to other clouds',
      'Smaller ecosystem than Kubernetes (no Helm charts, operators)',
      'Fargate costs more per unit of compute than self-managed instances'
    ],
    useWhen: [
      'You are on AWS and want containers without Kubernetes complexity',
      'A handful to a few dozen services run by a small team'
    ],
    avoidWhen: [
      'Multi-cloud or on-prem portability is a requirement',
      'You rely on Kubernetes-native tooling and operators'
    ],
    alternatives: ['Managed Kubernetes (EKS / GKE / AKS)', 'Google Cloud Run', 'HashiCorp Nomad', 'Azure Container Apps']
  },
  {
    id: 'cloud-run',
    name: 'Google Cloud Run',
    category: 'Compute & hosting',
    unit: 'u3',
    icon: 'rocket',
    tagline: 'Serverless containers that scale with HTTP traffic',
    summary:
      'Cloud Run takes any container image that listens on a port and runs it as an autoscaling HTTP service, including scaling to zero when idle. Unlike classic functions, one instance can handle many concurrent requests. It sits between Lambda-style functions and full Kubernetes: you ship a container, Google handles the rest.',
    strengths: [
      'Any language or binary, as long as it’s a container',
      'Scales to zero and bills only while handling requests (default mode)',
      'Multiple concurrent requests per instance lowers cost vs. one-per-call',
      'Built on the open Knative API, easing portability'
    ],
    weaknesses: [
      'Cold starts when scaling up from zero',
      'Stateless instances; local disk is ephemeral',
      'Less control over networking and scheduling than GKE'
    ],
    useWhen: [
      'Stateless HTTP APIs or web apps with variable traffic',
      'You want containers without managing a cluster'
    ],
    avoidWhen: [
      'Stateful workloads or ones needing local persistent disk',
      'Complex service meshes and custom scheduling (use GKE)'
    ],
    alternatives: ['AWS ECS & Fargate', 'AWS Lambda', 'Azure Container Apps', 'Fly.io']
  },
  {
    id: 'docker',
    name: 'Docker',
    category: 'Compute & hosting',
    unit: 'u3',
    alsoIn: ['u1', 'u9'],
    icon: 'container',
    tagline: 'Package an app and its dependencies into a portable container',
    summary:
      'Docker builds a container image that bundles your code, runtime and libraries, then runs it as an isolated process sharing the host’s kernel. The same image runs on a laptop, in CI and in production. Containers are the unit that orchestrators like Kubernetes and ECS schedule and scale.',
    strengths: [
      '"Works on my machine" becomes "works everywhere"',
      'Starts in seconds or less, far faster than booting a VM',
      'Same immutable image from dev to CI to prod',
      'Foundation for horizontal scaling and orchestration'
    ],
    weaknesses: [
      'Doesn’t schedule containers across many machines by itself',
      'Persistent data needs volumes and care',
      'Images need hygiene: base-image updates and vulnerability scanning'
    ],
    useWhen: [
      'Shipping any service consistently across environments',
      'Local dev environments with several dependencies (docker compose)'
    ],
    avoidWhen: [
      'Workloads needing special hardware or kernel access without extra setup',
      'Strong isolation between untrusted tenants (shared kernel; use VMs or microVMs)'
    ],
    alternatives: ['Podman', 'Virtual machines', 'Cloud Native Buildpacks']
  },
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    category: 'Compute & hosting',
    unit: 'u3',
    alsoIn: ['u4', 'u9'],
    icon: 'ship-wheel',
    tagline: 'Runs, heals and autoscales containers across a cluster',
    summary:
      'Kubernetes (K8s) is an open-source orchestrator: you declare the desired state (e.g. "run 5 replicas of this image") and its control loop keeps reality matching it across a cluster of machines. It handles scheduling, restarts, rolling deploys, service discovery and autoscaling. It has become the standard platform layer for running many services at scale.',
    strengths: [
      'Self-healing: restarts and reschedules failed containers',
      'Horizontal Pod Autoscaler scales on CPU or custom metrics',
      'Rolling deploys and rollbacks built in',
      'Huge ecosystem (Helm, operators) and runs on every major cloud'
    ],
    weaknesses: [
      'Steep learning curve and real operational complexity',
      'Overkill for a handful of services',
      'Many moving parts to secure and upgrade'
    ],
    useWhen: [
      'Many services owned by multiple teams',
      'You need autoscaling, standardized deploys and cloud portability'
    ],
    avoidWhen: [
      'Small team with one or two services (use a PaaS, ECS or Cloud Run)',
      'No one on the team can own cluster operations'
    ],
    alternatives: ['Managed Kubernetes (EKS / GKE / AKS)', 'AWS ECS & Fargate', 'Google Cloud Run', 'HashiCorp Nomad']
  },
  {
    id: 'managed-kubernetes',
    name: 'Managed Kubernetes (EKS / GKE / AKS)',
    category: 'Compute & hosting',
    unit: 'u3',
    alsoIn: ['u9'],
    icon: 'cloud-cog',
    tagline: 'Cloud-run Kubernetes control planes on AWS, Google and Azure',
    summary:
      'Amazon EKS, Google GKE and Azure AKS run the Kubernetes control plane (API server, etcd, scheduler) for you, so you only deal with workloads and, depending on mode, worker nodes. They integrate with each cloud’s load balancers, IAM and storage. Modes like GKE Autopilot and EKS with Fargate go further and manage nodes too.',
    strengths: [
      'No need to run or back up the control plane yourself',
      'Standard Kubernetes API, so manifests and Helm charts carry over',
      'Native integration with cloud LBs, disks, identity and logging',
      'Managed upgrades and node auto-repair options'
    ],
    weaknesses: [
      'Still Kubernetes: cluster design, upgrades and security remain your job',
      'Control-plane fees plus node costs add up for small setups',
      'Cloud-specific add-ons (IAM, ingress) reduce real portability'
    ],
    useWhen: [
      'You’ve chosen Kubernetes and don’t want to run it from scratch',
      'Platform team serving many services across teams'
    ],
    avoidWhen: [
      'A few services where ECS, Cloud Run or a PaaS is far simpler',
      'Strict on-prem requirements'
    ],
    alternatives: ['Kubernetes', 'AWS ECS & Fargate', 'Google Cloud Run', 'HashiCorp Nomad']
  },
  {
    id: 'nomad',
    name: 'HashiCorp Nomad',
    category: 'Compute & hosting',
    unit: 'u3',
    icon: 'orbit',
    tagline: 'Lightweight scheduler for containers, VMs and plain binaries',
    summary:
      'Nomad is a workload orchestrator shipped as a single binary that schedules jobs across a cluster. Unlike Kubernetes it can run containers, raw executables, Java apps and VMs side by side. It pairs with Consul for service discovery and Vault for secrets.',
    strengths: [
      'Single binary, far simpler to operate than Kubernetes',
      'Runs non-container workloads as well as containers',
      'Scales to very large clusters and multiple regions',
      'Integrates tightly with Consul and Vault'
    ],
    weaknesses: [
      'Much smaller ecosystem and talent pool than Kubernetes',
      'Needs Consul/Vault for features K8s bundles in',
      'Moved from open source (MPL) to the Business Source License in 2023'
    ],
    useWhen: [
      'Mixed workloads (legacy binaries plus containers)',
      'Teams that want orchestration without Kubernetes’ complexity'
    ],
    avoidWhen: [
      'You want the broad Kubernetes ecosystem and hiring pool',
      'A managed container service would remove the ops burden entirely'
    ],
    alternatives: ['Kubernetes', 'AWS ECS & Fargate', 'Docker Swarm']
  },
  {
    id: 'heroku',
    name: 'Heroku',
    category: 'Compute & hosting',
    unit: 'u3',
    alsoIn: ['u1'],
    icon: 'cloud-upload',
    tagline: 'Pioneering PaaS: git push and your app is live',
    summary:
      'Heroku is a platform-as-a-service that builds your code with buildpacks and runs it on managed containers called dynos. You scale by changing dyno count or size, and add databases and other services as add-ons. It runs on AWS underneath and trades control for developer speed.',
    strengths: [
      'Extremely simple deploys: push code, get a URL',
      'Managed Postgres, Redis and a large add-on marketplace',
      'Easy horizontal scaling by adding dynos',
      'Mature, well-documented platform'
    ],
    weaknesses: [
      'Expensive per unit of compute as you grow',
      'Limited control over networking, regions and runtime',
      'No free tier since 2022'
    ],
    useWhen: [
      'Prototypes, MVPs and small teams without ops staff',
      'Standard web apps on popular frameworks'
    ],
    avoidWhen: [
      'Large scale where cost per dyno dominates',
      'You need fine-grained network control or unusual infrastructure'
    ],
    alternatives: ['Render', 'Fly.io', 'Google App Engine', 'AWS Elastic Beanstalk']
  },
  {
    id: 'render',
    name: 'Render',
    category: 'Compute & hosting',
    unit: 'u3',
    icon: 'cloud-upload',
    tagline: 'Modern PaaS for web services, workers, cron jobs and databases',
    summary:
      'Render deploys apps from a Git repo or Docker image and hosts web services, background workers, cron jobs, static sites and managed Postgres. It provides TLS, private networking and autoscaling without you touching servers. It is often seen as a modern, cheaper Heroku successor.',
    strengths: [
      'Git-push or Docker deploys with automatic TLS',
      'Covers services, workers, cron and static sites in one place',
      'Managed Postgres and Redis-compatible key-value store',
      'Infrastructure-as-code via a render.yaml Blueprint'
    ],
    weaknesses: [
      'Fewer regions and less control than a hyperscaler',
      'Smaller ecosystem than AWS or Heroku',
      'Costs can exceed raw cloud VMs at scale'
    ],
    useWhen: [
      'Small teams that want a full stack without DevOps work',
      'Startups moving off Heroku'
    ],
    avoidWhen: [
      'You need many regions, special hardware or deep network control',
      'Large-scale workloads where cloud primitives are cheaper'
    ],
    alternatives: ['Heroku', 'Fly.io', 'Railway', 'Google Cloud Run']
  },
  {
    id: 'fly-io',
    name: 'Fly.io',
    category: 'Compute & hosting',
    unit: 'u3',
    alsoIn: ['u4'],
    icon: 'globe',
    tagline: 'Run containers as micro-VMs close to users worldwide',
    summary:
      'Fly.io converts your Docker image into Firecracker micro-VMs ("Machines") and runs them in many regions around the world. Its Anycast network routes each user to the nearest instance. It suits apps that want low latency globally, including stateful ones using attached volumes.',
    strengths: [
      'Easy multi-region deploys close to users',
      'Anycast routing and built-in private networking between apps',
      'Micro-VM isolation, with fast start and stop of Machines',
      'Supports persistent volumes for stateful apps'
    ],
    weaknesses: [
      'Volumes are tied to a single host; you handle replication yourself',
      'Smaller company and platform; reliability history is mixed',
      'Multi-region data consistency is still your problem'
    ],
    useWhen: [
      'Latency-sensitive apps with users on several continents',
      'Small teams wanting global deploys without a hyperscaler'
    ],
    avoidWhen: [
      'You need a hyperscaler’s breadth of managed services and compliance',
      'Single-region apps where a simpler PaaS is enough'
    ],
    alternatives: ['Render', 'Google Cloud Run', 'Cloudflare Workers', 'Heroku']
  },
  {
    id: 'vercel',
    name: 'Vercel',
    category: 'Compute & hosting',
    unit: 'u4',
    alsoIn: ['u3', 'u7'],
    icon: 'layout',
    tagline: 'Frontend cloud for Next.js and other web frameworks',
    summary:
      'Vercel deploys frontend apps from Git, serving static assets from a global CDN and running server-side code as serverless or edge functions. It is built by the creators of Next.js and gives every pull request a preview URL. It is typically the frontend and BFF layer, with databases and heavy backends living elsewhere.',
    strengths: [
      'Zero-config deploys and preview URLs per pull request',
      'First-class Next.js support (SSR, ISR, edge middleware)',
      'Global CDN caching for static and rendered pages',
      'Serverless functions scale automatically'
    ],
    weaknesses: [
      'Costs can grow fast with bandwidth and function usage',
      'Function duration limits; not built for long-running backends',
      'Tight coupling to Vercel-specific features creates lock-in'
    ],
    useWhen: [
      'Next.js or other modern frontend apps',
      'Teams that want fast iteration with preview deployments'
    ],
    avoidWhen: [
      'Long-running jobs, WebSocket servers or heavy backend compute',
      'Very high traffic where self-hosting is cheaper'
    ],
    alternatives: ['Netlify', 'Cloudflare Workers', 'AWS Amplify', 'Render']
  },
  {
    id: 'netlify',
    name: 'Netlify',
    category: 'Compute & hosting',
    unit: 'u4',
    alsoIn: ['u7'],
    icon: 'globe',
    tagline: 'Git-based hosting for static sites and Jamstack apps',
    summary:
      'Netlify builds your frontend from Git and serves it from a global CDN, with serverless and edge functions for dynamic pieces. It popularized the "Jamstack" pattern of pre-built static pages plus APIs. Built-in forms, redirects and deploy previews cover common site needs without a backend.',
    strengths: [
      'Simple Git-driven deploys with atomic rollbacks',
      'Deploy previews for every pull request',
      'Global CDN with instant cache invalidation on deploy',
      'Framework-agnostic (Astro, Hugo, Next.js, SvelteKit, etc.)'
    ],
    weaknesses: [
      'Serverless functions have execution time limits',
      'Bandwidth and build-minute costs rise with traffic',
      'Not suited to stateful or heavy backend workloads'
    ],
    useWhen: [
      'Static sites, docs, marketing pages and Jamstack apps',
      'Frontend teams wanting zero infrastructure work'
    ],
    avoidWhen: [
      'Backends needing long-running processes or persistent connections',
      'Apps tightly built around Next.js features (Vercel fits better)'
    ],
    alternatives: ['Vercel', 'Cloudflare Pages', 'AWS Amplify', 'GitHub Pages']
  },
  {
    id: 'cloudflare-workers',
    name: 'Cloudflare Workers',
    category: 'Compute & hosting',
    unit: 'u4',
    alsoIn: ['u3', 'u7'],
    icon: 'zap',
    tagline: 'Serverless functions running at the edge in V8 isolates',
    summary:
      'Workers run JavaScript, TypeScript or WebAssembly in lightweight V8 isolates across Cloudflare’s global network, so code executes close to each user. Isolates start far faster than containers, so cold starts are negligible. They pair with Cloudflare storage like KV, R2, D1 and Durable Objects.',
    strengths: [
      'Near-zero cold starts thanks to isolates',
      'Runs in hundreds of cities, close to users',
      'Great for auth checks, redirects, A/B tests and API routing at the edge',
      'Edge storage options: KV, R2, D1, Durable Objects'
    ],
    weaknesses: [
      'Not full Node.js: some APIs and native modules are unavailable',
      'Strict CPU-time and memory limits per request',
      'Data often lives far from the edge, eroding the latency win'
    ],
    useWhen: [
      'Lightweight request logic that benefits from being near users',
      'Edge middleware in front of an origin (auth, routing, caching)'
    ],
    avoidWhen: [
      'CPU-heavy or long-running work',
      'Code relying on native libraries or full Node.js APIs'
    ],
    alternatives: ['AWS Lambda', 'Vercel', 'Fastly Compute', 'Deno Deploy']
  },
  {
    id: 'app-engine',
    name: 'Google App Engine',
    category: 'Compute & hosting',
    unit: 'u3',
    icon: 'cloud',
    tagline: 'Google’s original fully managed app platform',
    summary:
      'App Engine runs web apps on Google-managed infrastructure that scales automatically with traffic. The Standard environment uses language-specific sandboxes and can scale to zero; the Flexible environment runs your app in containers on VMs. Google now steers most new projects toward Cloud Run.',
    strengths: [
      'Fully managed scaling, patching and load balancing',
      'Standard environment scales to zero',
      'Built-in traffic splitting between versions',
      'Long track record running at Google scale'
    ],
    weaknesses: [
      'Standard environment restricts runtimes and libraries',
      'Strong Google Cloud lock-in',
      'Largely superseded by Cloud Run for new work'
    ],
    useWhen: [
      'Maintaining existing App Engine apps',
      'Simple web apps on supported runtimes with spiky traffic'
    ],
    avoidWhen: [
      'New projects where Cloud Run gives more flexibility',
      'Workloads needing custom binaries or fine-grained infrastructure control'
    ],
    alternatives: ['Google Cloud Run', 'Heroku', 'AWS Elastic Beanstalk', 'Render']
  },

  // ───────────────────────── Networking & traffic ─────────────────────────
  {
    id: 'nginx',
    name: 'Nginx',
    category: 'Networking & traffic',
    unit: 'u4',
    alsoIn: ['u7'],
    icon: 'server-cog',
    tagline: 'Web server, reverse proxy and L7 load balancer',
    summary:
      'Nginx is an event-driven web server that is most often used as a reverse proxy: it terminates TLS, serves static files and forwards API requests to a pool of app servers. It can also cache responses, compress output and rate limit clients. It usually sits at the edge of a service, behind DNS or a cloud load balancer.',
    strengths: [
      'Very fast at serving static files and proxying HTTP with low memory use',
      'TLS termination, caching, compression and rate limiting built in',
      'Simple config and a huge community'
    ],
    weaknesses: [
      'Open-source version has only passive health checks (active checks need NGINX Plus)',
      'Dynamic backends need config reloads or extra tooling',
      'Less detailed load-balancing stats than HAProxy'
    ],
    useWhen: [
      'Reverse proxy in front of app servers',
      'Serving static content and proxying the API from one box'
    ],
    avoidWhen: [
      'You want a fully managed load balancer in the cloud',
      'Highly dynamic service-to-service routing (Envoy fits better)'
    ],
    alternatives: ['HAProxy', 'Envoy', 'Caddy', 'Traefik']
  },
  {
    id: 'haproxy',
    name: 'HAProxy',
    category: 'Networking & traffic',
    unit: 'u4',
    icon: 'shuffle',
    tagline: 'High-performance L4/L7 load balancer',
    summary:
      'HAProxy is an open-source load balancer and proxy focused purely on distributing TCP and HTTP traffic across backends. It offers active health checks, many balancing algorithms and a detailed stats page. It is commonly self-hosted in pairs, with keepalived moving a virtual IP on failure.',
    strengths: [
      'Extremely fast and battle-tested at large scale',
      'Active health checks, rich algorithms, detailed stats page',
      'Both TCP (L4) and HTTP (L7) modes'
    ],
    weaknesses: [
      'Not a web server (no static file serving)',
      'You run and make it highly available yourself (keepalived etc.)'
    ],
    useWhen: [
      'Self-hosted, high-throughput load balancing',
      'Balancing non-HTTP TCP traffic such as databases'
    ],
    avoidWhen: [
      'A managed cloud load balancer would remove the ops burden',
      'You also need to serve static files from the same layer'
    ],
    alternatives: ['Nginx', 'Envoy', 'AWS ALB / NLB']
  },
  {
    id: 'alb',
    name: 'AWS ALB / NLB',
    category: 'Networking & traffic',
    unit: 'u4',
    icon: 'cloud',
    tagline: 'Managed L7 (ALB) and L4 (NLB) load balancers on AWS',
    summary:
      'Elastic Load Balancing offers the Application Load Balancer, which routes HTTP(S) by path, host or header, and the Network Load Balancer, which forwards raw TCP/UDP with very low latency. Both are managed and spread across availability zones. They sit in front of EC2 Auto Scaling groups, ECS services or EKS pods and route only to healthy targets.',
    strengths: [
      'Fully managed and redundant across availability zones',
      'ALB: path/host routing, TLS termination, WebSockets, gRPC',
      'NLB: very low-latency L4 and static IPs per zone',
      'Integrates with Auto Scaling groups and ECS/EKS'
    ],
    weaknesses: [
      'Charged per hour plus per capacity unit',
      'AWS lock-in',
      'Less tunable than a self-hosted proxy'
    ],
    useWhen: [
      'You are on AWS and don’t want to run load balancers',
      'Need L7 routing to multiple services behind one domain (ALB)'
    ],
    avoidWhen: [
      'Multi-cloud or on-prem requirements',
      'You need advanced traffic shaping a proxy like Envoy provides'
    ],
    alternatives: ['Google Cloud Load Balancing', 'Azure Load Balancer / Application Gateway', 'HAProxy', 'Nginx']
  },
  {
    id: 'envoy',
    name: 'Envoy',
    category: 'Networking & traffic',
    unit: 'u4',
    alsoIn: ['u3'],
    icon: 'waypoints',
    tagline: 'Programmable L4/L7 proxy built for microservices',
    summary:
      'Envoy is a CNCF open-source proxy, originally from Lyft, designed to run as an edge gateway or as a sidecar next to each service. Its configuration can be updated live through APIs (xDS), which is why it is the data plane behind Istio and many API gateways. It provides retries, circuit breaking, observability and first-class HTTP/2 and gRPC.',
    strengths: [
      'Dynamic config via xDS APIs with no restarts',
      'Retries, timeouts, circuit breaking and outlier detection',
      'Rich metrics and distributed tracing out of the box',
      'Excellent HTTP/2 and gRPC support'
    ],
    weaknesses: [
      'Verbose, complex configuration; usually driven by a control plane',
      'Higher memory use than Nginx or HAProxy per instance',
      'Steeper learning curve for simple use cases'
    ],
    useWhen: [
      'Service-to-service traffic in a microservice or mesh setup',
      'gRPC-heavy systems needing smart L7 routing'
    ],
    avoidWhen: [
      'A simple reverse proxy for one app (Nginx or Caddy is easier)',
      'No control plane and no appetite for hand-written config'
    ],
    alternatives: ['Nginx', 'HAProxy', 'Traefik', 'Linkerd']
  },
  {
    id: 'traefik',
    name: 'Traefik',
    category: 'Networking & traffic',
    unit: 'u4',
    icon: 'route',
    tagline: 'Reverse proxy that configures itself from Docker and Kubernetes',
    summary:
      'Traefik is an open-source reverse proxy and ingress controller that watches providers like Docker, Kubernetes and Consul and builds its routes automatically from labels or resources. It handles TLS with automatic Let’s Encrypt certificates. It is popular for container setups where services come and go often.',
    strengths: [
      'Auto-discovers services; no manual route edits',
      'Automatic HTTPS via Let’s Encrypt',
      'Works as a Kubernetes ingress controller',
      'Built-in dashboard and middleware (auth, rate limit, retries)'
    ],
    weaknesses: [
      'Lower raw throughput than Nginx or HAProxy in benchmarks',
      'Label-based config can become hard to audit',
      'Advanced features sit in the commercial Enterprise edition'
    ],
    useWhen: [
      'Docker or Kubernetes setups with frequently changing services',
      'Small teams wanting automatic TLS and routing'
    ],
    avoidWhen: [
      'Maximum-throughput edge load balancing',
      'Static setups where a simple Nginx config suffices'
    ],
    alternatives: ['Nginx', 'Caddy', 'Envoy', 'HAProxy']
  },
  {
    id: 'caddy',
    name: 'Caddy',
    category: 'Networking & traffic',
    unit: 'u4',
    icon: 'lock',
    tagline: 'Web server and reverse proxy with automatic HTTPS by default',
    summary:
      'Caddy is an open-source web server written in Go that obtains and renews TLS certificates automatically for every site it serves. A few lines in a Caddyfile give you a static file server or reverse proxy with load balancing. It is a simpler alternative to Nginx for small and medium deployments.',
    strengths: [
      'Automatic HTTPS with certificate issuance and renewal',
      'Very short, readable config (Caddyfile)',
      'Memory-safe Go codebase; single static binary',
      'Live config changes through a JSON admin API'
    ],
    weaknesses: [
      'Smaller ecosystem and fewer tuning guides than Nginx',
      'Less proven at very large scale',
      'Some features need custom builds with plugins'
    ],
    useWhen: [
      'Self-hosting small services that need TLS with zero fuss',
      'Simple reverse proxy or static site serving'
    ],
    avoidWhen: [
      'Large, high-throughput edges with established Nginx/HAProxy expertise',
      'You’re already behind a managed load balancer that terminates TLS'
    ],
    alternatives: ['Nginx', 'Traefik', 'HAProxy']
  },
  {
    id: 'route53',
    name: 'Amazon Route 53',
    category: 'Networking & traffic',
    unit: 'u4',
    alsoIn: ['u8'],
    icon: 'compass',
    tagline: 'Managed DNS with health checks and traffic routing policies',
    summary:
      'Route 53 is AWS’s authoritative DNS service and domain registrar. Beyond plain records it supports routing policies (weighted, latency-based, geolocation, failover) combined with health checks, so DNS itself can steer users between regions. It is often the first hop in an AWS architecture, pointing at CloudFront or load balancers.',
    strengths: [
      'Highly available global DNS with an SLA',
      'Latency, geo, weighted and failover routing policies',
      'Health checks can pull unhealthy endpoints from DNS answers',
      'Alias records point directly at AWS resources like ALBs'
    ],
    weaknesses: [
      'Failover speed is bounded by DNS TTLs and client caching',
      'Advanced routing ties you to AWS',
      'Per-query and per-health-check charges add up at scale'
    ],
    useWhen: [
      'Your stack runs on AWS',
      'Multi-region active-active or active-passive failover'
    ],
    avoidWhen: [
      'You need instant failover (DNS caching delays it; use Global Accelerator)',
      'Multi-cloud DNS where a neutral provider is preferred'
    ],
    alternatives: ['Cloudflare DNS', 'Google Cloud DNS', 'Azure DNS', 'NS1']
  },
  {
    id: 'cloudflare-dns',
    name: 'Cloudflare DNS',
    category: 'Networking & traffic',
    unit: 'u4',
    alsoIn: ['u7'],
    icon: 'globe',
    tagline: 'Fast authoritative DNS on Cloudflare’s Anycast network',
    summary:
      'Cloudflare DNS hosts your domain’s records on its global Anycast network, which gives fast lookups and built-in DDoS resilience. Records can be "proxied", meaning traffic flows through Cloudflare’s CDN, WAF and TLS before reaching your origin. It is commonly the front door for sites that use Cloudflare’s other edge services.',
    strengths: [
      'Consistently among the fastest authoritative DNS providers',
      'Anycast network absorbs DDoS attacks',
      'Proxied records add CDN, WAF and origin IP hiding',
      'Generous free plan and simple dashboard and API'
    ],
    weaknesses: [
      'Proxy mode puts Cloudflare in the path of all your traffic',
      'Load balancing and advanced failover are paid add-ons',
      'Full setup usually means delegating nameservers to Cloudflare'
    ],
    useWhen: [
      'Any public site wanting fast, resilient DNS',
      'You also want Cloudflare’s CDN and security in front of your origin'
    ],
    avoidWhen: [
      'Policies forbid a third party terminating your TLS',
      'Deep AWS integrations (alias to ALB) matter more (use Route 53)'
    ],
    alternatives: ['Amazon Route 53', 'Google Cloud DNS', 'NS1', 'Azure DNS']
  },
  {
    id: 'api-gateway',
    name: 'Amazon API Gateway',
    category: 'Networking & traffic',
    unit: 'u4',
    alsoIn: ['u3'],
    icon: 'webhook',
    tagline: 'Managed front door for REST, HTTP and WebSocket APIs on AWS',
    summary:
      'API Gateway accepts client API calls and routes them to Lambda functions, HTTP backends or other AWS services. It handles auth (IAM, Cognito, JWT, custom authorizers), throttling, request validation and usage plans with API keys. It is the standard HTTP entry point for serverless architectures on AWS.',
    strengths: [
      'Fully managed and scales automatically',
      'Built-in throttling, auth and API keys with usage plans',
      'Native Lambda integration; also supports WebSocket APIs',
      'Pay per request with no idle servers'
    ],
    weaknesses: [
      'Adds latency and per-request cost at high volume',
      'Hard limits on integration timeout and payload size',
      'Config is AWS-specific and tricky to reproduce locally'
    ],
    useWhen: [
      'Exposing Lambda functions as an HTTP API',
      'You need per-client rate limits and API keys without building them'
    ],
    avoidWhen: [
      'Very high, steady traffic where an ALB or self-hosted gateway is cheaper',
      'Long-running requests that exceed integration timeouts'
    ],
    alternatives: ['Kong Gateway', 'AWS ALB / NLB', 'Apigee', 'Azure API Management']
  },
  {
    id: 'kong',
    name: 'Kong Gateway',
    category: 'Networking & traffic',
    unit: 'u4',
    icon: 'plug',
    tagline: 'Open-source API gateway built on Nginx with a plugin system',
    summary:
      'Kong is an API gateway that sits in front of your services to handle authentication, rate limiting, logging and request transformation through plugins. It is built on Nginx and OpenResty and can be self-hosted or used through Kong’s managed Konnect platform. It also runs as a Kubernetes ingress controller.',
    strengths: [
      'Large plugin library: auth, rate limiting, transforms, logging',
      'Cloud-agnostic; runs anywhere including Kubernetes',
      'High performance thanks to its Nginx core',
      'Declarative config (decK) fits GitOps workflows'
    ],
    weaknesses: [
      'You operate it (and its database, unless DB-less mode)',
      'Many advanced plugins require the paid Enterprise edition',
      'Custom plugins historically mean writing Lua'
    ],
    useWhen: [
      'Many microservices needing consistent auth and rate limiting',
      'Multi-cloud or on-prem setups avoiding a cloud-specific gateway'
    ],
    avoidWhen: [
      'A few services where a managed cloud gateway is simpler',
      'A team without capacity to run another critical component'
    ],
    alternatives: ['Amazon API Gateway', 'Envoy', 'Traefik', 'Apigee']
  },
  {
    id: 'istio',
    name: 'Istio',
    category: 'Networking & traffic',
    unit: 'u3',
    alsoIn: ['u4', 'u9'],
    icon: 'network',
    tagline: 'Service mesh for traffic control, mTLS and telemetry',
    summary:
      'Istio is a service mesh for Kubernetes that intercepts traffic between services using Envoy proxies (as sidecars, or via its newer sidecar-less ambient mode). A control plane pushes policies for retries, timeouts, canary traffic splits and mutual TLS. It gives uniform security and observability without changing application code.',
    strengths: [
      'Automatic mutual TLS between services',
      'Fine-grained traffic splitting for canaries and blue-green deploys',
      'Retries, timeouts and circuit breaking without code changes',
      'Uniform metrics and traces across every service'
    ],
    weaknesses: [
      'Significant complexity and a steep learning curve',
      'Sidecars add latency and memory to every pod',
      'Upgrades and debugging can be painful'
    ],
    useWhen: [
      'Many services needing zero-trust mTLS and consistent policy',
      'Advanced traffic management for progressive delivery'
    ],
    avoidWhen: [
      'A handful of services where the overhead outweighs the benefit',
      'A team without dedicated platform engineers'
    ],
    alternatives: ['Linkerd', 'Consul service mesh', 'Cilium']
  },
  {
    id: 'linkerd',
    name: 'Linkerd',
    category: 'Networking & traffic',
    unit: 'u3',
    alsoIn: ['u4', 'u9'],
    icon: 'link',
    tagline: 'Lightweight, security-focused service mesh for Kubernetes',
    summary:
      'Linkerd is a CNCF-graduated service mesh that adds a small Rust-based proxy next to each pod. It provides automatic mTLS, retries, load balancing and golden metrics (success rate, latency, throughput) with minimal configuration. It deliberately does less than Istio in exchange for simplicity and low overhead.',
    strengths: [
      'Simple to install and operate compared with Istio',
      'Purpose-built Rust micro-proxy with low latency and memory',
      'mTLS on by default between meshed pods',
      'Per-service golden metrics with no code changes'
    ],
    weaknesses: [
      'Fewer advanced traffic features than Istio/Envoy',
      'Kubernetes-only',
      'Stable release builds moved to a vendor (Buoyant) distribution in 2024'
    ],
    useWhen: [
      'You want mesh benefits (mTLS, metrics) with minimal complexity',
      'Latency- and resource-sensitive clusters'
    ],
    avoidWhen: [
      'You need rich traffic policies or VM workloads outside Kubernetes',
      'Only a few services that don’t need a mesh at all'
    ],
    alternatives: ['Istio', 'Consul service mesh', 'Cilium']
  },
  {
    id: 'vpc',
    name: 'Amazon VPC',
    category: 'Networking & traffic',
    unit: 'u1',
    alsoIn: ['u4', 'u9'],
    icon: 'shield',
    tagline: 'Your own isolated private network inside AWS',
    summary:
      'A Virtual Private Cloud is a logically isolated network where you define IP ranges, public and private subnets across availability zones, route tables and gateways. Security groups (per-instance firewalls) and network ACLs (per-subnet) control traffic. A typical design keeps load balancers in public subnets and app servers and databases in private ones.',
    strengths: [
      'Network isolation: databases never need a public IP',
      'Security groups and NACLs give layered firewalling',
      'Subnets across availability zones enable high availability',
      'Connect to on-prem or other VPCs via VPN, peering or Transit Gateway'
    ],
    weaknesses: [
      'CIDR planning mistakes are hard to fix later',
      'NAT gateways and cross-AZ traffic carry notable costs',
      'Routing and connectivity issues can be tricky to debug'
    ],
    useWhen: [
      'Any production AWS workload (everything runs in a VPC)',
      'Separating public-facing tiers from private data tiers'
    ],
    avoidWhen: [
      'Fully serverless apps with no private resources may not need custom VPC design',
      'Overly complex multi-VPC layouts before you actually need them'
    ],
    alternatives: ['Google Cloud VPC', 'Azure Virtual Network']
  },
  {
    id: 'global-accelerator',
    name: 'AWS Global Accelerator',
    category: 'Networking & traffic',
    unit: 'u4',
    alsoIn: ['u8'],
    icon: 'satellite',
    tagline: 'Static Anycast IPs that route users over the AWS backbone',
    summary:
      'Global Accelerator gives you two static Anycast IP addresses that users connect to at the nearest AWS edge location. From there traffic rides the AWS private backbone to healthy endpoints (ALBs, NLBs, EC2) in one or more regions. Because failover happens at the network layer, not via DNS, regional failover is much faster than DNS-based approaches.',
    strengths: [
      'Fast regional failover without waiting on DNS TTLs',
      'Static IPs simplify client allow-lists',
      'Lower, steadier latency over the AWS backbone',
      'Works for TCP and UDP, not just HTTP'
    ],
    weaknesses: [
      'Hourly fee plus data transfer premium',
      'No caching; it is not a CDN',
      'AWS-only endpoints'
    ],
    useWhen: [
      'Multi-region apps needing fast failover',
      'Non-HTTP workloads (gaming, VoIP, IoT) that want lower latency'
    ],
    avoidWhen: [
      'Cacheable static content (use a CDN like CloudFront)',
      'Single-region apps where DNS plus a load balancer suffices'
    ],
    alternatives: ['Amazon Route 53', 'Amazon CloudFront', 'Cloudflare Spectrum', 'Google Cloud Load Balancing']
  }
]
