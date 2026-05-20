"use client";

import { useState, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Ajouter un tag…",
  maxTags = 10,
  className,
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedInput = inputValue.toLowerCase().trim();

  const filteredSuggestions = suggestions.filter(
    (s) =>
      s.toLowerCase().includes(normalizedInput) &&
      !value.includes(s.toLowerCase()) &&
      normalizedInput.length > 0
  );

  const addTag = useCallback(
    (tag: string) => {
      const normalized = tag.toLowerCase().trim();
      if (!normalized || value.includes(normalized) || value.length >= maxTags) return;
      onChange([...value, normalized]);
      setInputValue("");
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [value, onChange, maxTags]
  );

  const removeTag = useCallback(
    (tag: string) => {
      onChange(value.filter((t) => t !== tag));
    },
    [value, onChange]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if ((e.key === "Enter" || e.key === ",") && normalizedInput) {
      e.preventDefault();
      addTag(normalizedInput);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value[value.length - 1]!);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "border-border bg-background flex min-h-10 flex-wrap items-center gap-1.5 rounded-md border px-3 py-2",
          "focus-within:ring-ring focus-within:ring-2 focus-within:ring-offset-2"
        )}
        onClick={() => inputRef.current?.focus()}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="border-gold/20 bg-gold-light/40 text-gold-darker inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(tag);
              }}
              className="hover:text-gold-deep ml-0.5"
              aria-label={`Retirer le tag ${tag}`}
            >
              <X className="size-3" />
            </button>
          </span>
        ))}

        {value.length < maxTags && (
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value);
              setShowSuggestions(true);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={value.length === 0 ? placeholder : ""}
            className="h-auto min-w-[120px] flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
          />
        )}
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <ul className="border-border bg-popover text-popover-foreground absolute top-full z-50 mt-1 max-h-48 w-full overflow-auto rounded-md border shadow-md">
          {filteredSuggestions.slice(0, 8).map((suggestion) => (
            <li key={suggestion}>
              <button
                type="button"
                className="hover:bg-cream w-full px-3 py-1.5 text-left text-sm"
                onMouseDown={(e) => {
                  e.preventDefault();
                  addTag(suggestion);
                }}
              >
                {suggestion}
              </button>
            </li>
          ))}
        </ul>
      )}

      {value.length >= maxTags && (
        <p className="text-text-secondary mt-1 text-xs">Maximum {maxTags} tags</p>
      )}
    </div>
  );
}
