/**
 * Tracks whether we're returning from an InAppBrowser webview.
 * Used to skip page transition animations when closing the webview.
 */

let returningFromWebview = false;

export function setReturningFromWebview(value: boolean) {
  returningFromWebview = value;
}

export function isReturningFromWebview(): boolean {
  return returningFromWebview;
}

/**
 * Call this before closing the InAppBrowser to skip the next animation.
 * The flag auto-clears after a short delay.
 */
export function markReturningFromWebview() {
  returningFromWebview = true;
  // Clear after animation would have completed
  setTimeout(() => {
    returningFromWebview = false;
  }, 300);
}
