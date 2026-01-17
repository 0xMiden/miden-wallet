import React, { FC, useRef } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import PageLayout from 'app/layouts/PageLayout';
import Footer from 'app/layouts/PageLayout/Footer';
import Activity from 'app/templates/activity/Activity';
import { useAccount } from 'lib/miden/front';

type AllActivityProps = {
  programId?: string | null;
};

const AllActivity: FC<AllActivityProps> = ({ programId }) => {
  const { t } = useTranslation();
  const account = useAccount();
  const scrollParentRef = useRef<HTMLDivElement>(null);

  return (
    <PageLayout pageTitle={<>{t('activity')}</>} hasBackAction={false}>
      <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
        <div
          className={classNames('flex-1 min-h-0 overflow-y-auto', 'bg-white z-30 relative')}
          ref={scrollParentRef}
        >
          <div className="px-4">
            <Activity
              address={account.publicKey}
              programId={programId}
              fullHistory={true}
              scrollParentRef={scrollParentRef}
            />
          </div>
        </div>
        <div className="flex-none">
          <Footer />
        </div>
      </div>
    </PageLayout>
  );
};

export default AllActivity;
