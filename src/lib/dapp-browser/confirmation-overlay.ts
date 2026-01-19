/**
 * Injectable confirmation overlay for the DApp browser.
 * This creates a modal overlay inside the webview instead of closing it.
 */

import { DAppConfirmationRequest } from './confirmation-store';

export interface OverlayTranslations {
  connectionRequest: string;
  transactionRequest: string;
  account: string;
  network: string;
  noAccountSelected: string;
  deny: string;
  approve: string;
  confirm: string;
}

/**
 * Generates JavaScript code to inject a confirmation overlay into the webview.
 * When user approves/denies, it sends a message back via mobileApp.postMessage.
 */
export function generateConfirmationOverlayScript(
  request: DAppConfirmationRequest,
  shortAccountId: string,
  translations: OverlayTranslations
): string {
  const appName = request.appMeta?.name || request.origin;
  const origin = request.origin;
  const network = request.network;
  const requestId = request.id;
  const isTransaction = request.type === 'transaction' || request.type === 'consume';
  const transactionMessages = request.transactionMessages || [];

  return `
(function() {
  // Remove any existing overlay
  const existing = document.getElementById('miden-confirmation-overlay');
  if (existing) existing.remove();

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.id = 'miden-confirmation-overlay';
  overlay.innerHTML = \`
    <style>
      #miden-confirmation-overlay {
        position: fixed;
        inset: 0;
        z-index: 999999;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.5);
        padding: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      }
      #miden-confirmation-modal {
        background: white;
        border-radius: 16px;
        width: 100%;
        max-width: 360px;
        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        overflow: hidden;
      }
      .miden-modal-header {
        padding: 24px;
        border-bottom: 1px solid #f0f0f0;
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .miden-modal-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        background: #EEF2FF;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .miden-modal-icon svg {
        width: 24px;
        height: 24px;
        color: #6366F1;
      }
      .miden-modal-title-container {
        flex: 1;
        min-width: 0;
      }
      .miden-modal-title {
        font-size: 18px;
        font-weight: 600;
        color: #1f2937;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin: 0;
      }
      .miden-modal-subtitle {
        font-size: 14px;
        color: #6b7280;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        margin: 0;
      }
      .miden-modal-content {
        padding: 24px;
      }
      .miden-modal-description {
        color: #4b5563;
        margin-bottom: 16px;
        font-size: 14px;
      }
      .miden-info-box {
        background: #f9fafb;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
      }
      .miden-info-label {
        font-size: 12px;
        color: #6b7280;
        margin-bottom: 4px;
      }
      .miden-info-value {
        font-size: 14px;
        color: #1f2937;
        font-family: ui-monospace, monospace;
      }
      .miden-info-value.capitalize {
        text-transform: capitalize;
        font-family: inherit;
      }
      .miden-tx-messages {
        background: #f9fafb;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
      }
      .miden-tx-message {
        font-size: 13px;
        color: #4b5563;
        padding: 4px 0;
        border-bottom: 1px solid #e5e7eb;
      }
      .miden-tx-message:last-child {
        border-bottom: none;
      }
      .miden-modal-actions {
        padding: 24px;
        border-top: 1px solid #f0f0f0;
        display: flex;
        gap: 12px;
      }
      .miden-btn {
        flex: 1;
        padding: 12px 24px;
        border-radius: 24px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        border: none;
      }
      .miden-btn-deny {
        background: white;
        border: 2px solid #f97316;
        color: #f97316;
      }
      .miden-btn-deny:hover {
        background: #fff7ed;
      }
      .miden-btn-approve {
        background: #6366F1;
        color: white;
      }
      .miden-btn-approve:hover {
        background: #4f46e5;
      }
      .miden-btn-approve:disabled {
        background: #c7d2fe;
        cursor: not-allowed;
      }
    </style>
    <div id="miden-confirmation-modal">
      <div class="miden-modal-header">
        <div class="miden-modal-icon">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
          </svg>
        </div>
        <div class="miden-modal-title-container">
          <h2 class="miden-modal-title">${escapeHtml(appName)}</h2>
          <p class="miden-modal-subtitle">${escapeHtml(origin)}</p>
        </div>
      </div>
      <div class="miden-modal-content">
        <p class="miden-modal-description">${isTransaction ? escapeHtml(translations.transactionRequest) : escapeHtml(translations.connectionRequest)}</p>
        ${
          isTransaction
            ? `<div class="miden-tx-messages">
                ${transactionMessages.map(msg => `<div class="miden-tx-message">${escapeHtml(msg)}</div>`).join('')}
              </div>`
            : `<div class="miden-info-box">
                <p class="miden-info-label">${escapeHtml(translations.account)}</p>
                <p class="miden-info-value">${escapeHtml(shortAccountId || translations.noAccountSelected)}</p>
              </div>`
        }
        <div class="miden-info-box" style="margin-bottom: 0;">
          <p class="miden-info-label">${escapeHtml(translations.network)}</p>
          <p class="miden-info-value capitalize">${escapeHtml(network)}</p>
        </div>
      </div>
      <div class="miden-modal-actions">
        <button class="miden-btn miden-btn-deny" id="miden-btn-deny">${escapeHtml(translations.deny)}</button>
        <button class="miden-btn miden-btn-approve" id="miden-btn-approve" ${!shortAccountId && !isTransaction ? 'disabled' : ''}>${isTransaction ? escapeHtml(translations.confirm) : escapeHtml(translations.approve)}</button>
      </div>
    </div>
  \`;

  document.body.appendChild(overlay);

  // Handle button clicks
  document.getElementById('miden-btn-deny').addEventListener('click', function() {
    sendResponse(false);
  });

  document.getElementById('miden-btn-approve').addEventListener('click', function() {
    sendResponse(true);
  });

  function sendResponse(confirmed) {
    // Remove overlay
    overlay.remove();

    // Send response back to native app
    if (window.mobileApp && window.mobileApp.postMessage) {
      window.mobileApp.postMessage({
        type: 'MIDEN_CONFIRMATION_RESPONSE',
        requestId: '${requestId}',
        confirmed: confirmed
      });
    }
  }
})();
`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/`/g, '&#96;');
}
