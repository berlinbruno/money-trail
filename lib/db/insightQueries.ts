import { CATEGORY_COLORS } from '@/constants/transactionConstants';
import { CategoryBreakdown, InsightsSummary, Period, TimeSeriesRecord } from '@/types/Insight';
import { TransactionCategory } from '@/types/Transaction';
import { getDateCondition } from '@/utils/dbUtils';
import { SQLiteDatabase } from 'expo-sqlite';

export async function fetchIncomeExpenseTrend(
  db: SQLiteDatabase,
  period: Period
): Promise<TimeSeriesRecord[]> {
  let query: string;
  let prevQuery: string;
  let labels: string[];

  switch (period) {
    case 'Weekly':
      query = `
        SELECT 
          strftime('%w', date) AS day_of_week,
          SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS expense,
          SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS savings
        FROM transactions
        WHERE ${getDateCondition('Weekly')} AND pending_approval = 0
        GROUP BY day_of_week
        ORDER BY day_of_week;
      `;
      prevQuery = `
        SELECT 
          strftime('%w', date) AS day_of_week,
          SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS expense,
          SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS savings
        FROM transactions
        WHERE date >= date('now', '-13 days') AND date < date('now', '-6 days') AND pending_approval = 0
        GROUP BY day_of_week
        ORDER BY day_of_week;
      `;
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      break;

    case 'Monthly':
      query = `
        SELECT 
          (CAST(strftime('%W', date) AS INTEGER) - CAST(strftime('%W', date('now', 'start of month')) AS INTEGER) + 1) AS week_of_month,
          SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS expense,
          SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS savings
        FROM transactions
        WHERE ${getDateCondition('Monthly')} AND pending_approval = 0
        GROUP BY week_of_month
        ORDER BY week_of_month;
      `;
      prevQuery = `
        SELECT 
          (CAST(strftime('%W', date) AS INTEGER) - CAST(strftime('%W', date('now', 'start of month', '-1 month')) AS INTEGER) + 1) AS week_of_month,
          SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS expense,
          SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS savings
        FROM transactions
        WHERE date >= date('now', 'start of month', '-1 month') AND date < date('now', 'start of month') AND pending_approval = 0
        GROUP BY week_of_month
        ORDER BY week_of_month;
      `;
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      break;

    case 'Yearly':
      query = `
        SELECT 
          strftime('%m', date) AS month,
          SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS expense,
          SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS savings
        FROM transactions
        WHERE ${getDateCondition('Yearly')} AND pending_approval = 0
        GROUP BY month
        ORDER BY month;
      `;
      prevQuery = `
        SELECT 
          strftime('%m', date) AS month,
          SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) AS income,
          SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS expense,
          SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) - SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) AS savings
        FROM transactions
        WHERE date >= date('now', 'start of year', '-1 year') AND date < date('now', 'start of year') AND pending_approval = 0
        GROUP BY month
        ORDER BY month;
      `;
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      break;

    default:
      throw new Error(`Unsupported period: ${period}`);
  }

  const rows = (await db.getAllAsync(query)) as {
    day_of_week?: string;
    week_of_month?: number;
    month?: string;
    income: number;
    expense: number;
    savings: number;
  }[];

  const prevRows = (await db.getAllAsync(prevQuery)) as {
    day_of_week?: string;
    week_of_month?: number;
    month?: string;
    income: number;
    expense: number;
    savings: number;
  }[];

  // Pre-fill result
  const result: TimeSeriesRecord[] = labels.map((label) => ({
    label,
    income: 0,
    expense: 0,
    savings: 0,
    prevIncome: 0,
    prevExpense: 0,
    prevSavings: 0,
  }));

  // Map current period data
  rows.forEach((row) => {
    let index: number;
    if (period === 'Weekly') {
      index = row.day_of_week === '0' ? 6 : Number(row.day_of_week) - 1;
    } else if (period === 'Monthly') {
      index = (row.week_of_month ?? 1) - 1;
    } else {
      index = parseInt(row.month ?? '1', 10) - 1;
    }
    if (index >= 0 && index < result.length) {
      result[index].income = row.income;
      result[index].expense = row.expense;
      result[index].savings = row.savings < 0 ? 0 : row.savings;
    }
  });

  // Map previous period data
  prevRows.forEach((row) => {
    let index: number;
    if (period === 'Weekly') {
      index = row.day_of_week === '0' ? 6 : Number(row.day_of_week) - 1;
    } else if (period === 'Monthly') {
      index = (row.week_of_month ?? 1) - 1;
    } else {
      index = parseInt(row.month ?? '1', 10) - 1;
    }
    if (index >= 0 && index < result.length) {
      result[index].previousIncome = row.income;
      result[index].previousExpense = row.expense;
      result[index].previousSavings = row.savings < 0 ? 0 : row.savings;
    }
  });

  return result;
}

export async function fetchInsightsSummary(
  db: SQLiteDatabase,
  period: Period
): Promise<InsightsSummary> {
  const dateCondition = getDateCondition(period);

  const highestSpend = await db.getFirstAsync<{ category: string; highest_amount: number }>(`
    SELECT COALESCE(category, 'N/A') as category, COALESCE(MAX(amount), 0) as highest_amount
    FROM transactions
    WHERE type = 'debit' AND pending_approval = 0 AND (${dateCondition})
  `);

  const avgSpend = await db.getFirstAsync<{ avg_spend: number }>(`
    SELECT COALESCE(AVG(amount), 0) as avg_spend
    FROM transactions
    WHERE type = 'debit' AND pending_approval = 0 AND (${dateCondition})
  `);

  const totals = await db.getFirstAsync<{ total_income: number; total_expense: number }>(`
    SELECT
      COALESCE(SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END), 0) as total_income,
      COALESCE(SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END), 0) as total_expense
    FROM transactions
    WHERE pending_approval = 0 AND (${dateCondition})
  `);

  return {
    highestExpenseAmount: highestSpend?.highest_amount ?? 0,
    highestExpenseCategory: highestSpend?.category ?? 'N/A',
    averageExpense: avgSpend?.avg_spend ?? 0,
    totalIncome: totals?.total_income ?? 0,
    totalExpense: totals?.total_expense ?? 0,
  };
}

export async function fetchCategoryBreakdown(
  db: SQLiteDatabase,
  period: Period
): Promise<{ incomeCategories: CategoryBreakdown[]; expenseCategories: CategoryBreakdown[] }> {
  const query = `
    SELECT 
      category,
      type,
      SUM(amount) AS total_amount
    FROM transactions
    WHERE ${getDateCondition(period)} AND pending_approval = 0
    GROUP BY category, type
    ORDER BY total_amount DESC;
  `;

  const rows = (await db.getAllAsync(query)) as {
    category: string;
    type: string;
    total_amount: number;
  }[];

  const { incomeCategories, expenseCategories } = rows.reduce(
    (acc, { category, type, total_amount }) => {
      const typedCategory = category as TransactionCategory;
      const color = CATEGORY_COLORS[typedCategory] || '#000000';
      const entry: CategoryBreakdown = {
        category: typedCategory,
        value: total_amount ?? 0,
        color,
        gradientCenterColor: color,
        focused: false,
      };
      if (type === 'credit') acc.incomeCategories.push(entry);
      else if (type === 'debit') acc.expenseCategories.push(entry);
      return acc;
    },
    { incomeCategories: [], expenseCategories: [] } as {
      incomeCategories: CategoryBreakdown[];
      expenseCategories: CategoryBreakdown[];
    }
  );

  return { incomeCategories, expenseCategories };
}
