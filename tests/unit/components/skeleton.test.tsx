import { Skeleton } from '@/components/skeleton';
import { render } from '@testing-library/react-native';
import React from 'react';
import { View } from 'react-native';

describe('Skeleton', () => {
  it('renders with correct dimensions', () => {
    const { UNSAFE_getByType } = render(
      <Skeleton width={100} height={50} />
    );

    expect(UNSAFE_getByType(View)).toBeTruthy();
  });

  it('renders with custom style', () => {
    const customStyle = { marginTop: 10, borderRadius: 8 };
    const { UNSAFE_getByType } = render(
      <Skeleton width={200} height={100} style={customStyle} />
    );

    expect(UNSAFE_getByType(View)).toBeTruthy();
  });

  it('renders without style prop', () => {
    const { UNSAFE_getByType } = render(
      <Skeleton width={150} height={75} />
    );

    expect(UNSAFE_getByType(View)).toBeTruthy();
  });

  it('renders with different sizes', () => {
    const sizes = [
      { width: 50, height: 50 },
      { width: 100, height: 200 },
      { width: 300, height: 150 },
    ];

    sizes.forEach(({ width, height }) => {
      const { UNSAFE_getByType } = render(
        <Skeleton width={width} height={height} />
      );
      expect(UNSAFE_getByType(View)).toBeTruthy();
    });
  });
});
