/**
 * Custom LocalBiometric plugin for iOS only.
 * This is a local Capacitor plugin that provides biometric authentication
 * using iOS LocalAuthentication framework directly.
 */

import { registerPlugin } from '@capacitor/core';

export interface LocalBiometricPlugin {
  isAvailable(): Promise<{
    isAvailable: boolean;
    biometryType: number; // 0 = none, 1 = TouchID, 2 = FaceID, 4 = OpticID
    errorCode?: number;
    errorMessage?: string;
  }>;

  verifyIdentity(options: { reason: string; useFallback?: boolean }): Promise<void>;

  setCredentials(options: { server: string; username: string; password: string }): Promise<void>;

  getCredentials(options: { server: string }): Promise<{ username: string; password: string }>;

  deleteCredentials(options: { server: string }): Promise<void>;
}

// Register the plugin - this connects to the native Swift implementation
export const LocalBiometric = registerPlugin<LocalBiometricPlugin>('LocalBiometric');
