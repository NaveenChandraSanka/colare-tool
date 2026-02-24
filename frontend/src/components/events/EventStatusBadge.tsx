import { Badge } from '@/components/ui/badge';
import { cn, getStatusColor } from '@/lib/utils';

interface EventStatusBadgeProps {
  status: string;
}

export function EventStatusBadge({ status }: EventStatusBadgeProps) {
  return (
    <Badge variant="secondary" className={cn('capitalize', getStatusColor(status))}>
      {status}
    </Badge>
  );
}
