import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { fetchEvent, fetchAttendees, resyncAttendees, updateEvent } from '@/api/events';
import { fetchAnalytics } from '@/api/analytics';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { EventStatusBadge } from '@/components/events/EventStatusBadge';
import { MetricsGrid } from '@/components/analytics/MetricsGrid';
import { SegmentPieChart } from '@/components/analytics/SegmentPieChart';
import { EmailFunnelChart } from '@/components/analytics/EmailFunnelChart';
import { RegistrationsChart } from '@/components/analytics/RegistrationsChart';
import { AttendeeTable } from '@/components/attendees/AttendeeTable';
import { EmailSeriesPanel } from '@/components/emails/EmailSeriesPanel';
import { QRCodeCard } from '@/components/registration/QRCodeCard';
import { formatDate } from '@/lib/utils';
import { ArrowLeft, Copy, RefreshCw } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { UpdateEventInput } from '@/types';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();

  const eventQuery = useQuery({
    queryKey: ['event', id],
    queryFn: () => fetchEvent(id!),
    enabled: !!id,
  });

  const attendeesQuery = useQuery({
    queryKey: ['attendees', id],
    queryFn: () => fetchAttendees(id!),
    enabled: !!id,
  });

  const analyticsQuery = useQuery({
    queryKey: ['analytics', id],
    queryFn: () => fetchAnalytics(id!),
    enabled: !!id,
  });

  const resyncMutation = useMutation({
    mutationFn: () => resyncAttendees(id!),
    onSuccess: (result) => {
      toast.success(
        `Resync complete: ${result.synced}/${result.total} synced, ${result.failed} failed`,
      );
      queryClient.invalidateQueries({ queryKey: ['attendees', id] });
    },
    onError: () => toast.error('Failed to resync attendees'),
  });

  const event = eventQuery.data;
  const registrationUrl = event
    ? `${window.location.origin}/events/${event.slug}`
    : '';

  function copyLink() {
    navigator.clipboard.writeText(registrationUrl);
    toast.success('Registration link copied!');
  }

  if (eventQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (eventQuery.error || !event) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        Event not found.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="mb-2 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Events
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold">{event.name}</h1>
          <EventStatusBadge status={event.status} />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {event.company_name} &middot; {formatDate(event.date)}
        </p>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendees">
            Attendees
            {attendeesQuery.data && ` (${attendeesQuery.data.length})`}
          </TabsTrigger>
          <TabsTrigger value="emails">Email Series</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6 space-y-6">
          {analyticsQuery.isLoading && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          )}

          {analyticsQuery.data && (
            <>
              <MetricsGrid analytics={analyticsQuery.data} />

              <div className="grid gap-6 lg:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Registrations Over Time
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attendeesQuery.data ? (
                      <RegistrationsChart attendees={attendeesQuery.data} />
                    ) : (
                      <Skeleton className="h-[280px]" />
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">
                      Registrations by Segment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <SegmentPieChart
                      data={analyticsQuery.data.registrations_by_segment}
                    />
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Email Funnel</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmailFunnelChart analytics={analyticsQuery.data} />
                </CardContent>
              </Card>

              {analyticsQuery.data.top_performing_segment && (
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-sm text-muted-foreground">
                      Top Performing Segment
                    </p>
                    <p className="text-lg font-semibold capitalize">
                      {analyticsQuery.data.top_performing_segment}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Open rate: {analyticsQuery.data.open_rate.toFixed(1)}% |
                      Click rate: {analyticsQuery.data.click_rate.toFixed(1)}%
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="attendees" className="mt-6">
          {attendeesQuery.isLoading && <Skeleton className="h-96" />}
          {attendeesQuery.data && (
            <AttendeeTable attendees={attendeesQuery.data} eventId={id!} />
          )}
        </TabsContent>

        <TabsContent value="emails" className="mt-6">
          <EmailSeriesPanel eventId={id!} />
        </TabsContent>

        <TabsContent value="settings" className="mt-6 space-y-6">
          <EventSettingsForm event={event} eventId={id!} />

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Registration Link</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <Input readOnly value={registrationUrl} />
                  <Button variant="outline" size="icon" onClick={copyLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            <QRCodeCard url={registrationUrl} eventName={event.slug} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Loops Sync</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-muted-foreground">
                Re-sync all attendees to Loops. This will create or update
                contacts for every registered attendee.
              </p>
              <Button
                variant="outline"
                onClick={() => resyncMutation.mutate()}
                disabled={resyncMutation.isPending}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${resyncMutation.isPending ? 'animate-spin' : ''}`}
                />
                {resyncMutation.isPending ? 'Resyncing...' : 'Resync All Attendees'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EventSettingsForm({
  event,
  eventId,
}: {
  event: { name: string; description: string | null; date: string; company_name: string; loops_event_name: string; status: string };
  eventId: string;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(event.name);
  const [description, setDescription] = useState(event.description || '');
  const [date, setDate] = useState(
    event.date.slice(0, 16), // Convert ISO to datetime-local format
  );
  const [companyName, setCompanyName] = useState(event.company_name);
  const [status, setStatus] = useState(event.status);

  const mutation = useMutation({
    mutationFn: (input: UpdateEventInput) => updateEvent(eventId, input),
    onSuccess: () => {
      toast.success('Event updated');
      queryClient.invalidateQueries({ queryKey: ['event', eventId] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
    onError: () => toast.error('Failed to update event'),
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutation.mutate({
      name,
      description: description || undefined,
      date: new Date(date).toISOString(),
      company_name: companyName,
      status: status as UpdateEventInput['status'],
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Event Details</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Loops Event Name</Label>
            <Input readOnly value={event.loops_event_name} disabled />
            <p className="text-xs text-muted-foreground">
              This maps to the Loops trigger and cannot be changed after creation.
            </p>
          </div>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Saving...' : 'Save Changes'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
