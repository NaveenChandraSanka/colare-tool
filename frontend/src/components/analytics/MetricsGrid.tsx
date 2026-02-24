import { Card, CardContent } from '@/components/ui/card';
import {
  Users,
  RefreshCw,
  Mail,
  Eye,
  MousePointerClick,
  AlertTriangle,
} from 'lucide-react';
import type { EventAnalytics } from '@/types';

interface MetricsGridProps {
  analytics: EventAnalytics;
}

const metrics = [
  { key: 'total_registered', label: 'Registered', icon: Users, color: 'text-blue-500' },
  { key: 'loops_synced', label: 'Loops Synced', icon: RefreshCw, color: 'text-green-500' },
  { key: 'emails_delivered', label: 'Delivered', icon: Mail, color: 'text-purple-500' },
  { key: 'emails_opened', label: 'Opened', icon: Eye, color: 'text-amber-500' },
  { key: 'emails_clicked', label: 'Clicked', icon: MousePointerClick, color: 'text-cyan-500' },
  { key: 'emails_bounced', label: 'Bounced', icon: AlertTriangle, color: 'text-red-500' },
] as const;

export function MetricsGrid({ analytics }: MetricsGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {metrics.map((m) => (
        <Card key={m.key}>
          <CardContent className="flex items-center gap-4 pt-6">
            <div className={`rounded-lg bg-muted p-2 ${m.color}`}>
              <m.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {analytics[m.key as keyof EventAnalytics] as number}
              </p>
              <p className="text-sm text-muted-foreground">{m.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
