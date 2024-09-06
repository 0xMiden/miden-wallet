import type { Meta, StoryObj } from '@storybook/react';

import { IconName } from 'app/icons/v2';
import { EmptyState } from 'components/EmptyState';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof EmptyState> = {
  title: 'Components/Empty State',
  component: EmptyState,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    controls: { exclude: ['className', 'name'] }
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    icon: {
      options: Object.values(IconName),
      control: {
        type: 'select'
      }
    },
    title: {
      control: {
        type: 'text'
      }
    },
    description: {
      control: {
        type: 'text'
      }
    }
  }
};

export default meta;
type Story = StoryObj<typeof EmptyState>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    icon: IconName.EmotionSad,
    title: 'No transactions yet',
    description: 'You have not made any transactions yet'
  }
};
