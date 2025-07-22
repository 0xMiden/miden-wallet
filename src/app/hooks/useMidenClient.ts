import { useEffect, useState } from 'react';

import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';

export const useMidenClient = () => {
  const [midenClient, setMidenClient] = useState<MidenClientInterface>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeClient = async () => {
      const client = await MidenClientInterface.create();
      setMidenClient(client);
      setIsLoading(false);
    };

    initializeClient();
  }, []);

  return { midenClient, midenClientLoading: isLoading };
};
