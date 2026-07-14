# Devpost Draft

## Project name

Luna Grounding Auditor

## Tagline

The CI system for AI agents.

## What it does

Luna Grounding Auditor certifies whether a specific AI surface can actually see the business facts it needs before that agent is deployed. It compares canonical knowledge with the exact context exposed to a voice agent, chatbot, copilot, or workflow. It then runs adversarial questions, checks expected evidence IDs, detects unsupported claims, identifies the layer where knowledge was lost, and returns a release decision: `CERTIFIED` or `NOT SAFE`.

## The problem

Agent teams often validate ingestion but not runtime visibility. A document may exist in a vector database while the production voice prompt receives only a weak summary. The system appears trained, yet the live agent cannot answer basic questions or safely reject unsupported requests.

## How we built it

The standalone Next.js application includes a deterministic audit engine, synthetic broken and corrected fixtures, an evidence explorer, a visual knowledge pipeline, downloadable certification reports, and an optional server-side GPT-5.6 workflow.

GPT-5.6 is used for adversarial question generation, surface-only answer simulation, semantic grounding evaluation, failure-layer diagnosis, and smallest-safe remediation. Codex accelerated the repository architecture, implementation, test coverage, UI iteration, CI workflow, and submission assets.

## Why it is different

This is not another agent builder or observability dashboard. It is a pre-deployment safety gate focused on the gap between knowledge that exists and knowledge the active AI surface can actually access.

## Judge demo

The deterministic demo needs no API key. Load the broken fixture, run the audit, inspect the missing evidence and knowledge-loss point, apply the suggested fix, and re-run the certification. The project moves from `NOT SAFE` to `CERTIFIED` in under 90 seconds.

## Track

Work and Productivity
