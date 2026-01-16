import './main.css';

import React from 'react';

import { createRoot } from 'react-dom/client';

import App from 'app/App';
import { WindowType } from 'app/env';
import { getMobileIntercomAdapter } from 'lib/intercom/mobile-adapter';

// Initialize mobile backend before rendering
async function initMobile() {
  console.log('Mobile app: Starting initialization');

  // Initialize the mobile intercom adapter (this starts the backend)
  const adapter = getMobileIntercomAdapter();
  await adapter.init();

  console.log('Mobile app: Backend initialized, rendering UI');

  // Render the app
  const container = document.getElementById('root');
  if (!container) {
    console.error('Mobile app: Root container not found');
    return;
  }

  const root = createRoot(container);
  root.render(<App env={{ windowType: WindowType.FullPage }} />);
}

// Start the mobile app
initMobile().catch(error => {
  console.error('Mobile app: Failed to initialize', error);
});
