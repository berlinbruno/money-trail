import { migrateSchema } from '@/lib/db/db';
import { Link } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Button, View } from 'react-native';

export default function DebugScreen() {
  const db = useSQLiteContext();
  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Button
        title="Reset DB"
        onPress={async () => {
          await migrateSchema(db);
        }}
      />
      <Link href={'/'} asChild>
        <Button title="Home" />
      </Link>
      <Link href={'/backgroundScreen'} asChild>
        <Button title="Background" />
      </Link>
    </View>
  );
}
