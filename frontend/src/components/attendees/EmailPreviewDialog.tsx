import { useQuery } from '@tanstack/react-query';
import { previewSequence, fetchAttendeeSeries } from '@/api/events';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmailStepCard } from '@/components/emails/EmailStepCard';

interface EmailPreviewDialogProps {
  eventId: string;
  attendeeId: string | null;
  attendeeName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EmailPreviewDialog({
  eventId,
  attendeeId,
  attendeeName,
  open,
  onOpenChange,
}: EmailPreviewDialogProps) {
  const previewQuery = useQuery({
    queryKey: ['preview', eventId, attendeeId],
    queryFn: () => previewSequence(eventId, attendeeId!),
    enabled: open && !!attendeeId,
  });

  const seriesQuery = useQuery({
    queryKey: ['attendee-series', eventId, attendeeId],
    queryFn: () => fetchAttendeeSeries(eventId, attendeeId!),
    enabled: open && !!attendeeId,
  });

  const hasSeries = seriesQuery.data && seriesQuery.data.length > 0;
  const isLoading = previewQuery.isLoading || seriesQuery.isLoading;
  const data = previewQuery.data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Email Preview{attendeeName ? ` — ${attendeeName}` : ''}
          </DialogTitle>
        </DialogHeader>

        {isLoading && (
          <div className="space-y-3">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {previewQuery.error && seriesQuery.error && (
          <p className="text-sm text-destructive">
            Failed to load email preview.
          </p>
        )}

        {data && (
          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Attendee
              </p>
              <p className="text-sm">
                {data.attendee.name} ({data.attendee.email})
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {data.attendee.segment && (
                  <Badge variant="outline">{data.attendee.segment}</Badge>
                )}
                {data.attendee.interests.map((i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {i}
                  </Badge>
                ))}
              </div>
            </div>

            {hasSeries ? (
              <div className="space-y-3">
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  3-Step Email Series
                </p>
                {seriesQuery.data!.map((email) => (
                  <EmailStepCard key={email.id} email={email} />
                ))}
              </div>
            ) : (
              <>
                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Subject Line
                  </p>
                  <p className="text-sm font-medium">
                    {data.preview.personalized_subject_line}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Personalized Intro
                  </p>
                  <p className="text-sm">{data.preview.personalized_intro}</p>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase text-muted-foreground">
                    Call to Action
                  </p>
                  <p className="text-sm">{data.preview.personalized_cta}</p>
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
