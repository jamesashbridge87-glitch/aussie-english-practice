import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/test-utils';
import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  it('renders the 404 page', () => {
    render(<NotFoundPage />);

    expect(screen.getByText("Crikey! Page not found")).toBeInTheDocument();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('displays helpful message', () => {
    render(<NotFoundPage />);

    expect(screen.getByText(/Looks like this page has hopped away/)).toBeInTheDocument();
  });

  it('shows suggestions', () => {
    render(<NotFoundPage />);

    expect(screen.getByText("Here's what you can do:")).toBeInTheDocument();
    expect(screen.getByText('Check the URL for typos')).toBeInTheDocument();
    expect(screen.getByText('Head back to the practice area')).toBeInTheDocument();
    expect(screen.getByText("Learn some Aussie slang while you're here")).toBeInTheDocument();
  });

  it('has navigation links', () => {
    render(<NotFoundPage />);

    const practiceLink = screen.getByRole('link', { name: 'Start Practicing' });
    const slangLink = screen.getByRole('link', { name: 'Learn Slang' });

    expect(practiceLink).toHaveAttribute('href', '/app');
    expect(slangLink).toHaveAttribute('href', '/slang');
  });

  it('shows Aussie tip/fun fact', () => {
    render(<NotFoundPage />);

    expect(screen.getByText('Aussie Tip:')).toBeInTheDocument();
    expect(screen.getByText(/gone walkabout/)).toBeInTheDocument();
  });

  it('has accessible structure', () => {
    render(<NotFoundPage />);

    // Check main heading
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toHaveTextContent("Crikey! Page not found");

    // Check links are accessible
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});
