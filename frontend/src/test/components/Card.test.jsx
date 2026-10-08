import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '../../components/common/Card.jsx';

describe('Card Component', () => {
  it('renders children inside card', () => {
    render(<Card><h3>Card Header</h3><p>Card body text</p></Card>);

    expect(screen.getByText('Card Header')).toBeInTheDocument();
    expect(screen.getByText('Card body text')).toBeInTheDocument();
  });

  it('triggers onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<Card onClick={handleClick} data-testid="test-card">Clickable Card</Card>);

    fireEvent.click(screen.getByTestId('test-card'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies hover styles when hover prop is true', () => {
    const { container } = render(<Card hover>Hover Card</Card>);
    const card = container.firstChild;
    expect(card.className).toContain('hover:shadow-md');
    expect(card.className).toContain('cursor-pointer');
  });
});
