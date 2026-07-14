# Architecture

```text
Canonical tenant facts
        |
        v
Surface-visible context
(voice prompt / chat context / retrieval output)
        |
        v
Question matrix + negative controls
        |
        v
Deterministic evidence comparator
        |
        v
PASS / PARTIAL / FAIL
        |
        v
Deployment certification report
```

A fact is not considered available merely because it exists in a database. It must be visible to the exact runtime surface under test.

GPT-5.6 augments the deterministic release gate with semantic question generation, answer simulation, entailment analysis, and remediation guidance.
