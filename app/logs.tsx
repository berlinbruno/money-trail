import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import Modal from '@/components/ui/modal';
import { Text } from '@/components/ui/text';
import { useToast } from '@/contexts/ToastProvider';
import type { AppLog, LogCategory, LogLevel } from '@/lib/database/loggingQueries';
import {
  clearAllLogs,
  clearOldLogs,
  getAllLogs,
  getLogsByCategory,
  getLogsByLevel,
} from '@/lib/database/loggingQueries';
import { useTheme } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import { AlertCircle, AlertTriangle, Bug, Filter, Info, Trash2, Zap } from 'lucide-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';

const LOG_LEVEL_COLORS = {
  debug: 'bg-gray-500',
  info: 'bg-blue-500',
  warn: 'bg-yellow-500',
  error: 'bg-red-500',
  critical: 'bg-red-600',
};

const LOG_LEVEL_ICONS = {
  debug: Bug,
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  critical: Zap,
};

const CATEGORY_COLORS = {
  task_execution: 'bg-purple-500',
  sms_processing: 'bg-green-500',
  transaction: 'bg-blue-500',
  database: 'bg-orange-500',
  auth: 'bg-red-500',
  notification: 'bg-yellow-500',
  system: 'bg-gray-500',
  error: 'bg-red-500',
  debug: 'bg-gray-500',
};

