import { isDelegateProofEnabled } from 'app/templates/DelegateSettings';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';
import { useEffect, useState } from 'react';

export const useMidenClient = () => {
  const [midenClient, setMidenClient] = useState<MidenClientInterface>();
  const [isLoading, setIsLoading] = useState(true);
  const isDelegatedProvingEnabled = isDelegateProofEnabled();

  useEffect(() => {
    const initializeClient = async () => {
      const client = await MidenClientInterface.create(isDelegatedProvingEnabled);
      setMidenClient(client);
      setIsLoading(false);
    };

    initializeClient();
  }, [isDelegatedProvingEnabled]);

  return { midenClient, midenClientLoading: isLoading };
};
