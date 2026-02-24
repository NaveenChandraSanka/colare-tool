import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import type { EventAnalytics } from '@/types';

interface EmailFunnelChartProps {
  analytics: EventAnalytics;
}

export function EmailFunnelChart({ analytics }: EmailFunnelChartProps) {
  const data = [
    { step: 'Delivered', count: analytics.emails_delivered },
    { step: 'Opened', count: analytics.emails_opened },
    { step: 'Clicked', count: analytics.emails_clicked },
  ];

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="step" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip />
        <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
