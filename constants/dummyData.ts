import { SQLiteDatabase } from 'expo-sqlite';

export async function insertDummyData(db: SQLiteDatabase) {
  // --- Transactions ---
  await db.execAsync(`
    INSERT INTO transactions (account, type, title, amount, date, mode, category, source, pending_approval)
    VALUES 
      ('HDFC', 'debit', 'Grocery Shopping', 1200, '2025-08-15', 'upi', 'grocery', 'manual', 0),
      ('HDFC', 'credit', 'Salary', 50000, '2025-08-01', 'other', 'salary', 'manual', 0),
      ('ICICI', 'debit', 'Fuel', 3000, '2025-08-10', 'card', 'fuel', 'manual', 0),
      ('ICICI', 'debit', 'Rent', 15000, '2025-08-01', 'neft', 'rent', 'manual', 0),
      ('HDFC', 'credit', 'Investment Refund', 2000, '2025-08-05', 'other', 'refund', 'api', 0);
  `);

  // --- Alerts ---
  await db.execAsync(`
    INSERT INTO alerts (type, frequency, category, threshold)
    VALUES
      ('income', 'monthly', 'salary', 50000),
      ('income', 'monthly', 'investments', 10000),
      ('spending', 'weekly', 'grocery', 2000),
      ('spending', 'monthly', 'rent', 15000),
      ('spending', 'weekly', 'fuel', 1500);
  `);

  // --- Notifications ---
  await db.execAsync(`
    INSERT INTO notifications (type, title, message, severity, is_read)
    VALUES
      ('transaction', 'New Transaction', '₹1200 spent on Grocery Shopping.', 'medium', 0),
      ('transaction', 'New Transaction', '₹50000 received as Salary.', 'success', 0),
      ('alert', 'Income Alert', 'You have reached 100% of your salary goal.', 'high', 0),
      ('alert', 'Spending Alert', 'You have used 85% of your grocery weekly budget.', 'high', 0),
      ('system', 'Welcome', 'Welcome to your finance tracker app!', 'info', 1);
  `);
}
