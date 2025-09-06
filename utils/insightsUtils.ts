// Utility to calculate total income, expense, savings from a dataset
import { CategoryBreakdown, TimeSeriesRecord, insightsDataset } from '@/types/Insight';
import { TransactionCategory } from '@/types/Transaction';

export interface InsightsTotals {
  totalIncome: number;
  totalExpense: number;
  totalSavings: number;
  totalPreviousIncome: number;
  totalPreviousExpense: number;
  totalPreviousSavings: number;
  maxIncome: number;
  maxExpense: number;
  maxSavings: number;
  maxPreviousIncome: number;
  maxPreviousExpense: number;
  maxPreviousSavings: number;
}

export function calculateTotals(
  dataset: insightsDataset | null,
  rangeLabel: keyof insightsDataset
): InsightsTotals {
  const data = dataset?.[rangeLabel] ?? {
    incomes: [],
    expenses: [],
    savings: [],
    previousIncomes: [],
    previousExpenses: [],
    previousSavings: [],
    labels: [],
  };

  const sum = (arr: number[] = []) => arr.reduce((s, v) => s + (v ?? 0), 0);
  const max = (arr: number[] = []) => (arr.length ? Math.max(...arr.map((v) => v ?? 0)) : 0);

  return {
    totalIncome: sum(data.incomes),
    totalExpense: sum(data.expenses),
    totalSavings: sum(data.savings),
    totalPreviousIncome: sum(data.previousIncomes),
    totalPreviousExpense: sum(data.previousExpenses),
    totalPreviousSavings: sum(data.previousSavings),

    maxIncome: max(data.incomes),
    maxExpense: max(data.expenses),
    maxSavings: max(data.savings),
    maxPreviousIncome: max(data.previousIncomes),
    maxPreviousExpense: max(data.previousExpenses),
    maxPreviousSavings: max(data.previousSavings),
  };
}

export function transformTimeSeries(records: TimeSeriesRecord[]) {
  return {
    labels: records.map((r) => r.label),
    incomes: records.map((r) => r.income ?? 0),
    expenses: records.map((r) => r.expense ?? 0),
    savings: records.map((r) => r.savings ?? 0),
    previousIncomes: records.map((r) => r.previousIncome ?? 0),
    previousExpenses: records.map((r) => r.previousExpense ?? 0),
    previousSavings: records.map((r) => r.previousSavings ?? 0),
  };
}

export function getBarChartData(
  timeSeriesData: insightsDataset | null,
  rangeKey: keyof insightsDataset,
  BAR_COLORS: any
) {
  if (!timeSeriesData?.[rangeKey]) return [];

  const { labels, incomes, expenses, savings } = timeSeriesData[rangeKey];
  const bars = [];

  for (let i = 0; i < labels.length; i++) {
    const inc = incomes[i];
    const exp = expenses[i];
    const sav = savings[i];

    // Group bars together for each label
    bars.push(
      {
        value: inc,
        label: labels[i],
        spacing: 2,
        labelWidth: 60,
        frontColor: BAR_COLORS.income,
        type: 'Income',
      },
      {
        value: exp,
        label: '',
        spacing: 2,
        labelWidth: 40,
        frontColor: BAR_COLORS.expense,
        type: 'Expense',
      },
      {
        value: sav,
        label: '',
        spacing: 20,
        labelWidth: 40,
        frontColor: BAR_COLORS.saving,
        type: 'Saving',
      }
    );
  }

  return bars;
}

export function getTrendLineData(
  timeSeriesData: insightsDataset | null,
  rangeKey: keyof insightsDataset
) {
  if (!timeSeriesData?.[rangeKey]) return null;
  const { labels, incomes, expenses, savings, previousIncomes, previousExpenses, previousSavings } =
    timeSeriesData[rangeKey];
  const mapValues = (arr: number[]) =>
    arr.map((v, i) => ({ value: v, label: labels[i], dataPointText: String(v) }));
  return {
    incomes: mapValues(incomes),
    expenses: mapValues(expenses),
    savings: mapValues(savings),
    previousIncomes: mapValues(previousIncomes),
    previousExpenses: mapValues(previousExpenses),
    previousSavings: mapValues(previousSavings),
  };
}

export function getPieChartData(
  categories: CategoryBreakdown[],
  focused: CategoryBreakdown | null
) {
  if (!categories.length) return [];
  return categories.map((cat) => ({
    value: cat.value,
    color: cat.color,
    gradientCenterColor: cat.gradientCenterColor,
    category: cat.category as TransactionCategory,
    focused: focused?.category === cat.category,
  }));
}

export function calculateStep(
  values: number[],
  noOfSections: number = 5,
  minStep: number = 10
): number {
  if (!values.length) return minStep;
  const maxValue = Math.max(...values);
  if (maxValue <= 0) return minStep;
  // Use a slightly higher axis max for better chart centering
  const axisMax = Math.max(Math.ceil(maxValue * 1.1), minStep * noOfSections);
  const roughStep = axisMax / noOfSections;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude;
  let niceNormalized: number;
  if (normalized < 1.5) niceNormalized = 1;
  else if (normalized < 3) niceNormalized = 2;
  else if (normalized < 7) niceNormalized = 5;
  else niceNormalized = 10;
  const step = Math.max(niceNormalized * magnitude, minStep);
  return step;
}

export function generateYAxisLabels(values: number[], noOfSections: number = 5): string[] {
  if (!values.length) return [];
  const maxValue = Math.max(...values);
  const step = calculateStep(values, noOfSections);
  const labels: string[] = [];
  for (let i = 0; i <= noOfSections; i++) {
    const value = i * step;
    labels.push(formatAxisLabel(value));
  }
  // Optionally, add one more label above maxValue
  labels.push(formatAxisLabel(maxValue + step));
  return labels;
}

export function formatAxisLabel(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(value % 1_000_000_000 === 0 ? 0 : 1) + 'B';
  } else if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1) + 'M';
  } else if (value >= 1_000) {
    return (value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1) + 'K';
  }
  return value.toString();
}
