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

/**
 * Transforms time series records into structured dataset
 * @param records Array of time series records
 * @returns Structured object with separated data arrays
 */
export function transformTimeSeries(records: TimeSeriesRecord[]) {
  // Simply use map functions for type safety
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

/**
 * Optimizes and creates data for bar chart visualization
 * @param timeSeriesData Dataset containing time series data
 * @param rangeKey Key identifying which time range to use
 * @param BAR_COLORS Color configuration for different bar types
 * @returns Array of bar chart data points ready for visualization
 */
export function getBarChartData(
  timeSeriesData: insightsDataset | null,
  rangeKey: keyof insightsDataset,
  BAR_COLORS: Record<string, string>
) {
  if (!timeSeriesData?.[rangeKey]) return [];

  const { labels, incomes, expenses, savings } = timeSeriesData[rangeKey];
  const barGroups = [];

  // Build data points for all labels in a single pass
  for (let i = 0; i < labels.length; i++) {
    // Create a group of bars for each time period
    barGroups.push(
      // Income bar
      {
        value: incomes[i],
        label: labels[i],
        spacing: 2,
        labelWidth: 60,
        frontColor: BAR_COLORS.income,
        type: 'Income',
      },
      // Expense bar
      {
        value: expenses[i],
        label: '',
        spacing: 2,
        labelWidth: 40,
        frontColor: BAR_COLORS.expense,
        type: 'Expense',
      },
      // Savings bar with extra spacing after group
      {
        value: savings[i],
        label: '',
        spacing: 20, // Extra spacing after this group
        labelWidth: 40,
        frontColor: BAR_COLORS.saving,
        type: 'Saving',
      }
    );
  }

  return barGroups;
}

/**
 * Transforms time series data for line chart visualization
 * @param timeSeriesData Dataset containing time series records
 * @param rangeKey Key identifying which time range to use
 * @returns Processed data for trend line visualization or null if no data
 */
export function getTrendLineData(
  timeSeriesData: insightsDataset | null,
  rangeKey: keyof insightsDataset
) {
  if (!timeSeriesData?.[rangeKey]) return null;

  const data = timeSeriesData[rangeKey];

  // Helper to map numeric arrays to point objects with labels
  const createDataPoints = (values: number[]) =>
    values.map((value, index) => ({
      value,
      label: data.labels[index],
      dataPointText: String(value),
    }));

  // Create data points for all metrics in a single pass
  return {
    incomes: createDataPoints(data.incomes),
    expenses: createDataPoints(data.expenses),
    savings: createDataPoints(data.savings),
    previousIncomes: createDataPoints(data.previousIncomes),
    previousExpenses: createDataPoints(data.previousExpenses),
    previousSavings: createDataPoints(data.previousSavings),
  };
}

/**
 * Creates optimized data for pie chart visualization
 * @param categories Array of category breakdown data
 * @param focused Currently focused category (if any)
 * @returns Array of processed pie chart data points
 */
export function getPieChartData(
  categories: CategoryBreakdown[],
  focused: CategoryBreakdown | null
) {
  if (!categories.length) return [];

  // Map categories to pie chart data points in a single pass
  return categories.map((cat) => ({
    value: cat.value,
    color: cat.color,
    gradientCenterColor: cat.gradientCenterColor,
    category: cat.category as TransactionCategory,
    focused: focused?.category === cat.category,
  }));
}

/**
 * Calculates an optimal step size for chart axis divisions
 * @param values Array of numeric values to be displayed on the chart
 * @param noOfSections Number of sections to divide the axis into
 * @param minStep Minimum step size
 * @returns Optimized step value for chart axis
 */
export function calculateStep(
  values: number[],
  noOfSections: number = 5,
  minStep: number = 10
): number {
  if (!values.length) return minStep;
  const maxValue = Math.max(...values);
  if (maxValue <= 0) return minStep;

  // Calculate base magnitude for step values
  let magnitude = Math.pow(10, Math.floor(Math.log10(maxValue / noOfSections)));

  // Special magnitude adjustments for values around 1M
  if (maxValue > 500000 && maxValue < 5000000) {
    magnitude = maxValue < 1000000 ? 100000 : 250000;
  } else if (maxValue >= 5000000 && maxValue < 10000000) {
    magnitude = 500000;
  }

  // Generate step options based on magnitude and value range
  const niceSteps =
    maxValue > 500000
      ? [1, 2, 2.5, 5, 10].map((m) => m * magnitude)
      : [1, 2, 5, 10].map((m) => m * magnitude);

  // Add 2.5M as a special case for values between 1M and 3M
  if (maxValue > 1000000 && maxValue < 3000000) {
    const twoPointFiveM = 2500000;
    if (!niceSteps.includes(twoPointFiveM)) {
      niceSteps.push(twoPointFiveM);
      niceSteps.sort((a, b) => a - b);
    }
  }

  // Find optimal step with appropriate headroom (10-30%)
  let step = niceSteps[niceSteps.length - 1]; // Default to largest step

  // Try to find a step with ideal headroom (10-30%)
  for (const niceStep of niceSteps) {
    const maxYAxisValue = niceStep * noOfSections;
    const headroom = maxYAxisValue / maxValue;

    if (headroom > 1.1 && headroom < 1.3) {
      step = niceStep;
      break;
    }
  }

  // If no ideal step found, find first step giving at least 10% headroom
  if (step === niceSteps[niceSteps.length - 1]) {
    for (const niceStep of niceSteps) {
      if (niceStep * noOfSections > maxValue * 1.1) {
        step = niceStep;
        break;
      }
    }
  }

  return Math.max(step, minStep);
}

/**
 * Generates well-formatted labels for Y-axis with proper value formatting
 * @param values Array of numeric values to generate labels for
 * @param noOfSections Number of sections to divide the axis into
 * @returns Object with labels array and sections needed
 */
export function generateYAxisLabels(
  values: number[],
  noOfSections: number = 5
): { labels: string[]; sectionsNeeded: number } {
  if (!values.length) return { labels: [], sectionsNeeded: 0 };

  const maxValue = Math.max(...values);
  const step = calculateStep(values, noOfSections);
  const sectionsNeeded = Math.ceil(maxValue / step);

  // Generate labels with proper formatting
  const labels = Array.from({ length: sectionsNeeded + 1 }, (_, i) => {
    const value = i * step;
    return formatLargeNumber(value);
  });

  return { labels, sectionsNeeded };
}

/**
 * Formats large numbers with appropriate suffixes (K, M, B)
 * @param value Number to format
 * @returns Formatted string with appropriate suffix
 */
function formatLargeNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return `${(value / 1_000_000_000).toFixed(1)}B`.replace('.0B', 'B');
  }

  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`.replace('.0M', 'M');
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)}K`.replace('.0K', 'K');
  }

  return Math.round(value).toString();
}

/**
 * Formats axis labels for chart display
 * @param value Number to format as axis label
 * @returns Formatted string with appropriate suffix
 */
export function formatAxisLabel(value: number): string {
  return formatLargeNumber(value);
}
