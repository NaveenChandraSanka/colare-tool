import { useState, type FormEvent } from 'react';
import { useMutation } from '@tanstack/react-query';
import { registerForEvent } from '@/api/registration';
import { ApiError } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatDate } from '@/lib/utils';
import type { PublicEvent, RegistrationInput } from '@/types';

interface RegistrationFormProps {
  event: PublicEvent;
  onSuccess: () => void;
}

export function RegistrationForm({ event, onSuccess }: RegistrationFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [error, setError] = useState('');

  const mutation = useMutation({
    mutationFn: (input: RegistrationInput) =>
      registerForEvent(event.slug, input),
    onSuccess: () => onSuccess(),
    onError: (err) => {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    },
  });

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    mutation.mutate({
      name,
      email,
      company: company || undefined,
      role: role || undefined,
      interests,
    });
  }

  return (
    <div className="w-full max-w-lg">
      {/* Event header */}
      <div className="mb-6 text-center">
        <p className="text-sm font-medium uppercase tracking-wide text-white/70">
          {event.company_name}
        </p>
        <h1 className="mt-1 text-3xl font-bold text-white">{event.name}</h1>
        <p className="mt-2 text-sm text-white/70">{formatDate(event.date)}</p>
        {event.description && (
          <p className="mt-3 text-sm text-white/80">{event.description}</p>
        )}
      </div>

      {/* Form card */}
      <div className="rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reg-name" className="text-gray-700 dark:text-gray-300">
                Full Name *
              </Label>
              <Input
                id="reg-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Smith"
                required
                className="dark:border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-email" className="text-gray-700 dark:text-gray-300">
                Email *
              </Label>
              <Input
                id="reg-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jane@company.com"
                required
                className="dark:border-gray-700"
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="reg-company" className="text-gray-700 dark:text-gray-300">
                Company
              </Label>
              <Input
                id="reg-company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Acme Corp"
                className="dark:border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reg-role" className="text-gray-700 dark:text-gray-300">
                Role
              </Label>
              <Input
                id="reg-role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Product Manager"
                className="dark:border-gray-700"
              />
            </div>
          </div>

          {event.interest_options.length > 0 && (
            <div className="space-y-2">
              <Label className="text-gray-700 dark:text-gray-300">
                What are you interested in?
              </Label>
              <div className="flex flex-wrap gap-2">
                {event.interest_options.map((interest) => (
                  <button
                    key={interest}
                    type="button"
                    onClick={() => toggleInterest(interest)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                      interests.includes(interest)
                        ? 'border-purple-500 bg-purple-50 text-purple-700 dark:border-purple-400 dark:bg-purple-900/30 dark:text-purple-300'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Registering...' : 'Register'}
          </Button>
        </form>
      </div>
    </div>
  );
}
