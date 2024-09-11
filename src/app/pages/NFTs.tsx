import React, { FC, useRef, useState } from 'react';

import { useAppEnv } from 'app/env';
import PageLayout from 'app/layouts/PageLayout';
import Footer from 'app/layouts/PageLayout/Footer';
import NFTContainer from 'app/templates/NFTs/NFTContainer';
import { useAccount } from 'lib/miden/front';

const NFTs: FC = () => {
  const account = useAccount();
  const address = account.publicKey;
  const [nftNumber, setNFTNumber] = useState(0);
  const { fullPage } = useAppEnv();
  // TODO: set max width for 600px for the app and min-width to 360px
  const height = fullPage ? { height: '607px' } : { height: '457px' };
  const scrollParentRef = useRef<HTMLDivElement>(null);

  const handleSetNFTNumber = (nftNumber: number) => {
    setNFTNumber(nftNumber);
  };

  return (
    <PageLayout
      pageTitle={
        <>
          <span>NFTs</span>
          <span className="bg-gray-700 rounded-lg mx-2 px-2">{nftNumber}</span>
        </>
      }
    >
      <div className="flex-grow overflow-y-scroll" style={height}>
        <NFTContainer address={address} scrollParentRef={scrollParentRef} setNFTNumber={handleSetNFTNumber} />
      </div>
      <div className="flex-none">
        <Footer />
      </div>
    </PageLayout>
  );
};

export default NFTs;
