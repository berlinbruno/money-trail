import TransactionCard from '@/components/transaction/TransactionCard';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { Transaction } from '@/types/Transaction';
import { useTheme } from '@react-navigation/native';
import React from 'react';
import { RefreshControl, View } from 'react-native';
import { SwipeListView } from 'react-native-swipe-list-view';

interface TransactionAction {
  label: string;
  variant: 'default' | 'destructive' | 'success';
  onPress: (id: string) => void;
}

interface TransactionListViewProps {
  transactions: Transaction[] | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  actions: TransactionAction[];
  leftAction?: TransactionAction; // Optional left swipe action (like Delete for approval screen)
}

/**
 * Reusable SwipeListView component for transactions
 * Handles rendering, swipe actions, and refresh control
 */
export default function TransactionListView({
  transactions,
  isRefreshing,
  onRefresh,
  actions,
  leftAction,
}: TransactionListViewProps) {
  const theme = useTheme();

  const renderHiddenItem = ({ item }: { item: Transaction }) => {
    const rightActions = actions.slice(); // Copy actions array

    return (
      <View className="m-1 h-20 flex-row items-start justify-between">
        {/* Left action (optional) */}
        {leftAction && (
          <Button
            size={null}
            variant={leftAction.variant}
            onPress={() => leftAction.onPress(item.id)}
            className="ml-1 h-full w-24 rounded-none rounded-l-lg">
            <Text>{leftAction.label}</Text>
          </Button>
        )}

        {/* Right actions */}
        <View className="h-20 flex-1 flex-row justify-end">
          {rightActions.map((action, index) => (
            <Button
              key={action.label}
              variant={action.variant}
              size={null}
              onPress={() => action.onPress(item.id)}
              className={`h-full w-24 rounded-none ${
                index === rightActions.length - 1 ? 'mr-1 rounded-r-lg' : ''
              }`}>
              <Text>{action.label}</Text>
            </Button>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SwipeListView
      data={transactions}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          colors={[theme.colors.background]}
          tintColor={theme.colors.primary}
        />
      }
      renderItem={({ item }) => (
        <TransactionCard
          title={item.title}
          amount={item.amount}
          date={item.date}
          type={item.type}
          category={item.category}
        />
      )}
      renderHiddenItem={renderHiddenItem}
      leftOpenValue={leftAction ? 90 : 0}
      stopLeftSwipe={leftAction ? 90 : 0}
      rightOpenValue={-(actions.length * 96)}
      stopRightSwipe={-(actions.length * 96)}
      disableRightSwipe={actions.length === 0}
      refreshing={isRefreshing}
      onRefresh={onRefresh}
    />
  );
}
