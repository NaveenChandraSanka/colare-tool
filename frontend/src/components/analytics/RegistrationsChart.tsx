import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format, parseISO, startOfDay } from 'date-fns';
import type { AttendeeWithEngagement } from '@/types';

interface RegistrationsChartProps {
  attendees: AttendeeWithEngagement[];
}

export function RegistrationsChart({ attendees }: RegistrationsChartProps) {
  // Group by day
  const byDay = new Map<string, number>();
  for (const a of attendees) {
    const day = format(startOfDay(parseISO(a.registered_at)), 'yyyy-MM-dd');
    byDay.set(day, (byDay.get(day) || 0) + 1);
  }

  const data = Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({
      date: format(parseISO(date), 'MMM d'),
      count,
    }));

  if (data.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No registrations yet
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" className="text-xs" />
        <YAxis className="text-xs" allowDecimals={false} />
        <Tooltip />
        <Area
          type="monotone"
          dataKey="count"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary))"
          fillOpacity={0.1}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
