import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, RADIUS } from '../constants/theme';
import Button from './Button';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('TMS Crash Guard caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconBadge}>
              <Text style={styles.iconText}>⚠️</Text>
            </View>
            <Text style={styles.title}>Session Interrupted</Text>
            <Text style={styles.subtitle}>
              An unexpected render anomaly occurred. Tap below to re-initialize your session telemetry.
            </Text>
            {this.state.error?.message ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorMsg} numberOfLines={3}>
                  {this.state.error.message}
                </Text>
              </View>
            ) : null}
            <Button
              title="Re-Initialize Session"
              onPress={this.handleReset}
              variant="primary"
              size="md"
              style={{ marginTop: SPACING.md }}
            />
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: COLORS.surfaceCard,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  iconText: {
    fontSize: 24,
  },
  title: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  errorBox: {
    width: '100%',
    padding: SPACING.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  errorMsg: {
    color: COLORS.red,
    fontSize: 11,
    fontFamily: 'monospace',
  },
});

export default ErrorBoundary;
