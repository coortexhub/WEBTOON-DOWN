import React from 'react';
import { ActivityIndicator, View, StyleSheet, Text } from 'react-native';
import { Colors, FontSize, Spacing } from '../utils/theme';

interface LoadingProps {
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message }) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  message: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.secondaryText,
  },
});
