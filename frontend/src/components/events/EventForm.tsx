import { useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createEvent, updateEvent } from '@/api/events';
import { Button } from '@/components/ui/button';
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
import { InterestOptionsBuilder } from './InterestOptionsBuilder';
import type { Event, CreateEventInput, UpdateEventInput } from '@/types';

interface EventFormProps {
  mode: 'create' | 'edit';
  event?: Event;
}

export function EventForm({ mode, event }: EventFormProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState(event?.name || '');
  const [description, setDescription] = useState(event?.description || '');
  const [date, setDate] = useState(event?.date?.slice(0, 16) || '');
  const [companyName, setCompanyName] = useState(event?.company_name || '');
  const [loopsEventName, setLoopsEventName] = useState(
    event?.loops_event_name || '',
  );
  const [interestOptions, setInterestOptions] = useState<string[]>(
    event?.interest_options || [],
  );
  const [status, setStatus] = useState<string>(event?.status || 'draft');

  const createMutation = useMutation({
    mutationFn: (input: CreateEventInput) => createEvent(input),
    onSuccess: (data) => {
      toast.success('Event created!');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      navigate(`/events/${data.id}/detail`);
    },
    onError: () => toast.error('Failed to create event'),
  });

  const updateMutation = useMutation({
    mutationFn: (input: UpdateEventInput) => updateEvent(event!.id, input),
    onSuccess: () => {
      toast.success('Event updated!');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['event', event!.id] });
      navigate(`/events/${event!.id}/detail`);
    },
    onError: () => toast.error('Failed to update event'),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const payload = {
      name,
      description: description || undefined,
      date: new Date(date).toISOString(),
      company_name: companyName,
      loops_event_name: loopsEventName,
      interest_options: interestOptions,
      status: status as CreateEventInput['status'],
    };

    if (mode === 'create') {
      createMutation.mutate(payload);
    } else {
      updateMutation.mutate(payload);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {mode === 'create' ? 'Create Event' : 'Edit Event'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Event Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tech Summit 2026"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date & Time *</Label>
              <Input
                id="date"
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name *</Label>
              <Input
                id="company"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Corp"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="loops">Loops Event Name *</Label>
              <Input
                id="loops"
                value={loopsEventName}
                onChange={(e) => setLoopsEventName(e.target.value)}
                placeholder="tech_summit.attended"
                required
              />
              <p className="text-xs text-muted-foreground">
                Maps to a Loops trigger event (e.g., event_name.attended)
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Describe the event..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="w-48">
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

          <div className="space-y-2">
            <Label>Interest Options</Label>
            <p className="text-xs text-muted-foreground">
              Define the interest checkboxes attendees will see on the
              registration form.
            </p>
            <InterestOptionsBuilder
              value={interestOptions}
              onChange={setInterestOptions}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? 'Saving...'
                : mode === 'create'
                  ? 'Create Event'
                  : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
