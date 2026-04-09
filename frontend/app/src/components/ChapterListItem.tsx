import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../utils/theme';
import { Ionicons } from '@expo/vector-icons';

interface ChapterListItemProps {
  title: string;
  thumbnail?: string;
  episodeNo?: number;
  downloaded?: boolean;
  isDownloading?: boolean;
  progress?: number;
  onPress: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  selected?: boolean;
  onSelect?: () => void;
  selectionMode?: boolean;
}

export const ChapterListItem: React.FC<ChapterListItemProps> = ({
  title,
  thumbnail,
  episodeNo,
  downloaded,
  isDownloading,
  progress = 0,
  onPress,
  onDownload,
  onDelete,
  selected,
  onSelect,
  selectionMode,
}) => {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
        selected && styles.selected,
      ]}
      onPress={selectionMode ? onSelect : onPress}
    >
      {selectionMode && (
        <View style={styles.checkbox}>
          <Ionicons
            name={selected ? 'checkmark-circle' : 'ellipse-outline'}
            size={24}
            color={selected ? Colors.primary : Colors.secondaryText}
          />
        </View>
      )}
      
      {thumbnail && (
        <Image
          source={{ uri: thumbnail }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      )}
      
      <View style={styles.content}>
        {episodeNo !== undefined && (
          <Text style={styles.episodeNo}>Episode {episodeNo}</Text>
        )}
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        
        {isDownloading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        )}
      </View>
      
      <View style={styles.actions}>
        {downloaded ? (
          <>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            {onDelete && (
              <Pressable
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                style={styles.actionButton}
              >
                <Ionicons name="trash-outline" size={20} color={Colors.danger} />
              </Pressable>
            )}
          </>
        ) : isDownloading ? (
          <Ionicons name="download-outline" size={20} color={Colors.primary} />
        ) : onDownload ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              onDownload();
            }}
            style={styles.actionButton}
          >
            <Ionicons name="download-outline" size={20} color={Colors.secondaryText} />
          </Pressable>
        ) : (
          <Ionicons name="chevron-forward" size={20} color={Colors.secondaryText} />
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  pressed: {
    opacity: 0.7,
  },
  selected: {
    backgroundColor: Colors.tertiaryBackground,
  },
  checkbox: {
    marginRight: Spacing.md,
  },
  thumbnail: {
    width: 60,
    height: 80,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
    backgroundColor: Colors.tertiaryBackground,
  },
  content: {
    flex: 1,
  },
  episodeNo: {
    fontSize: FontSize.xs,
    color: Colors.secondaryText,
    marginBottom: 2,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.medium,
    color: Colors.text,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.tertiaryBackground,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: FontSize.xs,
    color: Colors.secondaryText,
    marginLeft: Spacing.sm,
    minWidth: 35,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.xs,
  },
});
