import type { Unit } from '../../../../shared/types'

// ───────────────────────────── T1: Cloud fundamentals ─────────────────────────────
export const T1_CLOUD: Unit = {
  id: 't1',
  track: 'tools',
  requires: ['u1'],
  teaches: ['aws', 'ec2', 'aws-iam', 's3', 'ebs', 'vpc', 'gcp', 'azure'],
  title: 'Cloud fundamentals',
  subtitle: 'Regions, EC2, IAM and S3: the AWS mental model',
  icon: 'cloud',
  color: '#ff9f43',
  lessons: [
    {
      id: 't1-regions-ec2',
      type: 'lesson',
      title: 'Regions, AZs and EC2',
      minutes: 7,
      cards: [
        {
          title: 'Regions and availability zones',
          body: `<p>A <b>region</b> (e.g. <code>us-east-1</code>) is a geographic area. Each region has several <b>availability zones</b> (AZs): one or more data centers with their own power, cooling and networking, a few milliseconds apart.</p>
<pre class="diagram">Region us-east-1
 ├── AZ us-east-1a   (data centers)
 ├── AZ us-east-1b   (data centers)
 └── AZ us-east-1c   (data centers)</pre>
<p>Services are <b>global</b> (IAM, Route 53), <b>regional</b> (S3, SQS) or <b>zonal</b> (an EC2 instance, an EBS volume). Knowing which is which tells you what survives a failure.</p>`
        },
        {
          title: 'Why multi-AZ matters',
          body: `<p>An AZ is the failure unit you design for. Whole AZs do go down, so anything zonal should exist in <b>at least two AZs</b>:</p>
<ul><li>Load balancer (ALB) spread across 2+ AZs</li><li>App servers in an auto scaling group spanning those AZs</li><li>Database with a <b>Multi-AZ</b> standby (RDS/Aurora)</li></ul>
<p>Trade-offs: cross-AZ traffic adds a little latency and is <b>billed</b>. Multi-<i>region</i> is a much bigger step (data replication, failover DNS) that most designs only need for strict DR or global latency.</p>`
        },
        {
          title: 'EC2 instances and AMIs',
          body: `<p>EC2 gives you virtual machines. Instance type names encode the shape:</p>
<pre class="diagram">m7g.large
│││  └── size (nano … metal)
││└───── g = AWS Graviton (ARM) CPU
│└────── generation
└─────── family: t burstable, m general, c compute, r memory, g/p GPU</pre>
<p>An <b>AMI</b> is the boot image (OS + preinstalled software). AMIs are <b>regional</b>: copy one to launch it elsewhere. You either <b>bake</b> an AMI with everything installed (fast boot) or start from a base AMI and configure via <b>user data</b> scripts at boot (flexible, slower).</p>`
        },
        {
          title: 'Auto scaling groups',
          body: `<p>An <b>ASG</b> keeps a fleet of identical instances healthy and sized right. You give it a <b>launch template</b> (AMI, type, security groups), subnets in several AZs, and three numbers:</p>
<pre class="diagram">min 2   desired 4   max 10
policy: target tracking, average CPU = 50%</pre>
<p>If an instance fails its health check (EC2 or load balancer), the ASG terminates and replaces it. Scaling policies move <code>desired</code> between min and max. This only works if instances are <b>stateless</b>: sessions and files live elsewhere.</p>`
        },
        {
          title: 'Pricing models',
          body: `<ul><li><b>On-demand</b>: pay by the second, no commitment. The default.</li>
<li><b>Savings Plans / Reserved Instances</b>: commit to 1 or 3 years of usage for a large discount. Use for your steady baseline.</li>
<li><b>Spot</b>: spare capacity at a deep discount, but AWS can reclaim it with a <b>two-minute warning</b>. Great for stateless workers, CI and batch jobs that can retry.</li></ul>
<p>Common pattern: baseline on Savings Plans, peaks on on-demand, interruptible work on spot.</p>`
        },
        {
          title: 'Same ideas on GCP and Azure',
          body: `<p>The mental model transfers. Names change:</p>
<ul><li><b>VMs</b>: EC2 → GCP Compute Engine → Azure Virtual Machines</li>
<li><b>Scaling groups</b>: ASG → Managed Instance Groups → VM Scale Sets</li>
<li><b>Object storage</b>: S3 → Cloud Storage → Blob Storage</li>
<li><b>Identity</b>: AWS IAM → GCP IAM (service accounts) → Microsoft Entra ID + Azure RBAC</li></ul>
<p>All three have regions and zones. In an interview, naming the AWS service is fine; say "or the equivalent" if the company uses another cloud.</p>`
        }
      ],
      quiz: [
        {
          q: 'Why should an auto scaling group span at least two availability zones?',
          options: [
            'It makes each instance faster',
            'So the service survives the loss of a whole AZ',
            'AWS requires it for any ASG',
            'Cross-AZ traffic is free, so it saves money'
          ],
          answer: 1,
          explain: 'AZs fail independently. Instances in a second AZ keep serving while the ASG replaces capacity.'
        },
        {
          q: 'Read the command. What is the availability problem?',
          code: `aws autoscaling create-auto-scaling-group \\
  --auto-scaling-group-name web-asg \\
  --launch-template LaunchTemplateName=web-lt \\
  --min-size 2 --max-size 10 --desired-capacity 2 \\
  --vpc-zone-identifier "subnet-0a1b2c3d"`,
          options: [
            'min-size 2 is too low to auto scale',
            'A launch template cannot be referenced by name',
            'Only one subnet, so every instance lands in a single AZ',
            'desired-capacity must equal max-size'
          ],
          answer: 2,
          explain: 'A subnet lives in exactly one AZ. List subnets from two or more AZs so an AZ outage does not take out the whole fleet.'
        },
        {
          q: 'Which workload is the best fit for spot instances?',
          options: [
            'Workers pulling image-resize jobs from a queue, with retries',
            'The primary database',
            'A single long-lived server holding user sessions in memory',
            'A legacy app that cannot be restarted'
          ],
          answer: 0,
          explain: 'Spot can be reclaimed with two minutes notice. Stateless, retryable work from a queue tolerates that; stateful singletons do not.'
        },
        {
          q: 'In the instance type m7g.large, what does the g mean?',
          options: ['It has a GPU', 'It is general purpose', 'It uses an AWS Graviton (ARM) processor', 'It is a burstable instance'],
          answer: 2,
          explain: 'The letter after the generation is an attribute; g means Graviton. Family m is general purpose; GPUs are the g and p families.'
        },
        {
          q: 'You built an AMI in us-east-1 and want to launch it in eu-west-1. What do you do?',
          options: [
            'Nothing, AMIs are global',
            'Copy the AMI to eu-west-1 first',
            'Attach the AMI as an EBS volume in eu-west-1',
            'You can’t; AMIs never leave their region'
          ],
          answer: 1,
          explain: 'AMIs are regional resources. Copy them to each region you deploy in, which is a normal step in multi-region pipelines.'
        }
      ]
    },
    {
      id: 't1-iam',
      type: 'lesson',
      title: 'IAM: who can do what',
      minutes: 6,
      cards: [
        {
          title: 'Users, groups and roles',
          body: `<ul><li><b>User</b>: an identity with long-lived credentials (password, access keys). Today, humans usually sign in through SSO (IAM Identity Center) instead.</li>
<li><b>Group</b>: a set of users that share policies.</li>
<li><b>Role</b>: an identity with <b>no permanent credentials</b>. Something <i>assumes</i> it and gets temporary credentials from STS.</li></ul>
<p>Machines use roles: an EC2 <b>instance profile</b>, a Lambda <b>execution role</b>, a CI job assuming a deploy role. Rule of thumb: if it's code, it should be a role, not an access key.</p>`
        },
        {
          title: 'Policies are JSON',
          body: `<p>A policy lists statements of <b>Effect</b>, <b>Action</b>, <b>Resource</b> and optional <b>Condition</b>:</p>
<pre class="diagram">{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::acme-uploads/user-content/*"
  }]
}</pre>
<p>Attach it to a role, user or group (<b>identity-based</b>). Some resources also take <b>resource-based</b> policies, like an S3 bucket policy or SQS queue policy, which can grant access to other accounts.</p>`
        },
        {
          title: 'How a request is evaluated',
          body: `<ol><li>Everything starts as an <b>implicit deny</b>.</li>
<li>An applicable <b>Allow</b> grants access.</li>
<li>Any <b>explicit Deny</b> wins over every Allow.</li></ol>
<p>So you can grant broadly in one policy and fence off danger with a Deny (e.g. deny deleting the prod bucket). Organization-level guardrails (Service Control Policies) and permission boundaries can cap what any policy grants.</p>`
        },
        {
          title: 'Least privilege in practice',
          body: `<p>Grant only the actions and resources a principal needs:</p>
<ul><li>Avoid <code>"Action": "*"</code> and <code>"Resource": "*"</code> outside admin roles.</li>
<li>One role per service, scoped to its own bucket, queue or table.</li>
<li>Start narrow and widen on <code>AccessDenied</code>, not the other way around.</li>
<li>Use tools like IAM Access Analyzer and last-accessed data to trim unused permissions.</li></ul>
<p>In an interview: "each service gets its own role with least-privilege access" is a one-line security win.</p>`
        },
        {
          title: 'Classic IAM gotchas',
          body: `<ul><li><b>Leaked access keys</b>: keys committed to git get scraped within minutes. Use roles and short-lived credentials.</li>
<li><b>Root account</b>: enable MFA, lock it away, never use it day to day.</li>
<li><b>Bucket vs object ARNs</b>: <code>s3:ListBucket</code> applies to <code>arn:aws:s3:::bucket</code>; <code>s3:GetObject</code> applies to <code>arn:aws:s3:::bucket/*</code>. Mixing them up gives a confusing AccessDenied.</li>
<li><b>Cross-account</b>: a role needs a <b>trust policy</b> saying who may assume it, plus a permissions policy saying what it can do.</li></ul>`
        }
      ],
      quiz: [
        {
          q: 'Your app on EC2 needs to read from S3. What is the recommended way to give it credentials?',
          options: [
            'Create an IAM user and put its access keys in an .env file',
            'Use the root account keys, since they always work',
            'Make the bucket public',
            'Attach an IAM role to the instance via an instance profile'
          ],
          answer: 3,
          explain: 'The role delivers temporary, auto-rotated credentials through the instance metadata service, so no long-lived keys exist to leak.'
        },
        {
          q: 'Read the policy. Listing the bucket returns AccessDenied. Why?',
          code: `{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:ListBucket", "s3:GetObject"],
    "Resource": "arn:aws:s3:::acme-reports/*"
  }]
}`,
          options: [
            'ListBucket applies to the bucket ARN, not to objects under /*',
            'The Version date is wrong',
            'GetObject and ListBucket cannot be in the same statement',
            'S3 policies must use Effect: Permit'
          ],
          answer: 0,
          explain: 'Add arn:aws:s3:::acme-reports as a resource for ListBucket. Object actions use bucket/*, bucket actions use the bare bucket ARN.'
        },
        {
          q: 'One policy allows s3:DeleteObject on a bucket. Another attached policy explicitly denies it. What happens?',
          options: ['The delete succeeds; Allow wins', 'The delete is denied; explicit Deny always wins', 'Whichever policy was attached last wins', 'AWS rejects the policy attachment'],
          answer: 1,
          explain: 'IAM evaluation: explicit Deny beats any Allow, and anything not allowed is implicitly denied.'
        },
        {
          q: 'What is the key difference between an IAM user and an IAM role?',
          options: [
            'Roles can only be used by AWS services',
            'Users cannot have policies attached',
            'A role has no long-lived credentials; it is assumed for temporary ones',
            'Roles are regional, users are global'
          ],
          answer: 2,
          explain: 'Roles are assumed via STS and issue short-lived credentials. Humans, services and other accounts can all assume roles.'
        },
        {
          q: 'A CI pipeline in another AWS account must deploy into yours. Which setup is correct?',
          options: [
            'Share your root password with the CI account',
            'Create a role in your account whose trust policy allows the CI account, with deploy-only permissions',
            'Add the CI account’s users to your IAM groups',
            'Make all your resources public during deploys'
          ],
          answer: 1,
          explain: 'The trust policy controls who can assume the role; the permissions policy limits what they can do once they have.'
        }
      ]
    },
    {
      id: 't1-s3',
      type: 'lesson',
      title: 'S3: object storage',
      minutes: 7,
      cards: [
        {
          title: 'Buckets, keys and objects',
          body: `<p>S3 stores <b>objects</b> (bytes + metadata) under <b>keys</b> in a <b>bucket</b>. Bucket names are globally unique; each bucket lives in one region.</p>
<pre class="diagram">s3://acme-uploads/users/42/avatar.png
     └ bucket ──┘ └──── key ─────────┘</pre>
<p>There are no real folders: <code>users/42/</code> is just a key <b>prefix</b>. You can't append to or rename an object in place; you write a new one. Reads after writes are <b>strongly consistent</b>. Use it for user uploads, static assets, backups, logs and data lake files, not as a database.</p>`
        },
        {
          title: 'Durability vs availability',
          body: `<p>Two different promises:</p>
<ul><li><b>Durability</b>: will my data still exist? S3 Standard is designed for <b>eleven nines</b> (99.999999999%) by storing copies across multiple AZs.</li>
<li><b>Availability</b>: can I read it right now? S3 Standard is designed for <b>99.99%</b>.</li></ul>
<p>Data can be perfectly durable during a brief outage that makes it unavailable. One Zone classes keep data in a single AZ, so an AZ loss can destroy it. Durability does not protect against <b>you</b> deleting it: turn on <b>versioning</b> for that.</p>`
        },
        {
          title: 'Storage classes',
          body: `<ul><li><b>Standard</b>: hot data, millisecond access.</li>
<li><b>Intelligent-Tiering</b>: moves objects between tiers based on access; good when you can't predict.</li>
<li><b>Standard-IA / One Zone-IA</b>: cheaper storage, per-GB retrieval fee, minimum storage duration.</li>
<li><b>Glacier Instant / Flexible Retrieval</b>: archives; instant or minutes-to-hours to restore.</li>
<li><b>Glacier Deep Archive</b>: cheapest; restores take hours. Compliance archives.</li></ul>
<p>Colder = cheaper to store, more expensive and slower to read.</p>`
        },
        {
          title: 'Lifecycle rules',
          body: `<p>Lifecycle rules move or delete objects automatically by age and prefix:</p>
<pre class="diagram">{
  "Rules": [{
    "ID": "age-out-logs",
    "Filter": { "Prefix": "logs/" },
    "Status": "Enabled",
    "Transitions": [
      { "Days": 30, "StorageClass": "STANDARD_IA" },
      { "Days": 90, "StorageClass": "GLACIER" }
    ],
    "Expiration": { "Days": 365 }
  }]
}</pre>
<p>This is how you keep log and backup costs flat as data grows. Rules can also clean up old object versions and incomplete multipart uploads.</p>`
        },
        {
          title: 'Presigned URLs',
          body: `<p>A <b>presigned URL</b> embeds a signature from your credentials and an expiry, so anyone holding it can do one specific operation on one object without AWS credentials.</p>
<pre class="diagram">$ aws s3 presign s3://acme-uploads/reports/q3.pdf --expires-in 600
https://acme-uploads.s3.amazonaws.com/reports/q3.pdf?X-Amz-Algorithm=...</pre>
<p>Classic upload design: client asks your API for a presigned <b>PUT</b> URL (generated with the SDK), then uploads <b>directly to S3</b>. Large files never pass through your servers. Keep the bucket private, enable <b>Block Public Access</b>, and serve public assets through a CDN like CloudFront.</p>`
        }
      ],
      quiz: [
        {
          q: 'Read the lifecycle rule. What happens to logs/2024-01-01.gz after 100 days?',
          code: `{
  "Rules": [{
    "ID": "age-out-logs",
    "Filter": { "Prefix": "logs/" },
    "Status": "Enabled",
    "Transitions": [
      { "Days": 30, "StorageClass": "STANDARD_IA" },
      { "Days": 90, "StorageClass": "GLACIER" }
    ],
    "Expiration": { "Days": 365 }
  }]
}`,
          options: ['It is deleted', 'It is in Standard-IA', 'It is still in Standard', 'It is in Glacier'],
          answer: 3,
          explain: 'After 30 days it moved to Standard-IA and after 90 to Glacier. It is deleted at 365 days.'
        },
        {
          q: 'Users upload videos of up to 2 GB. What is the best upload path?',
          options: [
            'Stream the file through your API servers into S3',
            'API returns a presigned PUT URL; the client uploads directly to S3',
            'Make the bucket publicly writable',
            'Store the video in the database as a BLOB'
          ],
          answer: 1,
          explain: 'Presigned uploads keep big payloads off your servers while the bucket stays private. Multipart upload handles very large files.'
        },
        {
          q: 'S3 Standard is designed for 11 nines of durability and 99.99% availability. What does that mean?',
          options: [
            'Your object is extremely unlikely to be lost, but a request may occasionally fail',
            'S3 is never down',
            'Deleted objects can always be recovered',
            'Reads are 11 times faster than EBS'
          ],
          answer: 0,
          explain: 'Durability is about not losing data; availability is about reaching it. Recovering from your own deletes needs versioning.'
        },
        {
          q: 'Read the command. What does the output URL allow?',
          code: `$ aws s3 presign s3://acme-uploads/reports/q3.pdf --expires-in 600`,
          options: [
            'Anyone can list the whole bucket for 10 minutes',
            'Anyone can upload to any key for 600 days',
            'Anyone holding it can download q3.pdf for 10 minutes',
            'Only IAM users in your account can download q3.pdf'
          ],
          answer: 2,
          explain: 'The CLI presign command signs a GET for one object; --expires-in is in seconds. Upload URLs are generated with the SDK.'
        },
        {
          q: 'You must keep audit records for 7 years and will almost never read them. Cheapest fit?',
          options: ['S3 Standard', 'Glacier Deep Archive', 'EBS snapshots', 'One Zone-IA'],
          answer: 1,
          explain: 'Deep Archive has the lowest storage cost; slow restores are fine for rarely-read compliance data.'
        }
      ]
    },
    {
      id: 't1-byte-first-aws',
      type: 'byte',
      title: 'Interview Byte: leaving the single VPS',
      minutes: 6,
      prompt:
        'Your startup runs everything (web app, Postgres, uploaded files) on a single VPS. You are moving to AWS. Sketch the first architecture and explain why each piece is there.',
      hints: ['What on the VPS is a single point of failure?', 'Where do files and the database live once app servers are disposable?', 'Who gets which credentials?'],
      model: `<ol><li><b>One region, two or more AZs</b> inside a VPC: public subnets for the load balancer, private subnets for app and DB.</li>
<li><b>ALB</b> across AZs in front of an <b>auto scaling group</b> of EC2 instances (min 2, one per AZ), built from a launch template. Instances are stateless and replaceable.</li>
<li><b>Postgres on RDS Multi-AZ</b>: managed backups, point-in-time recovery, automatic failover. No more hand-run DB.</li>
<li><b>Uploads in S3</b>, private bucket, versioning on. Clients upload via <b>presigned URLs</b>; CloudFront serves public assets.</li>
<li><b>IAM roles</b>: the instance role can access only its bucket and secrets. Humans sign in via SSO; no access keys in code.</li>
<li><b>Sessions</b> in Redis or signed cookies so any instance can serve any user.</li>
<li>Cost: on-demand to start, Savings Plans once the baseline is known.</li></ol>`,
      points: [
        'Spread across at least two AZs',
        'Load balancer + auto scaling group of stateless instances',
        'Managed database with Multi-AZ failover and backups',
        'Files moved to S3 (presigned uploads, private bucket)',
        'IAM roles with least privilege, no hard-coded keys',
        'Mentioned cost model or what to defer (multi-region, Kubernetes)'
      ]
    }
  ]
}

