import { useMemo } from 'react';

import { useStorage } from 'lib/miden/front';

export type BlockExplorerId = 'aleo';

type BaseUrls = { account?: string; transaction: string };

export type BlockExplorer = {
  id: BlockExplorerId;
  name: string;
};

export const BLOCK_EXPLORERS: BlockExplorer[] = [
  {
    id: 'aleo',
    name: 'Aleo Network'
  }
];

const BLOCK_EXPLORER_STORAGE_KEY = 'block_explorer';

export function useBlockExplorer() {
  const [explorerId, setExplorerId] = useStorage<BlockExplorerId>(BLOCK_EXPLORER_STORAGE_KEY, 'aleo');
  const explorer = useMemo(() => BLOCK_EXPLORERS.find(({ id }) => id === explorerId)!, [explorerId]);

  return {
    explorer,
    setExplorerId
  };
}

export function useExplorerBaseUrls(): Partial<BaseUrls> {
  const { explorer } = useBlockExplorer();

  return {};
}
