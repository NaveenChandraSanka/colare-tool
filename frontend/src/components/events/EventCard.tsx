import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EventStatusBadge } from './EventStatusBadge';
import { formatDate } from '@/lib/utils';
import { Users, MoreVertical, Eye, Pencil, Link2 } from 'lucide-react';
import type { EventWithCount } from '@/types';

interface EventCardProps {
  event: EventWithCount;
}

export function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();

  function copyRegistrationLink() {
    const url = `${window.location.origin}/events/${event.slug}`;
    navigator.clipboard.writeText(url);
    toast.success('Registration link copied!');
  }

  return (
    <Card
      className="cursor-pointer transition-shadow hover:shadow-md"
      onClick={() => navigate(`/events/${event.id}/detail`)}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="min-w-0 flex-1">
          <CardTitle className="truncate text-base">{event.name}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {event.company_name}
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/events/${event.id}/detail`);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/events/${event.id}/edit`);
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                copyRegistrationLink();
              }}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Copy Registration Link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {formatDate(event.date)}
          </p>
          <EventStatusBadge status={event.status} />
        </div>
        <div className="mt-3 flex items-center gap-1 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span>
            {event.attendee_count}{' '}
            {event.attendee_count === 1 ? 'attendee' : 'attendees'}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
