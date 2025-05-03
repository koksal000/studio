'use client';

import React from 'react';
import { CodeProvider } from '@/context/code-context';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <CodeProvider>{children}</CodeProvider>;
}
