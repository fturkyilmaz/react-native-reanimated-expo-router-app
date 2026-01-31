import { Skeleton } from '@/components/skeleton';
import React from 'react';
import renderer from 'react-test-renderer';

describe('Skeleton Snapshot', () => {
  it('renders correctly with default props', () => {
    const tree = renderer
      .create(<Skeleton width={100} height={50} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly with custom dimensions', () => {
    const tree = renderer
      .create(<Skeleton width={200} height={100} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders correctly with custom style', () => {
    const customStyle = { marginTop: 10, borderRadius: 8 };
    const tree = renderer
      .create(<Skeleton width={150} height={75} style={customStyle} />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders with different sizes', () => {
    const sizes = [
      { width: 50, height: 50 },
      { width: 100, height: 200 },
      { width: 300, height: 150 },
    ];

    sizes.forEach(({ width, height }) => {
      const tree = renderer
        .create(<Skeleton width={width} height={height} />)
        .toJSON();
      expect(tree).toBeTruthy();
    });
  });
});
