import { ErrorBoundary } from '@/components/error-boundary';
import { Text, View } from 'react-native';
import renderer from 'react-test-renderer';

describe('ErrorBoundary Snapshot', () => {
  it('renders children when no error', () => {
    const tree = renderer
      .create(
        <ErrorBoundary>
          <View>
            <Text>Test Child</Text>
          </View>
        </ErrorBoundary>
      )
      .toJSON();
    expect(tree).toMatchSnapshot();
  });
});
