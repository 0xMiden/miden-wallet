import React, { FC, useRef } from 'react';

import classNames from 'clsx';

import { useAppEnv } from 'app/env';
import PageLayout from 'app/layouts/PageLayout';
import Activity from 'app/templates/activity/Activity';
import { useAccount } from 'lib/miden/front';
import { T } from 'lib/i18n/react';
import Footer from 'app/layouts/PageLayout/Footer';

type AllActivityProps = {
  programId?: string | null;
};

const AllActivity: FC<AllActivityProps> = ({ programId }) => {
  const account = useAccount();
  const scrollParentRef = useRef<HTMLDivElement>(null);
  const { fullPage } = useAppEnv();
  const height = fullPage ? '491px' : '459px';

  return (
    <PageLayout
      pageTitle={
        <>
          <T id="activity" />
        </>
      }
      hasBackAction={false}
    >
      <div className="px-4">
        <div
          className={classNames('-mx-4 pb-4', 'shadow-top-light bg-white overflow-y-scroll z-30 relative')}
          style={{ height }}
          ref={scrollParentRef}
        >
          <Activity
            address={account.publicKey}
            programId={programId}
            fullHistory={true}
            scrollParentRef={scrollParentRef}
          />
        </div>
      </div>
      <div className="flex-none w-full absolute bottom-0">
        <Footer />
      </div>
    </PageLayout>
  );
};

export default AllActivity;
