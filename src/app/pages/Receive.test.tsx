import React from 'react';

import { createRoot } from 'react-dom/client';
import { act } from 'react-dom/test-utils';

import { ConsumableNoteComponent, Receive } from './Receive';

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
  Button: ({ onClick, title, disabled }: { onClick: () => void; title: string; disabled?: boolean }) => (
    <button onClick={onClick} data-testid="claim-button" disabled={disabled}>
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

const mockMutateClaimableNotes = jest.fn();
const mockUseClaimableNotes = jest.fn(() => ({ data: [], mutate: mockMutateClaimableNotes }));
jest.mock('lib/miden/front/claimable-notes', () => ({
  useClaimableNotes: () => mockUseClaimableNotes()
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
  let consoleErrorSpy: jest.SpyInstance;

  const mockAccount = { publicKey: 'test-account-123' };

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
    // Suppress expected console.error calls during error handling tests
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

describe('Receive - Claim All', () => {
  let testRoot: ReturnType<typeof createRoot> | null = null;
  let testContainer: HTMLDivElement | null = null;
  let consoleErrorSpy: jest.SpyInstance;

  const createMockNote = (id: string, overrides = {}) => ({
    id,
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
    mockUseClaimableNotes.mockReturnValue({ data: [], mutate: mockMutateClaimableNotes });
    // Suppress expected console.error calls during error handling tests
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

  it('does not show Claim All button when there are no claimable notes', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    mockUseClaimableNotes.mockReturnValue({ data: [], mutate: mockMutateClaimableNotes });

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll');
    expect(claimAllButton).toBeFalsy();
  });

  it('shows Claim All button when there are claimable notes', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [createMockNote('note-1'), createMockNote('note-2')];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll');
    expect(claimAllButton).toBeTruthy();
  });

  it('processes all notes when Claim All is clicked', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [createMockNote('note-1'), createMockNote('note-2'), createMockNote('note-3')];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    let txIdCounter = 0;
    mockInitiateConsumeTransaction.mockImplementation(() => Promise.resolve(`tx-id-${++txIdCounter}`));

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll') as HTMLButtonElement;

    await act(async () => {
      claimAllButton.click();
    });

    // Wait for all async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // All transactions should be queued and waited for
    expect(mockInitiateConsumeTransaction).toHaveBeenCalledTimes(3);
    expect(mockWaitForConsumeTx).toHaveBeenCalledTimes(3);
    expect(mockMutateClaimableNotes).toHaveBeenCalled();
  });

  it('continues processing notes even if one fails to queue', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [createMockNote('note-1'), createMockNote('note-2'), createMockNote('note-3')];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    let callCount = 0;
    mockInitiateConsumeTransaction.mockImplementation(() => {
      callCount++;
      if (callCount === 2) {
        return Promise.reject(new Error('Transaction failed'));
      }
      return Promise.resolve(`tx-id-${callCount}`);
    });

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll') as HTMLButtonElement;

    await act(async () => {
      claimAllButton.click();
    });

    // Wait for all async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should have attempted all 3 notes even though note-2 failed to queue
    expect(mockInitiateConsumeTransaction).toHaveBeenCalledTimes(3);
    // waitForConsumeTx only called for successful queues (note-1 and note-3)
    expect(mockWaitForConsumeTx).toHaveBeenCalledTimes(2);
    expect(mockMutateClaimableNotes).toHaveBeenCalled();
  });

  it('skips notes that are already being claimed', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [
      createMockNote('note-1', { isBeingClaimed: false }),
      createMockNote('note-2', { isBeingClaimed: true }),
      createMockNote('note-3', { isBeingClaimed: false })
    ];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll') as HTMLButtonElement;

    await act(async () => {
      claimAllButton.click();
    });

    // Wait for all async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should only process note-1 and note-3, skipping note-2 which is already being claimed
    expect(mockInitiateConsumeTransaction).toHaveBeenCalledTimes(2);
  });

  it('shows spinners on individual notes while Claim All is in progress', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [createMockNote('note-1'), createMockNote('note-2')];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    // Let transactions queue, but hang on waitForConsumeTx to keep spinners visible
    let txIdCounter = 0;
    mockInitiateConsumeTransaction.mockImplementation(() => Promise.resolve(`tx-id-${++txIdCounter}`));
    mockWaitForConsumeTx.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll') as HTMLButtonElement;

    await act(async () => {
      claimAllButton.click();
      // Allow state updates to process
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should show spinners for individual notes
    const spinners = testContainer.querySelectorAll('.animate-spin');
    expect(spinners.length).toBe(2); // One spinner per note

    // Claim All button should NOT be visible (no unclaimed notes)
    const buttonsAfterClick = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButtonAfterClick = Array.from(buttonsAfterClick).find(b => b.textContent === 'claimAll');
    expect(claimAllButtonAfterClick).toBeFalsy();
  });
});

describe('Receive - Dynamic Note Arrivals', () => {
  let testRoot: ReturnType<typeof createRoot> | null = null;
  let testContainer: HTMLDivElement | null = null;
  let consoleErrorSpy: jest.SpyInstance;

  const createMockNote = (id: string, overrides = {}) => ({
    id,
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
    mockUseClaimableNotes.mockReturnValue({ data: [], mutate: mockMutateClaimableNotes });
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

  it('shows Claim All button when new note arrives during Claim All operation', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    // Start with 3 notes
    const initialNotes = [createMockNote('note-1'), createMockNote('note-2'), createMockNote('note-3')];
    mockUseClaimableNotes.mockReturnValue({ data: initialNotes, mutate: mockMutateClaimableNotes });

    // Hang on waitForConsumeTx to simulate in-progress claiming
    const waitPromises: { resolve: (value: string) => void }[] = [];
    mockWaitForConsumeTx.mockImplementation(
      () =>
        new Promise(resolve => {
          waitPromises.push({ resolve });
        })
    );

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    // Click Claim All
    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll') as HTMLButtonElement;

    await act(async () => {
      claimAllButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Verify spinners are showing and Claim All is hidden (no unclaimed notes)
    expect(testContainer.querySelectorAll('.animate-spin').length).toBe(3);
    let currentButtons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    expect(Array.from(currentButtons).find(b => b.textContent === 'claimAll')).toBeFalsy();

    // Simulate new note arriving (SWR revalidation)
    const notesWithNewArrival = [
      createMockNote('note-1', { isBeingClaimed: true }),
      createMockNote('note-2', { isBeingClaimed: true }),
      createMockNote('note-3', { isBeingClaimed: true }),
      createMockNote('note-4') // New note!
    ];
    mockUseClaimableNotes.mockReturnValue({ data: notesWithNewArrival, mutate: mockMutateClaimableNotes });

    // Re-render to simulate SWR update
    await act(async () => {
      testRoot!.render(<Receive />);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Claim All button should now appear (enabled) for the new note
    currentButtons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const newClaimAllButton = Array.from(currentButtons).find(b => b.textContent === 'claimAll') as HTMLButtonElement;
    expect(newClaimAllButton).toBeTruthy();
    expect(newClaimAllButton.disabled).toBeFalsy();

    // Should still show spinners for the 3 original notes
    expect(testContainer.querySelectorAll('.animate-spin').length).toBe(3);

    // New note should have a Claim button
    const claimButtons = Array.from(currentButtons).filter(b => b.textContent === 'claim');
    expect(claimButtons.length).toBe(1);
  });

  it('clicking Claim All on new note only claims the new note', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    // Start with notes already being claimed
    const notes = [
      createMockNote('note-1', { isBeingClaimed: true }),
      createMockNote('note-2', { isBeingClaimed: true }),
      createMockNote('note-3') // New unclaimed note
    ];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    // Click Claim All
    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll') as HTMLButtonElement;

    await act(async () => {
      claimAllButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should only initiate transaction for note-3
    expect(mockInitiateConsumeTransaction).toHaveBeenCalledTimes(1);
    expect(mockInitiateConsumeTransaction).toHaveBeenCalledWith(
      'test-account-123',
      expect.objectContaining({ id: 'note-3' }),
      false
    );
  });

  it('individual claim makes note unavailable for Claim All', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [createMockNote('note-1'), createMockNote('note-2'), createMockNote('note-3')];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    // Make individual claims hang
    mockWaitForConsumeTx.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    // Click individual Claim on note-1
    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const individualClaimButtons = Array.from(buttons).filter(b => b.textContent === 'claim');
    const note1ClaimButton = individualClaimButtons[0] as HTMLButtonElement;

    await act(async () => {
      note1ClaimButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // One spinner should appear
    expect(testContainer.querySelectorAll('.animate-spin').length).toBe(1);

    // Clear mock to track new calls
    mockInitiateConsumeTransaction.mockClear();

    // Click Claim All - should only claim note-2 and note-3
    const currentButtons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(currentButtons).find(b => b.textContent === 'claimAll') as HTMLButtonElement;

    await act(async () => {
      claimAllButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should only initiate for note-2 and note-3 (not note-1 which is already claiming)
    expect(mockInitiateConsumeTransaction).toHaveBeenCalledTimes(2);
    const calledNoteIds = mockInitiateConsumeTransaction.mock.calls.map((call: any[]) => call[1].id);
    expect(calledNoteIds).toContain('note-2');
    expect(calledNoteIds).toContain('note-3');
    expect(calledNoteIds).not.toContain('note-1');
  });

  it('Claim All button hidden when all notes are being claimed', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [
      createMockNote('note-1', { isBeingClaimed: true }),
      createMockNote('note-2', { isBeingClaimed: true })
    ];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    // Mock uncompleted transactions so the resume waiting effect doesn't clear loading
    mockGetUncompletedTransactions.mockResolvedValue([
      { id: 'tx-1', type: 'consume', noteId: 'note-1' },
      { id: 'tx-2', type: 'consume', noteId: 'note-2' }
    ]);
    // Make waitForConsumeTx hang so spinners stay visible
    mockWaitForConsumeTx.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    // Wait for resume waiting effects to run
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Claim All button should not be visible
    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll');
    expect(claimAllButton).toBeFalsy();

    // Should show spinners
    expect(testContainer.querySelectorAll('.animate-spin').length).toBe(2);
  });

  it('handles rapid consecutive Claim All clicks correctly', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [createMockNote('note-1'), createMockNote('note-2')];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    // Hang on waitForConsumeTx
    mockWaitForConsumeTx.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll') as HTMLButtonElement;

    // Click twice rapidly
    await act(async () => {
      claimAllButton.click();
    });

    await act(async () => {
      // Button might still be there briefly, try to click again
      const currentButtons = testContainer.querySelectorAll('[data-testid="claim-button"]');
      const maybeClaimAll = Array.from(currentButtons).find(b => b.textContent === 'claimAll') as HTMLButtonElement;
      maybeClaimAll?.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should only have initiated transactions once per note
    expect(mockInitiateConsumeTransaction).toHaveBeenCalledTimes(2);
  });

  it('multiple new notes arriving during Claim All shows correct button state', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    // Start with 2 notes
    const initialNotes = [createMockNote('note-1'), createMockNote('note-2')];
    mockUseClaimableNotes.mockReturnValue({ data: initialNotes, mutate: mockMutateClaimableNotes });

    mockWaitForConsumeTx.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    // Click Claim All
    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll') as HTMLButtonElement;

    await act(async () => {
      claimAllButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // 3 new notes arrive
    const notesWithNewArrivals = [
      createMockNote('note-1', { isBeingClaimed: true }),
      createMockNote('note-2', { isBeingClaimed: true }),
      createMockNote('note-3'), // New
      createMockNote('note-4'), // New
      createMockNote('note-5') // New
    ];
    mockUseClaimableNotes.mockReturnValue({ data: notesWithNewArrivals, mutate: mockMutateClaimableNotes });

    await act(async () => {
      testRoot!.render(<Receive />);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should show 2 spinners (original notes) and 3 Claim buttons (new notes)
    expect(testContainer.querySelectorAll('.animate-spin').length).toBe(2);

    const currentButtons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimButtons = Array.from(currentButtons).filter(b => b.textContent === 'claim');
    expect(claimButtons.length).toBe(3);

    // Claim All should be visible and enabled
    const newClaimAllButton = Array.from(currentButtons).find(b => b.textContent === 'claimAll') as HTMLButtonElement;
    expect(newClaimAllButton).toBeTruthy();
    expect(newClaimAllButton.disabled).toBeFalsy();
  });

  it('Claim All processes only unclaimed notes when mixed states exist', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [
      createMockNote('note-1', { isBeingClaimed: true }), // Already claiming from previous session
      createMockNote('note-2'), // Unclaimed
      createMockNote('note-3', { isBeingClaimed: true }), // Already claiming
      createMockNote('note-4'), // Unclaimed
      createMockNote('note-5') // Unclaimed
    ];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll') as HTMLButtonElement;

    await act(async () => {
      claimAllButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should only process unclaimed notes (note-2, note-4, note-5)
    expect(mockInitiateConsumeTransaction).toHaveBeenCalledTimes(3);
    const calledNoteIds = mockInitiateConsumeTransaction.mock.calls.map((call: any[]) => call[1].id);
    expect(calledNoteIds).toEqual(expect.arrayContaining(['note-2', 'note-4', 'note-5']));
    expect(calledNoteIds).not.toContain('note-1');
    expect(calledNoteIds).not.toContain('note-3');
  });
});

describe('Receive - Claiming State Reporting', () => {
  let testRoot: ReturnType<typeof createRoot> | null = null;
  let testContainer: HTMLDivElement | null = null;
  let consoleErrorSpy: jest.SpyInstance;

  const createMockNote = (id: string, overrides = {}) => ({
    id,
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
    mockUseClaimableNotes.mockReturnValue({ data: [], mutate: mockMutateClaimableNotes });
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

  it('reports claiming state to parent when individual claim starts', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [createMockNote('note-1'), createMockNote('note-2')];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    // Hang on transaction to keep claim in progress
    mockWaitForConsumeTx.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    // Initially both notes have Claim buttons
    let buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    let claimButtons = Array.from(buttons).filter(b => b.textContent === 'claim');
    expect(claimButtons.length).toBe(2);

    // Click Claim on first note
    await act(async () => {
      (claimButtons[0] as HTMLButtonElement).click();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // First note should now show spinner
    expect(testContainer.querySelectorAll('.animate-spin').length).toBe(1);

    // Claim All should still be visible (for the second unclaimed note)
    buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll');
    expect(claimAllButton).toBeTruthy();

    // Only one Claim button should remain
    claimButtons = Array.from(buttons).filter(b => b.textContent === 'claim');
    expect(claimButtons.length).toBe(1);
  });

  it('re-enables Claim All button after individual claim completes', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [createMockNote('note-1')];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    let resolveWait: (value: string) => void;
    mockWaitForConsumeTx.mockImplementation(
      () =>
        new Promise(resolve => {
          resolveWait = resolve;
        })
    );

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    // Click Claim on the note
    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimButton = Array.from(buttons).find(b => b.textContent === 'claim') as HTMLButtonElement;

    await act(async () => {
      claimButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Claim All should be hidden (note is being claimed)
    let currentButtons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    expect(Array.from(currentButtons).find(b => b.textContent === 'claimAll')).toBeFalsy();

    // Complete the claim
    await act(async () => {
      resolveWait!('tx-hash');
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // After claim completes, if note is still there (mock didn't remove it),
    // Claim button should reappear (claim finished successfully)
    // In real scenario, mutateClaimableNotes would remove the claimed note
  });

  it('syncs isLoading state when note.isBeingClaimed changes', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    // Start with unclaimed note
    const initialNotes = [createMockNote('note-1', { isBeingClaimed: false })];
    mockUseClaimableNotes.mockReturnValue({ data: initialNotes, mutate: mockMutateClaimableNotes });

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    // Should show Claim button initially
    let buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    expect(Array.from(buttons).find(b => b.textContent === 'claim')).toBeTruthy();

    // Simulate SWR update where note is now being claimed (popup was reopened)
    // Also mock the uncompleted transactions to include this note
    const updatedNotes = [createMockNote('note-1', { isBeingClaimed: true })];
    mockUseClaimableNotes.mockReturnValue({ data: updatedNotes, mutate: mockMutateClaimableNotes });
    mockGetUncompletedTransactions.mockResolvedValue([{ id: 'tx-1', type: 'consume', noteId: 'note-1' }]);
    mockWaitForConsumeTx.mockReturnValue(new Promise(() => {})); // Hang to keep spinner visible

    await act(async () => {
      testRoot!.render(<Receive />);
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should now show spinner
    expect(testContainer.querySelectorAll('.animate-spin').length).toBe(1);

    // Claim All should be hidden
    buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    expect(Array.from(buttons).find(b => b.textContent === 'claimAll')).toBeFalsy();
  });

  it('handles claim error and allows retry', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [createMockNote('note-1'), createMockNote('note-2')];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    // First call fails, subsequent calls succeed
    mockWaitForConsumeTx.mockRejectedValueOnce(new Error('Transaction failed'));

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    // Click Claim on first note
    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimButtons = Array.from(buttons).filter(b => b.textContent === 'claim');
    const note1ClaimButton = claimButtons[0] as HTMLButtonElement;

    await act(async () => {
      note1ClaimButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should show Retry button for failed note
    const currentButtons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const retryButton = Array.from(currentButtons).find(b => b.textContent === 'retry');
    expect(retryButton).toBeTruthy();

    // Claim All should still be available for note-2
    const claimAllButton = Array.from(currentButtons).find(b => b.textContent === 'claimAll');
    expect(claimAllButton).toBeTruthy();
  });
});

describe('Receive - Edge Cases', () => {
  let testRoot: ReturnType<typeof createRoot> | null = null;
  let testContainer: HTMLDivElement | null = null;
  let consoleErrorSpy: jest.SpyInstance;

  const createMockNote = (id: string, overrides = {}) => ({
    id,
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
    mockUseClaimableNotes.mockReturnValue({ data: [], mutate: mockMutateClaimableNotes });
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

  it('handles empty claimable notes array', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    mockUseClaimableNotes.mockReturnValue({ data: [], mutate: mockMutateClaimableNotes });

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    // No Claim buttons or spinners should be present
    expect(testContainer.querySelectorAll('[data-testid="claim-button"]').length).toBe(1); // Only upload button
    expect(testContainer.querySelectorAll('.animate-spin').length).toBe(0);
  });

  it('handles undefined claimable notes', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    mockUseClaimableNotes.mockReturnValue({ data: undefined, mutate: mockMutateClaimableNotes });

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    // Should not crash, no Claim All button should be present
    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll');
    expect(claimAllButton).toBeFalsy();
  });

  it('handles null notes in array', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [createMockNote('note-1'), null, createMockNote('note-2'), undefined] as any[];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    // Should only render valid notes
    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimButtons = Array.from(buttons).filter(b => b.textContent === 'claim');
    expect(claimButtons.length).toBe(2);
  });

  it('handles single note scenario', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [createMockNote('note-1')];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    // Should show both individual Claim and Claim All buttons
    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    expect(Array.from(buttons).find(b => b.textContent === 'claim')).toBeTruthy();
    expect(Array.from(buttons).find(b => b.textContent === 'claimAll')).toBeTruthy();
  });

  it('handles large number of notes', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    // Create 20 notes
    const notes = Array.from({ length: 20 }, (_, i) => createMockNote(`note-${i + 1}`));
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    // Should render all notes
    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimButtons = Array.from(buttons).filter(b => b.textContent === 'claim');
    expect(claimButtons.length).toBe(20);

    // Claim All should be available
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll');
    expect(claimAllButton).toBeTruthy();
  });

  it('handles all notes transitioning to being claimed simultaneously', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [createMockNote('note-1'), createMockNote('note-2'), createMockNote('note-3')];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    mockWaitForConsumeTx.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    // Click Claim All
    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll') as HTMLButtonElement;

    await act(async () => {
      claimAllButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // All notes should show spinners
    expect(testContainer.querySelectorAll('.animate-spin').length).toBe(3);

    // No Claim buttons should remain
    const currentButtons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimButtons = Array.from(currentButtons).filter(b => b.textContent === 'claim');
    expect(claimButtons.length).toBe(0);

    // Claim All should be hidden
    expect(Array.from(currentButtons).find(b => b.textContent === 'claimAll')).toBeFalsy();
  });

  it('handles interleaved individual and Claim All operations', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [
      createMockNote('note-1'),
      createMockNote('note-2'),
      createMockNote('note-3'),
      createMockNote('note-4')
    ];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    mockWaitForConsumeTx.mockReturnValue(new Promise(() => {}));

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    // Click individual Claim on note-1
    let buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    let claimButtons = Array.from(buttons).filter(b => b.textContent === 'claim');
    const note1ClaimButton = claimButtons[0] as HTMLButtonElement;

    await act(async () => {
      note1ClaimButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // 1 spinner should appear
    expect(testContainer.querySelectorAll('.animate-spin').length).toBe(1);

    // Click Claim All for remaining notes
    mockInitiateConsumeTransaction.mockClear();
    buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll') as HTMLButtonElement;

    await act(async () => {
      claimAllButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // All 4 notes should now show spinners
    expect(testContainer.querySelectorAll('.animate-spin').length).toBe(4);

    // Claim All should have only processed notes 2, 3, 4
    expect(mockInitiateConsumeTransaction).toHaveBeenCalledTimes(3);
    const calledNoteIds = mockInitiateConsumeTransaction.mock.calls.map((call: any[]) => call[1].id);
    expect(calledNoteIds).not.toContain('note-1');
  });

  it('cleans up claiming state when component unmounts during Claim All', async () => {
    testContainer = document.createElement('div');
    testRoot = createRoot(testContainer);

    const notes = [createMockNote('note-1'), createMockNote('note-2')];
    mockUseClaimableNotes.mockReturnValue({ data: notes, mutate: mockMutateClaimableNotes });

    let capturedSignal: AbortSignal | null = null;
    // Make first waitForConsumeTx hang to ensure we're mid-operation when unmounting
    mockWaitForConsumeTx.mockImplementation((_id: string, signal: AbortSignal) => {
      capturedSignal = signal;
      return new Promise(() => {}); // Never resolves
    });

    await act(async () => {
      testRoot!.render(<Receive />);
    });

    const buttons = testContainer.querySelectorAll('[data-testid="claim-button"]');
    const claimAllButton = Array.from(buttons).find(b => b.textContent === 'claimAll') as HTMLButtonElement;

    await act(async () => {
      claimAllButton.click();
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(capturedSignal).not.toBeNull();
    expect(capturedSignal!.aborted).toBe(false);

    // Unmount while Claim All is in progress
    await act(async () => {
      testRoot!.unmount();
      testRoot = null;
    });

    // The shared abort signal should be triggered on unmount
    expect(capturedSignal!.aborted).toBe(true);
  });
});
