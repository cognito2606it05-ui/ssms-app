import React from 'react';

export const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-stone-200 dark:bg-stone-700 rounded ${className}`} />
);
