import { it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, Field, Pagination, LoadState } from './UI';
it('disables a busy button even when disabled was explicitly false', () => {
  render(
    <Button busy disabled={false}>
      Save changes
    </Button>,
  );
  expect(screen.getByRole('button')).toBeDisabled();
});
it('associates field errors with inputs for assistive technology', () => {
  render(<Field label="Title" error="A title is required." required />);
  const input = screen.getByLabelText(/Title/);
  expect(input).toHaveAttribute('aria-invalid', 'true');
  expect(input).toHaveAccessibleDescription('A title is required.');
});
it('pagination prevents leaving the first page and advances to the next', async () => {
  const change = vi.fn();
  render(<Pagination pagination={{ page: 1, pages: 3, total: 30 }} onChange={change} />);
  expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
  await userEvent.click(screen.getByRole('button', { name: 'Next page' }));
  expect(change).toHaveBeenCalledWith(2);
});
it('shows an error with a working retry control', async () => {
  const reload = vi.fn();
  render(
    <LoadState request={{ error: new Error('Connection unavailable'), loading: false, reload }}>
      Content
    </LoadState>,
  );
  expect(screen.getByRole('alert')).toHaveTextContent('Connection unavailable');
  await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
  expect(reload).toHaveBeenCalled();
});
