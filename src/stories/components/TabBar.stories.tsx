import React, { useState } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { IconName } from 'app/icons/v2';
import { TabBar, TabBarProps } from 'components/TabBar';

const TabBarStory = (props: TabBarProps) => {
  const [tabs, setTabs] = useState(props.tabs);
  const onTabChange = (index: number) => {
    setTabs(prevTabs =>
      prevTabs.map((tab, i) => ({
        ...tab,
        active: i === index
      }))
    );
  };
  return <TabBar tabs={tabs} onTabChange={onTabChange} />;
};

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof TabBar> = {
  title: 'Components/Tab Bar',
  component: TabBarStory,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    controls: { exclude: ['className'] }
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    tabs: {
      control: {
        type: 'object'
      }
    }
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {},
  decorators: [
    Story => {
      return (
        <div className="w-96">
          <Story />
        </div>
      );
    }
  ]
};

export default meta;
type Story = StoryObj<typeof TabBarStory>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    tabs: [
      { active: true, icon: IconName.Home, activeIcon: IconName.HomeFill },
      { icon: IconName.List },
      { icon: IconName.Image },
      { icon: IconName.Settings }
    ]
  }
};
