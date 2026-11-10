import type { Unit } from '../../../../shared/types'

// ───────────────────────────── T12: SHIPPING ─────────────────────────────
export const T12_SHIPPING: Unit = {
  id: 't12',
  track: 'tools',
  requires: ['u9'],
  teaches: ['git', 'github', 'github-actions', 'aws-iam', 'argo-cd', 'terraform', 'launchdarkly', 'unleash'],
  title: 'Shipping',
  subtitle: 'Git, CI/CD, Terraform and feature flags: from merged PR to production',
  icon: 'rocket',
  color: '#5b8def',
  lessons: [
    {
      id: 't12-git-ci',
      type: 'lesson',
      title: 'Git workflows and CI with GitHub Actions',
      minutes: 7,
      cards: [
        {
          title: 'Trunk-based vs GitFlow',
          body: `<p><b>Trunk-based development</b>: everyone merges small, short-lived branches into <code>main</code> at least daily. <code>main</code> is always releasable. Unfinished work hides behind feature flags.</p>
<p><b>GitFlow</b>: long-lived <code>develop</code> and <code>main</code>, plus <code>feature/*</code>, <code>release/*</code> and <code>hotfix/*</code> branches. It fits versioned products with scheduled releases (mobile apps, on-prem software).</p>
<p>For a web service that deploys many times a day, say <b>trunk-based</b>. Long-lived branches mean big, painful merges and slow feedback.</p>`
        },
        {
          title: 'PRs and protected branches',
          body: `<p>A <b>pull request</b> is the gate: code review plus automated checks before anything reaches <code>main</code>.</p>
<p>On GitHub, protect <code>main</code> with branch protection rules or rulesets:</p>
<ul><li>Require a PR and at least one approving review</li><li>Require status checks (CI) to pass</li><li>Require branches to be up to date, or use a <b>merge queue</b> so each merge is tested against the latest <code>main</code></li><li>Block force pushes and deletions</li></ul>
<p>A <code>CODEOWNERS</code> file auto-requests reviews from the team that owns a path.</p>`
        },
        {
          title: 'Anatomy of a GitHub Actions workflow',
          body: `<p>Workflows live in <code>.github/workflows/*.yml</code>.</p>
<pre class="diagram">on:
  push:
    branches: [main]
  pull_request:
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test</pre>
<ul><li><code>on</code>: the triggering events</li><li><code>jobs</code>: run in parallel on separate runners unless linked with <code>needs</code></li><li><code>runs-on</code>: the runner (GitHub-hosted or self-hosted)</li><li><code>steps</code>: <code>uses</code> runs a reusable action, <code>run</code> runs shell commands</li></ul>`
        },
        {
          title: 'Caching, matrix and secrets',
          body: `<ul><li><b>Caching</b>: <code>actions/setup-node</code> with <code>cache: npm</code>, or <code>actions/cache</code> keyed on a lockfile hash. Saves minutes per run.</li>
<li><b>Matrix</b>: <code>strategy.matrix</code> fans one job out across versions or OSes.</li>
<li><b>Secrets</b>: stored in repo, org or environment settings and read as <code>\${{ secrets.NAME }}</code>. They are masked in logs. Workflows triggered by PRs from forks do not get them.</li></ul>
<p>Prefer <b>OIDC</b> (<code>permissions: id-token: write</code>) to get short-lived cloud credentials instead of storing long-lived keys as secrets.</p>`
        },
        {
          title: 'What CI should catch',
          body: `<p>A good PR pipeline runs, fastest first: lint and type-check, unit tests, build, integration tests, then security scans (dependency and image scanning).</p>
<p>The output of CI on <code>main</code> is an <b>immutable artifact</b>: a container image tagged with the commit SHA. Every later environment deploys that same artifact. Never rebuild per environment.</p>
<p>Keep the PR pipeline under ~10 minutes. Slow CI pushes people toward big batched PRs, which is the opposite of what you want.</p>`
        }
      ],
      quiz: [
        {
          q: 'A team deploys a web service 15 times a day. Which branching model fits best?',
          options: ['GitFlow with a release branch per deploy', 'Trunk-based development with short-lived branches and feature flags', 'One long-lived branch per developer', 'Forking the repo per feature'],
          answer: 1,
          explain: 'Trunk-based keeps main releasable and merges small changes often, which is what continuous deployment needs.'
        },
        {
          q: 'How many jobs does this workflow start on a pull request?',
          code: `on: pull_request
jobs:
  test:
    runs-on: \${{ matrix.os }}
    strategy:
      matrix:
        node: [18, 20, 22]
        os: [ubuntu-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - run: npm ci && npm test`,
          options: ['1', '3', '5', '6'],
          answer: 3,
          explain: 'A matrix runs one job per combination: 3 Node versions x 2 operating systems = 6 jobs.'
        },
        {
          q: 'A contributor opens a PR from a fork. The deploy-preview step that reads a cloud secret fails. Why?',
          code: `on: pull_request
jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy-preview.sh
        env:
          CLOUD_TOKEN: \${{ secrets.CLOUD_TOKEN }}`,
          options: ['Secrets are only available on self-hosted runners', 'The secret name must be lowercase', 'Secrets are not passed to pull_request workflows triggered from forks', 'env cannot reference secrets'],
          answer: 2,
          explain: 'GitHub withholds secrets from fork PR runs so untrusted code cannot read them; CLOUD_TOKEN is empty.'
        },
        {
          q: 'Two PRs each pass CI alone, but break main when both merge. Which GitHub feature prevents this?',
          options: ['A merge queue (or requiring branches to be up to date)', 'CODEOWNERS', 'Draft PRs', 'Squash merging'],
          answer: 0,
          explain: 'A merge queue tests each PR against main plus the PRs ahead of it before merging.'
        },
        {
          q: 'Why build one container image per commit and promote it through staging and prod?',
          options: ['Registries charge per build', 'Rebuilding per environment can produce a different artifact than the one you tested', 'Kubernetes requires it', 'It makes images smaller'],
          answer: 1,
          explain: 'Build once, deploy many. What you tested is exactly what ships.'
        }
      ]
    },
    {
      id: 't12-iam',
      type: 'lesson',
      title: 'Cloud permissions in depth (IAM)',
      minutes: 8,
      cards: [
        {
          title: 'Policies are JSON',
          body: `<p>AWS <b>IAM</b> decides who (a user, or a role that code assumes) can do what. Permissions are <b>policies</b>: statements of <b>Effect</b>, <b>Action</b>, <b>Resource</b> and an optional <b>Condition</b>.</p>
<pre class="diagram">{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": ["s3:GetObject", "s3:PutObject"],
    "Resource": "arn:aws:s3:::acme-uploads/user-content/*"
  }]
}</pre>
<p>Attach it to a role, user or group (<b>identity-based</b>). Some resources also take <b>resource-based</b> policies, like an S3 bucket policy, which can grant access to other accounts.</p>`
        },
        {
          title: 'How a request is evaluated',
          body: `<ol><li>Everything starts as an <b>implicit deny</b> (default deny).</li>
<li>An applicable <b>Allow</b> grants access.</li>
<li>Any <b>explicit Deny</b> wins over every Allow.</li></ol>
<p>So you can grant broadly in one policy and fence off danger with a Deny, e.g. deny deleting anything under <code>prod/</code>. On top of that, organization-level guardrails (<b>Service Control Policies</b>) and <b>permission boundaries</b> cap what any policy can grant: they never add permissions, only limit them.</p>`
        },
        {
          title: 'Roles and temporary credentials (STS)',
          body: `<p>A <b>role</b> has no password or long-lived keys. Something <b>assumes</b> it, and <b>STS</b> (Security Token Service) returns temporary credentials that expire, typically after an hour.</p>
<p>A role needs two policies:</p>
<ul><li><b>Trust policy</b>: who may assume it (an AWS service, another account, an identity provider).</li>
<li><b>Permissions policy</b>: what it can do once assumed.</li></ul>
<pre class="diagram">"Principal": { "Service": "ec2.amazonaws.com" },
"Action": "sts:AssumeRole"</pre>
<p>That trust statement lets EC2 instances use the role (via an <b>instance profile</b>). Lambda execution roles and cross-account access work the same way.</p>`
        },
        {
          title: 'Least privilege and classic gotchas',
          body: `<ul><li>One role per service, scoped to its own bucket, queue or table. Avoid <code>"Action": "*"</code> and <code>"Resource": "*"</code> outside admin roles.</li>
<li>Start narrow and widen on <code>AccessDenied</code>. IAM Access Analyzer and last-accessed data help trim unused permissions.</li>
<li><b>Bucket vs object ARNs</b>: <code>s3:ListBucket</code> applies to <code>arn:aws:s3:::bucket</code>; <code>s3:GetObject</code> to <code>arn:aws:s3:::bucket/*</code>. Mixing them up gives a confusing AccessDenied.</li>
<li><b>Leaked access keys</b> get scraped from Git within minutes. Roles and short-lived credentials remove the risk.</li>
<li>Cross-account AccessDenied on assume? Check the <b>trust policy</b> first.</li></ul>`
        },
        {
          title: 'CI deploys with OIDC, not stored keys',
          body: `<p>GitHub Actions can prove its identity with a signed <b>OIDC token</b>. You register GitHub as an identity provider in IAM and create a deploy role whose trust policy accepts only your repo and branch:</p>
<pre class="diagram">"Action": "sts:AssumeRoleWithWebIdentity",
"Condition": { "StringLike": {
  "token.actions.githubusercontent.com:sub":
    "repo:acme/api:ref:refs/heads/main" } }</pre>
<p>The workflow needs <code>permissions: id-token: write</code> and then runs <code>aws-actions/configure-aws-credentials</code> with <code>role-to-assume</code>. Each run gets credentials that expire soon after. No AWS keys stored as secrets, nothing to rotate or leak.</p>`
        }
      ],
      quiz: [
        {
          q: 'Read both statements, attached to the same role. Can it delete prod/report.csv?',
          code: `"Statement": [
  { "Effect": "Allow", "Action": "s3:*",
    "Resource": "arn:aws:s3:::acme-data/*" },
  { "Effect": "Deny", "Action": "s3:DeleteObject",
    "Resource": "arn:aws:s3:::acme-data/prod/*" }
]`,
          options: [
            'Yes, s3:* includes DeleteObject',
            'Yes, the Allow was listed first',
            'No, an explicit Deny always wins over an Allow',
            'No, s3:* does not cover object actions'
          ],
          answer: 2,
          explain: 'Explicit Deny beats any Allow. The role can still delete objects outside prod/.'
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
          q: 'What does assuming a role through STS give the caller?',
          options: [
            'A permanent access key for the role',
            'Temporary credentials that expire, limited to the role’s permissions',
            'The root user’s permissions for one hour',
            'A copy of the role in the caller’s own account'
          ],
          answer: 1,
          explain: 'STS issues short-lived credentials scoped by the role’s permissions policy. Nothing long-lived exists to leak.'
        },
        {
          q: 'Read the workflow. The credentials step fails to get a token. What is missing?',
          code: `on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::123456789012:role/deploy-api
          aws-region: us-east-1`,
          options: [
            'An AWS_SECRET_ACCESS_KEY secret',
            'A self-hosted runner inside AWS',
            'actions/checkout before the credentials step',
            'permissions: id-token: write, so the job can request an OIDC token'
          ],
          answer: 3,
          explain: 'Without id-token: write the job cannot get a GitHub OIDC token, so there is nothing to exchange for AWS credentials.'
        },
        {
          q: 'A deploy role has exactly the right permissions policy, but the CI job gets AccessDenied when trying to assume it. What should you check first?',
          options: [
            'The S3 bucket policy',
            'Whether the role has an explicit Deny on s3:*',
            'The role’s trust policy: does it allow this caller to assume it?',
            'The instance type of the runner'
          ],
          answer: 2,
          explain: 'The trust policy controls who may assume a role. The permissions policy only matters once the role is assumed.'
        }
      ]
    },
    {
      id: 't12-deploy',
      type: 'lesson',
      title: 'Deploy strategies and GitOps',
      minutes: 7,
      cards: [
        {
          title: 'CI vs CD',
          body: `<p><b>Continuous integration</b>: every change is merged and tested often.</p>
<p><b>Continuous delivery</b>: every green commit on <code>main</code> <i>could</i> go to prod, often behind a manual approval. <b>Continuous deployment</b>: it goes to prod automatically.</p>
<p>A typical path: merge, build image, deploy to staging, run smoke tests, promote to prod with a safe strategy, watch metrics. In GitHub Actions, <code>environment: production</code> with required reviewers adds the approval gate.</p>`
        },
        {
          title: 'Rolling updates',
          body: `<p>Replace old instances with new ones a few at a time. This is the Kubernetes Deployment default.</p>
<pre class="diagram">strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 25%
    maxUnavailable: 0</pre>
<p><b>Pro:</b> no extra fleet needed. <b>Con:</b> old and new versions serve traffic at the same time, so APIs and DB schemas must be compatible both ways. Rollback is another rollout (<code>kubectl rollout undo</code>), not instant. Readiness probes stop broken pods from getting traffic.</p>`
        },
        {
          title: 'Blue/green',
          body: `<p>Run two full environments. <b>Blue</b> serves traffic; deploy to <b>green</b>, test it, then flip the load balancer or DNS.</p>
<ul><li><b>Pro:</b> near-instant rollback: flip back.</li><li><b>Con:</b> double capacity during the switch.</li><li><b>Gotcha:</b> the database is usually shared. Schema changes must work for both versions. Use <b>expand/contract</b>: add the new column first, ship code, remove the old column later.</li></ul>
<p>DNS-based flips are slowed by TTL caching. A load balancer flip is faster.</p>`
        },
        {
          title: 'Canary releases',
          body: `<p>Send a small slice of traffic (say 1%, then 5%, 25%, 100%) to the new version and compare its error rate and latency to the stable version.</p>
<p>If the canary looks worse, roll back automatically. Only a small share of users saw the bad version.</p>
<p>Tools: <b>Argo Rollouts</b> or Flagger on Kubernetes, weighted target groups on an AWS ALB, or a service mesh like Istio. Canaries need good metrics and enough traffic to be statistically meaningful.</p>`
        },
        {
          title: 'GitOps with Argo CD',
          body: `<p>In <b>GitOps</b>, a Git repo holds the desired state of the cluster (Kubernetes manifests, Helm charts, Kustomize). An agent in the cluster <b>pulls</b> and applies it.</p>
<p><b>Argo CD</b> watches the repo, compares it with the live cluster, and shows apps as <i>Synced</i> or <i>OutOfSync</i>. With auto-sync and self-heal, manual <code>kubectl edit</code> changes get reverted.</p>
<p>CI's last step becomes: bump the image tag in the config repo. Deploy = merge. Rollback = <code>git revert</code>. Every change is audited, and CI never needs cluster credentials.</p>`
        }
      ],
      quiz: [
        {
          q: 'A Deployment has 10 replicas. During a rollout, what is the most pods that can exist and the fewest that can be available?',
          code: `spec:
  replicas: 10
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 2
      maxUnavailable: 0`,
          options: ['10 total, 8 available', '12 total, 10 available', '12 total, 8 available', '20 total, 10 available'],
          answer: 1,
          explain: 'maxSurge allows 2 extra pods (12), and maxUnavailable: 0 means all 10 desired pods stay available.'
        },
        {
          q: 'Which strategy gives the fastest rollback, at the cost of running double capacity?',
          options: ['Rolling update', 'Canary', 'Recreate', 'Blue/green'],
          answer: 3,
          explain: 'Blue keeps running, so rolling back is just switching traffic back to it.'
        },
        {
          q: 'You plan to rename a column and deploy with blue/green. What is the safe approach?',
          options: ['Rename the column in the same deploy', 'Expand/contract: add the new column, dual-write, switch reads, drop the old one later', 'Take downtime; blue/green cannot handle schema changes', 'Give green its own empty database'],
          answer: 1,
          explain: 'Both versions share the DB during the switch, so each step must be compatible with old and new code.'
        },
        {
          q: 'An engineer hot-fixes a replica count with kubectl edit. Ten minutes later it is back to the old value. Most likely cause?',
          options: ['Argo CD auto-sync with self-heal reverted the drift to match Git', 'The Kubernetes scheduler ignores manual edits', 'kubectl edit only changes a local copy', 'The HPA was deleted'],
          answer: 0,
          explain: 'In GitOps, Git is the source of truth. Change the repo, not the cluster.'
        },
        {
          q: 'What does a canary release need most to be useful?',
          options: ['A second database', 'Twice the server capacity', 'Metrics that compare the canary against the stable version, with enough traffic to be meaningful', 'GitFlow release branches'],
          answer: 2,
          explain: 'A canary is an experiment. Without good error and latency signals you cannot judge it.'
        }
      ]
    },
    {
      id: 't12-iac-flags',
      type: 'lesson',
      title: 'Terraform and feature flags',
      minutes: 8,
      cards: [
        {
          title: 'Terraform: declare, plan, apply',
          body: `<p>You describe infrastructure in HCL. <b>Providers</b> (aws, google, cloudflare...) talk to APIs. <b>Resources</b> are the things you manage.</p>
<pre class="diagram">resource "aws_s3_bucket" "assets" {
  bucket = "acme-assets-prod"
}</pre>
<pre class="diagram">terraform init
terraform plan -out=tfplan
terraform apply tfplan</pre>
<p><code>plan</code> diffs your code against the real world and shows <code>+</code> create, <code>~</code> update, <code>-</code> destroy, <code>-/+</code> replace. Review it in the PR, then apply exactly that saved plan.</p>
<p><b>OpenTofu</b> is the open-source fork created after HashiCorp moved Terraform to the BSL license. Same language and workflow.</p>`
        },
        {
          title: 'State and remote locking',
          body: `<p>Terraform keeps a <b>state file</b> mapping your resources to real IDs. Without it, Terraform cannot know what it already created.</p>
<ul><li>Never keep state on a laptop. Use a <b>remote backend</b> (S3, GCS, Terraform Cloud).</li><li>Enable <b>locking</b> so two applies cannot run at once and corrupt state. On S3 that has traditionally been a DynamoDB table; newer versions can also lock with the S3 bucket itself.</li><li>State can contain <b>secrets in plain text</b>. Encrypt it and restrict access.</li><li>Split state per environment and per component to limit blast radius.</li></ul>`
        },
        {
          title: 'Modules and drift',
          body: `<p><b>Modules</b> are reusable packages of resources with inputs and outputs:</p>
<pre class="diagram">module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  cidr   = "10.0.0.0/16"
}</pre>
<p>Pin module and provider versions so a plan does not change under you.</p>
<p><b>Drift</b> is when someone changes infra by hand in the console. The next <code>plan</code> shows it and wants to undo it. Run a scheduled plan in CI to detect drift early, and lock down console write access in prod.</p>`
        },
        {
          title: 'Feature flags: deploy is not release',
          body: `<p>A <b>feature flag</b> is a runtime switch checked in code:</p>
<pre class="diagram">if (flags.isEnabled('new-checkout', user)) {
  return newCheckout(cart)
}
return oldCheckout(cart)</pre>
<p>You <b>deploy</b> the code dark, then <b>release</b> it by turning the flag on: for staff, then 5% of users, then everyone. No redeploy needed.</p>
<p><b>LaunchDarkly</b> is a managed SaaS. <b>Unleash</b> is open source and can be self-hosted. Server SDKs typically cache rules and evaluate flags locally, so a flag check is not a network call.</p>`
        },
        {
          title: 'Kill switches and flag debt',
          body: `<ul><li><b>Kill switch</b>: a long-lived flag that turns off a risky or expensive feature (recommendations, a third-party call) during an incident. Faster than any rollback.</li>
<li><b>Flag debt</b>: every release flag doubles the code paths. Old flags pile up, nobody knows which are safe to delete, and tests miss combinations.</li></ul>
<p>Fixes: give each release flag an owner and an expiry date, remove it once it hits 100%, and alert on stale flags. Treat flag changes in prod like deploys: audited and visible on your dashboards.</p>`
        }
      ],
      quiz: [
        {
          q: 'A teammate wants to apply this plan to production. What will happen?',
          code: `  # aws_db_instance.orders must be replaced
-/+ resource "aws_db_instance" "orders" {
      ~ identifier = "orders-db" -> "orders-db-v2" # forces replacement
        # (24 unchanged attributes hidden)
    }

Plan: 1 to add, 0 to change, 1 to destroy.`,
          options: ['The database is renamed in place with no downtime', 'Terraform refuses to apply replacements', 'Only a new database is created; the old one is kept', 'The existing database is destroyed and a new empty one is created'],
          answer: 3,
          explain: '-/+ with "forces replacement" means destroy and recreate. Guard critical resources with lifecycle { prevent_destroy = true }.'
        },
        {
          q: 'What is the dynamodb_table setting for?',
          code: `terraform {
  backend "s3" {
    bucket         = "acme-tf-state"
    key            = "prod/network.tfstate"
    region         = "us-east-1"
    dynamodb_table = "tf-locks"
    encrypt        = true
  }
}`,
          options: ['Storing the state file itself', 'Locking, so two applies cannot modify the same state at once', 'Caching provider plugins', 'Recording drift history'],
          answer: 1,
          explain: 'The state lives in S3. The DynamoDB table holds a lock while a plan or apply is running.'
        },
        {
          q: 'Someone resized an instance in the AWS console. What does the next terraform plan show?',
          options: ['Nothing; Terraform only tracks its own changes', 'An error that state is corrupt', 'A change to set the instance back to the size in code', 'It automatically updates your .tf files'],
          answer: 2,
          explain: 'Plan refreshes real state and proposes reverting drift to match the code.'
        },
        {
          q: 'What is the main benefit of feature flags in a delivery pipeline?',
          options: ['They decouple deploying code from releasing it to users', 'They remove the need for tests', 'They make builds faster', 'They replace code review'],
          answer: 0,
          explain: 'Code ships dark and is turned on gradually, and turning it off needs no redeploy.'
        },
        {
          q: 'Your codebase has 400 flags, many at 100% for a year. What is the risk?',
          options: ['Flags slow down CPUs', 'Flag debt: dead code paths, untested combinations and confusion about what is safe to remove', 'LaunchDarkly will disable them', 'None; flags are free'],
          answer: 1,
          explain: 'Release flags should be removed once fully rolled out. Give them owners and expiry dates.'
        }
      ]
    },
    {
      id: 't12-byte-pipeline',
      type: 'byte',
      title: 'Interview Byte: merged PR to production',
      minutes: 6,
      prompt: 'Design the path from a merged PR to production for a team of 30 engineers, with safe rollbacks.',
      hints: ['What gates code before it reaches main, and what artifact does CI produce?', 'How does a change roll out to prod, and how do you know it is healthy?', 'How do you undo a bad deploy, a bad feature and a bad schema change?'],
      model: `<ol><li><b>Branching:</b> trunk-based. Small PRs into a protected <code>main</code>: one review, CODEOWNERS, required CI, merge queue.</li>
<li><b>CI (GitHub Actions):</b> lint, tests, build with dependency caching. On merge, build one image tagged with the commit SHA and push it to the registry.</li>
<li><b>CD (GitOps):</b> CI bumps the tag in a config repo. Argo CD syncs staging, smoke tests run, then prod is promoted.</li>
<li><b>Rollout:</b> canary via Argo Rollouts, 5% then 25% then 100%, with automated analysis on error rate and p99. Bad metrics abort and roll back.</li>
<li><b>Release:</b> risky features ship dark behind LaunchDarkly/Unleash flags; kill switches for dependencies.</li>
<li><b>Rollback:</b> code = abort canary or <code>git revert</code> in the config repo; feature = flip the flag; schema = expand/contract so old code always works.</li>
<li><b>Infra:</b> Terraform with remote, locked state; plan in PR, apply after review.</li></ol>`,
      points: [
        'Trunk-based flow with protected main and required checks',
        'Build one immutable artifact per commit and promote it',
        'Progressive rollout (canary or blue/green) gated on metrics',
        'Fast rollback path: revert in Git, abort canary or flip back',
        'Feature flags to separate deploy from release, plus kill switches',
        'Backward-compatible DB migrations (expand/contract)'
      ]
    }
  ]
}

