import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '../src/utils/theme';
import { useDownloadStore } from '../src/store/downloadStore';
import { EmptyState } from '../src/components/EmptyState';
import { DownloadTask } from '../src/types';

export default function DownloadsScreen() {
  const tasks = useDownloadStore(state => state.tasks);
  const removeTask = useDownloadStore(state => state.removeTask);
  const pauseTask = useDownloadStore(state => state.pauseTask);
  const resumeTask = useDownloadStore(state => state.resumeTask);
  const clearCompleted = useDownloadStore(state => state.clearCompleted);

  const activeTasks = tasks.filter(t => t.status !== 'completed' && t.status !== 'failed');
  const completedTasks = tasks.filter(t => t.status === 'completed');
  const failedTasks = tasks.filter(t => t.status === 'failed');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'downloading': return Colors.downloading;
      case 'completed': return Colors.completed;
      case 'failed': return Colors.failed;
      case 'paused': return Colors.paused;
      default: return Colors.secondaryText;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'downloading': return 'download';
      case 'completed': return 'checkmark-circle';
      case 'failed': return 'close-circle';
      case 'paused': return 'pause-circle';
      default: return 'time';
    }
  };

  const handleTaskAction = (task: DownloadTask) => {
    if (task.status === 'downloading' || task.status === 'queued') {
      pauseTask(task.id);
    } else if (task.status === 'paused') {
      resumeTask(task.id);
    } else if (task.status === 'failed') {
      Alert.alert(
        'Retry Download',
        'Do you want to retry this download?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => resumeTask(task.id) },
        ]
      );
    }
  };

  const renderTask = (task: DownloadTask) => (
    <View key={task.id} style={styles.taskCard}>
      <View style={styles.taskHeader}>
        <Ionicons
          name={getStatusIcon(task.status)}
          size={24}
          color={getStatusColor(task.status)}
        />
        <View style={styles.taskInfo}>
          <Text style={styles.seriesTitle} numberOfLines={1}>
            {task.series_title}
          </Text>
          <Text style={styles.chapterTitle} numberOfLines={1}>
            {task.chapter_title}
          </Text>
        </View>
        <View style={styles.taskActions}>
          {task.status !== 'completed' && (
            <Pressable onPress={() => handleTaskAction(task)} style={styles.actionButton}>
              <Ionicons
                name={task.status === 'downloading' || task.status === 'queued' ? 'pause' : 'play'}
                size={20}
                color={Colors.primary}
              />
            </Pressable>
          )}
          <Pressable onPress={() => removeTask(task.id)} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={20} color={Colors.danger} />
          </Pressable>
        </View>
      </View>
      
      {task.status !== 'completed' && task.total_images > 0 && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${task.progress}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {task.current_image}/{task.total_images} • {task.progress}%
          </Text>
        </View>
      )}
      
      {task.error && (
        <Text style={styles.errorText}>{task.error}</Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {tasks.length > 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          {activeTasks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Active ({activeTasks.length})</Text>
              </View>
              {activeTasks.map(renderTask)}
            </View>
          )}

          {completedTasks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Completed ({completedTasks.length})</Text>
                <Pressable onPress={clearCompleted}>
                  <Text style={styles.clearText}>Clear All</Text>
                </Pressable>
              </View>
              {completedTasks.map(renderTask)}
            </View>
          )}

          {failedTasks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Failed ({failedTasks.length})</Text>
              </View>
              {failedTasks.map(renderTask)}
            </View>
          )}
        </ScrollView>
      ) : (
        <EmptyState
          icon={<Ionicons name="download-outline" size={64} color={Colors.secondaryText} />}
          title="No Downloads"
          message="Your download queue is empty"
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
  section: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.bold,
    color: Colors.text,
  },
  clearText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
  },
  taskCard: {
    backgroundColor: Colors.card,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  taskHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  taskInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  seriesTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.semibold,
    color: Colors.text,
    marginBottom: 2,
  },
  chapterTitle: {
    fontSize: FontSize.sm,
    color: Colors.secondaryText,
  },
  taskActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  actionButton: {
    padding: Spacing.xs,
  },
  progressSection: {
    marginTop: Spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.tertiaryBackground,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: Spacing.xs,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  progressText: {
    fontSize: FontSize.xs,
    color: Colors.secondaryText,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: Spacing.xs,
  },
});
