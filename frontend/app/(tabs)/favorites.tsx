import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontWeight } from '../src/utils/theme';
import { useLibraryStore } from '../src/store/libraryStore';
import { SeriesCard } from '../src/components/SeriesCard';
import { EmptyState } from '../src/components/EmptyState';

export default function FavoritesScreen() {
  const favoriteSeries = useLibraryStore(state => state.getFavoriteSeries);
  const toggleFavorite = useLibraryStore(state => state.toggleFavorite);
  
  const favorites = favoriteSeries();

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
      {favorites.length > 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.grid}>
            {favorites.map((item) => (
              <View key={item.series_id} style={styles.gridItem}>
                <SeriesCard
                  title={item.title}
                  thumbnail={item.thumbnail_url}
                  author={item.author}
                  isFavorite
                  onPress={() => handleSeriesPress(item)}
                  onFavoritePress={() => toggleFavorite(item.series_id)}
                />
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <EmptyState
          icon={<Ionicons name="heart-outline" size={64} color={Colors.secondaryText} />}
          title="No Favorites"
          message="Mark series as favorites to see them here"
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
