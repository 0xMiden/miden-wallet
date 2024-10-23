import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';
import { useEffect, useState } from 'react';

export const useMidenClient = () => {
  const [midenClient, setMidenClient] = useState<MidenClientInterface>();

  useEffect(() => {
    const initializeClient = async () => {
      console.log('Initializing Miden client...');
      const client = await MidenClientInterface.create();
      setMidenClient(client);
      console.log('Miden client is ready');
    };

    initializeClient();
  }, []);

  return midenClient;
};
