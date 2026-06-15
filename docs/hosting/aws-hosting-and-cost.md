# Hosting bujo on AWS — cost, architecture, secure storage

What bujo actually is: a **static Vite SPA** (`dist/`) + **two tiny serverless
functions** (`api/sync.ts` → blob store, `api/feedback.ts` → GitHub). It is
**local-first**: the journal lives on the user's device; cloud is optional and, by
design (BYO storage + E2E), holds only **ciphertext** or nothing. That shape makes
hosting cheap and "storing their data securely" mostly a non-problem — you don't hold
readable data.

## Recommended AWS architecture

| Layer | Service | Why |
|------|---------|-----|
| Static site + CDN | **S3 (private) + CloudFront** with Origin Access Control | Cheapest, fastest way to serve a SPA. Bucket stays private; only CloudFront can read it. |
| TLS + DNS | **ACM** (free certs) + **Route 53** | HTTPS everywhere; custom domain. |
| Functions | **Lambda (Node 20)** via **function URLs** (or HTTP API Gateway) | Replaces the Vercel functions. Function URLs avoid API Gateway's per-request cost. |
| Optional cloud sync store | **S3** for E2E blobs *(recommended)* or **DynamoDB** for per-user rows | Mirror of today's Vercel Blob / Supabase `journals` table. Store ciphertext only. |
| Auth | **Cognito** (Google + email federation) | Replaces Supabase Auth; 50k MAU free. |
| IaC | **SST** or **AWS CDK** | One deploy for SPA + Lambda + Cognito + S3/Dynamo. SST fits SPAs especially well. |

## Cost estimate (approx, us-east-1; prices change — verify)

Static + serverless + on-demand data = you pay for traffic, not idle servers.

| Service | Low (~hundreds of users) | Mid (~10k MAU) |
|--------|--------------------------|----------------|
| S3 (hosting + E2E blobs) | < $0.10 | ~$1–3 |
| CloudFront (egress + requests) | ~$0–1 (free tier 1 TB/mo) | ~$5–15 |
| Route 53 (zone + queries) | ~$0.50–1 | ~$1 |
| Lambda (1M req/mo free) | $0 | ~$1–5 |
| Function URLs (vs API GW $1/M) | $0 | ~$0–3 |
| DynamoDB on-demand (if used) | ~$0 | ~$1–5 |
| Cognito (50k MAU free) | $0 | $0 |
| ACM / KMS | free / ~$1 | ~$1 |
| **Total** | **~$1–4 / month** | **~$15–35 / month** |

At personal scale it rounds to ~$1–4/mo (mostly Route 53). It scales with **traffic and
stored bytes**, not user count, because the app is static + local-first.

### Versus staying on Vercel
- Vercel **Hobby = free** (personal/non-commercial); **Pro = $20/mo flat**.
- You're already deployed on Vercel with the functions working. For this scale, Vercel
  is operationally simpler and effectively free.
- **AWS wins when:** you exceed Vercel's free limits, need commercial use without Pro,
  want everything in one cloud, or want fine-grained control/own the egress curve.

> **Honest recommendation:** stay on Vercel now; plan an AWS path (S3 + CloudFront +
> Cognito + S3/Dynamo via SST) for if/when you outgrow it. Migration is low-risk because
> the app is static + local-first. Don't pay for AWS complexity you don't yet need.

## Secure data storage (whichever cloud)

The cheapest *and* most private store is **"don't store plaintext."** Keep BYO + E2E:

- **S3 for E2E blobs:** Block Public Access ON; bucket policy denies non-TLS
  (`aws:SecureTransport=false`); SSE-KMS at rest; lifecycle/versioning; store only
  client-encrypted ciphertext (AES-GCM via `src/lib/crypto.ts`). A bucket leak = ciphertext.
- **DynamoDB (if per-user rows):** encryption at rest (KMS, default on), partition key =
  Cognito `sub`, IAM scoped so a token can touch only its own item, point-in-time recovery.
- **Auth:** Cognito with MFA + Google federation; short-lived JWTs; rotate app secrets.
- **Key management:** E2E means the *user* holds the data key — server-side KMS only
  protects the at-rest envelope, not contents. That's the point: you can't read it,
  can't mine it, can't "maintain" it. Document key-loss = data-loss (no server recovery).
- **Guardrails:** CloudTrail (audit), least-privilege IAM, GuardDuty optional, the same
  security headers + CSP shipped for Vercel (set on CloudFront via a response-headers
  policy), and the `senior-secops` audit in CI.

## Migration sketch (if/when you move)

1. `vite build` → sync `dist/` to S3; CloudFront in front (OAC, SPA error→`index.html`).
2. Port `api/sync.ts`/`api/feedback.ts` to Lambda function URLs; secrets in SSM/Secrets Manager.
3. Swap Vercel Blob → S3, Supabase → Cognito + DynamoDB (or keep Supabase; it's portable).
4. Move the security headers/CSP to a CloudFront response-headers policy.
5. Define it all in SST/CDK; wire the security audit into the deploy pipeline.

See also `../security/auth-and-data-security.md` and `../redesign/08-adaptive-auth-ownership-program.md`.
