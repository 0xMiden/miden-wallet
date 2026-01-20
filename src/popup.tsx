import './main.css';

import React from 'react';

import { createRoot } from 'react-dom/client';
import browser from 'webextension-polyfill';

import 'lib/lock-up/run-checks';

import App from 'app/App';
import { WindowType, openInFullPage } from 'app/env';
import { isPopupModeEnabled } from 'lib/popup-mode';

// Disable animations for extension
document.documentElement.classList.add('extension-no-animations');

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App env={{ windowType: WindowType.Popup }} />);

const popups = browser.extension.getViews({ type: 'popup' });
if (!popups.includes(window) || !isPopupModeEnabled()) {
  openInFullPage();
  window.close();
}
