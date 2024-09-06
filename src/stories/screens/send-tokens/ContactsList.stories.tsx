import React from 'react';

import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react';

import { ContactsListScreen, ContactsListScreenProps } from 'screens/send-tokens/ContactsList';
import { SendTokensAction, SendTokensActionId } from 'screens/send-tokens/types';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof ContactsListScreen> = {
  title: 'Screens/Send Tokens/Contacts List',
  component: ContactsListScreen,
  parameters: {
    layout: 'fullscreen',
    controls: { exclude: ['className', 'name', 'onAction'] }
  },
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {},
  decorators: Story => (
    <div className="w-[37.5rem] h-[40rem] flex mx-auto border rounded-md overflow-hidden my-8">
      <Story />
    </div>
  ),
  render: function Render(args) {
    const [, updateArgs] = useArgs<ContactsListScreenProps>();
    const onAction = (action: SendTokensAction) => {
      if (action.id === SendTokensActionId.SetFormValues) {
        Object.entries(action.payload).forEach(([key, value]) => {
          updateArgs({ [key]: value });
        });
      }
    };
    return <ContactsListScreen {...args} onAction={onAction} />;
  }
};

export default meta;
type Story = StoryObj<typeof ContactsListScreen>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    contacts: [
      {
        id: 'aleo1sdk0vgp9cs53cfdxvvl53xmzgl6f0dwq276hf4qgfcq5hrjtjuysq4zz5c',
        name: 'Account 2',
        address: 'aleo1sdk0vgp9cs53cfdxvvl53xmzgl6f0dwq276hf4qgfcq5hrjtjuysq4zz5c',
        isOwned: true
      },
      {
        id: 'aleo1djj09pnq27927gald6zx2jpdkkkp3hu9e7r7g6qghkq2nyrfkvqss4uvfg',
        name: 'Account 3',
        address: 'aleo1djj09pnq27927gald6zx2jpdkkkp3hu9e7r7g6qghkq2nyrfkvqss4uvfg',
        isOwned: true
      },
      {
        id: 'aleo1fjdfksl3j9fkp3hu9e7r7g6qghkq2nykp3hu9e7r7g6qghkq2nykp3hu9e',
        name: 'Account 3',
        address: 'aleo1fjdfksl3j9fkp3hu9e7r7g6qghkq2nykp3hu9e7r7g6qghkq2nykp3hu9e',
        isOwned: false
      }
    ]
  }
};
