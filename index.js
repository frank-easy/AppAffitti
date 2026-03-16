// #region agent log
console.log('[agent][H0] index.js entry before importing index.ts');
fetch('http://127.0.0.1:7242/ingest/9e30d0ae-f4ce-48ce-8de4-fbb42762dc04', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'debug-session',
    runId: 'pre-fix-2',
    hypothesisId: 'H0',
    location: 'index.js:entry',
    message: 'JS entry started (before importing index.ts)',
    data: {},
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

require('./index.ts');

