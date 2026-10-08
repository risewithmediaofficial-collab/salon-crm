import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { EmptyState } from '../../components/common/EmptyState.jsx';

describe('EmptyState Component', () => {
  it('renders title and description', () => {
    render(
      <EmptyState
        title="No appointments yet"
        description="Book your first appointment to see it here."
      />
    );

    expect(screen.getByText('No appointments yet')).toBeInTheDocument();
    expect(screen.getByText('Book your first appointment to see it here.')).toBeInTheDocument();
  });

  it('renders action button and calls onAction when clicked', () => {
    const handleAction = vi.fn();
    render(
      <EmptyState
        title="No items"
        description="Create one now"
        actionLabel="Book Now"
        onAction={handleAction}
      />
    );

    const button = screen.getByRole('button', { name: /book now/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleAction).toHaveBeenCalledTimes(1);
  });
});
