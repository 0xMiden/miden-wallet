import React from 'react';

import { render } from '@testing-library/react';

import { NoteToastProvider } from './NoteToastProvider';

// Mock dependencies
jest.mock('lib/platform', () => ({
  isMobile: jest.fn()
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

jest.mock('lib/miden/front', () => ({
  useAccount: () => ({ publicKey: 'test-public-key' })
}));

jest.mock('lib/miden/front/useNoteToast', () => ({
  useNoteToastMonitor: jest.fn()
}));

jest.mock('lib/mobile/native-notifications', () => ({
  initNativeNotifications: jest.fn(),
  showNoteReceivedNotification: jest.fn()
}));

let mockStoreState = {
  isNoteToastVisible: false,
  noteToastShownAt: null as number | null,
  dismissNoteToast: jest.fn()
};

jest.mock('lib/store', () => ({
  useWalletStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState)
}));

import { isMobile } from 'lib/platform';
import { initNativeNotifications, showNoteReceivedNotification } from 'lib/mobile/native-notifications';

const mockIsMobile = isMobile as jest.MockedFunction<typeof isMobile>;

describe('NoteToastProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockStoreState = {
      isNoteToastVisible: false,
      noteToastShownAt: null,
      dismissNoteToast: jest.fn()
    };
  });

  it('returns null on non-mobile platforms', () => {
    mockIsMobile.mockReturnValue(false);

    const { container } = render(<NoteToastProvider />);

    expect(container.firstChild).toBeNull();
    expect(initNativeNotifications).not.toHaveBeenCalled();
  });

  it('initializes native notifications on mobile', () => {
    mockIsMobile.mockReturnValue(true);

    render(<NoteToastProvider />);

    expect(initNativeNotifications).toHaveBeenCalled();
  });

  it('shows notification when toast is visible', () => {
    mockIsMobile.mockReturnValue(true);
    mockStoreState.isNoteToastVisible = true;
    mockStoreState.noteToastShownAt = Date.now();

    render(<NoteToastProvider />);

    expect(showNoteReceivedNotification).toHaveBeenCalledWith('noteReceivedTitle', 'noteReceivedTapToClaim');
    expect(mockStoreState.dismissNoteToast).toHaveBeenCalled();
  });

  it('does not show notification when toast is not visible', () => {
    mockIsMobile.mockReturnValue(true);
    mockStoreState.isNoteToastVisible = false;

    render(<NoteToastProvider />);

    expect(showNoteReceivedNotification).not.toHaveBeenCalled();
  });

  it('renders null even on mobile', () => {
    mockIsMobile.mockReturnValue(true);

    const { container } = render(<NoteToastProvider />);

    expect(container.firstChild).toBeNull();
  });
});
