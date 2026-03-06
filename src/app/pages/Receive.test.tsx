import React from 'react';

import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

import { ConsumableNoteComponent } from './Receive';

const mockConsume = jest.fn().mockResolvedValue({ transactionId: 'tx-hash-456' });
jest.mock('@miden-sdk/react', () => ({
  useConsume: () => ({
    consume: mockConsume,
    result: null,
    isLoading: false,
    stage: 'idle',
    error: null,
    reset: jest.fn()
  })
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

jest.mock('app/atoms/FormField', () => React.forwardRef(() => null));

jest.mock('app/env', () => ({
  useAppEnv: () => ({ popup: false })
}));

jest.mock('app/icons/v2', () => ({
  Icon: () => null,
  IconName: { ArrowRightDownFilledCircle: 'ArrowRightDownFilledCircle', Copy: 'Copy', File: 'File', Coins: 'Coins' }
}));

jest.mock('components/Button', () => ({
  Button: ({ onClick, title, disabled }: { onClick: () => void; title: string; disabled?: boolean }) => (
    <button onClick={onClick} data-testid="claim-button" disabled={disabled}>
      {title}
    </button>
  ),
  ButtonVariant: { Primary: 'Primary', Secondary: 'Secondary' }
}));

jest.mock('components/SyncWaveBackground', () => ({
  SyncWaveBackground: ({ isSyncing }: { isSyncing: boolean }) => (isSyncing ? <div data-testid="sync-wave" /> : null)
}));

jest.mock('lib/i18n/numbers', () => ({
  formatBigInt: (value: bigint) => value.toString()
}));

jest.mock('components/CardItem', () => ({
  CardItem: ({ title, iconRight }: any) => (
    <div data-testid="card-item">
      <span>{title}</span>
      {iconRight}
    </div>
  )
}));

jest.mock('lib/platform', () => ({
  isMobile: () => false
}));

jest.mock('lib/woozie', () => ({
  navigate: jest.fn(),
  useLocation: () => ({ search: '' }),
  HistoryAction: { Replace: 'Replace' }
}));

jest.mock('utils/string', () => ({
  truncateAddress: (addr: string) => addr?.slice(0, 8) || ''
}));

jest.mock('lib/mobile/haptics', () => ({
  hapticLight: jest.fn()
}));

jest.mock('lib/miden/front', () => ({
  useAccount: () => ({ publicKey: 'test-account-123' })
}));

jest.mock('lib/miden/front/claimable-notes', () => ({
  useClaimableNotes: () => ({ data: [], mutate: jest.fn(() => Promise.resolve([])) })
}));

jest.mock('lib/miden/sdk/miden-client', () => ({
  getMidenClient: jest.fn(() => Promise.resolve({ getInputNoteDetails: jest.fn(() => Promise.resolve([])) })),
  withWasmClientLock: jest.fn((callback: any) => callback())
}));

jest.mock('@miden-sdk/miden-sdk', () => ({
  InputNoteState: { Invalid: 'Invalid' },
  NoteFilter: jest.fn(),
  NoteFilterTypes: { List: 'List' },
  NoteId: { fromHex: jest.fn((id: string) => id) }
}));

jest.mock('lib/miden/activity', () => ({
  verifyStuckTransactionsFromNode: jest.fn().mockResolvedValue(0),
  getFailedTransactions: jest.fn().mockResolvedValue([])
}));

jest.mock('components/NavigationHeader', () => ({
  NavigationHeader: () => null
}));

jest.mock('components/QRCode', () => ({
  QRCode: () => null
}));

jest.mock('lib/ui/useCopyToClipboard', () => ({
  __esModule: true,
  default: () => ({ fieldRef: { current: null }, copy: jest.fn() })
}));

describe('ConsumableNoteComponent', () => {
  let testRoot: ReturnType<typeof createRoot> | null = null;
  let testContainer: HTMLDivElement | null = null;
  let consoleErrorSpy: jest.SpyInstance;

  const mockAccount = { publicKey: 'test-account-123' };
  const mockMutateClaimableNotes: jest.Mock<Promise<void>> = jest.fn(() => Promise.resolve());

  const createMockNote = (overrides = {}) => ({
    id: 'note-123',
    faucetId: 'faucet-456',
    amount: '1000000',
    senderAddress: 'sender-address-789',
    isBeingClaimed: false,
    metadata: {
      symbol: 'TEST',
      name: 'Test Token',
      decimals: 6
    },
    ...overrides
  });

  beforeAll(() => {
    (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  });

  afterAll(() => {
    delete (globalThis as any).IS_REACT_ACT_ENVIRONMENT;
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsume.mockResolvedValue({ transactionId: 'tx-hash-456' });
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(async () => {
    consoleErrorSpy.mockRestore();
    if (testRoot) {
      await act(async () => {
        testRoot!.unmount();
      });
      testRoot = null;
    }
    if (testContainer) {
      testContainer.remove();
      testContainer = null;
    }
  });

  it('shows Claim button when note is not being claimed', async () => {
    testContainer = document.createElement('div');
    document.body.appendChild(testContainer);

    const note = createMockNote();

    await act(async () => {
      testRoot = createRoot(testContainer!);
      testRoot.render(
        <ConsumableNoteComponent
          note={note as any}
          account={mockAccount as any}
          mutateClaimableNotes={mockMutateClaimableNotes}
        />
      );
    });

    const button = testContainer!.querySelector('[data-testid="claim-button"]') as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(button.textContent).toBe('claim');
    expect(button.disabled).toBe(false);
  });

  it('shows spinner when isClaimingFromParent is true', async () => {
    testContainer = document.createElement('div');
    document.body.appendChild(testContainer);

    const note = createMockNote();

    await act(async () => {
      testRoot = createRoot(testContainer!);
      testRoot.render(
        <ConsumableNoteComponent
          note={note as any}
          account={mockAccount as any}
          mutateClaimableNotes={mockMutateClaimableNotes}
          isClaimingFromParent={true}
        />
      );
    });

    const syncWave = testContainer!.querySelector('[data-testid="sync-wave"]');
    expect(syncWave).not.toBeNull();
    // No claim button when spinner is showing
    const button = testContainer!.querySelector('[data-testid="claim-button"]');
    expect(button).toBeNull();
  });

  it('calls SDK consume() when Claim button is clicked', async () => {
    testContainer = document.createElement('div');
    document.body.appendChild(testContainer);

    const note = createMockNote();

    await act(async () => {
      testRoot = createRoot(testContainer!);
      testRoot.render(
        <ConsumableNoteComponent
          note={note as any}
          account={mockAccount as any}
          mutateClaimableNotes={mockMutateClaimableNotes}
        />
      );
    });

    const button = testContainer!.querySelector('[data-testid="claim-button"]') as HTMLButtonElement;
    await act(async () => {
      button.click();
    });

    expect(mockConsume).toHaveBeenCalledWith({
      accountId: 'test-account-123',
      notes: ['note-123']
    });
  });

  it('shows error state when consume fails', async () => {
    mockConsume.mockRejectedValue(new Error('Transaction failed'));

    testContainer = document.createElement('div');
    document.body.appendChild(testContainer);

    const note = createMockNote();

    await act(async () => {
      testRoot = createRoot(testContainer!);
      testRoot.render(
        <ConsumableNoteComponent
          note={note as any}
          account={mockAccount as any}
          mutateClaimableNotes={mockMutateClaimableNotes}
        />
      );
    });

    const button = testContainer!.querySelector('[data-testid="claim-button"]') as HTMLButtonElement;
    await act(async () => {
      button.click();
    });

    // After failure, should show retry button
    const retryButton = testContainer!.querySelector('[data-testid="claim-button"]') as HTMLButtonElement;
    expect(retryButton).not.toBeNull();
    expect(retryButton.textContent).toBe('retry');
  });

  it('shows error state when hasFailedFromParent is true', async () => {
    testContainer = document.createElement('div');
    document.body.appendChild(testContainer);

    const note = createMockNote();

    await act(async () => {
      testRoot = createRoot(testContainer!);
      testRoot.render(
        <ConsumableNoteComponent
          note={note as any}
          account={mockAccount as any}
          mutateClaimableNotes={mockMutateClaimableNotes}
          hasFailedFromParent={true}
        />
      );
    });

    const button = testContainer!.querySelector('[data-testid="claim-button"]') as HTMLButtonElement;
    expect(button).not.toBeNull();
    expect(button.textContent).toBe('retry');
  });

  it('refreshes claimable notes after successful consume', async () => {
    testContainer = document.createElement('div');
    document.body.appendChild(testContainer);

    const note = createMockNote();

    await act(async () => {
      testRoot = createRoot(testContainer!);
      testRoot.render(
        <ConsumableNoteComponent
          note={note as any}
          account={mockAccount as any}
          mutateClaimableNotes={mockMutateClaimableNotes}
        />
      );
    });

    const button = testContainer!.querySelector('[data-testid="claim-button"]') as HTMLButtonElement;
    await act(async () => {
      button.click();
    });

    expect(mockMutateClaimableNotes).toHaveBeenCalled();
  });

  it('reports claiming state to parent', async () => {
    testContainer = document.createElement('div');
    document.body.appendChild(testContainer);

    const note = createMockNote();
    const onClaimingStateChange = jest.fn();

    // Use a promise to control when consume resolves
    let resolveConsume: (value: any) => void;
    mockConsume.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveConsume = resolve;
        })
    );

    await act(async () => {
      testRoot = createRoot(testContainer!);
      testRoot.render(
        <ConsumableNoteComponent
          note={note as any}
          account={mockAccount as any}
          mutateClaimableNotes={mockMutateClaimableNotes}
          onClaimingStateChange={onClaimingStateChange}
        />
      );
    });

    // Initially not claiming
    expect(onClaimingStateChange).toHaveBeenCalledWith('note-123', false);

    const button = testContainer!.querySelector('[data-testid="claim-button"]') as HTMLButtonElement;
    await act(async () => {
      button.click();
    });

    // Should report claiming state
    expect(onClaimingStateChange).toHaveBeenCalledWith('note-123', true);

    // Resolve the consume
    await act(async () => {
      resolveConsume!({ transactionId: 'tx-hash' });
    });

    // Should report no longer claiming
    expect(onClaimingStateChange).toHaveBeenCalledWith('note-123', false);
  });
});
