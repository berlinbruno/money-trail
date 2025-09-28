import {
  getAllLogs,
  getLogsByCategory,
  getLogsByLevel,
  getLogStatsByCategory,
  clearAllLogs,
  clearOldLogs,
  type AppLog,
  type LogCategory,
  type LogLevel,
} from '@/lib/database/loggingQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Text } from '@/components/ui/text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, RefreshControl, ScrollView, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import {
  Filter,
  Trash2,
  AlertCircle,
  Info,
  AlertTriangle,
  Bug,
  Zap,
  RefreshCw,
} from 'lucide-react-native';

const LOG_LEVEL_COLORS = {
  debug: 'bg-gray-100 text-gray-800',
  info: 'bg-blue-100 text-blue-800',
  warn: 'bg-yellow-100 text-yellow-800',
  error: 'bg-red-100 text-red-800',
  critical: 'bg-red-200 text-red-900',
};

const LOG_LEVEL_ICONS = {
  debug: Bug,
  info: Info,
  warn: AlertTriangle,
  error: AlertCircle,
  critical: Zap,
};

const CATEGORY_COLORS = {
  task_execution: 'bg-purple-100 text-purple-800',
  sms_processing: 'bg-green-100 text-green-800',
  transaction: 'bg-blue-100 text-blue-800',
  database: 'bg-orange-100 text-orange-800',
  auth: 'bg-red-100 text-red-800',
  notification: 'bg-yellow-100 text-yellow-800',
  system: 'bg-gray-100 text-gray-800',
  error: 'bg-red-100 text-red-800',
  debug: 'bg-gray-100 text-gray-800',
};

export default function LogsScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const [logs, setLogs] = useState<AppLog[]>([]);
  const [stats, setStats] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<LogCategory | 'all'>('all');
  const [selectedLevel, setSelectedLevel] = useState<LogLevel | 'all'>('all');

  const loadLogs = useCallback(async () => {
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

      const statsResult = await getLogStatsByCategory(db);

      setLogs(logsResult);
      setStats(statsResult);
    } catch (error) {
      console.error('Failed to load logs:', error);
      Alert.alert('Error', 'Failed to load logs');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [db, selectedCategory, selectedLevel]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadLogs();
  }, [loadLogs]);

  const handleClearAllLogs = useCallback(() => {
    Alert.alert(
      'Clear All Logs',
      'Are you sure you want to delete all log entries? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllLogs(db);
              await loadLogs();
              Alert.alert('Success', 'All logs have been cleared');
            } catch (error) {
              console.error('Failed to clear logs:', error);
              Alert.alert('Error', 'Failed to clear logs');
            }
          },
        },
      ]
    );
  }, [db, loadLogs]);

  const handleClearOldLogs = useCallback(() => {
    Alert.alert(
      'Clear Old Logs',
      'This will keep only the most recent 50 log entries and delete the rest.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Old',
          style: 'default',
          onPress: async () => {
            try {
              await clearOldLogs(db, 50);
              await loadLogs();
              Alert.alert('Success', 'Old logs have been cleared');
            } catch (error) {
              console.error('Failed to clear old logs:', error);
              Alert.alert('Error', 'Failed to clear old logs');
            }
          },
        },
      ]
    );
  }, [db, loadLogs]);

  const handleLogDetail = useCallback((log: AppLog) => {
    let metadata = {};
    try {
      metadata = log.metadata ? JSON.parse(log.metadata) : {};
    } catch {
      metadata = {};
    }

    const details = [
      `ID: ${log.id}`,
      `Key: ${log.log_key}`,
      `Category: ${log.category}`,
      `Level: ${log.log_level}`,
      `Status: ${log.status}`,
      `Timestamp: ${new Date(log.timestamp).toLocaleString()}`,
      `Message: ${log.message || 'N/A'}`,
      log.details ? `Details: ${log.details}` : null,
      Object.keys(metadata).length > 0 ? `Metadata: ${JSON.stringify(metadata, null, 2)}` : null,
    ]
      .filter(Boolean)
      .join('\n\n');

    Alert.alert(`Log Entry Details`, details, [{ text: 'Close', onPress: () => {} }]);
  }, []);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const renderLogEntry = (log: AppLog, index: number) => {
    const LevelIcon = LOG_LEVEL_ICONS[log.log_level];

    return (
      <TouchableOpacity key={log.id || index} onPress={() => handleLogDetail(log)}>
        <View className="mb-2 rounded-lg border border-border bg-card p-3">
          <View className="mb-2 flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <LevelIcon size={16} color={theme.colors.text} />
              <Badge className={LOG_LEVEL_COLORS[log.log_level]}>
                <Text className="text-xs font-medium">{log.log_level.toUpperCase()}</Text>
              </Badge>
              <Badge className={CATEGORY_COLORS[log.category]}>
                <Text className="text-xs">{log.category}</Text>
              </Badge>
            </View>
            <Text className="text-xs text-muted-foreground">
              {new Date(log.timestamp).toLocaleString()}
            </Text>
          </View>

          <Text className="mb-1 font-medium">{log.message || 'No message'}</Text>

          {log.details && (
            <Text className="mb-1 text-sm text-muted-foreground" numberOfLines={2}>
              {log.details}
            </Text>
          )}

          <View className="flex-row items-center justify-between">
            <Text className="text-xs text-muted-foreground">Status: {log.status}</Text>
            <Text className="text-xs text-muted-foreground">Key: {log.log_key}</Text>
          </View>
        </View>
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

  const renderStats = () => (
    <Card className="mb-4">
      <CardHeader>
        <CardTitle>Log Statistics</CardTitle>
      </CardHeader>
      <CardContent>
        {stats.length > 0 ? (
          stats.map((stat, index) => (
            <View
              key={index}
              className="flex-row items-center justify-between border-b border-border py-2 last:border-b-0">
              <Text className="font-medium">{stat.category}</Text>
              <View className="flex-row items-center gap-2">
                <Text className="text-sm text-muted-foreground">{stat.total_count} total</Text>
                {stat.error_count > 0 && (
                  <Badge className="bg-red-100 text-red-800">
                    <Text className="text-xs">{stat.error_count} errors</Text>
                  </Badge>
                )}
                {stat.warning_count > 0 && (
                  <Badge className="bg-yellow-100 text-yellow-800">
                    <Text className="text-xs">{stat.warning_count} warns</Text>
                  </Badge>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text className="italic text-muted-foreground">No log statistics available</Text>
        )}
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
          <Button onPress={handleRefresh} className="flex-1" disabled={isRefreshing}>
            <View className="flex-row items-center justify-center gap-2">
              <RefreshCw size={16} color="white" />
              <Text className="text-white">Refresh</Text>
            </View>
          </Button>
          <Button onPress={handleClearOldLogs} variant="secondary" className="flex-1">
            <Text>Clear Old</Text>
          </Button>
        </View>
        <Button onPress={handleClearAllLogs} variant="destructive">
          <View className="flex-row items-center justify-center gap-2">
            <Trash2 size={16} color="white" />
            <Text className="text-white">Clear All Logs</Text>
          </View>
        </Button>
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
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      contentContainerStyle={{ padding: 16 }}>
      {renderStats()}
      {renderFilters()}
      {renderActions()}

      <Card>
        <CardHeader>
          <CardTitle>
            Log Entries ({logs.length}){selectedCategory !== 'all' && ` - ${selectedCategory}`}
            {selectedLevel !== 'all' && ` - ${selectedLevel}`}
          </CardTitle>
        </CardHeader>
        <CardContent>
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
    </ScrollView>
  );
}
