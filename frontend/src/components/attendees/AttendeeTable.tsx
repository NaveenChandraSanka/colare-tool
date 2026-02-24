import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmailStatusIcons } from './EmailStatusIcons';
import { EmailPreviewDialog } from './EmailPreviewDialog';
import { formatDateTime } from '@/lib/utils';
import { ArrowUpDown, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AttendeeWithEngagement } from '@/types';

interface AttendeeTableProps {
  attendees: AttendeeWithEngagement[];
  eventId: string;
}

type SortKey = 'name' | 'email' | 'segment' | 'registered_at';
type SortDir = 'asc' | 'desc';

export function AttendeeTable({ attendees, eventId }: AttendeeTableProps) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('registered_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>('');

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = attendees;

    if (q) {
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q) ||
          (a.company?.toLowerCase().includes(q) ?? false) ||
          (a.segment?.toLowerCase().includes(q) ?? false),
      );
    }

    result = [...result].sort((a, b) => {
      const aVal = a[sortKey] ?? '';
      const bVal = b[sortKey] ?? '';
      const cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return result;
  }, [attendees, search, sortKey, sortDir]);

  function SortButton({ column, label }: { column: SortKey; label: string }) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-auto py-1"
        onClick={() => toggleSort(column)}
      >
        {label}
        <ArrowUpDown className="ml-1 h-3 w-3" />
      </Button>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search attendees..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
        <span className="ml-auto text-sm text-muted-foreground">
          {filtered.length} attendee{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <SortButton column="name" label="Name" />
              </TableHead>
              <TableHead>
                <SortButton column="email" label="Email" />
              </TableHead>
              <TableHead className="hidden md:table-cell">Company</TableHead>
              <TableHead>
                <SortButton column="segment" label="Segment" />
              </TableHead>
              <TableHead className="hidden lg:table-cell">
                <SortButton column="registered_at" label="Registered" />
              </TableHead>
              <TableHead>Email Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No attendees found
                </TableCell>
              </TableRow>
            )}
            {filtered.map((a) => (
              <TableRow
                key={a.id}
                className="cursor-pointer"
                onClick={() => {
                  setPreviewId(a.id);
                  setPreviewName(a.name);
                }}
              >
                <TableCell className="font-medium">{a.name}</TableCell>
                <TableCell className="text-muted-foreground">
                  {a.email}
                </TableCell>
                <TableCell className="hidden text-muted-foreground md:table-cell">
                  {a.company || '—'}
                </TableCell>
                <TableCell>
                  {a.segment ? (
                    <Badge variant="outline" className="capitalize">
                      {a.segment}
                    </Badge>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">
                  {formatDateTime(a.registered_at)}
                </TableCell>
                <TableCell>
                  <EmailStatusIcons
                    delivered={a.emails_delivered}
                    opened={a.emails_opened}
                    clicked={a.emails_clicked}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <EmailPreviewDialog
        eventId={eventId}
        attendeeId={previewId}
        attendeeName={previewName}
        open={!!previewId}
        onOpenChange={(open) => {
          if (!open) setPreviewId(null);
        }}
      />
    </div>
  );
}
