# Reproducible Testing Path

```bash
npm ci
npm run verify
npm run dev
```

Then open `http://localhost:3000`, run the broken fixture, apply the suggested fix, and run the corrected fixture. Verify `GET /api/health` returns `ok: true`.
