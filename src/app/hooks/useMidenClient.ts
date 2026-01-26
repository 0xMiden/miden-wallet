import { useEffect, useState } from 'react';

import { MIDEN_NETWORK_NAME } from 'lib/miden-chain/constants';
import { getMidenClient } from 'lib/miden/sdk/miden-client';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';

export const useMidenClient = (network: MIDEN_NETWORK_NAME) => {
  const [midenClient, setMidenClient] = useState<MidenClientInterface>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeClient = async () => {
      try {
        const client = await getMidenClient({ network });
        setMidenClient(client);
      } catch (error) {
        console.error('Failed to initialize Miden client:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeClient();
  }, []);

  return { midenClient, midenClientLoading: isLoading };
};
