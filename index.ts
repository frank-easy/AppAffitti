import { registerRootComponent } from 'expo';

import App from './App';

// #region agent log
console.log('[agent][H1] index.ts before registerRootComponent');
fetch('http://127.0.0.1:7242/ingest/9e30d0ae-f4ce-48ce-8de4-fbb42762dc04', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    sessionId: 'debug-session',
    runId: 'pre-fix-1',
    hypothesisId: 'H1',
    location: 'index.ts:before-registerRootComponent',
    message: 'About to register root component',
    data: {},
    timestamp: Date.now(),
  }),
}).catch(() => {});
// #endregion

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
