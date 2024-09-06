import type { Meta, StoryObj } from '@storybook/react';

import { Avatar } from 'components/Avatar';

const images = [
  '/misc/avatars/leo-blue.jpg',
  '/misc/avatars/leo-green.jpg',
  '/misc/avatars/leo-orange.jpg',
  '/misc/avatars/leo-pink.jpg',
  '/misc/avatars/leo-pale-blue.jpg',
  '/misc/avatars/leo-pale-red.jpg',
  '/misc/avatars/leo-grey.jpg',
  '/misc/avatars/leo-red.jpg',
  '/misc/tokens/aleo.jpg'
];

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: {
    // Optional parameter to center the component in the Canvas. More info: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    controls: { exclude: ['className', 'name'] }
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  // More on argTypes: https://storybook.js.org/docs/api/argtypes
  argTypes: {
    size: {
      options: ['xs', 'sm', 'md', 'lg', 'xl', 'xxl'],
      control: { type: 'select', defaultValue: 'sm' },
      defaultValue: 'md'
    },
    image: {
      options: images,
      control: { type: 'select', defaultValue: '/misc/logo.png' },
      defaultValue: images[0]
    }
  }
};

export default meta;
type Story = StoryObj<typeof Avatar>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    image: images[0],
    color: '#59C581',
    size: 'xxl'
  }
};