// ───────────────────────────── T2: Containers ─────────────────────────────
export const T2_CONTAINERS: Unit = {
  id: 't2',
  track: 'tools',
  requires: ['u3'],
  teaches: ['docker'],
  title: 'Containers',
  subtitle: 'Images, Dockerfiles, Compose and registries',
  icon: 'container',
  color: '#2496ed',
  lessons: [
    {
      id: 't2-images',
      type: 'lesson',
      title: 'Images, layers and the Dockerfile',
      minutes: 7,
      cards: [
        {
          title: 'Images vs containers',
          body: `<p>An <b>image</b> is a read-only, layered filesystem plus metadata (default command, env, exposed ports). A <b>container</b> is a running process started from an image, with a thin <b>writable layer</b> on top. Image is to container as class is to object.</p>
<p>Containers are not VMs. They share the host's <b>kernel</b> and are isolated with Linux <b>namespaces</b> (what a process can see) and <b>cgroups</b> (how much CPU and memory it can use). That's why they start in milliseconds and pack densely.</p>`
        },
        {
          title: 'Layers and the build cache',
          body: `<p>Each <code>RUN</code>, <code>COPY</code> and <code>ADD</code> creates a layer. Docker reuses a cached layer if the instruction and its input files are unchanged. Once one layer changes, <b>every layer after it rebuilds</b>.</p>
<p>So order from least to most frequently changing:</p>
<pre class="diagram">COPY package.json package-lock.json ./
RUN npm ci              # cached until deps change
COPY . .                # changes on every commit</pre>
<p>Get this wrong and every code change reinstalls all dependencies.</p>`
        },
        {
          title: 'A good Dockerfile: multi-stage',
          body: `<pre class="diagram">FROM node:22 AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build &amp;&amp; npm prune --omit=dev

FROM node:22-slim
WORKDIR /app
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
USER node
CMD ["node", "dist/server.js"]</pre>
<p>The build stage has compilers and dev deps; the final stage copies only the output. Result: a smaller image with fewer packages to patch.</p>`
        },
        {
          title: '.dockerignore and running as non-root',
          body: `<p><code>docker build .</code> sends the whole directory as the <b>build context</b>. A <code>.dockerignore</code> keeps junk and secrets out:</p>
<pre class="diagram">node_modules
.git
.env
*.log</pre>
<p>Without it, <code>COPY . .</code> can bake your <code>.env</code> into an image layer for anyone who pulls it.</p>
<p>By default the process runs as <b>root</b> inside the container. Add <code>USER</code> (the official Node image ships a <code>node</code> user) so a compromised app has less power.</p>`
        },
        {
          title: 'CMD, ENTRYPOINT and signals',
          body: `<p><code>CMD</code> is the default command; <code>ENTRYPOINT</code> fixes the executable and <code>CMD</code> supplies default args.</p>
<p>Use the <b>exec form</b>: <code>CMD ["node", "server.js"]</code>. The shell form <code>CMD node server.js</code> runs under <code>/bin/sh -c</code>, which may not pass <b>SIGTERM</b> to your app. Then <code>docker stop</code> or a Kubernetes rollout waits out the grace period and kills it hard, dropping in-flight requests. Handle SIGTERM in your app to finish requests and close connections.</p>`
        }
      ],
      quiz: [
        {
          q: 'Read the Dockerfile. You change one line in src/server.js and rebuild. What happens?',
          code: `FROM node:22-slim
WORKDIR /app
COPY . .
RUN npm ci
CMD ["node", "src/server.js"]`,
          options: [
            'Only the changed file is copied; npm ci stays cached',
            'The build fails because package.json is copied twice',
            'Nothing rebuilds; Docker ignores source changes',
            'COPY . . changes, so npm ci reruns and reinstalls every dependency'
          ],
          answer: 3,
          explain: 'A changed layer invalidates all later layers. Copy the package files and run npm ci before copying the source.'
        },
        {
          q: 'What is the main difference between an image and a container?',
          options: [
            'An image is a read-only template; a container is a running instance with its own writable layer',
            'Images run on Linux, containers on any OS',
            'A container is a compressed image',
            'They are the same thing'
          ],
          answer: 0,
          explain: 'You can start many containers from one image. Writes go to each container’s own layer and vanish when it is removed.'
        },
        {
          q: 'What is the main benefit of a multi-stage build?',
          options: [
            'Builds run in parallel on several machines',
            'The final image ships only runtime artifacts, not compilers and dev dependencies',
            'It encrypts the image',
            'It lets one container run two processes'
          ],
          answer: 1,
          explain: 'Only what you COPY --from the build stage ends up in the final image: smaller, faster to pull, smaller attack surface.'
        },
        {
          q: 'Your repo has a .env file with production secrets and no .dockerignore. What is the risk of COPY . .?',
          options: [
            'None; Docker strips dotfiles automatically',
            'The build fails on dotfiles',
            'The secrets get baked into an image layer anyone with pull access can read',
            'The .env is loaded into the container’s environment at runtime'
          ],
          answer: 2,
          explain: 'Layers are just tarballs. Even if a later step deletes the file, it remains in the earlier layer.'
        },
        {
          q: 'Pods take the full 30-second grace period to stop and drop requests during deploys. The Dockerfile ends with CMD npm start. Likely cause?',
          options: [
            'The image is too large',
            'The shell/npm wrapper is PID 1 and does not pass SIGTERM to the app',
            'The container is running as root',
            'EXPOSE is missing'
          ],
          answer: 1,
          explain: 'Run the app directly in exec form so it receives SIGTERM, and handle it to drain gracefully.'
        }
      ]
    },
    {
      id: 't2-run-compose',
      type: 'lesson',
      title: 'Running containers, Compose and registries',
      minutes: 7,
      cards: [
        {
          title: 'docker run: ports and env',
          body: `<pre class="diagram">docker run -d --name api \\
  -p 8080:3000 \\
  -e NODE_ENV=production \\
  --env-file .env.local \\
  acme/api:3f9c2e1</pre>
<ul><li><code>-p 8080:3000</code> maps <b>host</b> port 8080 to <b>container</b> port 3000.</li>
<li><code>EXPOSE</code> in a Dockerfile is documentation only; it publishes nothing.</li>
<li>Inside the container, the app must listen on <code>0.0.0.0</code>, not <code>127.0.0.1</code>, or published ports can't reach it.</li>
<li>Config comes from <b>env vars</b>, so the same image runs in every environment.</li></ul>`
        },
        {
          title: 'Volumes: where data lives',
          body: `<p>A container's writable layer disappears with the container. Persistent data needs a mount:</p>
<ul><li><b>Named volume</b>: <code>-v pgdata:/var/lib/postgresql/data</code>. Managed by Docker, survives container removal. Use for databases.</li>
<li><b>Bind mount</b>: <code>-v ./src:/app/src</code>. Maps a host folder in. Use for live code reloading in dev.</li></ul>
<p>Rule: containers are cattle, data is not. Anything you can't lose goes in a volume, or better in production, a managed service.</p>`
        },
        {
          title: 'Docker Compose for local dev',
          body: `<pre class="diagram">services:
  api:
    build: .
    ports: ["8080:3000"]
    environment:
      DATABASE_URL: postgres://app:secret@db:5432/app
    depends_on:
      db: { condition: service_healthy }
  db:
    image: postgres:16
    environment: { POSTGRES_USER: app, POSTGRES_PASSWORD: secret }
    volumes: ["pgdata:/var/lib/postgresql/data"]
    healthcheck: { test: ["CMD", "pg_isready", "-U", "app"], interval: 5s }
volumes:
  pgdata: {}</pre>
<p>One file describes the whole stack. <code>docker compose up -d</code> starts it.</p>`
        },
        {
          title: 'Compose networking and commands',
          body: `<p>Compose puts services on a shared network where each <b>service name is a hostname</b>. The API reaches Postgres at <code>db:5432</code>.</p>
<p>Gotcha: inside a container, <code>localhost</code> means <b>that container</b>, not your laptop or another service.</p>
<pre class="diagram">docker compose up -d --build   # build and start
docker compose logs -f api     # tail logs
docker compose exec db psql -U app
docker compose down            # stop, keep volumes
docker compose down -v         # stop AND delete volumes</pre>
<p><code>depends_on</code> only orders startup; add a healthcheck condition so the API waits for a ready DB.</p>`
        },
        {
          title: 'Registries and tags',
          body: `<p>A <b>registry</b> stores images: Docker Hub, Amazon ECR, GitHub Container Registry, Google Artifact Registry.</p>
<pre class="diagram">docker tag api 1234.dkr.ecr.us-east-1.amazonaws.com/api:3f9c2e1
docker push 1234.dkr.ecr.us-east-1.amazonaws.com/api:3f9c2e1</pre>
<p><b>Tags are mutable pointers.</b> <code>:latest</code> is just the default tag name, not "newest". In prod it makes deploys unreproducible: two nodes can run different code under the same tag, and rollback is unclear. Tag with the <b>git SHA</b> or a version, or pin by <b>digest</b> (<code>api@sha256:...</code>), which is immutable.</p>`
        },
        {
          title: 'Dev vs production',
          body: `<ul><li><b>Build once, promote the same image</b> through staging and prod; only config changes.</li>
<li>In prod, run containers on an orchestrator (ECS, Kubernetes, Cloud Run), not <code>docker compose</code> on one box.</li>
<li>Prefer a <b>managed database</b> (RDS, Cloud SQL) over Postgres in a container. Backups, failover and upgrades are the hard part.</li>
<li>Secrets come from a secret manager at runtime, never from the image.</li>
<li>Scan images for vulnerable packages in CI and rebuild regularly to pick up base image patches.</li></ul>`
        }
      ],
      quiz: [
        {
          q: 'Read the Compose file. The API logs "connection refused" when it starts. Why?',
          code: `services:
  api:
    build: .
    environment:
      DATABASE_URL: postgres://app:secret@localhost:5432/app
  db:
    image: postgres:16
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: secret`,
          options: [
            'Postgres needs ports: ["5432:5432"] for other services to reach it',
            'localhost is the api container itself; the host should be db',
            'The password is too short',
            'Compose services cannot talk to each other without a custom network'
          ],
          answer: 1,
          explain: 'Each container has its own localhost. On the Compose network, the database is reachable by its service name, db.'
        },
        {
          q: 'What does -p 8080:3000 do?',
          options: [
            'Maps container port 8080 to host port 3000',
            'Limits the container to 3000 connections on port 8080',
            'Maps host port 8080 to container port 3000',
            'Opens both ports inside the container'
          ],
          answer: 2,
          explain: 'The format is host:container. Requests to localhost:8080 on the host reach the app on 3000 inside.'
        },
        {
          q: 'You run docker compose down -v. What happens to the Postgres data in the pgdata volume?',
          options: [
            'It is deleted along with the volume',
            'It is kept; down never touches data',
            'It is backed up automatically',
            'It is moved into the image'
          ],
          answer: 0,
          explain: 'The -v flag removes named volumes declared in the file. Plain down keeps them.'
        },
        {
          q: 'Why avoid deploying :latest in production?',
          options: [
            'Registries reject pushes to :latest',
            ':latest images are always the oldest build',
            ':latest images cannot be pulled by Kubernetes',
            'The tag is mutable, so you can’t tell what is running or roll back reliably'
          ],
          answer: 3,
          explain: 'Use immutable tags like the git SHA (or digests) so every deploy maps to exactly one build.'
        },
        {
          q: 'Read the commands. The container is running but curl hangs or is refused. What is the likely cause?',
          code: `$ docker run -d -p 8080:3000 acme/api:3f9c2e1
$ docker logs $(docker ps -lq)
Server listening on http://127.0.0.1:3000
$ curl localhost:8080
curl: (56) Recv failure: Connection reset by peer`,
          options: [
            'Port 8080 is reserved on the host',
            'The app binds to 127.0.0.1 inside the container; it must listen on 0.0.0.0',
            'The image needs EXPOSE 8080',
            'curl cannot reach Docker containers'
          ],
          answer: 1,
          explain: 'Published traffic arrives on the container’s network interface, not its loopback. Bind to 0.0.0.0.'
        },
        {
          q: 'Which volume type fits live-reloading your source code during local development?',
          options: ['A named volume', 'A bind mount of the source folder', 'No volume; rebuild the image each time', 'A tmpfs mount'],
          answer: 1,
          explain: 'Bind mounts map host files straight into the container, so edits show up instantly without rebuilding.'
        }
      ]
    },
    {
      id: 't2-byte-containerize',
      type: 'byte',
      title: 'Interview Byte: containerize a Node API',
      minutes: 6,
      prompt:
        'Walk me through containerizing a Node.js API and its Postgres database for local development, and then how that changes for production.',
      hints: ['What goes in the Dockerfile, in what order?', 'How do the two services find each other locally?', 'Which parts should not be containers in prod?'],
      model: `<p><b>Dockerfile:</b> multi-stage. Copy package files, <code>npm ci</code>, copy source, build; final slim stage copies only <code>dist</code> and prod deps, runs as <code>USER node</code>, <code>CMD ["node","dist/server.js"]</code>. A <code>.dockerignore</code> excludes <code>node_modules</code>, <code>.git</code>, <code>.env</code>.</p>
<p><b>Local dev:</b> Docker Compose with <code>api</code> and <code>db</code> (postgres image, named volume for data, <code>pg_isready</code> healthcheck). API uses <code>db:5432</code>, waits on <code>service_healthy</code>, bind-mounts source for hot reload.</p>
<p><b>Production:</b> CI builds the image once, tags it with the git SHA, pushes to ECR/GHCR. The same image is deployed to ECS/Kubernetes/Cloud Run behind a load balancer. Postgres moves to a <b>managed</b> service (RDS) with backups and failover. Secrets come from a secret manager as env vars. App handles SIGTERM and exposes a health endpoint.</p>`,
      points: [
        'Layer order for caching (deps before source)',
        'Multi-stage build, .dockerignore, non-root user',
        'Compose with service-name networking and a DB volume',
        'Immutable image tags pushed to a registry',
        'Managed database in production, not a container',
        'Secrets and config injected at runtime, not baked in'
      ]
    }
  ]
}

