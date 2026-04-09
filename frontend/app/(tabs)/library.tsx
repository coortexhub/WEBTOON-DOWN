import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight } from '../src/utils/theme';
import { useLibraryStore } from '../src/store/libraryStore';
import { SeriesCard } from '../src/components/SeriesCard';
import { EmptyState } from '../src/components/EmptyState';

export default function LibraryScreen() {
  const series = useLibraryStore(state => state.series);
  const isFavorite = useLibraryStore(state => state.isFavorite);
  const toggleFavorite = useLibraryStore(state => state.toggleFavorite);

  const sortedSeries = series.slice().sort((a, b) => b.date_added - a.date_added);

  const handleSeriesPress = (seriesItem: any) => {
    router.push({
      pathname: '/series/[id]',
      params: {
        id: seriesItem.series_id,
        url: seriesItem.url,
        title: seriesItem.title,
        thumbnail: seriesItem.thumbnail_url || '',
        author: seriesItem.author || '',
        description: seriesItem.description || '',
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {sortedSeries.length > 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {sortedSeries.map((item) => (
              <View key={item.series_id} style={styles.gridItem}>
                <SeriesCard
                  title={item.title}
                  thumbnail={item.thumbnail_url}
                  author={item.author}
                  isFavorite={isFavorite(item.series_id)}
                  onPress={() => handleSeriesPress(item)}
                  onFavoritePress={() => toggleFavorite(item.series_id)}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <EmptyState
          icon={<Ionicons name="library-outline" size={64} color={Colors.secondaryText} />}
          title="No Series in Library"
          message="Download some webtoons to see them here"
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -Spacing.sm,
  },
  gridItem: {
    width: '50%',
    padding: Spacing.sm,
  },
});
