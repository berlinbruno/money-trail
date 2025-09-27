import { CATEGORY_COLORS } from '@/constants/transactionConstants';
import { KPIData, RecentTx, TopDeviationRow, TrendRow } from '@/types/Insight';
import { SQLiteDatabase } from 'expo-sqlite';

export async function getMonthlyKPI(db: SQLiteDatabase): Promise<KPIData> {
  const query = `
    SELECT
      IFNULL(SUM(CASE WHEN type = 'credit' THEN amount END), 0) AS totalIncome,
      IFNULL(SUM(CASE WHEN type = 'debit' THEN amount END), 0) AS totalExpense,
      (
        IFNULL(SUM(CASE WHEN type = 'credit' THEN amount END), 0) -
        IFNULL(SUM(CASE WHEN type = 'debit' THEN amount END), 0)
      ) AS totalSavings
    FROM transactions
    WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now') AND pending_approval = 0;
  `;
  const result = await db.getFirstAsync<KPIData>(query);
  return result ?? { totalIncome: 0, totalExpense: 0, totalSavings: 0 };
}

export async function getRecentTransactions(db: SQLiteDatabase, limit = 5): Promise<RecentTx[]> {
  const query = `
    SELECT
      id,
      title,
      type,
      amount,
      category,
      date
    FROM transactions
    WHERE pending_approval = 0
    ORDER BY date DESC, id DESC
    LIMIT ?;
  `;
  const rows = await db.getAllAsync<RecentTx>(query, [limit]);
  return rows.map((row) => ({
    ...row,
    type: row.type === 'credit' ? 'credit' : 'debit',
  }));
}

export async function getTopDeviations(db: SQLiteDatabase, limit: number = 6): Promise<TrendRow[]> {
  const query = `
    WITH current_month AS (
      SELECT 
        category,
        SUM(amount) AS total
      FROM transactions
      WHERE type = 'debit'
        AND pending_approval = 0
        AND strftime('%Y-%m', date) = strftime('%Y-%m', 'now')
      GROUP BY category
    ),
    last_month AS (
      SELECT 
        category,
        SUM(amount) AS total
      FROM transactions
      WHERE type = 'debit'
        AND pending_approval = 0
        AND strftime('%Y-%m', date) = strftime('%Y-%m', date('now', '-1 month'))
      GROUP BY category
    ),
    combined AS (
      SELECT
        cm.category AS category,
        cm.total AS current_total,
        IFNULL(lm.total, 0) AS last_total,
        (cm.total - IFNULL(lm.total, 0)) AS diff
      FROM current_month cm
      LEFT JOIN last_month lm ON cm.category = lm.category

      UNION ALL

      SELECT
        lm.category AS category,
        0 AS current_total,
        lm.total AS last_total,
        (0 - lm.total) AS diff
      FROM last_month lm
      LEFT JOIN current_month cm ON cm.category = lm.category
      WHERE cm.category IS NULL
    )
    SELECT 
      ROW_NUMBER() OVER (ORDER BY ABS(diff) DESC) AS id,
      category AS label,
      current_total AS value,
      CASE 
        WHEN diff > 0 THEN 'up'
        WHEN diff < 0 THEN 'down'
        ELSE 'flat'
      END AS direction
    FROM combined
    ORDER BY ABS(diff) DESC
    LIMIT ?;
  `;
  const rows = await db.getAllAsync<TopDeviationRow>(query, [limit]);
  return rows.map((row) => ({
    ...row,
    value: Number(row.value),
    color: CATEGORY_COLORS[row.label as keyof typeof CATEGORY_COLORS],
  }));
}
