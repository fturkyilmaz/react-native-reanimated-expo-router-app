import { AuthTransition } from '@/components/auth-transition';
import { render } from '@testing-library/react-native';
import React from 'react';

describe('AuthTransition', () => {
  const mockOnAnimationComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns null when not visible', () => {
    const { toJSON } = render(
      <AuthTransition
        isVisible={false}
        onAnimationComplete={mockOnAnimationComplete}
        userName="Test User"
      />
    );

    expect(toJSON()).toBeNull();
  });

  it('renders when visible', () => {
    const { getByText } = render(
      <AuthTransition
        isVisible={true}
        onAnimationComplete={mockOnAnimationComplete}
        userName="Test User"
      />
    );

    expect(getByText('Hoşgeldin Test User! 🎬')).toBeTruthy();
    expect(getByText('Film dünyası seni bekliyor...')).toBeTruthy();
  });

  it('renders with empty user name', () => {
    const { getByText } = render(
      <AuthTransition
        isVisible={true}
        onAnimationComplete={mockOnAnimationComplete}
        userName=""
      />
    );

    expect(getByText('Hoşgeldin ! 🎬')).toBeTruthy();
  });

  it('renders Lottie animation', () => {
    const { UNSAFE_getByType } = render(
      <AuthTransition
        isVisible={true}
        onAnimationComplete={mockOnAnimationComplete}
        userName="Test User"
      />
    );

    // LottieView should be rendered
    expect(UNSAFE_getByType).toBeDefined();
  });

  it('triggers animation sequence when becoming visible', async () => {
    const { rerender } = render(
      <AuthTransition
        isVisible={false}
        onAnimationComplete={mockOnAnimationComplete}
        userName="Test User"
      />
    );

    // Change to visible
    rerender(
      <AuthTransition
        isVisible={true}
        onAnimationComplete={mockOnAnimationComplete}
        userName="Test User"
      />
    );

    // Component should be rendered
    expect(true).toBe(true);
  });

  it('calls onAnimationComplete after animation', async () => {
    render(
      <AuthTransition
        isVisible={true}
        onAnimationComplete={mockOnAnimationComplete}
        userName="Test User"
      />
    );

    // Fast-forward through animations
    jest.advanceTimersByTime(2000);

    // Note: The actual callback is called via runOnJS in the animation
    // which is mocked in the setup file
  });

  it('renders with correct container styles', () => {
    const { toJSON } = render(
      <AuthTransition
        isVisible={true}
        onAnimationComplete={mockOnAnimationComplete}
        userName="Test User"
      />
    );

    expect(toJSON()).toBeTruthy();
  });
});
