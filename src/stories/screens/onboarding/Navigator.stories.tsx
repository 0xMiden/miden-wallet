import React from 'react';

import { useArgs } from '@storybook/preview-api';
import type { Meta, StoryObj } from '@storybook/react';

import { OnboardingFlow } from 'screens/onboarding/navigator';
import { OnboardingAction, OnboardingStep, OnboardingType } from 'screens/onboarding/types';

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof OnboardingFlow> = {
  title: 'Screens/Onboarding/Flow',
  component: OnboardingFlow,
  parameters: {
    layout: 'centered',
    controls: { exclude: ['onboardingType'] }
  },
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  args: {
    // seedPhrase: ['hello', 'world', 'foo', 'bar', 'baz', 'qux', 'quux', 'corge', 'grault', 'garply', 'waldo', 'fred'],
    step: OnboardingStep.Welcome
  },
  argTypes: {
    // seedPhrase: { control: { type: 'object' } },
    step: {
      options: Object.values(OnboardingStep),
      name: 'step',
      control: { type: 'select', defaultValue: OnboardingStep.Welcome },
      defaultValue: OnboardingStep.Welcome
    }
  },
  render: function Render(args) {
    const [{ step, onboardingType }, updateArgs] = useArgs();
    const onAction = (action: OnboardingAction) => {
      switch (action.id) {
        case 'backup-seed-phrase':
          updateArgs({ step: OnboardingStep.BackupSeedPhrase, onboardingType: OnboardingType.Create });
          break;
        // case 'import-wallet':
        //   updateArgs({ step: OnboardingStep.ImportWallet, onboardingType: OnboardingType.Import });
        //   break;
        case 'verify-seed-phrase':
          updateArgs({ step: OnboardingStep.VerifySeedPhrase });
          break;
        case 'create-password':
          updateArgs({ step: OnboardingStep.CreatePassword });
          break;
        case 'create-password-submit':
          updateArgs({
            step:
              onboardingType === OnboardingType.Create
                ? OnboardingStep.SelectTransactionType
                : OnboardingStep.Confirmation
          });
          break;
        case 'select-transaction-type':
          updateArgs({ step: OnboardingStep.Confirmation });
          break;
        case 'confirmation':
          updateArgs({ step: OnboardingStep.Welcome });
          break;
        case 'import-seed-phrase-submit':
          updateArgs({ step: OnboardingStep.CreatePassword });
          break;
        case 'back':
          if (step === OnboardingStep.BackupSeedPhrase || step === OnboardingStep.ImportWallet) {
            updateArgs({ step: OnboardingStep.Welcome });
          } else if (step === OnboardingStep.VerifySeedPhrase) {
            updateArgs({ step: OnboardingStep.BackupSeedPhrase });
          } else if (step === OnboardingStep.CreatePassword) {
            updateArgs({
              step:
                onboardingType === OnboardingType.Create ? OnboardingStep.BackupSeedPhrase : OnboardingStep.ImportWallet
            });
          } else if (step === OnboardingStep.SelectTransactionType) {
            updateArgs({ step: OnboardingStep.CreatePassword });
          }
          break;
        default:
          break;
      }
    };

    return (
      <div className="border border-grey-200 rounded-3xl">
        <OnboardingFlow {...args} onAction={onAction} />
      </div>
    );
  }
};

export default meta;
type Story = StoryObj<typeof OnboardingFlow>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Example: Story = {
  args: {
    step: OnboardingStep.Welcome
    // seedPhrase: ['hello', 'world', 'foo', 'bar', 'baz', 'qux', 'quux', 'corge', 'grault', 'garply', 'waldo', 'fred']
  }
};
