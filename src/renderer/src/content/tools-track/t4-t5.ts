import type { Unit } from '../../../../shared/types'

// ───────────────────────────── T4: Traffic in practice ─────────────────────────────
export const T4_TRAFFIC: Unit = {
  id: 't4',
  track: 'tools',
  requires: ['u4'],
  teaches: ['nginx', 'alb', 'route53', 'cloudflare-dns', 'api-gateway', 'kong'],
  title: 'Traffic in practice',
  subtitle: 'Nginx, ALB/NLB, Route 53 DNS and API gateways, with real config',
  icon: 'network',
  color: '#26a69a',
  lessons: [
    {
      id: 't4-proxies',
      type: 'lesson',
      title: 'Nginx and AWS load balancers',
      minutes: 8,
      cards: [
        {
          title: 'Nginx as a reverse proxy',
          body: `<p>Nginx config is nested blocks. A <code>server</code> block matches a port and hostname. Inside it, <code>location</code> blocks match URL paths. An <code>upstream</code> block names a pool of backends.</p>
<pre class="diagram">upstream api_pool {
    least_conn;
    server 10.0.1.10:8080;
    server 10.0.1.11:8080;
}
server {
    listen 80;
    server_name api.example.com;
    location /api/ {
        proxy_pass http://api_pool;
    }
}</pre>
<p>Default balancing is round robin. <code>least_conn</code>, <code>ip_hash</code> and <code>hash $key consistent</code> are the other common choices.</p>`
        },
        {
          title: 'Headers: who was the real client?',
          body: `<p>Behind a proxy, your app sees the <b>proxy's</b> IP and hostname unless you pass them along:</p>
<pre class="diagram">proxy_set_header Host $host;
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
proxy_set_header X-Forwarded-Proto $scheme;</pre>
<p><code>X-Forwarded-For</code> is a comma-separated chain; each proxy appends the address it saw. Clients can forge the left side, so only trust entries added by <b>your own</b> proxies. <code>X-Forwarded-Proto</code> tells the app the original request was HTTPS, so it doesn't build <code>http://</code> redirect loops.</p>`
        },
        {
          title: 'Timeouts, retries and passive health checks',
          body: `<ul><li><code>proxy_connect_timeout</code>: how long to wait to open a TCP connection to a backend.</li>
<li><code>proxy_read_timeout</code>: max gap between reads from the backend (default 60s). Exceeding it returns <b>504</b>.</li>
<li><code>max_fails=3 fail_timeout=30s</code> on a <code>server</code> line: after 3 failures within 30s, Nginx skips that server for 30s. This is a <b>passive</b> check, based on real traffic.</li>
<li><code>proxy_next_upstream</code> controls which errors get retried on another server.</li></ul>
<p>Active health checks (polling a <code>/health</code> URL) are an NGINX Plus feature; open-source Nginx only does passive checks.</p>`
        },
        {
          title: 'The proxy_pass trailing slash gotcha',
          body: `<p>Whether <code>proxy_pass</code> has a URI part changes the path the backend receives:</p>
<pre class="diagram">location /api/ { proxy_pass http://pool; }
  GET /api/users  ->  backend sees /api/users

location /api/ { proxy_pass http://pool/; }
  GET /api/users  ->  backend sees /users</pre>
<p>With a URI (even just <code>/</code>), Nginx <b>replaces</b> the matched location prefix. Without one, it passes the path unchanged. This one character causes a lot of 404s.</p>`
        },
        {
          title: 'AWS ALB: layer 7',
          body: `<p>An <b>Application Load Balancer</b> works at HTTP level. The pieces:</p>
<ul><li><b>Listener</b>: a port + protocol, e.g. HTTPS:443 with an ACM certificate. TLS terminates here.</li>
<li><b>Rules</b>: conditions on path, host header, HTTP headers or query string. E.g. <code>/api/*</code> to one group, <code>/static/*</code> to another.</li>
<li><b>Target group</b>: the backends (instances, IPs or Lambda functions) plus a <b>health check</b> (path, interval, healthy/unhealthy thresholds, expected status codes).</li></ul>
<p>Unhealthy targets stop getting traffic. On deploys, <b>deregistration delay</b> lets in-flight requests finish before a target is removed.</p>`
        },
        {
          title: 'ALB vs NLB',
          body: `<ul><li><b>ALB</b>: HTTP/HTTPS, path/host routing, gRPC and WebSockets, adds <code>X-Forwarded-For</code>, integrates with AWS WAF. No fixed IP addresses.</li>
<li><b>NLB</b>: layer 4 (TCP/UDP/TLS). Very high throughput and low latency, a <b>static IP per AZ</b> (can be an Elastic IP), and it can preserve the client source IP. No path routing.</li></ul>
<p>Rule of thumb in an interview: web and API traffic gets an ALB. Raw TCP (databases, game servers, MQTT), customers who must allowlist fixed IPs, or extreme connection counts get an NLB.</p>`
        }
      ],
      quiz: [
        {
          q: 'A request for /api/orders hits this config. What path does the backend see?',
          code: `location /api/ {
    proxy_pass http://orders_pool/;
}`,
          options: ['/api/orders', '/orders', '/api/api/orders', '/'],
          answer: 1,
          explain: 'Because proxy_pass includes a URI (/), Nginx replaces the matched /api/ prefix with it, so the backend gets /orders.'
        },
        {
          q: 'What does this upstream block do when 10.0.1.11 starts refusing connections?',
          code: `upstream api_pool {
    server 10.0.1.10:8080 max_fails=3 fail_timeout=30s;
    server 10.0.1.11:8080 max_fails=3 fail_timeout=30s;
}`,
          options: [
            'Nothing until an active /health probe fails',
            'Nginx removes it permanently until reload',
            'After 3 failed attempts within 30s, Nginx stops sending it traffic for 30s, then tries again',
            'Nginx returns 502 to every client for 30s'
          ],
          answer: 2,
          explain: 'max_fails/fail_timeout is passive health checking: real request failures mark the server unavailable for fail_timeout.'
        },
        {
          q: 'Every user in your app logs shows the same IP, 10.0.0.5. What most likely happened?',
          options: [
            'The app reads the TCP peer address, which is the proxy’s IP, instead of X-Forwarded-For',
            'All users share a NAT gateway',
            'The load balancer is using ip_hash',
            'TLS termination strips client IPs'
          ],
          answer: 0,
          explain: 'Behind a proxy the TCP peer is the proxy. Pass the client IP in X-Forwarded-For / X-Real-IP and read it from a trusted proxy.'
        },
        {
          q: 'An enterprise customer needs to allowlist fixed IP addresses for your raw TCP service. Which AWS load balancer fits?',
          options: ['ALB', 'Classic ELB', 'API Gateway', 'NLB'],
          answer: 3,
          explain: 'NLB gives a static IP per AZ (optionally Elastic IPs) and handles TCP. ALB IPs change over time.'
        },
        {
          q: 'You want /api/* and /images/* on the same domain to go to different services behind one ALB. What do you configure?',
          options: [
            'Two listeners on port 443',
            'Listener rules with path-pattern conditions forwarding to two target groups',
            'Two Route 53 records for the same name',
            'An NLB with path routing'
          ],
          answer: 1,
          explain: 'ALB listener rules match on path (and host, headers, query) and forward to the matching target group.'
        },
        {
          q: 'Users get 504 Gateway Timeout from Nginx on a slow report endpoint that takes 90s. Most direct cause?',
          options: [
            'proxy_connect_timeout is too high',
            'max_fails is set too low',
            'proxy_read_timeout (default 60s) expired while waiting for the backend',
            'The upstream uses least_conn'
          ],
          answer: 2,
          explain: 'proxy_read_timeout limits how long Nginx waits between reads from the backend. Better fix: make the report async.'
        }
      ]
    },
    {
      id: 't4-dns-cdn',
      type: 'lesson',
      title: 'DNS in practice with Route 53',
      minutes: 7,
      cards: [
        {
          title: 'Route 53 record types',
          body: `<ul><li><b>A / AAAA</b>: name to IPv4 / IPv6 address.</li>
<li><b>CNAME</b>: name to another name. <b>Not allowed at the zone apex</b> (<code>example.com</code>), only on subdomains like <code>www</code>.</li>
<li><b>Alias</b> (Route 53 specific): looks like an A/AAAA record but points at an AWS resource (ALB, CloudFront, S3 website, API Gateway). Works at the apex, follows the target's IP changes, and Route 53 doesn't charge for alias queries to AWS resources.</li></ul>
<p>Cloudflare does the same apex trick with <b>CNAME flattening</b>.</p>`
        },
        {
          title: 'TTLs and migrations',
          body: `<p>A record's <b>TTL</b> is how long resolvers may cache it. High TTL means fewer lookups but slow changes. Low TTL means fast failover but more queries.</p>
<pre class="diagram">$ dig +noall +answer www.example.com
www.example.com.  3600  IN  A  203.0.113.10</pre>
<p>Migration playbook: <b>lower the TTL</b> to ~60s a day ahead (wait out the old TTL), switch the record, verify, then raise it again. Some clients and resolvers ignore TTLs, so keep the old server up for a while.</p>`
        },
        {
          title: 'Routing policies',
          body: `<ul><li><b>Weighted</b>: split by weight, e.g. 90/10 between old and new stacks. Good for canary migrations.</li>
<li><b>Latency</b>: answer with the region that has the lowest latency for the user.</li>
<li><b>Failover</b>: primary/secondary. A Route 53 <b>health check</b> on the primary flips answers to the secondary.</li>
<li><b>Geolocation</b>: by user country/continent, e.g. for data residency.</li></ul>
<p>DNS failover is only as fast as the TTL plus health-check detection time. Expect tens of seconds to minutes, not milliseconds.</p>`
        },
        {
          title: 'What a CDN edge is for',
          body: `<p>A <b>CDN</b> (CloudFront, Cloudflare, Fastly) runs servers called <b>edges</b> in many cities. You point a hostname such as <code>static.example.com</code> at the CDN, and each user connects to the edge nearest them.</p>
<p>The edge keeps copies of <b>static files</b>: images, JS, CSS, video. A user in Sydney gets them from Sydney instead of crossing the planet to your origin in Virginia. Your servers see far less traffic, and TLS is set up close to the user.</p>
<p>Personal API responses usually pass straight through to your origin. Unit 07 and the Caching in practice module cover the headers that control what an edge keeps.</p>`
        }
      ],
      quiz: [
        {
          q: 'You want example.com (the bare apex) to point at your ALB on Route 53. Which record?',
          options: ['CNAME to the ALB DNS name', 'A record with the ALB’s current IPs', 'Alias A record targeting the ALB', 'TXT record'],
          answer: 2,
          explain: 'CNAMEs are not allowed at the apex and ALB IPs change. A Route 53 alias record handles both.'
        },
        {
          q: 'What does this dig output tell you?',
          code: `$ dig +noall +answer api.example.com
api.example.com.        300  IN  CNAME  my-alb-123.us-east-1.elb.amazonaws.com.
my-alb-123.us-east-1.elb.amazonaws.com.  60  IN  A  203.0.113.25
my-alb-123.us-east-1.elb.amazonaws.com.  60  IN  A  203.0.113.26`,
          options: [
            'api.example.com has two A records that someone typed in by hand',
            'api.example.com is a CNAME to the load balancer’s name, which currently resolves to two IPs that resolvers may cache for 60s',
            'The load balancer is down, because it returned two answers',
            'Resolvers will cache the two IPs for 300s'
          ],
          answer: 1,
          explain: 'The CNAME (TTL 300) points at the ALB’s DNS name, and AWS answers that name with its current IPs (TTL 60). That is why you never hardcode ALB IPs.'
        },
        {
          q: 'You plan to move www.example.com to a new IP tomorrow. The record has TTL 86400. What should you do today?',
          options: [
            'Nothing, DNS changes are instant',
            'Raise the TTL so resolvers keep the record longer',
            'Delete the record now',
            'Lower the TTL to ~60s now, so after the old TTL expires, tomorrow’s switch propagates fast'
          ],
          answer: 3,
          explain: 'Resolvers keep the old answer for up to the old TTL, so lower it at least one TTL ahead of the switch.'
        },
        {
          q: 'You are moving to a new stack and want only 10% of users on it at first. Which Route 53 routing policy?',
          options: ['Weighted', 'Latency', 'Geolocation', 'Failover'],
          answer: 0,
          explain: 'Weighted routing splits answers by weight, e.g. 90/10, and you shift the weights as confidence grows.'
        },
        {
          q: 'You use Route 53 failover routing with TTL 300. The primary region dies. Roughly how fast do most users move?',
          options: ['Instantly', 'Within a few minutes: health check detection plus up to the TTL', 'Only after you edit the record by hand', 'Never, failover only works for new users'],
          answer: 1,
          explain: 'Route 53 flips the answer once the health check fails, but resolvers keep the cached answer until the TTL expires.'
        },
        {
          q: 'Users in Australia say product images load slowly. Your only servers are in us-east-1. Simplest effective fix?',
          options: [
            'Lower the DNS TTL on the image hostname',
            'Switch the load balancer to least connections',
            'Add more app servers in us-east-1',
            'Serve images through a CDN so they come from an edge near the user'
          ],
          answer: 3,
          explain: 'The delay is distance. A CDN edge near the user serves the static files locally and only goes back to your origin when it lacks a copy.'
        }
      ]
    },
    {
      id: 't4-gateways',
      type: 'lesson',
      title: 'API gateways: Amazon API Gateway and Kong',
      minutes: 6,
      cards: [
        {
          title: 'What a gateway does that a load balancer doesn’t',
          body: `<p>A load balancer spreads traffic. An <b>API gateway</b> also applies <b>API policy</b> at the edge:</p>
<ul><li>Authentication (validate a JWT or API key before your code runs)</li>
<li>Rate limiting and quotas per client</li>
<li>Routing by path/method to different services or functions</li>
<li>Request/response transforms, CORS, logging</li></ul>
<p>Use it so every service doesn't reimplement auth and throttling. Keep business logic out of it.</p>`
        },
        {
          title: 'Amazon API Gateway',
          body: `<p>Managed and serverless, often in front of Lambda. Two main flavors: <b>REST APIs</b> (more features: usage plans, request validation, caching) and <b>HTTP APIs</b> (simpler, cheaper, lower latency).</p>
<p>Auth options: <b>IAM</b>, <b>Cognito</b> user pools, <b>JWT authorizers</b> (HTTP APIs), or a <b>Lambda authorizer</b> running your own check.</p>
<p>Gotcha: integrations have a short timeout (around 29 seconds by default). Long jobs should return 202 and finish asynchronously.</p>`
        },
        {
          title: 'Throttling and usage plans',
          body: `<p>API Gateway throttles with a <b>token bucket</b>: a steady <b>rate</b> (requests/s) plus a <b>burst</b>. Over the limit, clients get <b>429 Too Many Requests</b>.</p>
<p>Limits stack: account-level per region, then stage/method settings, then per-client <b>usage plans</b> tied to <b>API keys</b> (REST APIs).</p>
<p>API keys identify and meter a client. They are <b>not</b> a security mechanism on their own; pair them with a real authorizer.</p>`
        },
        {
          title: 'Kong',
          body: `<p>Kong is a self-hostable gateway built on Nginx/OpenResty. You define <b>services</b> (upstreams), <b>routes</b> (how requests match) and <b>plugins</b> (auth, rate limiting, logging). Core is open source; some plugins and the management UI are in the paid Enterprise/Konnect editions.</p>
<pre class="diagram">plugins:
- name: rate-limiting
  config:
    minute: 100
    policy: redis
    redis_host: redis.internal</pre>
<p><code>policy: local</code> counts per node, so N nodes allow roughly N x the limit. Use <code>redis</code> or <code>cluster</code> for a shared count.</p>`
        }
      ],
      quiz: [
        {
          q: 'You run 4 Kong nodes behind a load balancer with this config. Roughly how many requests per minute can one client make?',
          code: `plugins:
- name: rate-limiting
  config:
    minute: 100
    policy: local`,
          options: ['100', '25', 'Unlimited', 'About 400'],
          answer: 3,
          explain: 'local keeps counters in each node’s memory, so with requests spread over 4 nodes the effective limit is about 4 x 100.'
        },
        {
          q: 'A partner hits your API Gateway too fast. What status code do they see?',
          options: ['429 Too Many Requests', '503 Service Unavailable', '401 Unauthorized', '504 Gateway Timeout'],
          answer: 0,
          explain: 'Throttled requests are rejected with 429.'
        },
        {
          q: 'A teammate wants to secure a public API using only API Gateway API keys. Best response?',
          options: [
            'Fine, API keys are encrypted credentials',
            'API keys are for identifying and metering clients; add a real authorizer (JWT, Cognito, IAM or Lambda)',
            'Use API keys plus a longer key length',
            'Move the keys into query strings'
          ],
          answer: 1,
          explain: 'AWS documents API keys for usage plans, not authorization. Use an authorizer for auth.'
        },
        {
          q: 'A Lambda behind API Gateway generates a report that takes 2 minutes. Clients get timeouts. Best fix?',
          options: [
            'Increase the Lambda memory',
            'Switch to an NLB',
            'Return 202 with a job id, process asynchronously (queue/Step Functions), let clients poll or get a callback',
            'Retry on the client until it succeeds'
          ],
          answer: 2,
          explain: 'The gateway’s integration timeout is short. Long work belongs in an async job.'
        },
        {
          q: 'Which job belongs in the API gateway rather than in each microservice?',
          options: ['Calculating order totals', 'Validating JWTs and enforcing per-client rate limits', 'Writing to the orders table', 'Sending order confirmation emails'],
          answer: 1,
          explain: 'Cross-cutting edge policy (auth, throttling) goes in the gateway. Business logic stays in services.'
        }
      ]
    },
    {
      id: 't4-byte-request-path',
      type: 'byte',
      title: 'Interview Byte: Follow the request',
      minutes: 6,
      prompt:
        'A user types https://shop.example.com/api/cart into their browser. Trace the request from the URL bar to the app server and back, naming the actual AWS or Cloudflare pieces at each hop and what each one does.',
      hints: [
        'Start with DNS: which record type, and where does it point?',
        'Where does TLS terminate, and which responses can an edge serve from its copy?',
        'How does the app server learn the real client IP and protocol?'
      ],
      model: `<ol><li><b>DNS</b>: the resolver asks Route 53 (or Cloudflare DNS). An <b>alias</b> record for <code>shop.example.com</code> points to a CloudFront distribution; the answer is cached for its TTL.</li>
<li><b>CDN edge</b>: the browser opens TLS to the nearest CloudFront edge. <code>/static/*</code> files are served from the edge's copy; <code>/api/*</code> requests pass straight through to the origin with their auth headers.</li>
<li><b>WAF</b> rules and rate limits apply at the edge.</li>
<li><b>Origin</b>: CloudFront forwards to an <b>ALB</b>. Its HTTPS listener rule matches <code>/api/*</code> and picks a healthy target from the cart <b>target group</b>.</li>
<li><b>App</b>: the service reads <code>X-Forwarded-For</code>/<code>X-Forwarded-Proto</code>, checks the session or JWT, reads Redis/DB.</li>
<li><b>Back</b>: the response flows ALB to CloudFront to the browser. The cart is personal, so the edge must not keep a copy to hand to other users.</li></ol>`,
      points: [
        'DNS lookup with the right record type (alias/CNAME flattening) and TTL',
        'TLS termination point named (CDN edge and/or ALB with an ACM cert)',
        'CDN edge serves static files but passes personal API responses through',
        'ALB listener rule and target group with health checks',
        'Client IP/protocol passed via X-Forwarded-* headers',
        'Response path back through the same hops, with the cart never shared between users'
      ]
    }
  ]
}

