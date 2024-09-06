import React from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { Icon, IconName, IconSize } from 'app/icons/v2';

const AllIconsStory = ({ size = 'sm', color = 'black' }: { size: IconSize; color: string }) => {
  return (
    <div className="grid grid-cols-10 gap-4 p-4">
      {Object.values(IconName).map(name => (
        <div className="flex flex-col items-center" key={`icon-${name}`}>
          <Icon name={name} fill={color} size={size} />
          <p className="text-xs text-center">{name}</p>
        </div>
      ))}
    </div>
  );
};

const meta: Meta<typeof AllIconsStory> = {
  title: 'Components/Icons',
  component: AllIconsStory,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen'
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    size: {
      options: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
      control: { type: 'select', defaultValue: 'sm' },
      defaultValue: 'sm'
    },
    color: { control: 'color', defaultValue: 'black' }
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {}
};

export default meta;
type Story = StoryObj<typeof AllIconsStory>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const AppIcons: Story = {
  args: {
    size: 'sm',
    color: 'black'
  }
};
