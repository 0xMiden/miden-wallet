import { useMidenClient } from 'app/hooks/useMidenClient';
import { MidenClientInterface } from 'lib/miden/sdk/miden-client-interface';
import React, { FC, useEffect, useState } from 'react';

export interface ExportFileCompleteProps {
  onGoBack: () => void;
  passwordValue: string;
}

const ExportFileComplete: React.FC<ExportFileCompleteProps> = ({}) => {
  const { midenClient, midenClientLoading } = useMidenClient();
  const [dump, setDump] = useState('');

  const getDbDump = async () => {
    console.log('dumping...');
    const _dump = await midenClient?.exportDb();
    setDump(_dump);
    console.log('dump complete');
  };

  useEffect(() => {
    if (midenClientLoading) return;

    getDbDump();
  }, [midenClientLoading]);
  return <div>the dump is: {dump}</div>;
};

export default ExportFileComplete;
