import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

interface SeriesCardProps {
  title: string;
  thumbnail?: string;
  author?: string;
  chapterCount?: number;
  isFavorite?: boolean;
  onPress: () => void;
  onFavoritePress?: () => void;
}

export const SeriesCard: React.FC<SeriesCardProps> = ({
  title,
  thumbnail,
  author,
  chapterCount,
  isFavorite,
  onPress,
  onFavoritePress,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.imageContainer}>
        {thumbnail ? (
          <Image
            source={{ uri: thumbnail }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.image, styles.placeholderImage]}>
            <Ionicons name="book-outline" size={48} color={Colors.secondaryText} />
          </View>
        )}
        {onFavoritePress && (
          <Pressable
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              onFavoritePress();
            }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? Colors.danger : Colors.text}
            />
          </Pressable>
        )}
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        {author && (
          <Text style={styles.author} numberOfLines={1}>
            {author}
          </Text>
        )}
        {chapterCount !== undefined && (
          <Text style={styles.chapterCount}>
            {chapterCount} {chapterCount === 1 ? 'chapter' : 'chapters'}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 160,
    marginRight: Spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    backgroundColor: Colors.tertiaryBackground,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    marginTop: Spacing.sm,
  },
  title: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  author: {
    fontSize: FontSize.xs,
    color: Colors.secondaryText,
    marginBottom: 2,
  },
  chapterCount: {
    fontSize: FontSize.xs,
    color: Colors.tertiaryText,
  },
});
