import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Spacing, FontSize } from '../src/utils/theme';

export default function ReaderScreen() {
  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <View style={styles.center}>
        <Text style={styles.text}>Reader Screen</Text>
        <Text style={styles.subtext}>Under Construction</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  text: {
    fontSize: FontSize.xl,
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtext: {
    fontSize: FontSize.md,
    color: Colors.secondaryText,
  },
});
