/**
 * QR code scanner wrapper.
 *
 * This module provides a cross-platform QR scanning interface for mobile apps.
 * - iOS: Uses local native plugin (BarcodeScannerPlugin.swift)
 * - Android: Uses capacitor-barcode-scanner npm package
 * - Desktop: Scanning is not available (UI should hide scan button)
 */

import { registerPlugin } from '@capacitor/core';

import { isAndroid, isMobile } from 'lib/platform';

import { decodeAddress, isValidMidenAddress } from './format';

interface BarcodeScannerPlugin {
  scan(): Promise<{ barcode: string }>;
}

// Register the plugin - this works for both:
// - iOS: Local Swift plugin registered in AppViewController
// - Android: npm package auto-registered via Gradle
const BarcodeScanner = registerPlugin<BarcodeScannerPlugin>('BarcodeScanner');

export interface ScanResult {
  success: boolean;
  address?: string;
  error?: string;
}

/**
 * Checks if QR scanning is available on the current platform.
 * @returns true if scanning is available (mobile only)
 */
export function isScanAvailable(): boolean {
  return isMobile();
}

/**
 * Scans a QR code and extracts the Miden address.
 *
 * @returns A ScanResult with either the address or an error
 */
export async function scanQRCode(): Promise<ScanResult> {
  if (!isMobile()) {
    return { success: false, error: 'QR scanning is only available on mobile' };
  }

  try {
    let barcode: string;

    if (isAndroid()) {
      // On Android, use the npm package which returns { result: boolean, code?: string }
      const { BarcodeScanner: AndroidScanner } = await import('capacitor-barcode-scanner');
      const result = await AndroidScanner.scan();
      barcode = result.code || '';
    } else {
      // On iOS, use the local native plugin
      const result = await BarcodeScanner.scan();
      barcode = result.barcode;
    }

    if (!barcode) {
      return { success: false, error: 'No QR code found' };
    }

    // Decode the address (strips miden: prefix if present)
    const address = decodeAddress(barcode);

    // Validate the address
    if (!isValidMidenAddress(address)) {
      return { success: false, error: 'Invalid Miden address' };
    }

    return { success: true, address };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';

    // Handle user cancellation
    if (message.includes('cancel') || message.includes('dismissed') || message.includes('Cancel')) {
      return { success: false, error: 'Scan cancelled' };
    }

    return { success: false, error: message };
  }
}

/**
 * Checks if the device has a camera and camera permissions can be requested.
 * @returns true if camera access is possible
 */
export async function checkCameraPermission(): Promise<boolean> {
  // This plugin handles permissions internally when scan() is called
  return isMobile();
}
