import { useState, useEffect } from 'react';

import { MidenTokens, TOKEN_MAPPING } from 'lib/miden-chain/constants';
import { getFaucetIdSetting } from 'lib/miden/assets';

function useMidenFaucetId() {
  const [midenFaucetId, setMidenFaucetId] = useState<string>(TOKEN_MAPPING[MidenTokens.Miden].faucetId);

  useEffect(() => {
    const fetchFaucetId = async () => {
      const faucetId = await getFaucetIdSetting();
      setMidenFaucetId(faucetId);
    };
    fetchFaucetId();
  }, []);

  return midenFaucetId;
}

export default useMidenFaucetId;