export default function LogsScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<LogCategory | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => Promise<void>;
  }>({ open: false, title: '', description: '', onConfirm: async () => {} });

  const loadLogs = useCallback(
    async (showLoader = true) => {
      if (showLoader) setIsLoading(true);
      try {
        let logsResult: AppLog[];

        if (selectedCategory !== 'all' && selectedLevel !== 'all') {
          // Filter by both category and level (we need a custom query for this)
          const allLogsResult = await getAllLogs(db, 100);
          logsResult = allLogsResult.filter(
            (log) => log.category === selectedCategory && log.log_level === selectedLevel
          );
        } else if (selectedCategory !== 'all') {
          logsResult = await getLogsByCategory(db, selectedCategory, 100);
        } else if (selectedLevel !== 'all') {
          logsResult = await getLogsByLevel(db, selectedLevel, 100);
        } else {
          logsResult = await getAllLogs(db, 100);
        }

        setLogs(logsResult);
      } catch {
        showToast('Failed to load logs');
        // Set empty array to prevent infinite loading
        setLogs([]);
      } finally {
        if (showLoader) setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [db, selectedCategory, selectedLevel, showToast]
  );

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadLogs(false); // Don't show loading spinner, just refresh
  }, [loadLogs]);

  const handleClearAllLogs = useCallback(() => {
    setConfirmDialog({
      open: true,
      title: 'Clear All Logs',
      description: 'Are you sure you want to delete all log entries? This action cannot be undone.',
      onConfirm: async () => {
        await clearAllLogs(db);
        await loadLogs(false); // Silent refresh
        showToast('All logs cleared');
      },
    });
  }, [db, loadLogs, showToast]);

  const handleClearOldLogs = useCallback(() => {
    setConfirmDialog({
      open: true,
      title: 'Clear Old Logs',
      description: 'This will keep only the most recent 50 log entries and delete the rest.',
      onConfirm: async () => {
        await clearOldLogs(db, 50);
        await loadLogs(false); // Silent refresh
        showToast('Old logs cleared');
      },
    });
  }, [db, loadLogs, showToast]);

  const [logDetailModal, setLogDetailModal] = useState<{
    visible: boolean;
    log: AppLog | null;
  }>({ visible: false, log: null });

  const handleLogDetail = useCallback((log: AppLog) => {
    setLogDetailModal({ visible: true, log });
  }, []);

  // Load logs on mount and when filters change
  useEffect(() => {
    if (isInitialLoad) {
      // Show loading spinner only on initial mount
      loadLogs(true);
      setIsInitialLoad(false);
    } else {
      // Silent loading for filter changes
      loadLogs(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedLevel]);

  const renderLogEntry = (log: AppLog, index: number) => {
    const LevelIcon = LOG_LEVEL_ICONS[log.log_level];

    return (
      <TouchableOpacity key={log.id || index} onPress={() => handleLogDetail(log)}>
        <Card className="mb-2">
          <CardContent className="p-3">
            {/* First row: Badges */}
            <View className="mb-2 flex-row items-center gap-2">
              <LevelIcon size={16} color={theme.colors.text} />
              <Badge className={LOG_LEVEL_COLORS[log.log_level]}>
                <Text className="text-xs font-medium">{log.log_level.toUpperCase()}</Text>
              </Badge>
              <Badge className={CATEGORY_COLORS[log.category]}>
                <Text className="text-xs">{log.category}</Text>
              </Badge>
            </View>

            {/* Second row: Date */}
            <View className="mb-2">
              <Text className="text-xs text-muted-foreground">
                {new Date(log.timestamp).toLocaleString()}
              </Text>
            </View>

            {/* Message */}
            <Text className="mb-1 font-medium">{log.message || 'No message'}</Text>

            {/* Details (if exists) */}
            {log.details && (
              <Text className="mb-1 text-sm text-muted-foreground" numberOfLines={2}>
                {log.details}
              </Text>
            )}

            {/* Footer: Status and Key */}
            <View className="flex-row items-center justify-between">
              <Text className="text-xs text-muted-foreground">Status: {log.status}</Text>
              <Text className="text-xs text-muted-foreground">Key: {log.log_key}</Text>
            </View>
          </CardContent>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderFilters = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle className="flex-row items-center gap-2">
          <Filter size={20} color={theme.colors.text} />
          <Text>Filters</Text>
        </CardTitle>
      </CardHeader>
      <CardContent className="gap-4">
        <View>
          <Text className="mb-2 font-medium">Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
            {[
              'all',
              'task_execution',
              'sms_processing',
              'transaction',
              'database',
              'auth',
              'notification',
              'system',
              'error',
              'debug',
            ].map((category) => (
              <TouchableOpacity
                key={category}
                onPress={() => setSelectedCategory(category as LogCategory | 'all')}
                className={`mr-2 rounded-full px-3 py-1 ${
                  selectedCategory === category ? 'bg-primary' : 'bg-secondary'
                }`}>
                <Text
                  className={
                    selectedCategory === category
                      ? 'text-primary-foreground'
                      : 'text-secondary-foreground'
                  }>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View>
          <Text className="mb-2 font-medium">Level</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-2">
            {['all', 'debug', 'info', 'warn', 'error', 'critical'].map((level) => (
              <TouchableOpacity
                key={level}
                onPress={() => setSelectedLevel(level as LogLevel | 'all')}
                className={`mr-2 rounded-full px-3 py-1 ${
                  selectedLevel === level ? 'bg-primary' : 'bg-secondary'
                }`}>
                <Text
                  className={
                    selectedLevel === level
                      ? 'text-primary-foreground'
                      : 'text-secondary-foreground'
                  }>
                  {level}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </CardContent>
    </Card>
  );

  const renderActions = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="gap-2">
        <View className="flex-row gap-2">
          <Button onPress={handleClearOldLogs} variant="secondary" className="flex-1">
            <Text>Clear Old</Text>
          </Button>
          <Button onPress={handleClearAllLogs} variant="destructive" className="flex-1">
            <View className="flex-row items-center justify-center gap-2">
              <Trash2 size={16} color="white" />
              <Text className="text-white">Clear All</Text>
            </View>
          </Button>
        </View>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <ScrollView className="flex-1 bg-background p-4">
        <Text className="text-center text-muted-foreground">Loading logs...</Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ padding: 16 }}
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}>
      {renderFilters()}
      {renderActions()}

      <Card>
        <CardHeader>
          <CardTitle>
            Log Entries ({logs.length}){selectedCategory !== 'all' && ` - ${selectedCategory}`}
            {selectedLevel !== 'all' && ` - ${selectedLevel}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="px-1">
          {logs.length > 0 ? (
            logs.map((log, index) => renderLogEntry(log, index))
          ) : (
            <Text className="py-8 text-center italic text-muted-foreground">
              No log entries found
              {(selectedCategory !== 'all' || selectedLevel !== 'all') &&
                ' for the selected filters'}
            </Text>
          )}
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog({ open, title: '', description: '', onConfirm: async () => {} })
        }
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmText="Confirm"
        cancelText="Cancel"
        confirmVariant="destructive"
        onConfirm={confirmDialog.onConfirm}
        loadingText="Processing..."
      />

      {/* Log Detail Modal */}
      <Modal
        visible={logDetailModal.visible}
        onClose={() => setLogDetailModal({ visible: false, log: null })}
        title="Log Entry Details">
        <View className="max-h-72 pt-4">
          <ScrollView>
            {logDetailModal.log &&
              (() => {
                let metadata = {};
                try {
                  metadata = logDetailModal.log.metadata
                    ? JSON.parse(logDetailModal.log.metadata)
                    : {};
                } catch {
                  metadata = {};
                }

                return (
                  <View className="gap-3">
                    <View>
                      <Text className="text-sm font-semibold">ID:</Text>
                      <Text className="text-sm">{logDetailModal.log.id}</Text>
                    </View>
                    <View>
                      <Text className="text-sm font-semibold">Key:</Text>
                      <Text className="text-sm">{logDetailModal.log.log_key}</Text>
                    </View>
                    <View>
                      <Text className="text-sm font-semibold">Category:</Text>
                      <Text className="text-sm">{logDetailModal.log.category}</Text>
                    </View>
                    <View>
                      <Text className="text-sm font-semibold">Level:</Text>
                      <Text className="text-sm">{logDetailModal.log.log_level}</Text>
                    </View>
                    <View>
                      <Text className="text-sm font-semibold">Status:</Text>
                      <Text className="text-sm">{logDetailModal.log.status}</Text>
                    </View>
                    <View>
                      <Text className="text-sm font-semibold">Timestamp:</Text>
                      <Text className="text-sm">
                        {new Date(logDetailModal.log.timestamp).toLocaleString()}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-sm font-semibold">Message:</Text>
                      <Text className="text-sm">{logDetailModal.log.message || 'N/A'}</Text>
                    </View>
                    {logDetailModal.log.details && (
                      <View>
                        <Text className="text-sm font-semibold">Details:</Text>
                        <Text className="text-sm">{logDetailModal.log.details}</Text>
                      </View>
                    )}
                    {Object.keys(metadata).length > 0 && (
                      <View>
                        <Text className="text-sm font-semibold">Metadata:</Text>
                        <Text className="font-mono text-xs">
                          {JSON.stringify(metadata, null, 2)}
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })()}
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}
