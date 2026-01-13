import React from 'react';

import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

import { ConsumableNoteComponent } from './Receive';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

jest.mock('app/atoms/FormField', () => React.forwardRef(() => null));

jest.mock('app/env', () => ({
  openLoadingFullPage: jest.fn(),
  useAppEnv: () => ({ popup: false })
}));

jest.mock('app/hooks/useMidenClient', () => ({
  useMidenClient: () => ({ midenClient: null })
}));

jest.mock('app/icons/v2', () => ({
  Icon: () => null,
  IconName: { ArrowRightDownFilledCircle: 'ArrowRightDownFilledCircle', Copy: 'Copy', File: 'File' }
}));

jest.mock('app/layouts/PageLayout', () => ({ children }: { children: React.ReactNode }) => <div>{children}</div>);

jest.mock('app/templates/AddressChip', () => () => null);

jest.mock('components/Button', () => ({
  Button: ({ onClick, title }: { onClick: () => void; title: string }) => (
    <button onClick={onClick} data-testid="claim-button">
      {title}
    </button>
  ),
  ButtonVariant: { Primary: 'Primary', Secondary: 'Secondary' }
}));

jest.mock('lib/i18n/numbers', () => ({
  formatBigInt: (value: bigint) => value.toString()
}));

jest.mock('lib/i18n/react', () => ({
  T: ({ id }: { id: string }) => <span>{id}</span>
}));

jest.mock('lib/miden/front', () => ({
  useAccount: () => ({ publicKey: 'test-account-123' })
}));

jest.mock('lib/miden/front/claimable-notes', () => ({
  useClaimableNotes: () => ({ data: [], mutate: jest.fn() })
}));

jest.mock('lib/settings/helpers', () => ({
  isDelegateProofEnabled: () => false
}));

jest.mock('lib/ui/useCopyToClipboard', () => ({
  __esModule: true,
  default: () => ({ fieldRef: { current: null }, copy: jest.fn() })
}));

jest.mock('lib/woozie', () => ({
  navigate: jest.fn(),
  HistoryAction: { Replace: 'Replace' }
}));

jest.mock('utils/string', () => ({
  truncateAddress: (addr: string) => addr?.slice(0, 8) || ''
}));

const mockInitiateConsumeTransaction = jest.fn();
const mockWaitForConsumeTx = jest.fn();
const mockGetUncompletedTransactions = jest.fn();

jest.mock('lib/miden/activity', () => ({
  initiateConsumeTransaction: (...args: any[]) => mockInitiateConsumeTransaction(...args),
  waitForConsumeTx: (...args: any[]) => mockWaitForConsumeTx(...args),
  getUncompletedTransactions: (...args: any[]) => mockGetUncompletedTransactions(...args)
}));

