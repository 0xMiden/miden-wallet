import './main.css';

import React from 'react';

import { createRoot } from 'react-dom/client';

import App from 'app/App';
import { WindowType } from 'app/env';

// Disable animations for extension
document.documentElement.classList.add('extension-no-animations');

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(<App env={{ windowType: WindowType.Popup, confirmWindow: true }} />);
