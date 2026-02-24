import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchSeries, fetchAttendees, generateSeriesForAttendee } from '@/api/events';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { EmailStepCard } from './EmailStepCard';
import { Sparkles, ChevronDown, ChevronRight, Mail, Loader2 } from 'lucide-react';

interface EmailSeriesPanelProps {
  eventId: string;
}

export function EmailSeriesPanel({ eventId }: EmailSeriesPanelProps) {
  const queryClient = useQueryClient();
  const [expandedAttendees, setExpandedAttendees] = useState<Set<string>>(new Set());
  const [generatingFor, setGeneratingFor] = useState<Set<string>>(new Set());

  const attendeesQuery = useQuery({
    queryKey: ['attendees', eventId],
    queryFn: () => fetchAttendees(eventId),
  });

  const seriesQuery = useQuery({
    queryKey: ['series', eventId],
    queryFn: () => fetchSeries(eventId),
  });

  // Build a map of attendee_id -> series emails
  const seriesMap = new Map<string, any[]>();
  for (const s of seriesQuery.data || []) {
    seriesMap.set(s.attendee_id, s.emails);
  }

  async function handleGenerate(attendeeId: string) {
    setGeneratingFor((prev) => new Set(prev).add(attendeeId));
    try {
      await generateSeriesForAttendee(eventId, attendeeId);
      toast.success('Email series generated!');
      queryClient.invalidateQueries({ queryKey: ['series', eventId] });
      queryClient.invalidateQueries({ queryKey: ['attendee-series', eventId, attendeeId] });
      setExpandedAttendees((prev) => new Set(prev).add(attendeeId));
    } catch {
      toast.error('Failed to generate email series');
    } finally {
      setGeneratingFor((prev) => {
        const next = new Set(prev);
        next.delete(attendeeId);
        return next;
      });
    }
  }

  function toggleAttendee(attendeeId: string) {
    setExpandedAttendees((prev) => {
      const next = new Set(prev);
      if (next.has(attendeeId)) {
        next.delete(attendeeId);
      } else {
        next.add(attendeeId);
      }
      return next;
    });
  }

  const attendees = attendeesQuery.data || [];
  const totalWithSeries = seriesMap.size;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {totalWithSeries} of {attendees.length} attendee{attendees.length !== 1 ? 's' : ''} have generated series
        </p>
        {totalWithSeries > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (expandedAttendees.size > 0) {
                setExpandedAttendees(new Set());
              } else {
                setExpandedAttendees(new Set(attendees.map((a) => a.id)));
              }
            }}
          >
            {expandedAttendees.size > 0 ? 'Collapse All' : 'Expand All'}
          </Button>
        )}
      </div>

      {attendeesQuery.isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      )}

      {attendees.length === 0 && !attendeesQuery.isLoading && (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <Mail className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm text-muted-foreground">
            No attendees registered yet. Once attendees register, you can generate personalized email series for each one.
          </p>
        </div>
      )}

      {attendees.map((attendee) => {
        const emails = seriesMap.get(attendee.id);
        const hasSeries = emails && emails.length > 0;
        const isExpanded = expandedAttendees.has(attendee.id);
        const isGenerating = generatingFor.has(attendee.id);

        return (
          <div key={attendee.id} className="rounded-lg border">
            <div className="flex w-full items-center justify-between p-4">
              <button
                onClick={() => hasSeries && toggleAttendee(attendee.id)}
                className={`flex items-center gap-3 text-left ${hasSeries ? 'cursor-pointer' : 'cursor-default'}`}
              >
                {hasSeries ? (
                  isExpanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  )
                ) : (
                  <div className="h-4 w-4" />
                )}
                <div>
                  <p className="text-sm font-medium">{attendee.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {attendee.email}
                    {attendee.company && ` · ${attendee.company}`}
                  </p>
                </div>
              </button>
              <div className="flex items-center gap-2">
                {attendee.segment && (
                  <Badge variant="outline" className="text-xs">
                    {attendee.segment}
                  </Badge>
                )}
                {hasSeries && (
                  <Badge variant="secondary" className="text-xs">
                    {emails.length} emails
                  </Badge>
                )}
                <Button
                  variant={hasSeries ? 'ghost' : 'default'}
                  size="sm"
                  onClick={() => handleGenerate(attendee.id)}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                  ) : (
                    <Sparkles className="mr-1 h-3 w-3" />
                  )}
                  {isGenerating ? 'Generating...' : hasSeries ? 'Regenerate' : 'Generate'}
                </Button>
              </div>
            </div>

            {isExpanded && hasSeries && (
              <div className="space-y-3 px-4 pb-4">
                {emails.map((email: any) => (
                  <EmailStepCard key={email.id} email={email} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
