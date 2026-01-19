import React from 'react';

import { render, screen } from '@testing-library/react';

import { IconOrComponent } from './icon-or-component';

// Mock Icon component
jest.mock('app/icons/v2', () => ({
  Icon: ({ name, fill, size, className }: any) => (
    <span data-testid="icon" data-name={name} data-fill={fill} data-size={size} className={className} />
  ),
  IconName: {
    ArrowRight: 'ArrowRight',
    ArrowLeft: 'ArrowLeft',
    Settings: 'Settings'
  }
}));

// Import the mocked IconName
const { IconName } = jest.requireMock('app/icons/v2');

describe('IconOrComponent', () => {
  it('renders Icon when icon prop is an IconName', () => {
    render(<IconOrComponent icon={IconName.ArrowRight} color="blue" />);

    expect(screen.getByTestId('icon')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'ArrowRight');
  });

  it('passes color to Icon', () => {
    render(<IconOrComponent icon={IconName.ArrowRight} color="red" />);

    expect(screen.getByTestId('icon')).toHaveAttribute('data-fill', 'red');
  });

  it('uses default size md', () => {
    render(<IconOrComponent icon={IconName.ArrowRight} color="blue" />);

    expect(screen.getByTestId('icon')).toHaveAttribute('data-size', 'md');
  });

  it('passes custom size to Icon', () => {
    render(<IconOrComponent icon={IconName.ArrowRight} color="blue" size="lg" />);

    expect(screen.getByTestId('icon')).toHaveAttribute('data-size', 'lg');
  });

  it('renders ReactNode when icon is not an IconName', () => {
    render(<IconOrComponent icon={<span data-testid="custom">Custom Icon</span>} color="blue" />);

    expect(screen.getByTestId('custom')).toBeInTheDocument();
    expect(screen.getByText('Custom Icon')).toBeInTheDocument();
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
  });

  it('renders string content as ReactNode', () => {
    render(<IconOrComponent icon="Text content" color="blue" />);

    expect(screen.getByText('Text content')).toBeInTheDocument();
    expect(screen.queryByTestId('icon')).not.toBeInTheDocument();
  });

  it('applies w-6 h-6 classes to Icon', () => {
    render(<IconOrComponent icon={IconName.ArrowRight} color="blue" />);

    expect(screen.getByTestId('icon')).toHaveClass('w-6', 'h-6');
  });
});
