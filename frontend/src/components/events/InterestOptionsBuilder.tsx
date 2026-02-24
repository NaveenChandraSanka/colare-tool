import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface InterestOptionsBuilderProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const SUGGESTIONS = [
  'demo',
  'partnership',
  'learn-more',
  'networking',
  'hiring',
  'investing',
];

export function InterestOptionsBuilder({
  value,
  onChange,
}: InterestOptionsBuilderProps) {
  const [inputValue, setInputValue] = useState('');

  function addOption(option: string) {
    const trimmed = option.trim().toLowerCase();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue('');
  }

  function removeOption(option: string) {
    onChange(value.filter((v) => v !== option));
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      addOption(inputValue);
    }
  }

  const availableSuggestions = SUGGESTIONS.filter((s) => !value.includes(s));

  return (
    <div className="space-y-3">
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((opt) => (
            <Badge key={opt} variant="secondary" className="gap-1 pr-1">
              {opt}
              <button
                type="button"
                onClick={() => removeOption(opt)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <Input
          placeholder="Add interest option..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => addOption(inputValue)}
          disabled={!inputValue.trim()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {availableSuggestions.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs text-muted-foreground">Suggestions:</p>
          <div className="flex flex-wrap gap-1.5">
            {availableSuggestions.map((s) => (
              <Button
                key={s}
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={() => addOption(s)}
              >
                + {s}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
