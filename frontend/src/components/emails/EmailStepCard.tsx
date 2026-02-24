import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { EmailSeriesStep } from '@/types';

const STEP_LABELS: Record<number, string> = {
  1: 'Welcome',
  2: 'Follow-up',
  3: 'CTA',
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
  queued: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
  sent: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
};

interface EmailStepCardProps {
  email: EmailSeriesStep;
}

export function EmailStepCard({ email }: EmailStepCardProps) {
  return (
    <Card className="border-l-4 border-l-primary/40">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase text-muted-foreground">
              Day {email.send_day}
            </span>
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs font-medium text-muted-foreground">
              {STEP_LABELS[email.step] || `Step ${email.step}`}
            </span>
          </div>
          <Badge variant="outline" className={STATUS_STYLES[email.status] || ''}>
            {email.status}
          </Badge>
        </div>

        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
            Subject
          </p>
          <p className="text-sm font-medium">{email.subject}</p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
            Body
          </p>
          <p className="text-sm whitespace-pre-line leading-relaxed">
            {email.body}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground mb-1">
            Call to Action
          </p>
          <p className="text-sm italic">{email.cta}</p>
        </div>
      </CardContent>
    </Card>
  );
}
