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

  // Prevent rendering until the client is initialized
  if (midenClient === undefined) {
    throw new Promise<void>(resolve => {
      MidenClientInterface.create().then(client => {
        setMidenClient(client);
        resolve();
      });
    });
  }

  return midenClient;
};
