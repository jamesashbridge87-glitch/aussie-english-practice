import { describe, it, expect } from 'vitest';
import { render, screen } from '../../test/test-utils';
import {
  Spinner,
  LoadingOverlay,
  Skeleton,
  SkeletonText,
  SkeletonCard,
  LoadingButton,
  ProgressBar,
  PulsingDots,
} from './Loading';

describe('Spinner', () => {
  it('renders with default props', () => {
    render(<Spinner />);
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveClass('spinner', 'spinner-md', 'spinner-primary');
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Spinner size="sm" />);
    expect(screen.getByRole('status')).toHaveClass('spinner-sm');

    rerender(<Spinner size="lg" />);
    expect(screen.getByRole('status')).toHaveClass('spinner-lg');
  });

  it('renders with different colors', () => {
    const { rerender } = render(<Spinner color="secondary" />);
    expect(screen.getByRole('status')).toHaveClass('spinner-secondary');

    rerender(<Spinner color="white" />);
    expect(screen.getByRole('status')).toHaveClass('spinner-white');
  });
});

describe('LoadingOverlay', () => {
  it('renders with default message', () => {
    render(<LoadingOverlay />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders with custom message', () => {
    render(<LoadingOverlay message="Please wait" />);
    expect(screen.getByText('Please wait')).toBeInTheDocument();
  });

  it('applies fullscreen class when specified', () => {
    const { container } = render(<LoadingOverlay fullScreen />);
    expect(container.firstChild).toHaveClass('loading-overlay-fullscreen');
  });
});

describe('Skeleton', () => {
  it('renders with default props', () => {
    const { container } = render(<Skeleton />);
    expect(container.firstChild).toHaveClass('skeleton', 'skeleton-text', 'skeleton-pulse');
  });

  it('renders different variants', () => {
    const { container, rerender } = render(<Skeleton variant="circular" />);
    expect(container.firstChild).toHaveClass('skeleton-circular');

    rerender(<Skeleton variant="rectangular" />);
    expect(container.firstChild).toHaveClass('skeleton-rectangular');
  });

  it('renders with custom dimensions', () => {
    const { container } = render(<Skeleton width={100} height={50} />);
    expect(container.firstChild).toHaveStyle({ width: '100px', height: '50px' });
  });

  it('renders with different animations', () => {
    const { container, rerender } = render(<Skeleton animation="wave" />);
    expect(container.firstChild).toHaveClass('skeleton-wave');

    rerender(<Skeleton animation="none" />);
    expect(container.firstChild).toHaveClass('skeleton-none');
  });
});

describe('SkeletonText', () => {
  it('renders correct number of lines', () => {
    const { container } = render(<SkeletonText lines={4} />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons).toHaveLength(4);
  });

  it('renders with default 3 lines', () => {
    const { container } = render(<SkeletonText />);
    const skeletons = container.querySelectorAll('.skeleton');
    expect(skeletons).toHaveLength(3);
  });
});

describe('SkeletonCard', () => {
  it('renders with image by default', () => {
    const { container } = render(<SkeletonCard />);
    expect(container.querySelector('.skeleton-card-image')).toBeInTheDocument();
  });

  it('renders without image when showImage is false', () => {
    const { container } = render(<SkeletonCard showImage={false} />);
    expect(container.querySelector('.skeleton-card-image')).not.toBeInTheDocument();
  });

  it('renders actions when showActions is true', () => {
    const { container } = render(<SkeletonCard showActions />);
    expect(container.querySelector('.skeleton-card-actions')).toBeInTheDocument();
  });
});

describe('LoadingButton', () => {
  it('renders children when not loading', () => {
    render(<LoadingButton>Click me</LoadingButton>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<LoadingButton loading>Click me</LoadingButton>);
    expect(screen.getByRole('button')).toHaveClass('loading-button-loading');
  });

  it('shows loading text when provided', () => {
    render(<LoadingButton loading loadingText="Saving...">Save</LoadingButton>);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('is disabled when loading', () => {
    render(<LoadingButton loading>Click me</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('is disabled when disabled prop is true', () => {
    render(<LoadingButton disabled>Click me</LoadingButton>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

describe('ProgressBar', () => {
  it('renders with correct progress', () => {
    render(<ProgressBar value={50} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
  });

  it('renders with custom max', () => {
    render(<ProgressBar value={25} max={50} />);
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuemax', '50');
  });

  it('shows label when showLabel is true', () => {
    render(<ProgressBar value={75} showLabel />);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { container, rerender } = render(<ProgressBar value={50} size="sm" />);
    expect(container.firstChild).toHaveClass('progress-bar-sm');

    rerender(<ProgressBar value={50} size="lg" />);
    expect(container.firstChild).toHaveClass('progress-bar-lg');
  });

  it('clamps values to 0-100 range', () => {
    const { container } = render(<ProgressBar value={150} />);
    const fill = container.querySelector('.progress-bar-fill') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });
});

describe('PulsingDots', () => {
  it('renders correct number of dots', () => {
    const { container } = render(<PulsingDots count={5} />);
    const dots = container.querySelectorAll('.pulsing-dot');
    expect(dots).toHaveLength(5);
  });

  it('renders 3 dots by default', () => {
    const { container } = render(<PulsingDots />);
    const dots = container.querySelectorAll('.pulsing-dot');
    expect(dots).toHaveLength(3);
  });
});
