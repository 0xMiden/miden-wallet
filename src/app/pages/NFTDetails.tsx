import React, { FC } from 'react';

import classNames from 'clsx';

import { useAppEnv } from 'app/env';
import PageLayout from 'app/layouts/PageLayout';
import AdvancedSettings from 'app/pages/AdvancedSettings';
import NFTDetailsView from 'app/templates/NFTs/NFTDetailsView';
import { t } from 'lib/i18n/react';
import { Link, useLocation } from 'lib/woozie';

const NFTDetails: FC<{}> = () => {
  const location = useLocation();
  const nft = location.state;
  const { fullPage } = useAppEnv();
  const height = fullPage ? { height: '750px', maxWidth: '600px', minWidth: '600px' } : { maxHeight: '600px' };

  const advancedSettings = (
    <Link to={{ pathname: '/convert-nft', state: nft }} className={classNames('block', 'p-1')}>
      <span>{`${t('convert')} ${t('nft')}`}</span>
    </Link>
  );

  return (
    <PageLayout
      pageTitle={
        <>
          <span>{`NFT ${t('details').toUpperCase()}`}</span>
        </>
      }
      advancedSettingsSection={<AdvancedSettings>{advancedSettings}</AdvancedSettings>}
    >
      <div className="overflow-y-scroll" style={height}>
        <NFTDetailsView nft={nft} />
      </div>
    </PageLayout>
  );
};

export default NFTDetails;
