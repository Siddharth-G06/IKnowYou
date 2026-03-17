'use client';

import { FC, ReactNode } from 'react';
import { PersonResponse } from '@/types/api';

interface SearchResultCardProps {
  person: PersonResponse;
  memorySnippet: ReactNode;
  relationPath: string;
  tamilName: string;
  hindiName: string;
  similarityScore: number;
}

export const SearchResultCard: FC<SearchResultCardProps> = ({
  person,
  memorySnippet,
  relationPath,
  tamilName,
  hindiName,
  similarityScore,
}) => {
  const primary = relationPath || 'Your connection';

  const secondaryParts: string[] = [];
  if (tamilName) secondaryParts.push(`Tamil: ${tamilName}`);
  if (hindiName) secondaryParts.push(`Hindi: ${hindiName}`);
  const secondary = secondaryParts.join(' | ');

  return (
    <div
      className="rounded-xl border border-border bg-card/60 p-4 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between gap-3 mb-2">
        <div>
          <div className="text-sm font-semibold text-foreground">
            {person.name}
            {person.nickname ? (
              <span className="ml-1 text-xs text-muted-foreground">
                ({person.nickname})
              </span>
            ) : null}
          </div>
          <div className="text-xs text-amber mt-0.5">
            {primary}
          </div>
          {secondary && (
            <div className="text-[11px] text-muted-foreground mt-0.5">
              {secondary}
            </div>
          )}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {(similarityScore * 100).toFixed(0)}% match
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground leading-snug line-clamp-3">
        {memorySnippet}
      </p>
    </div>
  );
};

export default SearchResultCard;

