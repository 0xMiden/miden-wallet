import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';

import { CircleButton } from './CircleButton';

// Mock Icon component
jest.mock('app/icons/v2', () => ({
  Icon: ({ name, fill, size, className }: any) => (
    <span data-testid="icon" data-name={name} data-fill={fill} data-size={size} className={className} />
  ),
  IconName: {
    Loader: 'Loader',
    Send: 'Send'
  }
}));

// Mock haptics
jest.mock('lib/mobile/haptics', () => ({
  hapticLight: jest.fn()
}));

// Mock colors
jest.mock('utils/tailwind-colors', () => ({
  grey: {
    300: '#d1d5db'
  }
}));

import { IconName } from 'app/icons/v2';
import { hapticLight } from 'lib/mobile/haptics';

describe('CircleButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders button with icon', () => {
    render(<CircleButton icon={IconName.Send} />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('displays the correct icon', () => {
    render(<CircleButton icon={IconName.Send} />);

    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'Send');
  });

  it('triggers haptic feedback on click', () => {
    render(<CircleButton icon={IconName.Send} />);

    fireEvent.click(screen.getByRole('button'));

    expect(hapticLight).toHaveBeenCalled();
  });

  it('calls onClick handler when clicked', () => {
    const onClick = jest.fn();
    render(<CircleButton icon={IconName.Send} onClick={onClick} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows loader icon when isLoading is true', () => {
    render(<CircleButton icon={IconName.Send} isLoading />);

    expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'Loader');
    expect(screen.getByTestId('icon')).toHaveClass('animate-spin');
  });

  it('disables pointer events when loading', () => {
    render(<CircleButton icon={IconName.Send} isLoading />);

    expect(screen.getByRole('button')).toHaveClass('pointer-events-none');
  });

  it('applies disabled styles when disabled', () => {
    render(<CircleButton icon={IconName.Send} disabled />);

    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByTestId('icon')).toHaveAttribute('data-fill', '#d1d5db');
  });

  it('uses custom color when provided', () => {
    render(<CircleButton icon={IconName.Send} color="blue" />);

    expect(screen.getByTestId('icon')).toHaveAttribute('data-fill', 'blue');
  });

  it('uses black color by default', () => {
    render(<CircleButton icon={IconName.Send} />);

    expect(screen.getByTestId('icon')).toHaveAttribute('data-fill', 'black');
  });

  it('applies custom size', () => {
    render(<CircleButton icon={IconName.Send} size="lg" />);

    expect(screen.getByTestId('icon')).toHaveAttribute('data-size', 'lg');
  });

  it('uses md size by default', () => {
    render(<CircleButton icon={IconName.Send} />);

    expect(screen.getByTestId('icon')).toHaveAttribute('data-size', 'md');
  });

  it('applies custom className', () => {
    render(<CircleButton icon={IconName.Send} className="custom-class" />);

    expect(screen.getByRole('button')).toHaveClass('custom-class');
  });

  it('has button type by default', () => {
    render(<CircleButton icon={IconName.Send} />);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });
});