// ───────────────────────────── T3: Orchestration & serverless ─────────────────────────────
export const T3_ORCHESTRATION: Unit = {
  id: 't3',
  track: 'tools',
  requires: ['u3'],
  teaches: ['kubernetes', 'managed-kubernetes', 'helm', 'ecs-fargate', 'aws-lambda', 'cloud-run', 'vercel'],
  title: 'Orchestration & serverless',
  subtitle: 'Kubernetes, Lambda and picking the right runtime',
  icon: 'ship-wheel',
  color: '#326ce5',
  lessons: [
    {
      id: 't3-k8s-objects',
      type: 'lesson',
      title: 'Kubernetes core objects',
      minutes: 8,
      cards: [
        {
          title: 'Desired state and control loops',
          body: `<p>Kubernetes runs containers across a cluster of machines (<b>nodes</b>). You declare <b>desired state</b> in YAML and <code>kubectl apply</code> it. <b>Controllers</b> loop forever, comparing actual state to desired state and fixing the difference.</p>
<p>The <b>control plane</b> has the API server, <b>etcd</b> (the state store), the scheduler (picks a node for each pod) and controllers. Each node runs a <b>kubelet</b> that starts containers. Managed offerings (EKS, GKE, AKS) run the control plane for you; you still own your workloads and usually the nodes.</p>`
        },
        {
          title: 'Pod, ReplicaSet, Deployment',
          body: `<ul><li><b>Pod</b>: the smallest unit. One or more containers sharing a network namespace (same IP) and volumes. Pods are disposable and get new IPs when replaced.</li>
<li><b>ReplicaSet</b>: keeps N identical pods running.</li>
<li><b>Deployment</b>: manages ReplicaSets to roll out new versions and roll back.</li></ul>
<pre class="diagram">Deployment api
 └── ReplicaSet api-7d9f (v2)  → Pod, Pod, Pod
 └── ReplicaSet api-5c1a (v1)  → scaled to 0</pre>
<p>You almost never create pods or ReplicaSets directly; you write Deployments.</p>`
        },
        {
          title: 'A Deployment in YAML',
          body: `<pre class="diagram">apiVersion: apps/v1
kind: Deployment
metadata: { name: api }
spec:
  replicas: 3
  selector: { matchLabels: { app: api } }
  template:
    metadata: { labels: { app: api } }
    spec:
      containers:
      - name: api
        image: acme/api:3f9c2e1
        ports: [{ containerPort: 3000 }]</pre>
<p>The <code>selector</code> must match the pod template's <code>labels</code>. Labels are how everything in Kubernetes finds everything else.</p>`
        },
        {
          title: 'Services: stable addresses',
          body: `<p>Pods come and go, so clients talk to a <b>Service</b>: a stable virtual IP and DNS name (<code>api.default.svc.cluster.local</code>, or just <code>api</code> in the same namespace) that load-balances across pods whose labels match its <code>selector</code>.</p>
<ul><li><b>ClusterIP</b> (default): reachable only inside the cluster.</li>
<li><b>NodePort</b>: opens a port on every node.</li>
<li><b>LoadBalancer</b>: asks the cloud for an external load balancer.</li></ul>
<p>Only pods that are <b>ready</b> receive traffic.</p>`
        },
        {
          title: 'Ingress: HTTP routing',
          body: `<p>An <b>Ingress</b> routes external HTTP(S) by host and path to Services, and can terminate TLS:</p>
<pre class="diagram">api.acme.com/      → Service web
api.acme.com/v1/   → Service api</pre>
<p>An Ingress object does nothing on its own. You need an <b>ingress controller</b> running in the cluster (ingress-nginx, Traefik, the AWS Load Balancer Controller) to implement it. The newer <b>Gateway API</b> is the successor model for this job. One load balancer in front of many services is cheaper than one per Service.</p>`
        },
        {
          title: 'ConfigMaps and Secrets',
          body: `<p><b>ConfigMap</b>: non-secret config. <b>Secret</b>: credentials. Both can be injected as env vars or mounted as files.</p>
<pre class="diagram">env:
- name: DATABASE_URL
  valueFrom:
    secretKeyRef: { name: db-creds, key: url }</pre>
<p>Gotcha: Secret values are only <b>base64-encoded</b>, not encrypted. Restrict access with RBAC, turn on encryption at rest for etcd, or sync from a real secret store (Vault, AWS Secrets Manager). Teams often package all these manifests with <b>Helm</b> charts.</p>`
        }
      ],
      quiz: [
        {
          q: 'Read the manifests. The Service has no endpoints and requests fail. Why?',
          code: `kind: Deployment
spec:
  template:
    metadata:
      labels: { app: orders-api }
---
kind: Service
spec:
  selector: { app: orders }
  ports: [{ port: 80, targetPort: 3000 }]`,
          options: [
            'Services cannot point at Deployments',
            'port and targetPort must be equal',
            'The Service selector app: orders does not match the pod label app: orders-api',
            'The Service needs type: LoadBalancer'
          ],
          answer: 2,
          explain: 'A Service picks pods by label. With no matching pods it has no endpoints to send traffic to.'
        },
        {
          q: 'You delete one pod of a 3-replica Deployment. What happens?',
          options: [
            'The ReplicaSet notices only 2 exist and creates a replacement',
            'The Deployment is scaled to 2 permanently',
            'The pod is restarted on the same IP',
            'Nothing until you run kubectl apply again'
          ],
          answer: 0,
          explain: 'Controllers reconcile continuously; desired is 3, actual is 2, so a new pod is created (with a new IP).'
        },
        {
          q: 'A teammate says Kubernetes Secrets are safe to commit to git because they are encrypted. Correct?',
          options: [
            'Yes, Secrets are encrypted with the cluster key',
            'Yes, as long as the namespace is private',
            'No, but only because YAML files are public',
            'No, the values are only base64-encoded and anyone can decode them'
          ],
          answer: 3,
          explain: 'base64 is encoding, not encryption. Use sealed/external secrets, RBAC and encryption at rest.'
        },
        {
          q: 'You apply an Ingress but nothing routes to your Service. What is the most likely missing piece?',
          options: [
            'An ingress controller running in the cluster',
            'A ConfigMap named ingress',
            'A NodePort on every pod',
            'A second replica'
          ],
          answer: 0,
          explain: 'Ingress is just a rule set; a controller (nginx, Traefik, AWS LB Controller) must watch it and configure a proxy or load balancer.'
        },
        {
          q: 'What does a managed Kubernetes service like EKS, GKE or AKS take off your plate?',
          options: [
            'Writing Deployments and Services',
            'Running and upgrading the control plane (API server, etcd)',
            'Choosing container images',
            'Configuring readiness probes'
          ],
          answer: 1,
          explain: 'The provider operates the control plane. Your workloads, manifests and often node groups remain your job.'
        }
      ]
    },
    {
      id: 't3-k8s-ops',
      type: 'lesson',
      title: 'Probes, rollouts and autoscaling',
      minutes: 7,
      cards: [
        {
          title: 'Readiness vs liveness',
          body: `<ul><li><b>Readiness probe</b> fails → pod is <b>removed from Service endpoints</b>. No traffic, no restart. Use for "warming up" or "temporarily can't serve".</li>
<li><b>Liveness probe</b> fails → kubelet <b>restarts the container</b>. Use only for "stuck and won't recover on its own" (deadlock).</li>
<li><b>Startup probe</b>: holds off the other probes until a slow-starting app is up.</li></ul>
<p>Without readiness, a rolling update sends traffic to pods that haven't finished booting.</p>`
        },
        {
          title: 'Probe config and the classic mistake',
          body: `<pre class="diagram">readinessProbe:
  httpGet: { path: /ready, port: 3000 }
  periodSeconds: 5
livenessProbe:
  httpGet: { path: /live, port: 3000 }
  periodSeconds: 10
  failureThreshold: 3</pre>
<p>Keep <b>liveness shallow</b>: "is this process responsive?" Never check the database in liveness. If the DB gets slow, every pod fails liveness, Kubernetes restarts them all, and a DB hiccup becomes a full outage. Dependency checks belong, carefully, in readiness.</p>`
        },
        {
          title: 'Rolling updates',
          body: `<p>Changing the image starts a <b>rolling update</b>: a new ReplicaSet scales up as the old one scales down.</p>
<pre class="diagram">strategy:
  type: RollingUpdate
  rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }</pre>
<p><code>maxSurge</code>: extra pods allowed above <code>replicas</code>. <code>maxUnavailable</code>: pods allowed below. Both default to 25%.</p>
<pre class="diagram">kubectl set image deployment/api api=acme/api:8b21d40
kubectl rollout status deployment/api
kubectl rollout undo deployment/api</pre>
<p>New pods must pass readiness before old ones are removed, so a broken build stalls instead of taking you down.</p>`
        },
        {
          title: 'Requests and limits',
          body: `<pre class="diagram">resources:
  requests: { cpu: 250m, memory: 256Mi }
  limits:   { memory: 512Mi }</pre>
<ul><li><b>Requests</b>: what the scheduler reserves on a node. Used to place pods and by the HPA for utilization.</li>
<li><b>Memory limit</b> exceeded → container is <b>OOMKilled</b> and restarted.</li>
<li><b>CPU limit</b> exceeded → the container is <b>throttled</b>, not killed. Many teams skip CPU limits for latency-sensitive apps.</li></ul>`
        },
        {
          title: 'Horizontal Pod Autoscaler',
          body: `<p>The <b>HPA</b> adjusts a Deployment's replica count to hit a target metric:</p>
<pre class="diagram">kubectl autoscale deployment api --cpu-percent=60 --min=3 --max=20

desired = ceil(current * currentMetric / target)
        = ceil(4 * 90% / 60%) = 6</pre>
<p>It needs <b>metrics-server</b> (or a custom metrics adapter) and CPU <b>requests</b> set, or utilization is unknown. The HPA adds pods; if nodes are full, the <b>Cluster Autoscaler</b> or <b>Karpenter</b> adds nodes. Scaling takes tens of seconds to minutes, so sudden spikes still need headroom.</p>`
        }
      ],
      quiz: [
        {
          q: 'Read the probe. The database has a slow minute. What happens to the API?',
          code: `livenessProbe:
  httpGet:
    path: /health   # runs SELECT 1 against Postgres
    port: 3000
  timeoutSeconds: 1
  periodSeconds: 10
  failureThreshold: 3`,
          options: [
            'Pods are removed from the Service but keep running',
            'Nothing; probes ignore timeouts',
            'Only one pod restarts at a time, by design',
            'Every pod fails liveness and gets restarted, turning a DB blip into an outage'
          ],
          answer: 3,
          explain: 'Liveness failures cause restarts. Checking a shared dependency there makes all pods restart together. Keep liveness shallow.'
        },
        {
          q: 'A pod’s readiness probe starts failing. What does Kubernetes do?',
          options: [
            'Stops sending it Service traffic, without restarting it',
            'Restarts the container',
            'Deletes the Deployment',
            'Moves the pod to another node'
          ],
          answer: 0,
          explain: 'Readiness gates traffic. Restarting is what liveness does.'
        },
        {
          q: 'Read the strategy. With replicas: 4, how does the rollout proceed?',
          code: `spec:
  replicas: 4
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0`,
          options: [
            'All 4 old pods stop, then 4 new pods start',
            'It adds 1 new pod, waits for it to be ready, removes 1 old pod, and repeats; capacity never drops below 4',
            'It runs 8 pods at once, then deletes the old 4',
            'It removes 1 old pod first, then adds 1 new pod'
          ],
          answer: 1,
          explain: 'maxSurge 1 allows 5 pods at most; maxUnavailable 0 means ready pods never go below 4.'
        },
        {
          q: 'Read the output. Why is the HPA not scaling?',
          code: `$ kubectl get hpa api
NAME   REFERENCE        TARGETS         MINPODS   MAXPODS   REPLICAS
api    Deployment/api   <unknown>/60%   3         20        3`,
          options: [
            'maxPods is too low',
            'The Deployment has too many replicas',
            'CPU usage is below 60%',
            'It can’t read CPU utilization: metrics-server missing or no CPU requests on the pods'
          ],
          answer: 3,
          explain: 'Utilization is usage divided by request. Without metrics or requests the HPA has nothing to compare to the target.'
        },
        {
          q: 'A container keeps restarting with reason OOMKilled. What happened?',
          options: [
            'It used more CPU than its limit',
            'Its liveness probe timed out',
            'It exceeded its memory limit and was killed',
            'The node ran out of disk'
          ],
          answer: 2,
          explain: 'Memory over the limit kills the container. CPU over the limit only throttles it.'
        },
        {
          q: 'An HPA targets 50% CPU. 4 pods are averaging 100%. How many replicas will it ask for (ignoring max)?',
          options: ['5', '6', '8', '16'],
          answer: 2,
          explain: 'ceil(4 × 100 / 50) = 8.'
        }
      ]
    },
    {
      id: 't3-serverless',
      type: 'lesson',
      title: 'Serverless and choosing a platform',
      minutes: 7,
      cards: [
        {
          title: 'The Lambda model',
          body: `<p>With <b>AWS Lambda</b> you upload a function; AWS runs it in response to <b>events</b> and scales by creating more execution environments. You pay per request and per unit of compute time; nothing runs when idle.</p>
<ul><li><b>Sync</b>: API Gateway or a function URL (HTTP), ALB.</li>
<li><b>Async</b>: S3 object created, EventBridge rules and schedules, SNS.</li>
<li><b>Poll-based</b>: SQS, Kinesis, DynamoDB Streams; Lambda pulls batches for you.</li></ul>
<p>Memory is configurable, and CPU scales with it.</p>`
        },
        {
          title: 'Cold starts and limits',
          body: `<p>A <b>cold start</b> happens when Lambda creates a new environment: download code, start the runtime, run your init code. It can add from tens of milliseconds to seconds. Warm environments are reused.</p>
<ul><li>Do expensive setup (SDK clients, DB connections) <b>outside the handler</b> so warm calls reuse it.</li>
<li><b>Provisioned concurrency</b> keeps environments warm for latency-critical paths.</li>
<li>Max timeout is <b>15 minutes</b>; long jobs belong elsewhere.</li>
<li>Many concurrent functions can exhaust DB connections; use <b>RDS Proxy</b> or a pooler.</li></ul>`
        },
        {
          title: 'Concurrency',
          body: `<p>Concurrency is how many requests are in flight at once:</p>
<pre class="diagram">concurrency ≈ requests/sec × avg duration (s)
1,000 rps × 0.2 s = 200 concurrent executions</pre>
<p>Each account has a regional concurrency limit (a soft quota you can raise). Above it, requests are <b>throttled</b>. <b>Reserved concurrency</b> caps one function, which both guarantees it capacity and protects a fragile downstream (like a DB) from a flood. For bursty writes, put <b>SQS</b> in front and let Lambda drain it at a controlled rate.</p>`
        },
        {
          title: 'Container serverless and app platforms',
          body: `<ul><li><b>Cloud Run</b> (GCP): give it a container; it scales on HTTP requests, down to zero. One instance serves <b>many concurrent requests</b> (configurable), so fewer cold starts than one-request-per-instance. Set min instances to stay warm.</li>
<li><b>ECS on Fargate</b> (AWS): run container tasks without managing servers. Scales on metrics, but normally keeps at least one task running.</li>
<li><b>Vercel / Netlify</b>: git-push deploys and preview URLs per pull request, aimed at frontends (e.g. Next.js) with serverless and edge functions for the API layer.</li></ul>`
        },
        {
          title: 'Choosing a runtime',
          body: `<ul><li><b>Lambda</b>: event-driven glue, spiky or low traffic, short tasks. Watch cold starts, 15-minute cap, connection limits, and cost at sustained high load.</li>
<li><b>Cloud Run / Fargate</b>: you have a container and want little ops. Good default for a typical web service.</li>
<li><b>Kubernetes (managed)</b>: many services, need for fine control (sidecars, custom scheduling, portability), and a platform team to run it.</li>
<li><b>Plain VMs + ASG</b>: special hardware, licensed software, or simple steady workloads.</li></ul>
<p>Interviewers want the trade-off, not the trendy answer.</p>`
        }
      ],
      quiz: [
        {
          q: 'An endpoint gets 500 requests/s and each Lambda invocation takes 200 ms. Roughly how much concurrency does it use?',
          options: ['25', '100', '500', '2,500'],
          answer: 1,
          explain: '500 × 0.2 s = 100 executions in flight at any moment.'
        },
        {
          q: 'Read the handler. Under load the database runs out of connections and latency is high. What is the main problem?',
          code: `import pg from 'pg'

export const handler = async (event) => {
  const client = new pg.Client(process.env.DATABASE_URL)
  await client.connect()
  const { rows } = await client.query(
    'SELECT * FROM orders WHERE id = $1', [event.id])
  await client.end()
  return rows[0]
}`,
          options: [
            'SELECT * is not allowed in Lambda',
            'It opens a new connection on every invocation; create it outside the handler and use a pooler like RDS Proxy',
            'Lambda cannot connect to Postgres',
            'The handler should be synchronous'
          ],
          answer: 1,
          explain: 'Init code outside the handler is reused by warm environments. A proxy caps total connections as concurrency grows.'
        },
        {
          q: 'You need to transcode videos that take 30–40 minutes each. Is a single Lambda invocation a good fit?',
          options: [
            'Yes, Lambda has no time limit',
            'Yes, if you give it the maximum memory',
            'No, Lambda only runs on HTTP requests',
            'No, Lambda has a 15-minute maximum timeout; use Fargate/Batch or a worker fleet'
          ],
          answer: 3,
          explain: 'Long-running jobs exceed Lambda’s timeout. Containers or batch workers fit better, or split the work into chunks.'
        },
        {
          q: 'A checkout Lambda has occasional slow first requests after idle periods. Most direct fix?',
          options: [
            'Provisioned concurrency for that function',
            'Increase the timeout',
            'Lower the memory setting',
            'Add reserved concurrency of 0'
          ],
          answer: 0,
          explain: 'Provisioned concurrency keeps pre-initialized environments ready, removing cold starts for that capacity. Reserved concurrency 0 would block it entirely.'
        },
        {
          q: 'How does Cloud Run differ from Lambda’s default model in handling concurrent requests?',
          options: [
            'Cloud Run can only run one request at a time',
            'Cloud Run cannot scale to zero',
            'One Cloud Run instance can serve many requests at once, so fewer instances and cold starts',
            'Cloud Run runs only functions, not containers'
          ],
          answer: 2,
          explain: 'Lambda runs one request per environment at a time; Cloud Run instances handle many concurrent requests (configurable).'
        }
      ]
    },
    {
      id: 't3-byte-spiky',
      type: 'byte',
      title: 'Interview Byte: K8s, Fargate or Lambda?',
      minutes: 6,
      prompt:
        'You are launching a new service with very spiky traffic: near zero most of the day, then 50x bursts for a few minutes. Choose between Kubernetes, ECS/Fargate and Lambda, and defend the choice.',
      hints: ['How fast does each option scale, and from what floor?', 'What does each request do and how long does it take?', 'What already exists at the company: a platform team? a cluster?'],
      model: `<p><b>Clarify first:</b> request duration, latency SLO, downstream (DB?) and what the team already runs.</p>
<p><b>Default pick: Lambda</b> (behind API Gateway, or fed by SQS) if requests are short and stateless.</p>
<ul><li>Scales out in seconds and to zero when idle, so you don't pay for the quiet hours.</li>
<li>Risks: cold starts (mitigate with provisioned concurrency on the hot path), the 15-minute cap, and connection storms on the DB. Put <b>RDS Proxy</b> in front, set <b>reserved concurrency</b>, or buffer writes through SQS.</li></ul>
<p><b>Fargate</b> if it's a long-lived container (websockets, heavy deps) but scaling takes longer, so keep a warm floor. <b>Kubernetes</b> only if a cluster and platform team already exist; HPA plus node autoscaling is slow for sudden bursts unless you overprovision.</p>
<p>Revisit if traffic becomes high and steady: containers usually get cheaper.</p>`,
      points: [
        'Asked about request duration, latency and existing platform',
        'Compared scale-up speed and scale-to-zero across options',
        'Addressed cold starts and how to mitigate them',
        'Protected the database (proxy, concurrency cap or queue)',
        'Stated when they would switch to containers',
        'Made a clear choice and defended it'
      ]
    }
  ]
}
