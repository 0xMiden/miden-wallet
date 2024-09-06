import React, { Fragment } from 'react';

import type { Meta, StoryObj } from '@storybook/react';

import { AllIcons } from 'app/icons';
import { Button, ButtonProps, ButtonVariant } from 'components/Button';

import colors from '../utils/tailwind-colors';

const ThemeColors = () => {
  const displayColors: { [x: string]: Record<string, string> } = {
    grey: colors.grey,
    Primary: colors.primary,
    Red: colors.red,
    Yellow: colors.yellow,
    Green: colors.green,
    Blue: colors.blue
  };

  return (
    <div className="grid grid-cols-6 gap-2 p-4">
      {Object.keys(displayColors).map(color => (
        <div className="flex flex-col gap-2" key={`color-${color}`}>
          <header className="text-xl font-semibold mt-4">{color}</header>
          {Object.keys(displayColors[color]).map(key => (
            <div
              className="flex flex-row items-end h-16 p-2 rounded-lg"
              key={`color-${color}-${key}`}
              style={{ backgroundColor: displayColors[color][key], color: Number(key) > 300 ? 'white' : 'black' }}
            >
              <p>
                {color}-{key}
              </p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

const ThemeButtons = () => {
  const variants = [ButtonVariant.Primary, ButtonVariant.Secondary, ButtonVariant.Ghost, ButtonVariant.Danger];

  const props: { name: string; props: ButtonProps }[] = [
    {
      name: 'Default',
      props: {}
    },
    // {
    //   name: 'Hover',
    //   props: {}
    // },
    // {
    //   name: 'Pressed',
    //   props: {}
    // },
    {
      name: 'Disabled',
      props: {
        disabled: true
      }
    }
  ];
  return (
    <div className="grid grid-cols-5 gap-4 pt-16 px-4">
      <div />
      {variants.map(variant => (
        <div key={variant} className="flex items-center justify-center font-medium capitalize">
          <h3>{variant}</h3>
        </div>
      ))}
      {props.map(el => {
        return (
          <Fragment key={el.name}>
            <div className="flex items-center justify-center font-medium">
              <h3>{el.name}</h3>
            </div>
            {variants.map(variant => (
              <Button variant={variant} key={variant} {...el.props} />
            ))}
          </Fragment>
        );
      })}
    </div>
  );
};

const ThemeIconsStory = () => {
  return (
    <div className="flex flex-wrap gap-4 p-4">
      {AllIcons.map((Icon, idx) => (
        <div className="w-24 aspect-square border border-grey-200 flex items-center justify-center" key={`icon-${idx}`}>
          <Icon className="fill-current w-8 h-8 border border-grey-100" />
        </div>
      ))}
    </div>
  );
};

const Theme = (props: { category: 'colors' | 'buttons' | 'typography' | 'icons' }) => {
  switch (props.category) {
    case 'colors':
      return <ThemeColors />;
    case 'buttons':
      return <ThemeButtons />;
    case 'typography':
      return <ThemeTypography />;
    case 'icons':
      return <ThemeIconsStory />;
    default:
      return null;
  }
};

const ThemeTypography = () => {
  const headers = [
    {
      title: 'X Large',
      size: 'text-4xl'
    },
    {
      title: 'Large',
      size: 'text-2xl'
    },
    {
      title: 'Medium',
      size: 'text-lg'
    },
    {
      title: 'Small',
      size: 'text-base'
    },
    {
      title: 'X Small',
      size: 'text-sm'
    }
  ];
  const paragraphs = [
    {
      title: 'Large',
      size: 'text-base'
    },
    {
      title: 'Medium',
      size: 'text-sm'
    },
    {
      title: 'Small',
      size: 'text-xs'
    },
    {
      title: 'X Small',
      size: 'text-[10px]'
    }
  ];
  return (
    <div className="px-6 flex flex-col divide-y divide-grey-200">
      <div className="flex flex-col gap-y-4 py-6">
        <header className="text-grey-500">Headers</header>
        {headers.map(header => (
          <div key={header.title}>
            <p className="text-grey-500">{header.title}</p>
            <p className={`font-bold ${header.size}`}>{`${header.title}. This is a headline`}</p>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-y-4 py-6">
        <header className="text-grey-500">Paragraphs</header>
        <div className="flex flex-row gap-x-16">
          <div className="flex flex-col gap-y-4">
            <p>Regular</p>
            {paragraphs.map(paragraph => (
              <div key={paragraph.title}>
                <p className="text-grey-500">{paragraph.title}</p>
                <p className={`${paragraph.size}`}>Lorem Ipsum is simply dummy text.</p>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-y-4">
            <p className="font-bold">Bold</p>
            {paragraphs.map(paragraph => (
              <div key={paragraph.title}>
                <p className="text-grey-500">{paragraph.title}</p>
                <p className={`font-bold ${paragraph.size}`}>Lorem Ipsum is simply dummy text.</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const meta: Meta<typeof Theme> = {
  title: 'Foundations',
  component: Theme,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on Story layout: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen'
  },
  args: {
    category: 'buttons'
  }
};

export default meta;
type Story = StoryObj<typeof Theme>;

export const Colors: Story = {
  args: {
    category: 'colors'
  }
};

export const Typography: Story = {
  args: {
    category: 'typography'
  }
};

export const Buttons: Story = {
  args: {
    category: 'buttons'
  }
};

export const Icons: Story = {
  args: {
    category: 'icons'
  }
};
