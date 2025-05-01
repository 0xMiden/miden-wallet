import React, { ComponentProps, FC, useEffect, useRef } from 'react';

import classNames from 'clsx';

import { Button } from 'app/atoms/Button';
import ColorIdenticon from 'app/atoms/ColorIdenticon';
import HashShortView from 'app/atoms/HashShortView';
import Name from 'app/atoms/Name';
import { TestIDProps } from 'lib/analytics';
import { T } from 'lib/i18n/react';

import { SendFormSelectors } from '../SendForm.selectors';

type ContactsDropdownItemProps = ComponentProps<typeof Button> &
  TestIDProps & {
    active?: boolean;
  };

const ContactsDropdownItem: FC<ContactsDropdownItemProps> = ({ active, testID, testIDProperties, ...rest }) => {
  const ref = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (active) {
      ref.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  }, [active]);

  return (
    <Button
      ref={ref}
      type="button"
      testID={testID ?? SendFormSelectors.ContactItemButton}
      testIDProperties={testIDProperties}
      className={classNames(
        'w-full flex items-center',
        'p-2 text-left',
        active ? 'bg-gray-100' : 'hover:bg-gray-100 focus:bg-gray-100'
      )}
      tabIndex={-1}
      {...rest}
    >
      <ColorIdenticon publicKey={'contact.address'} className="flex-shrink-0" />

      <div className="ml-3 flex flex-1 w-full">
        <div className="flex flex-col justify-between flex-1">
          <Name className="mb-px text-sm font-medium leading-tight text-left text-black">{'contact.name'}</Name>

          <span className={classNames('text-xs leading-tight text-black')}>
            <HashShortView hash={'contact.address'} />
          </span>
        </div>

        {'contact.accountInWallet' ? (
          <div className="flex items-center">
            <span
              className={classNames(
                'mx-1',
                'rounded-md',
                'border-2',
                'px-2 py-1',
                'leading-tight',
                'border-gray-800 bg-gray-800 text-black',
                'font-medium'
              )}
              style={{ fontSize: '0.6rem' }}
            >
              <T id="ownAccount" />
            </span>
          </div>
        ) : null}
      </div>
    </Button>
  );
};

export default ContactsDropdownItem;
