import React, { FC, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { useAccount } from 'lib/miden/front';
import { useNoteToastMonitor } from 'lib/miden/front/useNoteToast';
import { initNativeNotifications, showNoteReceivedNotification } from 'lib/mobile/native-notifications';
import { isMobile } from 'lib/platform';
import { useWalletStore } from 'lib/store';

/**
 * Provider component that monitors for new notes and displays native notifications.
 * Only active on mobile - returns null on extension.
 */
export const NoteToastProvider: FC = () => {
  // Early return for non-mobile platforms
  if (!isMobile()) {
    return null;
  }

  return <NoteToastProviderInner />;
};

/**
 * Inner component that handles the actual notification logic.
 * Separated to ensure hooks are only called on mobile.
 */
const NoteToastProviderInner: FC = () => {
  const { t } = useTranslation();
  const account = useAccount();
  const isNoteToastVisible = useWalletStore(state => state.isNoteToastVisible);
  const noteToastShownAt = useWalletStore(state => state.noteToastShownAt);
  const dismissNoteToast = useWalletStore(state => state.dismissNoteToast);

  // Initialize native notifications on mount
  useEffect(() => {
    initNativeNotifications();
  }, []);

  // Monitor for new notes
  useNoteToastMonitor(account.publicKey);

  // Show native notification when toast should be visible
  useEffect(() => {
    if (isNoteToastVisible && noteToastShownAt) {
      showNoteReceivedNotification(t('noteReceivedTitle'), t('noteReceivedTapToClaim'));
      // Dismiss the store state since we've shown the native notification
      dismissNoteToast();
    }
  }, [isNoteToastVisible, noteToastShownAt, dismissNoteToast, t]);

  // This component doesn't render anything - notifications are native
  return null;
};
