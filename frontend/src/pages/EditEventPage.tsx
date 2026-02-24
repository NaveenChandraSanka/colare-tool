import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchEvent } from '@/api/events';
import { EventForm } from '@/components/events/EventForm';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft } from 'lucide-react';

export default function EditEventPage() {
  const { id } = useParams<{ id: string }>();

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['event', id],
    queryFn: () => fetchEvent(id!),
    enabled: !!id,
  });

  return (
    <div>
      <Link
        to={`/events/${id}/detail`}
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Event
      </Link>

      {isLoading && <Skeleton className="h-96" />}

      {error && (
        <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
          Event not found.
        </div>
      )}

      {event && <EventForm mode="edit" event={event} />}
    </div>
  );
}
