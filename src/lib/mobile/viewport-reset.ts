import { Keyboard } from '@capacitor/keyboard';

/**
 * Reset viewport after a webview (InAppBrowser) closes.
 * Fixes bug where viewport stays shrunk (as if keyboard is open) after closing webview.
 *
 * The issue: On both iOS and Android, when the InAppBrowser webview closes,
 * the main app's webview can get stuck with incorrect viewport dimensions
 * (typically ~60% of the correct height).
 *
 * The workaround that works manually is opening/closing the keyboard, which
 * forces the native layer to recalculate viewport bounds. So we simulate that
 * by briefly focusing a hidden input to trigger keyboard calculations, then
 * immediately hiding it.
 */
export async function resetViewportAfterWebview(): Promise<void> {
  // Method 1: Try to hide any existing keyboard first
  try {
    await Keyboard.hide();
  } catch {
    // Keyboard plugin may fail if no keyboard was shown, ignore
  }

  // Method 2: Create a temporary input and focus/blur it to trigger
  // native keyboard calculations which forces viewport recalculation
  const tempInput = document.createElement('input');
  tempInput.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;pointer-events:none;';
  tempInput.setAttribute('readonly', 'readonly'); // Prevent actual keyboard on some devices
  document.body.appendChild(tempInput);

  // Small delay to let the DOM settle after webview close
  await new Promise(resolve => setTimeout(resolve, 50));

  // Focus triggers native keyboard calculation path even if keyboard doesn't show
  tempInput.focus();

  // Another small delay
  await new Promise(resolve => setTimeout(resolve, 50));

  // Blur and remove
  tempInput.blur();
  document.body.removeChild(tempInput);

  // Method 3: Force layout recalculation via CSS
  const root = document.getElementById('root');
  if (root) {
    // Force reflow by reading a layout property after a style change
    root.style.display = 'none';
    void root.offsetHeight; // Force reflow
    root.style.display = '';
  }

  // Method 4: Dispatch resize event to notify any listeners
  window.dispatchEvent(new Event('resize'));

  // Method 5: Scroll to trigger any scroll-based viewport calculations
  window.scrollTo(0, 1);
  await new Promise(resolve => setTimeout(resolve, 10));
  window.scrollTo(0, 0);

  // Blur any remaining active element
  if (document.activeElement instanceof HTMLElement) {
    document.activeElement.blur();
  }
}
