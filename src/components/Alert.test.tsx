import React from 'react';

import { render, screen } from '@testing-library/react';

import { Alert, AlertVariant } from './Alert';

// Mock Icon component
jest.mock('app/icons/v2', () => ({
  Icon: ({ name, fill, size }: any) => <span data-testid="icon" data-name={name} data-fill={fill} data-size={size} />,
  IconName: {
    InformationFill: 'InformationFill',
    WarningFill: 'WarningFill',
    CloseCircleFill: 'CloseCircleFill',
    CheckboxCircleFill: 'CheckboxCircleFill',
    Close: 'Close'
  }
}));

// Mock colors
jest.mock('utils/tailwind-colors', () => ({
  blue: { 500: '#3b82f6' },
  yellow: { 500: '#eab308' },
  red: { 500: '#ef4444' },
  green: { 500: '#22c55e' },
  grey: { 800: '#1f2937' }
}));

describe('Alert', () => {
  it('renders with default title', () => {
    render(<Alert variant={AlertVariant.Info} />);

    expect(screen.getByText('Alert Title')).toBeInTheDocument();
  });

  it('renders with custom title', () => {
    render(<Alert variant={AlertVariant.Info} title="Custom Title" />);

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
  });

  it('renders title as ReactNode', () => {
    render(<Alert variant={AlertVariant.Info} title={<strong>Bold Title</strong>} />);

    expect(screen.getByText('Bold Title')).toBeInTheDocument();
  });

  describe('variants', () => {
    it('renders Info variant with correct styles', () => {
      const { container } = render(<Alert variant={AlertVariant.Info} />);

      expect(container.firstChild).toHaveClass('bg-primary-50');
      expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'InformationFill');
    });

    it('renders Warning variant with correct styles', () => {
      const { container } = render(<Alert variant={AlertVariant.Warning} />);

      expect(container.firstChild).toHaveClass('bg-yellow-50');
      expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'WarningFill');
    });

    it('renders Error variant with correct styles', () => {
      const { container } = render(<Alert variant={AlertVariant.Error} />);

      expect(container.firstChild).toHaveClass('bg-red-50');
      expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'CloseCircleFill');
    });

    it('renders Success variant with correct styles', () => {
      const { container } = render(<Alert variant={AlertVariant.Success} />);

      expect(container.firstChild).toHaveClass('bg-green-50');
      expect(screen.getByTestId('icon')).toHaveAttribute('data-name', 'CheckboxCircleFill');
    });
  });

  describe('dismiss button', () => {
    it('does not show dismiss button by default', () => {
      render(<Alert variant={AlertVariant.Info} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows dismiss button when canDismiss is true', () => {
      render(<Alert variant={AlertVariant.Info} canDismiss />);

      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getAllByTestId('icon')).toHaveLength(2); // Alert icon + close icon
    });
  });

  it('applies custom className', () => {
    const { container } = render(<Alert variant={AlertVariant.Info} className="custom-class" />);

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('has rounded corners', () => {
    const { container } = render(<Alert variant={AlertVariant.Info} />);

    expect(container.firstChild).toHaveClass('rounded-lg');
  });
});
