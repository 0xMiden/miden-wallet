import React, { FC } from 'react';

import { Icon, IconName } from 'app/icons/v2';
import PageLayout from 'app/layouts/PageLayout';
import { Button, ButtonVariant } from 'components/Button';
import { navigate } from 'lib/woozie';

type ImportNoteResultProps = {
  success: boolean;
};

const ImportNoteResult: FC<ImportNoteResultProps> = ({ success }) => {
  return (
    <PageLayout pageTitle="Transaction file" showBottomBorder={false} hasBackAction={false}>
      <div className="flex m-auto">
        <div className="flex-1 flex flex-col justify-center items-center md:w-[460px] md:mx-auto">
          <div className="w-40 aspect-square flex items-center justify-center mb-8">
            {success && <Icon name={IconName.Success} size="3xl" />}
            {!success && <Icon name={IconName.Failed} size="3xl" />}
          </div>
          <h1 className="flex flex-col font-semibold text-2xl lh-title text-center text-balance pb-4">
            {success && <>Available to claim</>}
            {!success && <>Verification Failed</>}
          </h1>
          <p className="text-sm text-center px-4">
            {success && <>The transaction has been successfully verified. You can now claim your tokens.</>}
            {!success && (
              <>The uploaded transaction file could not be verified. Ensure the file is valid and try again.</>
            )}
          </p>
        </div>
      </div>
      <div className="px-6 pb-6">
        <Button
          className="w-full"
          variant={ButtonVariant.Secondary}
          onClick={() => navigate('/receive')}
          title={success ? 'Done' : 'Close'}
          style={{ cursor: 'pointer' }}
        />
      </div>
    </PageLayout>
  );
};

export default ImportNoteResult;