// ───────────────────────────── T5: Auth in practice ─────────────────────────────
export const T5_AUTH: Unit = {
  id: 't5',
  track: 'tools',
  requires: ['u4'],
  teaches: ['jwt', 'oauth2', 'oidc', 'saml', 'auth0', 'okta', 'cognito', 'clerk', 'keycloak'],
  title: 'Auth in practice',
  subtitle: 'Sessions, JWTs, OAuth + PKCE, OIDC, SAML and picking a provider',
  icon: 'fingerprint',
  color: '#ab47bc',
  lessons: [
    {
      id: 't5-sessions-jwt',
      type: 'lesson',
      title: 'Sessions vs tokens, and JWTs',
      minutes: 8,
      cards: [
        {
          title: 'Server-side sessions',
          body: `<p>On login, the server creates a random session id, stores the session data server-side, and sends the id in a cookie. The store must be <b>shared</b> by every app server (that is what keeps the servers stateless), so it is usually a shared fast in-memory key-value store such as Redis:</p>
<pre class="diagram">SET sess:9f2c... '{"uid":42}' EX 1800   # save, expire in 30 min
SADD user:42:sessions 9f2c...           # remember user 42's sessions
DEL sess:9f2c...                        # logout</pre>
<p>Pros: instant revocation (delete the entry), small cookie, nothing sensitive in the browser. Cost: a store lookup on every request, which an in-memory store makes cheap. Keeping a per-user list of session ids makes "log out everywhere" one loop of deletes.</p>`
        },
        {
          title: 'Cookie flags that matter',
          body: `<pre class="diagram">Set-Cookie: sid=9f2c...; Path=/; HttpOnly; Secure; SameSite=Lax</pre>
<ul><li><b>HttpOnly</b>: JavaScript can't read it, so an XSS bug can't steal the session.</li>
<li><b>Secure</b>: only sent over HTTPS.</li>
<li><b>SameSite</b>: <code>Lax</code> (common default) blocks the cookie on most cross-site requests, which helps against CSRF. <code>Strict</code> blocks all cross-site sends. <code>None</code> allows them and requires <code>Secure</code>.</li></ul>
<p>Storing tokens in <code>localStorage</code> gives up HttpOnly protection. For browser apps, prefer HttpOnly cookies.</p>`
        },
        {
          title: 'JWT anatomy',
          body: `<p>A JWT is three base64url parts joined by dots: <code>header.payload.signature</code>.</p>
<pre class="diagram">header:  {"alg":"RS256","kid":"key-2025-01"}
payload: {"iss":"https://auth.example.com/",
          "sub":"user_42","aud":"api.example.com",
          "exp":1735693200,"scope":"orders:read"}</pre>
<p>The signature proves the token wasn't changed and who issued it. The payload is <b>encoded, not encrypted</b>: anyone can read it. Never put secrets in it.</p>`
        },
        {
          title: 'Validating a JWT correctly',
          body: `<ol><li>Verify the signature with the key you expect, using an <b>allowlist of algorithms</b>. Never trust the token's own <code>alg</code>; reject <code>none</code>.</li>
<li>Check <code>exp</code> (and <code>nbf</code>) with a little clock skew.</li>
<li>Check <code>iss</code> is your issuer and <code>aud</code> is <b>your</b> API.</li></ol>
<p><b>HS256</b> uses one shared secret: anyone who can verify can also mint tokens. <b>RS256/ES256</b> sign with a private key and verify with a public key, usually fetched from the issuer's <b>JWKS</b> URL and picked by <code>kid</code>. Use asymmetric keys when more than one service verifies.</p>`
        },
        {
          title: 'Revocation and refresh tokens',
          body: `<p>A JWT is valid until <code>exp</code>, even after logout. The usual fix:</p>
<ul><li><b>Short-lived access tokens</b> (minutes).</li>
<li><b>Refresh tokens</b> stored server-side, used to get new access tokens. Revoke them to end a session.</li>
<li><b>Rotation</b>: each refresh returns a new refresh token; reuse of an old one signals theft, so revoke the whole family.</li>
<li>For urgent cases: a denylist of <code>jti</code>s, or a per-user token version checked on each request (which reintroduces a lookup).</li></ul>`
        }
      ],
      quiz: [
        {
          q: 'Your billing API at https://billing.example.com receives this token with a valid signature. What should it do?',
          code: `{
  "iss": "https://auth.example.com/",
  "sub": "user_42",
  "aud": "https://api.example.com",
  "scope": "orders:read",
  "exp": 1893456000
}`,
          options: [
            'Accept it, the signature is valid',
            'Accept it but log a warning',
            'Reject it: the audience is a different API',
            'Reject it: the token has no nbf claim'
          ],
          answer: 2,
          explain: 'aud says the token was minted for another API. Accepting it lets a token for one service be replayed against another.'
        },
        {
          q: 'What is wrong with this cookie for a session id?',
          code: `Set-Cookie: sid=9f2c7a1e; Path=/; Secure; SameSite=Lax`,
          options: [
            'Missing HttpOnly, so any XSS can read and exfiltrate the session id',
            'SameSite=Lax breaks all logins',
            'Secure cookies cannot be sent to APIs',
            'Nothing, it is fully hardened'
          ],
          answer: 0,
          explain: 'Without HttpOnly, document.cookie exposes the session id to injected scripts.'
        },
        {
          q: 'A JWT arrives with this header. A naive library verifies it using the alg from the header. What happens?',
          code: `{"alg":"none","typ":"JWT"}`,
          options: [
            'It is rejected automatically by all libraries',
            'It may be accepted with no signature at all; you must pin allowed algorithms',
            'It is treated as HS256',
            'It is decrypted with the public key'
          ],
          answer: 1,
          explain: 'The alg=none attack. Always verify against an allowlist of algorithms you expect, never the token’s claim.'
        },
        {
          q: 'Ten microservices need to verify tokens issued by one auth service. Which signing setup?',
          options: [
            'HS256 with the secret copied to all ten services',
            'No signature; services call the auth service per request',
            'Encrypt the payload with AES',
            'RS256/ES256: auth service signs with a private key, services verify with the public key from JWKS'
          ],
          answer: 3,
          explain: 'With asymmetric keys, verifiers cannot mint tokens, and keys rotate via JWKS and kid.'
        },
        {
          q: 'A user logs out, but their JWT access token (1-hour exp) still works for 50 minutes. Best standard fix?',
          options: [
            'Make access tokens short-lived and revoke the server-side refresh token at logout',
            'Make access tokens last 1 day',
            'Store the JWT in localStorage',
            'Switch from RS256 to HS256'
          ],
          answer: 0,
          explain: 'Short access tokens bound the damage; revoking the refresh token stops new ones being issued.'
        }
      ]
    },
    {
      id: 't5-oauth-oidc',
      type: 'lesson',
      title: 'OAuth 2.0 + PKCE and OpenID Connect',
      minutes: 8,
      cards: [
        {
          title: 'OAuth 2.0 is delegation, not login',
          body: `<p>OAuth 2.0 is a <b>standard</b> for letting an app get an <b>access token</b> to call an API on a user's behalf. Roles: the <b>resource owner</b> (user), the <b>client</b> (your app), the <b>authorization server</b> (Google, Auth0, Keycloak) and the <b>resource server</b> (the API).</p>
<p>For user-facing apps (web, mobile, SPA) the recommended flow is <b>Authorization Code with PKCE</b>. The <b>implicit flow</b> (tokens in the URL fragment) is deprecated. Machine-to-machine uses <b>client credentials</b>.</p>`
        },
        {
          title: 'Authorization Code + PKCE, step by step',
          body: `<ol><li>App makes a random <code>code_verifier</code> and <code>code_challenge = BASE64URL(SHA256(verifier))</code>, plus a random <code>state</code>.</li>
<li>Redirect to <code>/authorize?response_type=code&amp;client_id=...&amp;redirect_uri=...&amp;scope=openid email&amp;state=...&amp;code_challenge=...&amp;code_challenge_method=S256</code></li>
<li>User logs in and consents.</li>
<li>Server redirects to <code>redirect_uri?code=...&amp;state=...</code>. App checks <code>state</code> matches.</li>
<li>App POSTs to <code>/token</code> with <code>grant_type=authorization_code</code>, the code and the <code>code_verifier</code>.</li>
<li>Server checks the verifier hashes to the challenge, returns tokens.</li></ol>`
        },
        {
          title: 'Why PKCE and state exist',
          body: `<ul><li><b>PKCE</b>: a stolen authorization code is useless without the verifier, which never left the app. Essential for mobile apps and SPAs, which can't keep a client secret. Now recommended for every client.</li>
<li><b>state</b>: ties the callback to the session that started it, blocking CSRF on the redirect.</li>
<li><b>Exact redirect URI matching</b> on the server stops codes being sent to an attacker's URL.</li></ul>
<p>On mobile, run the flow in the <b>system browser</b> (ASWebAuthenticationSession, Custom Tabs), not an embedded webview. Google blocks sign-in from embedded webviews.</p>`
        },
        {
          title: 'OpenID Connect: the login layer',
          body: `<p><b>OIDC</b> is built on OAuth 2.0 and adds <b>identity</b>. Ask for <code>scope=openid</code> (plus <code>profile</code>, <code>email</code>) and the token response includes an <b>ID token</b>.</p>
<ul><li><b>ID token</b>: a JWT for <b>your client</b> (its <code>aud</code> is your client_id) saying who logged in: <code>sub</code>, <code>email</code>, <code>nonce</code>. Use it to create your session.</li>
<li><b>Access token</b>: for calling the <b>API</b>. Its format can be opaque.</li></ul>
<p>Don't send ID tokens to APIs as bearer tokens, and don't use access tokens as proof of login.</p>`
        },
        {
          title: 'Discovery',
          body: `<p>Every OIDC provider publishes its config at a well-known URL:</p>
<pre class="diagram">GET https://accounts.google.com/.well-known/openid-configuration
{
  "issuer": "https://accounts.google.com",
  "authorization_endpoint": ".../o/oauth2/v2/auth",
  "token_endpoint": "https://oauth2.googleapis.com/token",
  "jwks_uri": "https://www.googleapis.com/oauth2/v3/certs"
}</pre>
<p>Libraries read this to find endpoints and the <b>JWKS</b> signing keys automatically, so adding a provider is mostly config.</p>`
        }
      ],
      quiz: [
        {
          q: 'A new SPA starts login with this URL. What is the problem?',
          code: `https://auth.example.com/authorize
  ?response_type=token
  &client_id=spa-web
  &redirect_uri=https://app.example.com/cb
  &scope=openid%20email`,
          options: [
            'scope must not contain openid',
            'It is the deprecated implicit flow; use response_type=code with PKCE',
            'redirect_uri must be http, not https',
            'client_id must be secret'
          ],
          answer: 1,
          explain: 'response_type=token returns tokens in the URL fragment. Current best practice is Authorization Code + PKCE for SPAs.'
        },
        {
          q: 'In PKCE, what does the client send in the final POST to the token endpoint that proves it started the flow?',
          options: ['The code_challenge', 'The client secret', 'The ID token', 'The original code_verifier'],
          answer: 3,
          explain: 'The server hashes the verifier and compares it to the challenge it received at /authorize.'
        },
        {
          q: 'Your callback receives ?code=abc&state=XYZ but the state you stored for this browser was QRS. What should you do?',
          options: [
            'Abort the login: it may be a CSRF / login injection attempt',
            'Exchange the code anyway',
            'Retry the token request twice',
            'Ignore state; PKCE covers it'
          ],
          answer: 0,
          explain: 'state binds the callback to the session that started it. A mismatch means the response is not for this login.'
        },
        {
          q: 'Your backend API receives a Google ID token as a bearer token. Why is that wrong?',
          options: [
            'ID tokens are not JWTs',
            'ID tokens never expire',
            'The ID token’s audience is the client app, not your API; APIs should accept access tokens issued for them',
            'Google ID tokens are encrypted'
          ],
          answer: 2,
          explain: 'An ID token tells the client who logged in. Authorization to an API is the access token’s job, checked against the API’s audience.'
        },
        {
          q: 'How does an OIDC library find a provider’s token endpoint and signing keys?',
          options: [
            'Hardcoded per provider in the library',
            'From /.well-known/openid-configuration, which lists endpoints and jwks_uri',
            'From DNS TXT records',
            'From the ID token header'
          ],
          answer: 1,
          explain: 'OIDC discovery publishes the provider’s metadata, including jwks_uri for key lookup.'
        },
        {
          q: 'A backend job needs to call another internal API with no user involved. Which OAuth grant?',
          options: ['Authorization Code + PKCE', 'Implicit', 'Client credentials', 'Device code'],
          answer: 2,
          explain: 'Client credentials is for machine-to-machine access with no user present.'
        }
      ]
    },
    {
      id: 't5-sso-providers',
      type: 'lesson',
      title: 'SAML and choosing an auth provider',
      minutes: 6,
      cards: [
        {
          title: 'SAML for enterprise SSO',
          body: `<p><b>SAML 2.0</b> is an older XML-based standard, still everywhere in enterprise SSO. The company's <b>Identity Provider</b> (Okta, Microsoft Entra ID) vouches for users to your app, the <b>Service Provider</b>.</p>
<ol><li>User hits your app; you redirect them to their company IdP (SP-initiated).</li>
<li>They log in there (with corporate MFA).</li>
<li>The browser POSTs a <b>signed XML assertion</b> back to your ACS URL.</li>
<li>You verify the signature with the IdP's certificate (from its metadata) and create a session.</li></ol>
<p>XML signature validation is easy to get wrong. Let a library or your auth provider handle it.</p>`
        },
        {
          title: 'Managed providers',
          body: `<ul><li><b>Auth0</b> (owned by Okta): customer login, social and enterprise connections, rules/actions for custom logic.</li>
<li><b>Okta</b>: strong in workforce identity, the IdP many enterprises already run.</li>
<li><b>Amazon Cognito</b>: user pools integrated with AWS (API Gateway authorizers, ALB auth). Cheap at scale, less flexible UX.</li>
<li><b>Clerk</b>: developer-focused, prebuilt UI components, popular with React/Next.js.</li></ul>
<p>You get MFA, social login, breach detection and SAML/OIDC federation without building them. Costs: per-user pricing that grows with you, and vendor lock-in for user data and flows.</p>`
        },
        {
          title: 'Self-hosting with Keycloak',
          body: `<p><b>Keycloak</b> is an open-source (Apache 2.0) identity server: OIDC, OAuth 2.0 and SAML, user federation (LDAP/AD), realms, roles and an admin console.</p>
<p>No per-user fees and full control over data. But <b>you</b> run it: its database, high availability, upgrades, backups, security patches. If auth is down, everything is down.</p>
<p>Interview framing: managed for a startup moving fast; Keycloak when data residency, cost at huge user counts or deep customization justify an ops team owning it.</p>`
        },
        {
          title: 'Standards vs products',
          body: `<p>Keep these separate in an answer:</p>
<ul><li><b>Standards</b>: OAuth 2.0 (delegated access), OIDC (login on top of OAuth), SAML (enterprise SSO), JWT (a token format).</li>
<li><b>Products</b>: Auth0, Okta, Cognito, Clerk, Keycloak implement those standards.</li></ul>
<p>Because everything speaks OIDC, your app code mostly validates tokens from an issuer. Switching providers is painful mainly because of <b>user data and password hashes</b>, not protocol code.</p>`
        }
      ],
      quiz: [
        {
          q: 'A large enterprise customer says "we need SSO with our Okta". Which statement is most accurate?',
          options: [
            'You must switch your whole app to Okta',
            'Only OAuth client credentials can do this',
            'Enterprise SSO requires building your own password storage',
            'Your app acts as a SAML (or OIDC) service provider trusting their IdP; many auth providers add this as a connection'
          ],
          answer: 3,
          explain: 'Their Okta is the IdP. You federate with it via SAML or OIDC, often through your own auth provider.'
        },
        {
          q: 'Which is a standard rather than a product?',
          options: ['Auth0', 'OpenID Connect', 'Cognito', 'Keycloak'],
          answer: 1,
          explain: 'OIDC is a protocol spec. The others are products that implement it.'
        },
        {
          q: 'Main operational cost of choosing Keycloak over Auth0?',
          options: [
            'Keycloak cannot do social login',
            'Keycloak only supports SAML',
            'You run, scale, patch and back up a critical service yourself',
            'Keycloak requires a commercial license'
          ],
          answer: 2,
          explain: 'Keycloak is free and open source, but you own its uptime and security.'
        },
        {
          q: 'In SP-initiated SAML login, what does your app verify on the assertion it receives?',
          options: [
            'The XML signature using the IdP’s certificate from its metadata, plus audience and validity window',
            'Nothing, the browser already checked it',
            'The user’s password hash',
            'The PKCE code_verifier'
          ],
          answer: 0,
          explain: 'The assertion arrives via the browser, so its signature and conditions must be validated before trusting it.'
        }
      ]
    },
    {
      id: 't5-byte-login-design',
      type: 'byte',
      title: 'Interview Byte: Login everywhere, logout everywhere',
      minutes: 6,
      prompt:
        'Design login for a product with a web app and a mobile app. Users can sign up with email/password or "Sign in with Google". Security asks for a "log out of all devices" button that takes effect within a minute. Walk through tokens, flows and storage.',
      hints: [
        'Which OAuth flow do both clients use, and how does Google fit in?',
        'Where does each client store what, and how long does each token live?',
        'What do you revoke to kill every device, and how fast does that bite?'
      ],
      model: `<ul><li><b>Identity</b>: one auth server (Auth0/Cognito or Keycloak) speaking OIDC. Google is a federated connection, so the apps only talk to your auth server.</li>
<li><b>Flow</b>: both apps use <b>Authorization Code + PKCE</b> with <code>state</code>. Mobile runs it in the system browser.</li>
<li><b>Tokens</b>: access token JWT (RS256, ~5 min, <code>aud</code> = your API) plus a rotating refresh token. APIs or the gateway validate signature, <code>iss</code>, <code>aud</code>, <code>exp</code> via JWKS.</li>
<li><b>Storage</b>: web uses a backend-for-frontend with an <code>HttpOnly; Secure; SameSite=Lax</code> session cookie; mobile keeps the refresh token in Keychain/Keystore.</li>
<li><b>Logout all</b>: revoke every refresh token for the user and delete their Redis sessions (<code>user:42:sessions</code>). Bump a per-user token version checked at the gateway for immediate effect; otherwise access tokens die within 5 min.</li></ul>`,
      points: [
        'Authorization Code + PKCE for both web and mobile (no implicit flow)',
        'Google federated through OIDC, ID token vs access token kept distinct',
        'Short-lived access tokens with server-side, rotating refresh tokens',
        'Secure storage: HttpOnly cookie on web, Keychain/Keystore on mobile',
        'Logout-all revokes refresh tokens and sessions, plus a version/denylist for faster cutoff',
        'API validates signature, iss, aud and exp'
      ]
    }
  ]
}
