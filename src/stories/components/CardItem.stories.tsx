import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { IconName } from 'app/icons/v2';
import { Avatar } from 'components/Avatar';
import { CardItem } from 'components/CardItem';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof CardItem> = {
  title: 'Components/Card Item',
  component: CardItem,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    controls: { exclude: ['className', 'name'] }
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    iconLeft: {
      options: [undefined, ...Object.values(IconName)],
      control: {
        type: 'select'
      }
    },
    iconRight: {
      options: [undefined, ...Object.values(IconName)],
      control: {
        type: 'select'
      }
    }
  },
  decorators: [
    Story => (
      <div className="bg-green-50 p-4 w-96">
        {/* 👇 Decorators in Storybook also accept a function. Replace <Story/> with Story() to enable it  */}
        <Story />
      </div>
    )
  ]
};

export default meta;
type Story = StoryObj<typeof CardItem>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    title: 'Aleo',
    subtitle: 'aleo1rw...0fk3',
    iconLeft: IconName.Wallet,
    iconRight: IconName.CheckboxCircleFill,
    titleRight: '20.00',
    subtitleRight: 'ALEO'
  }
};

export const AvatarIcon: Story = {
  args: {
    title: 'Aleo',
    subtitle: 'aleo1rw...0fk3',
    iconLeft: <Avatar image="/misc/avatars/leo-red.jpg" size="lg" />,
    iconRight: IconName.CheckboxCircleFill,
    titleRight: '20.00',
    subtitleRight: 'ALEO'
  }
};
