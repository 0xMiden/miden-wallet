import React from 'react';

import { render, screen, fireEvent } from '@testing-library/react';

import Alert from './Alert';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}));

// Mock SVG
jest.mock('app/icons/close.svg', () => ({
  ReactComponent: () => <svg data-testid="close-icon" />
}));

describe('Alert', () => {
  it('renders description', () => {
    render(<Alert description="Test description" />);

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    render(<Alert description="Test" title="Test Title" />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('does not render title when not provided', () => {
    const { container } = render(<Alert description="Test" />);

    expect(container.querySelector('h2')).not.toBeInTheDocument();
  });

  it('applies warn type styles by default', () => {
    const { container } = render(<Alert description="Test" />);
    const alert = container.firstChild;

    expect(alert).toHaveClass('bg-yellow-100');
    expect(alert).toHaveClass('text-yellow-700');
  });

  it('applies success type styles', () => {
    const { container } = render(<Alert description="Test" type="success" />);
    const alert = container.firstChild;

    expect(alert).toHaveClass('bg-green-100');
    expect(alert).toHaveClass('text-green-700');
  });

  it('applies error type styles', () => {
    const { container } = render(<Alert description="Test" type="error" />);
    const alert = container.firstChild;

    expect(alert).toHaveClass('bg-red-100');
    expect(alert).toHaveClass('text-red-700');
  });

  it('has alert role', () => {
    render(<Alert description="Test" />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('auto focuses when autoFocus is true', () => {
    render(<Alert description="Test" autoFocus />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveFocus();
  });

  it('does not auto focus when autoFocus is false', () => {
    render(<Alert description="Test" />);

    const alert = screen.getByRole('alert');
    expect(alert).not.toHaveFocus();
  });

  it('renders close button when closable', () => {
    render(<Alert description="Test" closable />);

    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByTestId('close-icon')).toBeInTheDocument();
  });

  it('does not render close button when not closable', () => {
    render(<Alert description="Test" />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(<Alert description="Test" closable onClose={onClose} />);

    fireEvent.click(screen.getByRole('button'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('applies custom className', () => {
    const { container } = render(<Alert description="Test" className="custom-class" />);
    const alert = container.firstChild;

    expect(alert).toHaveClass('custom-class');
  });

  it('passes through additional props', () => {
    render(<Alert description="Test" data-testid="my-alert" />);

    expect(screen.getByTestId('my-alert')).toBeInTheDocument();
  });
});