// ───────────────────────────── T13: OPERATING ─────────────────────────────
export const T13_OPERATING: Unit = {
  id: 't13',
  track: 'tools',
  requires: ['u9'],
  teaches: ['prometheus', 'grafana', 'opentelemetry', 'jaeger', 'elk', 'loki', 'sentry', 'pagerduty'],
  title: 'Operating',
  subtitle: 'Metrics, traces, logs, SLOs and on-call with real tools',
  icon: 'activity',
  color: '#e5534b',
  lessons: [
    {
      id: 't13-metrics',
      type: 'lesson',
      title: 'Metrics with Prometheus and Grafana',
      minutes: 8,
      cards: [
        {
          title: 'The three pillars',
          body: `<ul><li><b>Metrics</b>: cheap numeric time series (requests/s, p99 latency). Tell you <i>that</i> something is wrong. Best for dashboards and alerts.</li>
<li><b>Logs</b>: detailed events. Tell you <i>what</i> happened in one request.</li>
<li><b>Traces</b>: one request's path across services, with timing per hop. Tell you <i>where</i> the time went.</li></ul>
<p>A good investigation goes metrics, then traces, then logs, joined by a shared <code>trace_id</code>.</p>`
        },
        {
          title: 'Prometheus: the pull model',
          body: `<p>Apps expose metrics as text on <code>/metrics</code>. Prometheus <b>scrapes</b> each target on an interval and stores time series locally.</p>
<pre class="diagram">scrape_configs:
  - job_name: api
    scrape_interval: 15s
    static_configs:
      - targets: ['api-1:8080', 'api-2:8080']</pre>
<p>In Kubernetes, targets come from service discovery instead of a static list. Short-lived batch jobs can push to a <b>Pushgateway</b>. For long-term, multi-cluster storage teams add Thanos or Mimir. A failed scrape is itself a signal: the <code>up</code> metric drops to 0.</p>`
        },
        {
          title: 'Metric types and labels',
          body: `<ul><li><b>Counter</b>: only goes up (resets on restart). <code>http_requests_total</code>. Always wrap in <code>rate()</code>.</li>
<li><b>Gauge</b>: goes up and down. Queue depth, memory in use.</li>
<li><b>Histogram</b>: counts observations into buckets (<code>_bucket{le="0.5"}</code>, plus <code>_sum</code> and <code>_count</code>). Lets you compute percentiles across instances.</li>
<li><b>Summary</b>: percentiles computed in the client; cannot be aggregated across instances.</li></ul>
<p><b>Labels</b> add dimensions: <code>{method="POST", status="500"}</code>. Each unique label combination is a separate series. Never put user IDs, emails or raw URLs in labels: that <b>cardinality</b> explosion can take Prometheus down.</p>`
        },
        {
          title: 'PromQL you should know',
          body: `<p>Per-second request rate by status, over the last 5 minutes:</p>
<pre class="diagram">sum by (status) (rate(http_requests_total{job="api"}[5m]))</pre>
<p>p99 latency across all instances:</p>
<pre class="diagram">histogram_quantile(0.99,
  sum by (le) (rate(http_request_duration_seconds_bucket[5m])))</pre>
<p>Error ratio: divide the rate of 5xx requests by the rate of all requests. Keep <code>le</code> in the <code>by</code> clause for <code>histogram_quantile</code>, or the result is meaningless.</p>`
        },
        {
          title: 'Grafana and what to put on a dashboard',
          body: `<p><b>Grafana</b> draws dashboards from many data sources (Prometheus, Loki, Elasticsearch, CloudWatch...) and can alert too. Template variables let one dashboard switch between services or regions.</p>
<p>What to chart:</p>
<ul><li><b>Golden signals</b> (Google SRE): latency, traffic, errors, saturation.</li><li><b>RED</b> for services: rate, errors, duration.</li><li><b>USE</b> for resources: utilization, saturation, errors (CPU, disk, connection pools).</li></ul>
<p>Start each service dashboard with RED, then dependencies. Add deploy markers so you can see if a spike lines up with a release.</p>`
        }
      ],
      quiz: [
        {
          q: 'What does this query return?',
          code: `histogram_quantile(0.99,
  sum by (le) (
    rate(http_request_duration_seconds_bucket{job="checkout"}[5m])
  )
)`,
          options: ['The average checkout latency', 'The slowest single request in the last 5 minutes', 'The estimated p99 checkout latency across all instances over the last 5 minutes', 'The number of requests slower than 0.99 seconds'],
          answer: 2,
          explain: 'histogram_quantile estimates the 99th percentile from bucket rates summed across instances by le.'
        },
        {
          q: 'A dashboard plots http_requests_total directly and shows a line that only climbs. What is wrong?',
          options: ['Nothing, traffic is growing', 'It is a counter; you need rate() to get requests per second', 'It should be a gauge', 'Prometheus is not scraping'],
          answer: 1,
          explain: 'Counters are cumulative. rate() turns them into a per-second rate and handles resets.'
        },
        {
          q: 'Prometheus memory usage explodes after this metric ships. Why?',
          code: `http_requests_total{method="GET", path="/users/8812734", user_id="8812734", status="200"} 1
http_requests_total{method="GET", path="/users/1093321", user_id="1093321", status="200"} 1
http_requests_total{method="GET", path="/users/5521870", user_id="5521870", status="200"} 1`,
          options: ['High-cardinality labels: every user creates new time series', 'Counters use more memory than gauges', 'The scrape interval is too short', 'Status codes should be integers'],
          answer: 0,
          explain: 'Each unique label set is its own series. Use a route template like /users/:id and drop user_id.'
        },
        {
          q: 'You want to monitor a database connection pool. Which framework fits a resource best?',
          options: ['RED', 'DORA', 'Golden signals only for frontends', 'USE: utilization, saturation, errors'],
          answer: 3,
          explain: 'USE is for resources (pools, CPUs, disks). RED is for request-driven services.'
        },
        {
          q: 'Why use a histogram rather than a summary for API latency?',
          options: ['Histograms are exact', 'Histogram buckets can be summed across instances before computing a percentile', 'Summaries cannot be scraped', 'Histograms use no labels'],
          answer: 1,
          explain: 'You cannot average client-side percentiles from many pods, but you can add bucket counts.'
        }
      ]
    },
    {
      id: 't13-traces-logs',
      type: 'lesson',
      title: 'Traces, logs and errors',
      minutes: 7,
      cards: [
        {
          title: 'Distributed tracing',
          body: `<p>A <b>trace</b> is one request's journey. It is a tree of <b>spans</b>. Each span is one unit of work (an HTTP handler, a DB query) with a start time, duration, parent span ID and attributes like <code>http.route</code> or <code>db.statement</code>.</p>
<p>The trace view is a waterfall. You can see at a glance that 900ms of a 1s request was one slow call to the payments service.</p>
<p><b>Jaeger</b> is an open-source tracing backend for storing and viewing traces. Grafana Tempo and most commercial APMs fill the same role.</p>`
        },
        {
          title: 'Context propagation',
          body: `<p>For spans from different services to join one trace, the trace ID must travel with the request. The W3C standard is the <code>traceparent</code> header:</p>
<pre class="diagram">traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
             ver  trace-id (32 hex)               parent span id   flags</pre>
<p>Every hop must forward it, including message queues (put it in message headers). One service that drops the header breaks the trace into pieces.</p>
<p>Sampling: <b>head</b> sampling decides at the start (cheap, may miss rare errors). <b>Tail</b> sampling decides after the trace finishes, so you can keep all slow or failed ones.</p>`
        },
        {
          title: 'OpenTelemetry',
          body: `<p><b>OpenTelemetry</b> (OTel) is a CNCF standard, not a backend. It gives you:</p>
<ul><li><b>APIs and SDKs</b> for most languages, with auto-instrumentation for common frameworks and HTTP and DB clients</li><li>The <b>OTLP</b> wire protocol</li><li>The <b>Collector</b>: receives telemetry, batches, filters and samples it, then exports to Jaeger, Prometheus, Datadog and others</li></ul>
<p>Interview point: instrument once with OTel, and switching vendors becomes a Collector config change, not a code rewrite.</p>`
        },
        {
          title: 'Structured logs: ELK and Loki',
          body: `<p>Log JSON, not prose, and always include the trace ID:</p>
<pre class="diagram">{"level":"error","service":"checkout","trace_id":"4bf92f...",
 "msg":"payment timeout","order_id":"o_981","latency_ms":3012}</pre>
<ul><li><b>ELK</b>: Elasticsearch stores and full-text indexes logs, Logstash or Beats ship them, Kibana searches them. Powerful, but indexing everything is expensive. Note the licensing changes; OpenSearch is the Apache-licensed fork.</li>
<li><b>Grafana Loki</b> indexes only labels and stores log lines compressed in object storage. Much cheaper. Query with LogQL: <code>{app="checkout"} |= "timeout"</code>.</li></ul>`
        },
        {
          title: 'Error tracking with Sentry',
          body: `<p><b>Sentry</b> catches exceptions in backend and frontend code and groups identical stack traces into one <b>issue</b> with a count, affected users and first and last seen.</p>
<ul><li><b>Releases</b>: tag events with a version so you see "new in this deploy"</li><li><b>Source maps</b>: turn minified JS stacks back into readable code</li><li><b>Breadcrumbs</b>: the events leading up to the error</li></ul>
<p>Logs tell you everything that happened. Sentry tells you which errors are new, frequent and affecting users. Offered as SaaS, with a source-available self-hosted option.</p>`
        }
      ],
      quiz: [
        {
          q: 'What does this header tell the receiving service?',
          code: `GET /api/payments/authorize HTTP/1.1
Host: payments.internal
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01`,
          options: ['Which user made the request', 'The trace ID to join and the parent span ID to attach its span under, plus a sampled flag', 'An auth token for the payments service', 'The request timeout in ms'],
          answer: 1,
          explain: 'W3C traceparent carries version, trace ID, parent span ID and flags so spans connect into one trace.'
        },
        {
          q: 'Traces show checkout and orders, but stop at the Kafka consumer that sends emails. Most likely cause?',
          options: ['Jaeger cannot store more than 3 services', 'Kafka is too fast to trace', 'Tail sampling deleted it', 'Trace context was not propagated in the message headers'],
          answer: 3,
          explain: 'Async hops need the trace context put in message headers and extracted by the consumer.'
        },
        {
          q: 'What is OpenTelemetry?',
          options: ['A vendor-neutral standard with APIs, SDKs and a Collector for producing and shipping telemetry', 'A hosted tracing database', 'A Grafana plugin', 'A replacement for Prometheus storage'],
          answer: 0,
          explain: 'OTel produces and exports telemetry. You still need backends like Jaeger or Prometheus to store it.'
        },
        {
          q: 'What does this Loki query do?',
          code: `{app="checkout", env="prod"} |= "timeout" | json | latency_ms > 2000`,
          options: ['Counts timeouts per minute', 'Deletes old checkout logs', 'Finds prod checkout log lines containing "timeout", parses them as JSON, and keeps those with latency_ms over 2000', 'Creates an alert rule'],
          answer: 2,
          explain: 'Select streams by label, filter by text, parse JSON fields, then filter on a field.'
        },
        {
          q: 'Why log JSON with a trace_id field instead of free-text lines?',
          options: ['JSON is smaller', 'Fields are queryable and the trace_id links a log line to its trace', 'Kibana only accepts JSON', 'It removes the need for metrics'],
          answer: 1,
          explain: 'Structured fields allow filtering and aggregation; trace_id lets you jump between logs and traces.'
        }
      ]
    },
    {
      id: 't13-slo-oncall',
      type: 'lesson',
      title: 'SLOs, alerting and on-call',
      minutes: 7,
      cards: [
        {
          title: 'SLI, SLO, SLA',
          body: `<ul><li><b>SLI</b> (indicator): a measured ratio of good events. "Share of checkout requests that return non-5xx in under 300ms."</li>
<li><b>SLO</b> (objective): your internal target for it. "99.9% over a rolling 30 days."</li>
<li><b>SLA</b> (agreement): a contract with customers, with penalties. Always looser than the SLO.</li></ul>
<p>Pick SLIs that users feel: availability and latency at the edge, not CPU usage. 100% is never the right target.</p>`
        },
        {
          title: 'Error budgets: a worked example',
          body: `<p>SLO: 99.9% of requests succeed over 30 days. Traffic: 10 million requests a month.</p>
<pre class="diagram">error budget = 0.1% x 10,000,000 = 10,000 failed requests
in time:       0.1% x 30 days     = ~43 minutes of full outage</pre>
<p>Day 10: a bad deploy fails 6,000 requests. 60% of the budget is gone with 20 days left.</p>
<p>The policy decides what happens: budget healthy means ship fast; budget exhausted means freeze risky launches and spend time on reliability. It turns reliability arguments into numbers.</p>`
        },
        {
          title: 'Alert on symptoms, not causes',
          body: `<p>Page a human only when <b>users are hurt or about to be</b>: error rate or latency SLO burning. "CPU at 85%" is a cause; maybe nothing is wrong. Send it to a dashboard or a ticket.</p>
<p><b>Burn-rate alerts</b> page when you spend budget too fast. Burning at 14.4x for 1 hour uses 2% of a 30-day budget: page. A slow 1x burn: ticket.</p>
<p>Prometheus evaluates alert rules; <b>Alertmanager</b> groups, dedupes, silences and routes them to PagerDuty, Slack or email.</p>`
        },
        {
          title: 'On-call with PagerDuty',
          body: `<p><b>PagerDuty</b> turns alerts into incidents and gets them to a human.</p>
<ul><li><b>Services</b>: each alert source maps to an owning team</li><li><b>Schedules</b>: who is on call when, with rotations</li><li><b>Escalation policies</b>: if the primary does not acknowledge in N minutes, page the secondary, then the manager</li><li><b>Urgency</b>: high wakes you up, low waits for business hours</li></ul>
<p>Opsgenie and incident.io fill similar roles. Track pages per shift: if on-call is noisy, people start ignoring pages.</p>`
        },
        {
          title: 'Runbooks and postmortems',
          body: `<p>Every paging alert links to a <b>runbook</b>: what the alert means, the dashboard to open, likely causes, and safe first actions (roll back, flip a kill switch, scale up).</p>
<p>During an incident: one <b>incident commander</b>, a comms channel, a status page update. <b>Mitigate first</b>, find the root cause later.</p>
<p>Afterwards, a <b>blameless postmortem</b>: timeline, impact (budget burned), contributing factors, and action items with owners. Blame people and they stop telling you what really happened.</p>`
        }
      ],
      quiz: [
        {
          q: 'Your SLO is 99.9% success over 30 days and you serve 50 million requests in that window. What is the error budget?',
          options: ['5,000 failed requests', '500 failed requests', '50,000 failed requests', '500,000 failed requests'],
          answer: 2,
          explain: '0.1% of 50,000,000 = 50,000 requests may fail before the SLO is breached.'
        },
        {
          q: 'What does the for: 10m line do in this rule?',
          code: `groups:
  - name: checkout
    rules:
      - alert: CheckoutHighErrorRate
        expr: |
          sum(rate(http_requests_total{job="checkout",code=~"5.."}[5m]))
            / sum(rate(http_requests_total{job="checkout"}[5m])) > 0.02
        for: 10m
        labels:
          severity: page`,
          options: ['Checks the rule every 10 minutes', 'Fires only if the error ratio stays above 2% for 10 continuous minutes', 'Silences the alert for 10 minutes after it fires', 'Keeps 10 minutes of data'],
          answer: 1,
          explain: 'The alert is pending until the condition has held for the whole for duration, which filters short blips.'
        },
        {
          q: 'Which alert should page someone at 3am?',
          options: ['Node CPU above 80%', 'Disk 60% full', 'A pod restarted once', 'Checkout error rate is burning the 30-day error budget 14x faster than sustainable'],
          answer: 3,
          explain: 'Page on user-facing symptoms that threaten the SLO. Causes like CPU go to dashboards or tickets.'
        },
        {
          q: 'The primary on-call engineer does not acknowledge a page within 10 minutes. In PagerDuty, what handles this?',
          options: ['The escalation policy pages the next level', 'Alertmanager resends it forever', 'The incident auto-resolves', 'The schedule deletes the shift'],
          answer: 0,
          explain: 'Escalation policies define who gets paged next and after how long.'
        },
        {
          q: 'What is the main goal of a blameless postmortem?',
          options: ['Identify who to discipline', 'Satisfy the SLA lawyers', 'Learn how the system and process allowed the failure, and fix them with owned action items', 'Close the incident ticket quickly'],
          answer: 2,
          explain: 'Blamelessness keeps people honest about what happened, which is the only way to fix the real causes.'
        }
      ]
    },
    {
      id: 't13-byte-latency',
      type: 'byte',
      title: 'Interview Byte: checkout p99 doubled',
      minutes: 6,
      prompt: 'Checkout p99 latency doubled 20 minutes ago. Walk me through how you investigate using your observability stack.',
      hints: ['What changed 20 minutes ago? Deploys, flags, traffic, config.', 'Is it all requests or a slice: one region, route, pod or customer?', 'Which signal tells you where the time is going inside a request?'],
      model: `<ol><li><b>Impact:</b> is the latency SLO burning? Is it paging? Open the incident and post a status update if users are hurt.</li>
<li><b>What changed:</b> check Grafana deploy markers, Argo CD history and recent flag changes. If a release lines up, <b>roll back or flip the flag first</b>, then investigate.</li>
<li><b>Scope with metrics:</b> PromQL <code>histogram_quantile(0.99, sum by (le, route) (rate(..._bucket[5m])))</code>. Split by route, pod and region. Check RED for downstream services and USE for DB pools and CPU.</li>
<li><b>Find the slow hop:</b> open slow traces in Jaeger (exemplars link from the graph). Look for the span that grew: payments call, a DB query, retries.</li>
<li><b>Explain it:</b> filter logs by <code>trace_id</code> in Loki or Kibana; check Sentry for new errors in this release.</li>
<li><b>Fix and follow up:</b> mitigate, confirm p99 recovers, then a blameless postmortem with action items.</li></ol>`,
      points: [
        'Checked user impact and SLO burn before diving in',
        'Correlated with recent deploys, flag changes and traffic',
        'Mitigated first (rollback or kill switch) when a change lined up',
        'Used metrics to narrow scope by route, instance and dependency',
        'Used traces to find the slow span, and logs or Sentry to explain it',
        'Confirmed recovery and planned a postmortem'
      ]
    }
  ]
}
