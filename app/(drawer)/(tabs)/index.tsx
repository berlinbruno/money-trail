import {
  DashboardKPISection,
  DashboardNotificationsSection,
  DashboardQuickActionsSection,
  DashboardRecentTransactionsSection,
  DashboardTrendsSection,
} from '@/components/dashboard';
import { useToastHelpers } from '@/contexts/ToastProvider';
import {
  getMonthlyKPI,
  getRecentTransactions,
  getTopDeviations,
} from '@/lib/database/dashboardQueries';
import {
  getAlertsWithProgress,
  getUnreadNotifications,
  insertAlertNotifications,
} from '@/lib/database/notificationQueries';
import { INotificationRow } from '@/types/Common';
import { KPIData, RecentTx, TrendRow } from '@/types/Insight';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';

export default function DashboardScreen() {
  const db = useSQLiteContext();
  const { showError } = useToastHelpers();
  const [monthlyKPIData, setMonthlyKPIData] = useState<KPIData>({
    totalIncome: 0,
    totalExpense: 0,
    totalSavings: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTx[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<TrendRow[]>([]);
  const [notifications, setNotifications] = useState<INotificationRow[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(
    async (showLoader = true) => {
      if (showLoader) setIsRefreshing(true);
      try {
        const [transactions, kpiData, trendsData, unreadNotifications] = await Promise.all([
          getRecentTransactions(db),
          getMonthlyKPI(db),
          getTopDeviations(db),
          getUnreadNotifications(db, 3),
        ]);
        setRecentTransactions(transactions);
        setMonthlyKPIData(kpiData);
        setMonthlyTrends(trendsData);
        setNotifications(unreadNotifications);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showError({
          title: 'Dashboard Loading Failed',
          description: 'Unable to load dashboard data',
        });
      } finally {
        if (showLoader) setIsRefreshing(false);
      }
    },
    [db, showError]
  );

  const insertAlerts = useCallback(async () => {
    try {
      const alertsData = await getAlertsWithProgress(db);
      await insertAlertNotifications(db, alertsData);
    } catch (error) {
      console.error('Error inserting alert notifications:', error);
      // Silent error - this is a background operation
    }
  }, [db]);

  // Load data on mount
  useEffect(() => {
    fetchDashboardData(false); // Silent initial load
    insertAlerts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Safe to disable - we only want this to run once on mount

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchDashboardData(false); // Don't double-set loading
      await insertAlerts();
      // Silent refresh - no toast needed for pull-to-refresh
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchDashboardData, insertAlerts]);

  const handleMarkedRead = useCallback(
    async (id: number) => {
      try {
        setNotifications((prev) => prev.filter((n) => n.id !== String(id)));
        const unread = await getUnreadNotifications(db, 3);
        setNotifications(unread);
      } catch (error) {
        console.error('Error marking notification as read:', error);
        showError({
          title: 'Notification Error',
          description: 'Unable to mark notification as read',
        });
      }
    },
    [db, showError]
  );

  const handleClearAll = useCallback(async () => {
    try {
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      showError({
        title: 'Clear Failed',
        description: 'Unable to clear notifications',
      });
    }
  }, [showError]);
  return (
    <ScrollView
      className="p-2"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={['#177AD5']}
          tintColor="#177AD5"
        />
      }>
      <DashboardKPISection kpiData={monthlyKPIData} />

      <DashboardRecentTransactionsSection recentTransactions={recentTransactions} />

      <DashboardQuickActionsSection />

      <DashboardNotificationsSection
        notifications={notifications}
        onMarkedRead={handleMarkedRead}
        onClearAll={handleClearAll}
      />

      <DashboardTrendsSection monthlyTrends={monthlyTrends} />
    </ScrollView>
  );
}
