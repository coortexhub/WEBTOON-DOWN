import React, { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useLibraryStore } from './src/store/libraryStore';
import { useDownloadStore } from './src/store/downloadStore';
import { useHistoryStore } from './src/store/historyStore';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from './src/utils/theme';

export default function Index() {
  const initializeLibrary = useLibraryStore(state => state.initialize);
  const initializeDownloads = useDownloadStore(state => state.initialize);
  const initializeHistory = useHistoryStore(state => state.initialize);
  const initialized = useLibraryStore(state => state.initialized);

  useEffect(() => {
    Promise.all([
      initializeLibrary(),
      initializeDownloads(),
      initializeHistory(),
    ]).catch(error => {
      console.error('Failed to initialize app:', error);
    });
  }, []);

  if (!initialized) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <Redirect href="/(tabs)/home" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
