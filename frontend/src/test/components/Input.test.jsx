import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input } from '../../components/common/Input.jsx';

describe('Input Component', () => {
  it('renders input with label and required indicator', () => {
    render(<Input label="Mobile Number" required id="phone-input" />);

    expect(screen.getByLabelText(/mobile number/i)).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('handles value changes via onChange', () => {
    const handleChange = vi.fn();
    render(<Input label="Name" placeholder="Enter name" onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Enter name');
    fireEvent.change(input, { target: { value: 'Jane' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(input.value).toBe('Jane');
  });

  it('renders error message when error prop is passed', () => {
    render(<Input label="Email" error="Invalid email address" />);

    expect(screen.getByText('Invalid email address')).toBeInTheDocument();
  });

  it('renders helperText when no error is present', () => {
    render(<Input label="Password" helperText="Must be at least 8 characters" />);

    expect(screen.getByText('Must be at least 8 characters')).toBeInTheDocument();
  });

  it('renders icon and endAdornment when provided', () => {
    const MockIcon = () => <span data-testid="field-icon">Icon</span>;
    render(
      <Input
        label="Search"
        icon={MockIcon}
        endAdornment={<button type="button">Clear</button>}
      />
    );

    expect(screen.getByTestId('field-icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument();
  });
});
