import React, { FC } from 'react';

import { T } from '../../../../lib/i18n/react';
import { Button } from '../../../atoms/Button';
import styles from '../Onboarding.module.css';

interface Props {
  setStep: (step: number) => void;
}

const FourthStep: FC<Props> = ({ setStep }) => {
  return (
    <>
      <p className={styles['title']}>
        <T id={'profileRpcDetails'} />
      </p>
      <p className={styles['description']}>
        <T id={'profileRpcDescription'} />
      </p>
      <p className={styles['description']} style={{ marginBottom: 0 }}>
        <T id={'profileRpcHint1'} />
      </p>
      <p className={styles['description']} style={{ marginTop: 20, marginBottom: 0 }}>
        <T id={'profileRpcHint2'} />
      </p>
      <p className={styles['description']} style={{ marginTop: 20, marginBottom: 0 }}>
        <T id={'profileRpcHint3'} />
        <a
          href={'https://leo.app/leo-wallet/how-to-add-a-custom-rpc-to-the-leo-wallet'}
          target="_blank"
          rel="noreferrer"
          className={styles['link']}
        >
          <T id={'instructions'} />
        </a>
      </p>

      <Button
        className="w-full justify-center border-none"
        style={{
          padding: '10px 2rem',
          background: '#4198e0',
          color: '#ffffff',
          marginTop: '40px',
          borderRadius: 4
        }}
        onClick={() => setStep(4)}
      >
        <T id={'done'} />
      </Button>
    </>
  );
};

export default FourthStep;
