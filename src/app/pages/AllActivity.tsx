import React, { FC, useRef } from 'react';

import classNames from 'clsx';
import { useTranslation } from 'react-i18next';

import Activity from 'app/templates/activity/Activity';
import { useAccount } from 'lib/miden/front';
import { isMobile } from 'lib/platform';

type AllActivityProps = {
  programId?: string | null;
};

const AllActivity: FC<AllActivityProps> = ({ programId }) => {
  const { t } = useTranslation();
  const account = useAccount();
  const scrollParentRef = useRef<HTMLDivElement>(null);

  // Content only - container and footer provided by TabLayout
  return (
    <>
      {/* Header */}
      <div
        className="flex-none px-4 bg-white border-b border-grey-100"
        style={{ paddingTop: isMobile() ? '24px' : '14px', paddingBottom: '14px' }}
      >
        <h1 className="text-lg font-semibold text-black">{t('activity')}</h1>
      </div>

      {/* Content */}
      <div className={classNames('flex-1 min-h-0 overflow-y-auto', 'bg-white z-30 relative')} ref={scrollParentRef}>
        <div className="px-4">
          <Activity
            address={account.publicKey}
            programId={programId}
            fullHistory={true}
            scrollParentRef={scrollParentRef}
          />
        </div>
      </div>
    </>
  );
};

export default AllActivity;
