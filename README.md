# Luna Grounding Auditor

A deployment-certification tool for AI agents.

It answers one question:

> The business knowledge exists—but can this specific AI surface actually see the facts it needs to answer safely?

The auditor compares canonical business facts, surface-visible context, adversarial questions, expected evidence IDs, and negative controls. It then produces a deterministic `PASS`, `PARTIAL`, or `FAIL` report before deployment.

## Build Week track

**Work and Productivity**

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

Run tests:

```bash
npm test
```

## Demo

Use the two included fixtures:

- `fixtures/usx-before.json`: the source facts exist, but the voice prompt exposes only a vague service
- `fixtures/usx-after.json`: the same facts are now visible to the voice surface

Click **Run deployment audit** to see the certification move from blocked to ready.

## Why this matters

AI systems can pass ingestion tests and still fail in production because the runtime surface reads a different store, summary, prompt, or retrieval path. A document may exist in a database and remain invisible to a phone agent.

This project turns that hidden failure into a release gate.

## GPT-5.6 roadmap

The first release uses deterministic evidence matching so judges can run it without an API key.

GPT-5.6 will add:

- adversarial question generation;
- answer simulation by surface;
- semantic entailment evaluation;
- missing-store and prompt-assembly diagnosis;
- smallest-safe-fix recommendations.

## Codex requirement

Use one focused Codex session to implement or materially extend the core engine, then run `/feedback` and include that session ID in the submission.

## Security

The included fixture is synthetic. Do not publish production tenant data, credentials, or private customer content.

## License

MIT
