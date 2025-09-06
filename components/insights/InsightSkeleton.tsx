import { CardContent, CardFooter } from '../ui/card';
import { Skeleton } from '../ui/skeleton';

export function PieChartSkeleton() {
  return (
    <CardContent className="my-2 flex w-full flex-col items-center justify-center gap-2">
      <Skeleton className="h-60 w-60 rounded-full" />
      <Skeleton className="h-4 w-72 rounded-full" />
      <Skeleton className="h-4 w-72 rounded-full" />
    </CardContent>
  );
}

export function BarChartSkeleton() {
  return (
    <CardContent>
      <Skeleton className="h-56 rounded-lg" />
    </CardContent>
  );
}

export default function InsightSkeleton() {
  return (
    <CardFooter className="flex-col items-start gap-2">
      <Skeleton className="h-4 w-56 rounded-full" />
      <Skeleton className="h-4 w-44 rounded-full" />
      <Skeleton className="h-4 w-56 rounded-full" />
      <Skeleton className="h-4 w-44 rounded-full" />
    </CardFooter>
  );
}
