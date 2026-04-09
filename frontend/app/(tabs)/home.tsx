import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../src/utils/theme';
import { apiService } from '../src/services/api';
import { useLibraryStore } from '../src/store/libraryStore';
import { useHistoryStore } from '../src/store/historyStore';
import { SeriesCard } from '../src/components/SeriesCard';
import { EmptyState } from '../src/components/EmptyState';
import { Loading } from '../src/components/Loading';

export default function HomeScreen() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const series = useLibraryStore(state => state.series);
  const history = useHistoryStore(state => state.history);
  const isFavorite = useLibraryStore(state => state.isFavorite);
  const toggleFavorite = useLibraryStore(state => state.toggleFavorite);

  const recentSeries = series
    .slice()
    .sort((a, b) => b.date_added - a.date_added)
    .slice(0, 10);

  const recentHistory = history.slice(0, 5);

  const handleSearch = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a webtoon URL');
      return;
    }

    if (!url.includes('webtoons.com')) {
      Alert.alert('Error', 'Please enter a valid Webtoons.com URL');
      return;
    }

    setLoading(true);
    try {
      const seriesInfo = await apiService.getSeriesInfo(url.trim());
      
      // Navigate to series detail screen
      router.push({
        pathname: '/series/[id]',
        params: {
          id: seriesInfo.series_id,
          url: url.trim(),
          title: seriesInfo.title,
          thumbnail: seriesInfo.thumbnail_url || '',
          author: seriesInfo.author || '',
          description: seriesInfo.description || '',
        },
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to fetch webtoon');
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return <Loading message="Fetching webtoon..." />;
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Search Section */}
          <View style={styles.searchSection}>
            <Text style={styles.title}>Browse Webtoons</Text>
            <Text style={styles.subtitle}>
              Enter a Webtoons.com series URL to get started
            </Text>

            <View style={styles.searchContainer}>
              <Ionicons
                name="link-outline"
                size={20}
                color={Colors.secondaryText}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="https://www.webtoons.com/en/..."
                placeholderTextColor={Colors.tertiaryText}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                returnKeyType="search"
                onSubmitEditing={handleSearch}
              />
              {url.length > 0 && (
                <Pressable onPress={() => setUrl('')} style={styles.clearButton}>
                  <Ionicons name="close-circle" size={20} color={Colors.secondaryText} />
                </Pressable>
              )}
            </View>

            <Pressable
              style={({ pressed }) => [
                styles.searchButton,
                pressed && styles.searchButtonPressed,
              ]}
              onPress={handleSearch}
              disabled={loading}
            >
              <Ionicons name="search" size={20} color={Colors.text} />
              <Text style={styles.searchButtonText}>Search Webtoon</Text>
            </Pressable>
          </View>

          {/* Recent History */}
          {recentHistory.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Continue Reading</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {recentHistory.map((item) => {
                  const seriesItem = series.find(s => s.series_id === item.series_id);
                  return (
                    <SeriesCard
                      key={item.chapter_id}
                      title={item.series_title}
                      thumbnail={item.thumbnail_url}
                      onPress={() => seriesItem && handleSeriesPress(seriesItem)}
                    />
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Recent Series */}
          {recentSeries.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Recently Added</Text>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
              >
                {recentSeries.map((item) => (
                  <SeriesCard
                    key={item.series_id}
                    title={item.title}
                    thumbnail={item.thumbnail_url}
                    author={item.author}
                    isFavorite={isFavorite(item.series_id)}
                    onPress={() => handleSeriesPress(item)}
                    onFavoritePress={() => toggleFavorite(item.series_id)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* Empty State */}
          {recentSeries.length === 0 && recentHistory.length === 0 && (
            <EmptyState
              icon={<Ionicons name="book-outline" size={64} color={Colors.secondaryText} />}
              title="No Webtoons Yet"
              message="Enter a Webtoons.com URL above to start downloading your favorite series"
            />
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
    paddingBottom: Spacing.xl,
  },
  searchSection: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  title: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.secondaryText,
    marginBottom: Spacing.xl,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.secondaryBackground,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    height: 48,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  clearButton: {
    padding: Spacing.xs,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  searchButtonPressed: {
    opacity: 0.8,
  },
  searchButtonText: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
  },
  section: {
    marginTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  horizontalList: {
    paddingHorizontal: Spacing.lg,
  },
});
