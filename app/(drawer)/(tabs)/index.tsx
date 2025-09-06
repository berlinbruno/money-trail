import { DashboardNotificationsSection } from '@/components/dashboard/DashboardNotificationsSection';
import { DashboardKPISection } from '@/components/dashboard/KPISection';
import { DashboardQuickActionsSection } from '@/components/dashboard/QuickActionsSection';
import { DashboardRecentTransactionsSection } from '@/components/dashboard/RecentTransactionsSection';
import { DashboardTrendsSection } from '@/components/dashboard/TrendsSection';
import { getMonthlyKPI, getRecentTransactions, getTopDeviations } from '@/lib/db/dashboardQueries';
import {
  getAlertsWithProgress,
  getUnreadNotifications,
  insertAlertNotifications,
} from '@/lib/db/notificationQueries';
import { INotificationRow } from '@/types/Common';
import { KPIData, RecentTx, TrendRow } from '@/types/Insight';
import { useSQLiteContext } from 'expo-sqlite';
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';

export default function DashboardScreen() {
  const db = useSQLiteContext();
  const [monthlyKPIData, setMonthlyKPIData] = useState<KPIData>({
    totalIncome: 0,
    totalExpense: 0,
    totalSavings: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTx[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<TrendRow[]>([]);
  const [notifications, setNotifications] = useState<INotificationRow[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const [transactions, kpiData, trendsData, unreadNotifications] = await Promise.all([
        getRecentTransactions(db),
        getMonthlyKPI(db),
        getTopDeviations(db),
        getUnreadNotifications(db, 5),
      ]);
      setRecentTransactions(transactions);
      setMonthlyKPIData(kpiData);
      setMonthlyTrends(trendsData);
      setNotifications(unreadNotifications);
    } finally {
      setIsRefreshing(false);
    }
  }, [db]);

  const insertAlerts = useCallback(async () => {
    const alertsData = await getAlertsWithProgress(db);
    await insertAlertNotifications(db, alertsData);
  }, [db]);

  useEffect(() => {
    fetchDashboardData();
    insertAlerts();
  }, [fetchDashboardData, insertAlerts]);

  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    try {
      fetchDashboardData();
      insertAlerts();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchDashboardData, insertAlerts]);

  const handleMarkedRead = useCallback(
    async (id: number) => {
      setNotifications((prev) => prev.filter((n) => n.id !== String(id)));
      const unread = await getUnreadNotifications(db, 5);
      setNotifications(unread);
    },
    [db]
  );
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
      />

      <DashboardTrendsSection monthlyTrends={monthlyTrends} />
    </ScrollView>
  );
}
