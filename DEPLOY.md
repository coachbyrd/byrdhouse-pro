# Deploy on Cloudflare Pages

The site is static files in `public/`. Chat is `POST /api/chat`, implemented two ways:

- `server.js` — Express, what Railway runs today
- `functions/api/chat.js` — Cloudflare Pages Function, same request and response

The browser sends the model (`claude-haiku-4-5-20251001`), `max_tokens`, system prompt, and messages. Both servers forward that JSON to `https://api.anthropic.com/v1/messages` with header `anthropic-version: 2023-06-01` and `ANTHROPIC_API_KEY`. Neither file contains the API key.

Leave Railway running until the Pages URL answers a chat question. Then move the domains and shut Railway down.

## 1. Connect the repository

In the Cloudflare dashboard: **Workers & Pages → Create → Pages → Connect to Git**. Choose this GitHub repo. Production branch: `main` (merge this change first).

Build settings:

| Setting | Value |
| --- | --- |
| Framework preset | None |
| Root directory | `/` (repository root, so `functions/` is picked up) |
| Build command | Leave empty. If the form requires a command, use `exit 0` |
| Build output directory | `public` |

`functions/` stays at the repository root. It is not part of the static build output, and it must not be moved into `public/`.

There is no build step. Pages publishes `public/` and deploys `functions/api/chat.js` as `POST /api/chat`.

## 2. Set the API key

**Settings → Variables and Secrets → Add** (do this for **Production**, and also **Preview** if branch deploys should be able to chat):

| Name | Value | Type |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | The same key Railway uses now | **Encrypt** (secret) |

Save, then retry the deployment if the first build finished before the secret existed. Pages injects the secret as `env.ANTHROPIC_API_KEY`. Do not put the key in the repo, in `wrangler.toml`, or in the browser code.

`wrangler.toml` in this repo does **not** set `pages_build_output_dir` on purpose. That key would make the file override the dashboard, including variables you set there. Configure the build output and the secret in the dashboard.

## 3. Check the `pages.dev` URL

Open the deployment URL Cloudflare shows (`https://<project>.pages.dev`). Ask a question in the chat box. A real answer means the function and the secret are working. An authentication error means the secret name or value does not match Railway.

## 4. Attach the domains

In the Pages project: **Custom domains → Set up a custom domain**. Add both:

- `byrdhouse.pro`
- `www.byrdhouse.pro`

If `byrdhouse.pro` is already a zone on this Cloudflare account, accept the DNS records Pages offers (apex and `www` pointing at the Pages project). SSL is issued automatically.

If DNS is hosted somewhere else, create the records the dashboard shows. That is usually:

- `www` — CNAME to `<project>.pages.dev`
- apex `byrdhouse.pro` — CNAME (or ALIAS / ANAME) to `<project>.pages.dev`, if the DNS host allows a CNAME at the apex

Do this only after step 3 succeeds. Railway can keep serving the domain until these records propagate.

## 5. Stop paying Railway

After `https://byrdhouse.pro` loads the site and a chat question gets an answer:

1. Confirm `www.byrdhouse.pro` as well.
2. Remove the Railway custom domains if they are still attached.
3. Delete or suspend the Railway service so billing stops.

`server.js` stays in the repo, so you can point the domain back at Railway if you need to.

## Local development

```bash
npx wrangler pages dev public
```

Create `.dev.vars` in the repository root (gitignored):

```
ANTHROPIC_API_KEY=your-key-here
```

The site is at `http://localhost:8788`. `npm start` still runs the Express server for Railway.

The Pages free plan includes this Function. The Anthropic request is waiting on the network, so it fits the free CPU allowance for a proxy of this size.
