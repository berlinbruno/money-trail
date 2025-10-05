import {
  DashboardKPISection,
  DashboardNotificationsSection,
  DashboardQuickActionsSection,
  DashboardRecentTransactionsSection,
  DashboardTrendsSection,
} from '@/components/dashboard';
import { useApp } from '@/contexts/AppContext';
import { useToast } from '@/contexts/ToastProvider';
import { useTransactionState } from '@/hooks/useTransactionState';
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
  const { showToast } = useToast();
  const { state: appState, actions: appActions } = useApp();
  const { pendingCount } = useTransactionState();

  const [monthlyKPIData, setMonthlyKPIData] = useState<KPIData>({
    totalIncome: 0,
    totalExpense: 0,
    totalSavings: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTx[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<TrendRow[]>([]);
  const [notifications, setNotifications] = useState<INotificationRow[]>([]);

  // Fetch pending transaction count is now handled by useTransactionState
  const fetchPendingCount = useCallback(async () => {
    // This function now triggers a refresh which will update pendingCount via useTransactionState
    appActions.triggerTransactionRefresh();
  }, [appActions]);

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
    } catch (error) {
      console.error('Error inserting alert notifications:', error);
      // Silent error - this is a background operation
    }
  }, [db]);

  // Load data on mount and when transaction triggers change
  useEffect(() => {
    fetchDashboardData(false); // Silent initial load
    insertAlerts();
  }, [fetchDashboardData, insertAlerts, appState.dashboardUpdateTrigger]);

  const onRefresh = useCallback(async () => {
    appActions.setRefreshing(true);
    try {
      await fetchDashboardData(false); // Don't double-set loading
      await insertAlerts();
      // Silent refresh - no toast needed for pull-to-refresh
    } finally {
      appActions.setRefreshing(false);
    }
  }, [fetchDashboardData, insertAlerts, appActions]);

  const handleMarkedRead = useCallback(
    async (id: number) => {
      try {
        setNotifications((prev) => prev.filter((n) => n.id !== String(id)));
        const unread = await getUnreadNotifications(db, 3);
        setNotifications(unread);
      } catch (error) {
        console.error('Error marking notification as read:', error);
        showToast('Unable to mark notification as read');
      }
    },
    [db, showToast]
  );

  const handleClearAll = useCallback(async () => {
    try {
      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
      showToast('Unable to clear notifications');
    }
  }, [showToast]);
  return (
    <ScrollView
      className="p-2"
      refreshControl={
        <RefreshControl
          refreshing={appState.isRefreshing}
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
