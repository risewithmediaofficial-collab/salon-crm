import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '../../components/common/Select.jsx';

describe('Select Component', () => {
  const options = [
    { value: 'haircut', label: 'Haircut & Styling' },
    { value: 'facial', label: 'Luxury Facial' },
    { value: 'spa', label: 'Spa Treatment' },
  ];

  it('renders select with label and options', () => {
    render(<Select label="Choose Service" options={options} />);

    expect(screen.getByLabelText(/choose service/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Select an option' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Haircut & Styling' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Luxury Facial' })).toBeInTheDocument();
  });

  it('handles value change via user selection', () => {
    const handleChange = vi.fn();
    render(<Select label="Service" options={options} onChange={handleChange} />);

    const select = screen.getByLabelText(/service/i);
    fireEvent.change(select, { target: { value: 'facial' } });

    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(select.value).toBe('facial');
  });

  it('displays error text and error border styling when error prop is passed', () => {
    render(<Select label="Service" options={options} error="Please select a service" />);

    expect(screen.getByText('Please select a service')).toBeInTheDocument();
    const select = screen.getByLabelText(/service/i);
    expect(select.className).toContain('border-rose-400');
  });
});
