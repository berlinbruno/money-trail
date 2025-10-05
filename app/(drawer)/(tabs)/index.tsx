import {
  DashboardKPISection,
  DashboardNotificationsSection,
  DashboardQuickActionsSection,
  DashboardRecentTransactionsSection,
  DashboardTrendsSection,
} from '@/components/dashboard';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastProvider';
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
import { getPendingTransactionCount } from '@/lib/database/transactionQueries';
import { INotificationRow } from '@/types/Common';
import { KPIData, RecentTx, TrendRow } from '@/types/Insight';
import { useTheme } from '@react-navigation/native';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';

export default function DashboardScreen() {
  const theme = useTheme();
  const db = useSQLiteContext();
  const { showToast } = useToast();
  const { state: appState, actions: appActions } = useApp();

  const [monthlyKPIData, setMonthlyKPIData] = useState<KPIData>({
    totalIncome: 0,
    totalExpense: 0,
    totalSavings: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTx[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<TrendRow[]>([]);
  const [notifications, setNotifications] = useState<INotificationRow[]>([]);
  const [pendingCount, setPendingCount] = useState<number>(0);

  const fetchPendingCount = useCallback(async () => {
    try {
      const count = await getPendingTransactionCount(db);
      setPendingCount(count);
    } catch (error) {
      console.error('Error fetching pending count:', error);
    }
  }, [db]);

  const fetchDashboardData = useCallback(
    async (showLoader = true) => {
      if (showLoader) appActions.setRefreshing(true);
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

        // Mark dashboard as updated
        appActions.markDashboardUpdated();
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        showToast('Unable to load dashboard data');
      } finally {
        if (showLoader) appActions.setRefreshing(false);
      }
    },
    [db, showToast, appActions]
  );

  const insertAlerts = useCallback(async () => {
    try {
      const alertsData = await getAlertsWithProgress(db);
      await insertAlertNotifications(db, alertsData);
      // Don't trigger notifications refresh here - it will be triggered by the useEffect
      // when notifications are actually created in the database
    } catch (error) {
      console.error('Error inserting alert notifications:', error);
      // Silent error - this is a background operation
    }
  }, [db]);

  // Load data on mount and when triggers change
  useEffect(() => {
    fetchDashboardData(false); // Silent initial load
  }, [fetchDashboardData, appState.dashboardUpdateTrigger]);

  // Run alert checking only on initial load and then periodically (every 5 minutes)
  useEffect(() => {
    // Initial alert check
    insertAlerts();

    // Set up periodic alert checking (every 5 minutes)
    const alertInterval = setInterval(
      () => {
        insertAlerts();
      },
      5 * 60 * 1000
    ); // 5 minutes

    // Cleanup interval on unmount
    return () => clearInterval(alertInterval);
  }, [insertAlerts]); // Only depend on insertAlerts, not dashboard triggers

  // Load notifications when notifications trigger changes
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const unreadNotifications = await getUnreadNotifications(db, 3);
        setNotifications(unreadNotifications);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    fetchNotifications();
  }, [db, appState.notificationsUpdateTrigger]);

  // Load KPI data when kpi trigger changes
  useEffect(() => {
    const fetchKPI = async () => {
      try {
        const kpiData = await getMonthlyKPI(db);
        setMonthlyKPIData(kpiData);
      } catch (error) {
        console.error('Error fetching KPI data:', error);
      }
    };
    fetchKPI();
  }, [db, appState.kpiUpdateTrigger]);

  // Load recent transactions when recent transactions trigger changes
  useEffect(() => {
    const fetchRecent = async () => {
      try {
        const recent = await getRecentTransactions(db, 5);
        setRecentTransactions(recent);
      } catch (error) {
        console.error('Error fetching recent transactions:', error);
      }
    };
    fetchRecent();
  }, [db, appState.recentTransactionsTrigger]);

  // Load pending count when pending transaction count trigger changes
  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount, appState.pendingTransactionCountTrigger]);

  const onRefresh = useCallback(async () => {
    appActions.setRefreshing(true);
    try {
      await fetchDashboardData(false); // Don't double-set loading
      // Don't call insertAlerts here - it runs on its own schedule
      // Silent refresh - no toast needed for pull-to-refresh
    } finally {
      appActions.setRefreshing(false);
    }
  }, [fetchDashboardData, appActions]);

  const handleMarkedRead = useCallback(
    async (id: number) => {
      try {
        // Optimistically update local state first
        setNotifications((prev) => prev.filter((n) => n.id !== String(id)));

        // Then refresh from database to ensure consistency
        const unread = await getUnreadNotifications(db, 3);
        setNotifications(unread);

        // Don't trigger notifications refresh here - it creates a loop
        // The mark as read operation happens in the NotificationCard component
      } catch (error) {
        console.error('Error marking notification as read:', error);
        showToast('Unable to mark notification as read');
        // Revert optimistic update on error
        const unread = await getUnreadNotifications(db, 3);
        setNotifications(unread);
      }
    },
    [db, showToast]
  );

  const handleClearAll = useCallback(async () => {
    try {
      // Optimistically clear local state first
      setNotifications([]);

      // Don't trigger notifications refresh here - it creates a loop
      // The clear all operation happens in the NotificationSection component
    } catch (error) {
      console.error('Error clearing notifications:', error);
      showToast('Unable to clear notifications');
      // Revert optimistic update on error
      const unread = await getUnreadNotifications(db, 3);
      setNotifications(unread);
    }
  }, [showToast, db]);
  return (
    <ScrollView
      className="p-2"
      refreshControl={
        <RefreshControl
          refreshing={appState.isRefreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.background]}
          tintColor={theme.colors.primary}
        />
      }>
      <DashboardKPISection kpiData={monthlyKPIData} />

      <DashboardRecentTransactionsSection recentTransactions={recentTransactions} />

      <DashboardQuickActionsSection pendingCount={pendingCount} />

      <DashboardNotificationsSection
        notifications={notifications}
        onMarkedRead={handleMarkedRead}
        onClearAll={handleClearAll}
      />

      <DashboardTrendsSection monthlyTrends={monthlyTrends} />
    </ScrollView>
  );
}
