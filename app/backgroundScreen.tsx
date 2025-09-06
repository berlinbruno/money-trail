import { FinanceSms, getSmsHistory, initializeBackgroundTask } from '@/lib/smsBackgroundTask';
import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { useEffect, useRef, useState } from 'react';
import { AppState, AppStateStatus, Button, ScrollView, StyleSheet, Text, View } from 'react-native';

// Debugging: list registered tasks
TaskManager.getRegisteredTasksAsync().then((tasks) => {
  console.log(tasks);
});

// Promise resolver for background task init
let resolver: (() => void) | null;
const promise = new Promise<void>((resolve) => {
  resolver = resolve;
});
initializeBackgroundTask(promise);

export default function BackgroundTaskScreen() {
  // Removed unused 'status' state
  const [smsHistory, setSmsHistory] = useState<FinanceSms[]>([]);
  const appState = useRef(AppState.currentState);

  const loadSmsHistory = async () => {
    const history = await getSmsHistory();
    if (history) {
      setSmsHistory(history);
    }
  };

  useEffect(() => {
    // Resolve when inner app is mounted
    if (resolver) {
      resolver();
      console.log('Resolver called');
    }

    // Load initial SMS data
    loadSmsHistory();

    // Listen to app state changes
    const sub = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App foregrounded, reload SMS history');
        loadSmsHistory();
      }
      if (appState.current.match(/active/) && nextAppState === 'background') {
        console.log('App backgrounded');
      }
      appState.current = nextAppState;
    });

    return () => {
      sub.remove();
    };
  }, []);

  return (
    <ScrollView style={styles.screen}>
      <View style={styles.textContainer}></View>

      <View style={styles.smsContainer}>
        <Text style={styles.sectionTitle}>Latest SMS:</Text>
        {smsHistory.length > 0 ? (
          <View style={styles.smsCard}>
            <Text style={styles.smsAddress}>From: {smsHistory[0].address}</Text>
            <Text style={styles.smsBody}>{smsHistory[0].body}</Text>
            <Text style={styles.smsTimestamp}>{new Date(smsHistory[0].date).toLocaleString()}</Text>
          </View>
        ) : (
          <Text>No SMS captured yet</Text>
        )}

        {smsHistory.length > 1 && (
          <>
            <Text style={[styles.sectionTitle, styles.previousTitle]}>Previous SMS:</Text>
            {smsHistory.slice(1).map((sms, index) => (
              <View key={index} style={[styles.smsCard, index === 0 && styles.previousSms]}>
                <Text style={styles.smsAddress}>From: {sms.address}</Text>
                <Text style={styles.smsBody}>{sms.body}</Text>
                <Text style={styles.smsTimestamp}>{new Date(sms.date).toLocaleString()}</Text>
              </View>
            ))}
          </>
        )}
      </View>

      <Button
        title="Run Background Task (Debug)"
        onPress={async () => {
          await BackgroundTask.triggerTaskWorkerForTestingAsync();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
  },
  textContainer: {
    margin: 10,
    marginTop: 60,
  },
  smsContainer: {
    margin: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  previousTitle: {
    marginTop: 20,
  },
  smsCard: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  previousSms: {
    backgroundColor: '#e8e8e8',
    opacity: 0.8,
  },
  smsAddress: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  smsBody: {
    fontSize: 16,
    marginBottom: 8,
  },
  smsTimestamp: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
});
