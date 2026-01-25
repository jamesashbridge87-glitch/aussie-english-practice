import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from '../components/ui';

interface WrapperProps {
  children: ReactNode;
}

// All providers wrapper for testing
function AllProviders({ children }: WrapperProps) {
  return (
    <BrowserRouter>
      <ToastProvider position="top-right">
        {children}
      </ToastProvider>
    </BrowserRouter>
  );
}

// Custom render that includes all providers
function customRender(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Re-export everything from testing-library
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

// Override render with custom render
export { customRender as render };

// Helper to create mock messages for SessionTranscript
export function createMockMessages(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `msg-${i + 1}`,
    role: (i % 2 === 0 ? 'user' : 'agent') as 'user' | 'agent',
    content: i % 2 === 0
      ? `This is user message ${Math.floor(i / 2) + 1}`
      : `G'day mate! This is agent response ${Math.floor(i / 2) + 1}`,
    timestamp: new Date(Date.now() - (count - i) * 60000),
  }));
}

// Helper to wait for async operations
export function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Helper to mock localStorage
export function mockLocalStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
}
