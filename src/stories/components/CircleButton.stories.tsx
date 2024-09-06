import type { Meta, StoryObj } from '@storybook/react';

import { IconName } from 'app/icons/v2';
import { CircleButton } from 'components/CircleButton';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof CircleButton> = {
  title: 'Components/Circle Button',
  component: CircleButton,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    controls: { exclude: ['className'] }
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
    disabled: {
      control: 'boolean',
      defaultValue: false
    }
  },
  // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
  args: {}
};

export default meta;
type Story = StoryObj<typeof CircleButton>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    icon: IconName.AddCircle,
    title: 'Label',
    disabled: false
  }
};
