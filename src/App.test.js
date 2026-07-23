import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the game title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Minesweeper/i);
  expect(titleElement).toBeInTheDocument();
});
