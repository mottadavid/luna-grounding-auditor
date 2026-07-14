# Build Week Demo Script — Under 3 Minutes

## 0:00–0:20 — Problem

“Most AI agent tests confirm that knowledge was ingested. They do not confirm that the deployed surface can actually see it. Luna Grounding Auditor turns that hidden grounding failure into a release gate.”

## 0:20–0:45 — Broken fixture

Load the broken fixture. Explain that canonical facts include services, hours, and safety boundaries, while the voice-visible prompt contains only a vague summary.

## 0:45–1:15 — Audit

Click **Run deployment audit**. Show:

- `NOT SAFE · DEPLOYMENT BLOCKED`;
- the grounding score;
- the knowledge-path loss marker;
- the failed adversarial question;
- expected evidence versus visible evidence.

## 1:15–1:40 — Remediation

Open the evidence explorer and click **Apply suggested fix**. Explain that the auditor recommends the smallest safe remediation instead of rewriting the entire agent.

## 1:40–2:00 — Certification

Run the audit again. Show `CERTIFIED · SAFE TO DEPLOY` and download the JSON certification report.

## 2:00–2:30 — GPT-5.6 and Codex

“Codex accelerated the architecture, implementation, tests, and release workflow. GPT-5.6 can generate adversarial questions, simulate the exact surface, evaluate semantic grounding, diagnose the missing layer, and recommend the smallest safe fix. The deterministic mode remains available so judges can test the project without an API key.”

## 2:30–2:50 — Product vision

“This can run before deploying a voice agent, support bot, sales agent, or internal copilot. The goal is simple: no AI surface ships unless the facts it needs are actually visible and grounded.”

## 2:50–3:00 — Close

Show the repository, public demo URL, and `GET /api/health` endpoint.
