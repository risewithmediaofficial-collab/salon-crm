import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Pagination } from '../../components/common/Pagination.jsx';

describe('Pagination Component', () => {
  it('returns null if totalPages <= 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} totalItems={5} onPageChange={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders pagination details and handles next/prev page clicks', () => {
    const handlePageChange = vi.fn();
    render(
      <Pagination
        currentPage={2}
        totalPages={5}
        totalItems={100}
        pageSize={20}
        onPageChange={handlePageChange}
      />
    );

    expect(screen.getByText(/showing/i)).toBeInTheDocument();
    expect(screen.getByText('Page 2 of 5')).toBeInTheDocument();

    const prevBtn = screen.getByRole('button', { name: /previous page/i });
    const nextBtn = screen.getByRole('button', { name: /next page/i });

    expect(prevBtn).not.toBeDisabled();
    expect(nextBtn).not.toBeDisabled();

    fireEvent.click(prevBtn);
    expect(handlePageChange).toHaveBeenCalledWith(1);

    fireEvent.click(nextBtn);
    expect(handlePageChange).toHaveBeenCalledWith(3);
  });

  it('disables previous button on first page and next button on last page', () => {
    const { rerender } = render(
      <Pagination currentPage={1} totalPages={3} totalItems={60} onPageChange={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /previous page/i })).toBeDisabled();

    rerender(
      <Pagination currentPage={3} totalPages={3} totalItems={60} onPageChange={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /next page/i })).toBeDisabled();
  });
});
