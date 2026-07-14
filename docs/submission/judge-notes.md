# Judge Testing Notes

The deterministic demo is the recommended first path because it requires no API key and is fully reproducible.

1. Load the broken fixture.
2. Run the audit.
3. Inspect the failed evidence control and highlighted prompt-builder loss point.
4. Apply the suggested fix.
5. Re-run the audit and confirm certification.

GPT-5.6 mode is optional and activates only when `OPENAI_API_KEY` is configured server-side. The interface reports the active mode and model in the certification panel.
