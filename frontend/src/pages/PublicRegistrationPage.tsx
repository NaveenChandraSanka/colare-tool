import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchPublicEvent } from '@/api/registration';
import { RegistrationForm } from '@/components/registration/RegistrationForm';
import { RegistrationSuccess } from '@/components/registration/RegistrationSuccess';
import { Skeleton } from '@/components/ui/skeleton';

export default function PublicRegistrationPage() {
  const { slug } = useParams<{ slug: string }>();
  const [registered, setRegistered] = useState(false);

  const { data: event, isLoading, error } = useQuery({
    queryKey: ['publicEvent', slug],
    queryFn: () => fetchPublicEvent(slug!),
    enabled: !!slug,
  });

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-800 px-4 py-12">
      {isLoading && (
        <div className="w-full max-w-lg space-y-4">
          <Skeleton className="mx-auto h-8 w-48 bg-white/20" />
          <Skeleton className="mx-auto h-6 w-32 bg-white/20" />
          <Skeleton className="h-96 rounded-xl bg-white/10" />
        </div>
      )}

      {error && (
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-white">Event Not Found</h1>
          <p className="mt-2 text-white/70">
            This event may have been removed or the link is incorrect.
          </p>
        </div>
      )}

      {event && event.status !== 'active' && !registered && (
        <div className="w-full max-w-md text-center">
          <h1 className="text-3xl font-bold text-white">{event.name}</h1>
          <p className="mt-4 text-white/70">
            This event is not currently accepting registrations.
          </p>
        </div>
      )}

      {event && event.status === 'active' && !registered && (
        <RegistrationForm
          event={event}
          onSuccess={() => setRegistered(true)}
        />
      )}

      {event && registered && <RegistrationSuccess event={event} />}
    </div>
  );
}