describe('ConsumableNoteComponent', () => {
  let testRoot: ReturnType<typeof createRoot> | null = null;
  let testContainer: HTMLDivElement | null = null;

  const mockAccount = { publicKey: 'test-account-123' };
  const mockMutateClaimableNotes = jest.fn();

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
    mockGetUncompletedTransactions.mockResolvedValue([]);
    mockInitiateConsumeTransaction.mockResolvedValue('tx-id-123');
    mockWaitForConsumeTx.mockResolvedValue('tx-hash-456');
  });

  afterEach(async () => {
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
    testRoot = createRoot(testContainer);

    const note = createMockNote({ isBeingClaimed: false });

    await act(async () => {
      testRoot!.render(
        <ConsumableNoteComponent
          note={note as any}
          account={mockAccount as any}
          mutateClaimableNotes={mockMutateClaimableNotes}
          isDelegatedProvingEnabled={false}
        />
      );
    });

    const button = testContainer.querySelector('[data-testid="claim-button"]');
    expect(button).toBeTruthy();
    expect(button?.textContent).toBe('claim');
  });

  it('shows spinner when note is being claimed', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    // Make the transaction lookup never resolve so spinner stays visible
    mockGetUncompletedTransactions.mockReturnValue(new Promise(() => {}));

    const note = createMockNote({ isBeingClaimed: true });

    await act(async () => {
      testRoot!.render(
        <ConsumableNoteComponent
          note={note as any}
          account={mockAccount as any}
          mutateClaimableNotes={mockMutateClaimableNotes}
          isDelegatedProvingEnabled={false}
        />
      );
    });

    const spinner = testContainer.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('initiates consume transaction when Claim button is clicked', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const note = createMockNote({ isBeingClaimed: false });

    await act(async () => {
      testRoot!.render(
        <ConsumableNoteComponent
          note={note as any}
          account={mockAccount as any}
          mutateClaimableNotes={mockMutateClaimableNotes}
          isDelegatedProvingEnabled={false}
        />
      );
    });

    const button = testContainer.querySelector('[data-testid="claim-button"]') as HTMLButtonElement;

    await act(async () => {
      button.click();
    });

    expect(mockInitiateConsumeTransaction).toHaveBeenCalledWith('test-account-123', note, false);
    expect(mockWaitForConsumeTx).toHaveBeenCalledWith('tx-id-123', expect.any(AbortSignal));
  });

  it('shows error and Retry button when claim fails', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    mockWaitForConsumeTx.mockRejectedValue(new Error('Transaction failed'));

    const note = createMockNote({ isBeingClaimed: false });

    await act(async () => {
      testRoot!.render(
        <ConsumableNoteComponent
          note={note as any}
          account={mockAccount as any}
          mutateClaimableNotes={mockMutateClaimableNotes}
          isDelegatedProvingEnabled={false}
        />
      );
    });

    const button = testContainer.querySelector('[data-testid="claim-button"]') as HTMLButtonElement;

    await act(async () => {
      button.click();
    });

    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    const retryButton = testContainer.querySelector('[data-testid="claim-button"]');
    expect(retryButton?.textContent).toBe('retry');
    expect(testContainer.textContent).toContain('Error Claiming');
  });

  it('resumes waiting for in-progress transaction on mount', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    mockGetUncompletedTransactions.mockResolvedValue([{ id: 'existing-tx-id', type: 'consume', noteId: 'note-123' }]);

    const note = createMockNote({ isBeingClaimed: true });

    await act(async () => {
      testRoot!.render(
        <ConsumableNoteComponent
          note={note as any}
          account={mockAccount as any}
          mutateClaimableNotes={mockMutateClaimableNotes}
          isDelegatedProvingEnabled={false}
        />
      );
    });

    // Wait for the resume effect to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(mockGetUncompletedTransactions).toHaveBeenCalledWith('test-account-123');
    expect(mockWaitForConsumeTx).toHaveBeenCalledWith('existing-tx-id', expect.any(AbortSignal));
  });

  it('clears loading state if no in-progress transaction found on mount', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    // Use a deferred promise so we can control when it resolves
    let resolveGetTransactions: (value: any[]) => void;
    mockGetUncompletedTransactions.mockReturnValue(
      new Promise(resolve => {
        resolveGetTransactions = resolve;
      })
    );

    const note = createMockNote({ isBeingClaimed: true });

    await act(async () => {
      testRoot!.render(
        <ConsumableNoteComponent
          note={note as any}
          account={mockAccount as any}
          mutateClaimableNotes={mockMutateClaimableNotes}
          isDelegatedProvingEnabled={false}
        />
      );
    });

    // Initially shows spinner (before the async lookup completes)
    expect(testContainer.querySelector('.animate-spin')).toBeTruthy();

    // Now resolve with no transactions found
    await act(async () => {
      resolveGetTransactions!([]);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should now show button since no transaction was found
    const button = testContainer.querySelector('[data-testid="claim-button"]');
    expect(button).toBeTruthy();
  });

  it('shows error when resumed transaction fails', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    mockGetUncompletedTransactions.mockResolvedValue([{ id: 'existing-tx-id', type: 'consume', noteId: 'note-123' }]);
    mockWaitForConsumeTx.mockRejectedValue(new Error('Transaction failed'));

    const note = createMockNote({ isBeingClaimed: true });

    await act(async () => {
      testRoot!.render(
        <ConsumableNoteComponent
          note={note as any}
          account={mockAccount as any}
          mutateClaimableNotes={mockMutateClaimableNotes}
          isDelegatedProvingEnabled={false}
        />
      );
    });

    // Wait for the resume effect and error handling
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(testContainer.textContent).toContain('Error Claiming');
    const retryButton = testContainer.querySelector('[data-testid="claim-button"]');
    expect(retryButton?.textContent).toBe('retry');
  });

  it('aborts waiting on unmount', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    let abortSignal: AbortSignal | null = null;
    mockWaitForConsumeTx.mockImplementation((_id: string, signal: AbortSignal) => {
      abortSignal = signal;
      return new Promise(() => {}); // Never resolves
    });

    const note = createMockNote({ isBeingClaimed: false });

    await act(async () => {
      testRoot!.render(
        <ConsumableNoteComponent
          note={note as any}
          account={mockAccount as any}
          mutateClaimableNotes={mockMutateClaimableNotes}
          isDelegatedProvingEnabled={false}
        />
      );
    });

    const button = testContainer.querySelector('[data-testid="claim-button"]') as HTMLButtonElement;

    await act(async () => {
      button.click();
    });

    expect(abortSignal).not.toBeNull();
    expect(abortSignal!.aborted).toBe(false);

    // Unmount
    await act(async () => {
      testRoot!.unmount();
      testRoot = null;
    });

    expect(abortSignal!.aborted).toBe(true);
  });
});
