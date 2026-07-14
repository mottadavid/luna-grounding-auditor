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

The API key remains server-side. When the key is absent or unavailable, the application falls back to deterministic mode.

## Release automation

The repository includes a GitHub Actions release gate that runs:

- `npm ci`;
- `npm test`;
- `npm run typecheck`;
- `npm run build`.

A public runtime can be monitored at:

```text
GET /api/health
```

## Why this matters

AI systems can pass ingestion tests and still fail in production because the runtime surface reads a different store, summary, prompt, or retrieval path. A document may exist in a database and remain invisible to a phone agent.

This project turns that hidden failure into an explicit release decision.

## Codex requirement

Use one focused Codex session to implement or materially extend the core engine, run `/feedback`, and include that session ID in the Build Week submission.

## Security

- Do not publish production tenant data, credentials, phone numbers, or internal service URLs.
- Uploaded or pasted fixtures should remain synthetic.
- `OPENAI_API_KEY` is optional and server-only.

## License

MIT
