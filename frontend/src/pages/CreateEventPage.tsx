import { Link } from 'react-router-dom';
import { EventForm } from '@/components/events/EventForm';
import { ArrowLeft } from 'lucide-react';

export default function CreateEventPage() {
  return (
    <div>
      <Link
        to="/dashboard"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Events
      </Link>
      <EventForm mode="create" />
    </div>
  );
}
