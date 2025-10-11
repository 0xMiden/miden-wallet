import React, { HTMLAttributes, useCallback, useMemo } from 'react';

import classNames from 'clsx';

import { IconName } from 'app/icons/v2';
import { Avatar } from 'components/Avatar';
import { CardItem } from 'components/CardItem';
import { EmptyState } from 'components/EmptyState';
import { NavigationHeader } from 'components/NavigationHeader';
import { shortenAddress } from 'utils/string';

import { SendTokensAction, SendTokensActionId, UIContact } from './types';

export interface ContactsListScreenProps extends HTMLAttributes<HTMLDivElement> {
  recipientAddress?: string;
  onAction?: (action: SendTokensAction) => void;
  contacts?: UIContact[];
}

export const ContactsListScreen: React.FC<ContactsListScreenProps> = ({
  className,
  recipientAddress,
  contacts,
  onAction,
  ...props
}) => {
  const onCloseClick = useCallback(
    () =>
      onAction?.({
        id: SendTokensActionId.GoBack
      }),
    [onAction]
  );

  const onSelectContact = useCallback(
    (contact: UIContact) => {
      onAction?.({
        id: SendTokensActionId.SetFormValues,
        payload: {
          recipientAddress: contact.address,
          recipientAddressInput: contact.address
        }
      });
      setTimeout(() => onCloseClick(), 300);
    },
    [onAction, onCloseClick]
  );

  const contactsSections = useMemo(
    () => [
      { id: 'owned', title: 'Your Accounts', contacts: contacts?.filter(contact => contact.isOwned) },
      { id: 'external', title: 'External Contacts', contacts: contacts?.filter(contact => !contact.isOwned) }
    ],
    [contacts]
  ).filter(section => section.contacts?.length);

  return (
    <div {...props} className={classNames('flex-1 flex flex-col', className)}>
      <NavigationHeader mode="close" title="Contacts" onClose={onCloseClick} />
      <div className="flex flex-col flex-1 p-4 gap-y-2 md:w-[460px] md:mx-auto">
        {contacts?.length === 0 ? (
          <EmptyState
            className="flex-1"
            icon={IconName.Users}
            title={'No contacts yet'}
            description={'You have not added any contacts yet.'}
          />
        ) : (
          contactsSections.map(section => (
            <div key={section.id} className="flex flex-col gap-y-2">
              <h3 className="text-xs text-grey-600">{section.title}</h3>
              {section.contacts?.map(el => (
                <CardItem
                  key={el.id}
                  title={el.name}
                  subtitle={shortenAddress(el.address)}
                  iconLeft={<Avatar image="/misc/avatars/miden-orange.jpg" size="lg" />}
                  iconRight={el.address === recipientAddress ? IconName.CheckboxCircleFill : undefined}
                  onClick={() => onSelectContact(el)}
                />
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
