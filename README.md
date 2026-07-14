# Luna Grounding Auditor

**The CI system for AI agents.**

Luna Grounding Auditor answers one deployment question:

> The business knowledge exists—but can this specific AI surface actually see the facts it needs to answer safely?

It compares canonical facts, surface-visible context, adversarial questions, expected evidence IDs, and negative controls. The result is a deterministic `PASS`, `PARTIAL`, or `FAIL` certification before deployment.

## Build Week track

**Work and Productivity**

## 90-second judging path

1. Open the app in deterministic mode; no API key is required.
2. Click **Load broken**.
3. Click **Run deployment audit**.
4. Inspect the highlighted knowledge-loss point and failed evidence control.
5. Click **Apply suggested fix**.
6. Run the audit again and confirm the result changes to **CERTIFIED · SAFE TO DEPLOY**.
7. Download the machine-readable certification report.

## What the report proves

Each certification contains:

- deployment decision and grounding score;
- passed, partial, and failed control counts;
- exact visible and missing evidence IDs;
- diagnosed knowledge-loss layer;
- smallest-safe remediation;
- deterministic fixture fingerprint;
- active mode and model;
- generation timestamp.

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Run the complete release gate:

```bash
npm run verify
```

This executes tests, TypeScript validation, and the production build.

## Test your own fixture

The app accepts fixture JSON in three ways:

- paste or edit JSON directly;
- upload a `.json` file smaller than 1 MB;
- download and modify the included example fixture.

Fixtures are validated with Zod. Validation errors identify the exact path, including duplicate IDs and questions that reference unknown evidence.

Minimal shape:

```json
{
  "tenant": { "slug": "demo", "businessName": "Demo Business" },
  "canonicalFacts": [
    { "id": "hours", "category": "hours", "claim": "Open Saturday.", "evidence": "Approved hours." }
  ],
  "surfaces": [
    { "surface": "voice_prompt", "visibleText": "Demo Business is open weekdays." }
  ],
  "questions": [
    { "id": "q1", "question": "Are you open Saturday?", "expectedFactIds": ["hours"] }
  ]
}
```

## Demo fixtures

- `fixtures/usx-before.json`: source facts exist, but the voice prompt exposes only a vague service.
- `fixtures/usx-after.json`: the same facts are visible to the voice surface.

The fixtures are synthetic and contain no production tenant data.

## GPT-5.6 mode

The app always supports deterministic demo mode. Set the optional server-side environment variables to enable GPT-5.6:

```bash
cp .env.example .env.local
```

```env
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.6
```

When configured, GPT-5.6 supports:

- adversarial question generation;
- surface-only answer simulation;
- semantic grounding evaluation;
- missing-store and prompt-assembly diagnosis;
- smallest-safe-fix recommendations.

The API key remains server-side. If GPT-5.6 is unavailable, times out, or exceeds quota, the request falls back to deterministic certification and visibly reports the fallback reason.

## Use it as a deployment gate

`POST /api/gate` returns:

- HTTP `200` when the fixture is certified;
- HTTP `422` when deployment must be blocked;
- HTTP `400` for malformed or invalid fixtures.

Example:

```bash
curl --fail-with-body \
  -H "Content-Type: application/json" \
  --data-binary @fixtures/usx-after.json \
  http://localhost:3000/api/gate
```

A copy-ready GitHub Actions example is included at:

```text
examples/github-actions/grounding-gate.yml
```

## Public deployment

The repository includes `vercel.json` and can be deployed without authentication. Deterministic mode works without any environment variables.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mottadavid/luna-grounding-auditor&env=OPENAI_API_KEY,OPENAI_MODEL&envDescription=Optional%20server-side%20GPT-5.6%20configuration)

After deployment, verify:

```text
GET /api/health
```

## Release automation

The repository includes a GitHub Actions release gate that runs:

- `npm ci`;
- `npm test`;
- `npm run typecheck`;
- `npm run build`.

The production dependency tree is pinned to patched compatible releases with no high or critical audit findings.

## Why this matters

AI systems can pass ingestion tests and still fail in production because the runtime surface reads a different store, summary, prompt, or retrieval path. A document may exist in a database and remain invisible to a phone agent.

This project turns that hidden failure into an explicit release decision.

## Codex requirement

Use one focused Codex session to implement or materially extend the core engine, run `/feedback`, and include that session ID in the Build Week submission.

## Security

- Do not publish production tenant data, credentials, phone numbers, or internal service URLs.
- Uploaded or pasted fixtures remain in browser memory unless submitted for the current audit request.
- The application does not persist fixtures.
- `OPENAI_API_KEY` is optional and server-only.
- Downloaded certification reports contain only the submitted fixture-derived audit results.

## License

MIT
