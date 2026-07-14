# Architecture

```text
Canonical business facts
        |
        v
Surface-visible context -----------+
        |                           |
        v                           v
Deterministic controls        GPT-5.6 workflow (optional)
- evidence IDs                - adversarial questions
- negative controls           - answer simulation
- exact visibility checks     - semantic evaluation
        |                     - diagnosis/remediation
        +-------------+-------------+
                      v
             Certification report
          PASS / PARTIAL / FAIL
                      |
                      v
              Deployment release gate
```

The deterministic path is the judge-safe baseline and requires no external API. GPT-5.6 adds semantic and generative analysis but does not remove the deterministic evidence checks.
