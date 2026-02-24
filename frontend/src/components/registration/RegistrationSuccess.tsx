import type { PublicEvent } from '@/types';
import { formatDate } from '@/lib/utils';

interface RegistrationSuccessProps {
  event: PublicEvent;
}

export function RegistrationSuccess({ event }: RegistrationSuccessProps) {
  return (
    <div className="w-full max-w-md text-center">
      {/* Animated checkmark */}
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white/20">
        <svg
          className="h-10 w-10 text-white"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path
            d="M5 13l4 4L19 7"
            className="animate-[draw_0.5s_ease-out_0.3s_both]"
            style={{
              strokeDasharray: 24,
              strokeDashoffset: 24,
              animation: 'draw 0.5s ease-out 0.3s forwards',
            }}
          />
        </svg>
      </div>

      <h1 className="text-3xl font-bold text-white">You're Registered!</h1>
      <p className="mt-2 text-lg text-white/80">
        for {event.name}
      </p>
      <p className="mt-1 text-sm text-white/60">{formatDate(event.date)}</p>

      <div className="mt-8 rounded-xl bg-white/10 p-6 backdrop-blur-sm">
        <p className="text-white/90">
          Check your email for a confirmation message with event details.
        </p>
      </div>

      <style>{`
        @keyframes draw {
          to {
            stroke-dashoffset: 0;
          }
        }
      `}</style>
    </div>
  );
}
