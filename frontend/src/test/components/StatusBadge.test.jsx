import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../../components/common/StatusBadge.jsx';

describe('StatusBadge Component', () => {
  it('formats status label into title case', () => {
    render(<StatusBadge status="CONFIRMED" />);
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('formats multi-word statuses like IN_SERVICE correctly', () => {
    render(<StatusBadge status="IN_SERVICE" />);
    expect(screen.getByText('In Service')).toBeInTheDocument();
  });

  it('falls back to Pending when status is null or undefined', () => {
    render(<StatusBadge status={null} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });
});
