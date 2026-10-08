import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../../components/common/Badge.jsx';

describe('Badge Component', () => {
  it('renders badge text content', () => {
    render(<Badge>Active</Badge>);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('applies emerald variant classes for positive states', () => {
    const { container } = render(<Badge variant="emerald">Success</Badge>);
    const badge = container.firstChild;
    expect(badge.className).toContain('bg-emerald-50');
    expect(badge.className).toContain('text-emerald-800');
  });

  it('applies rose variant classes for alert states', () => {
    const { container } = render(<Badge variant="rose">Cancelled</Badge>);
    const badge = container.firstChild;
    expect(badge.className).toContain('bg-rose-50');
    expect(badge.className).toContain('text-rose-800');
  });

  it('applies default stone variant when no variant specified', () => {
    const { container } = render(<Badge>Default</Badge>);
    const badge = container.firstChild;
    expect(badge.className).toContain('bg-stone-100');
  });
});
