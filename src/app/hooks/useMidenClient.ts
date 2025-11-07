import { useEffect, useState } from 'react';

import { getMidenClient } from 'lib/miden/sdk/miden-client';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';

export const useMidenClient = () => {
  const [midenClient, setMidenClient] = useState<MidenClientInterface>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeClient = async () => {
      try {
        const client = await getMidenClient();
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
