'use client';

import { notFound } from 'next/navigation';

import CostsView from '@/components/CostsView';
import { previewData } from '@/lib/costs/fixture';

// Dev only: the dashboard with sample data, no sign-in.
export default function CostsPreview() {
  if (process.env.NODE_ENV === 'production') notFound();
  return <CostsView data={previewData()} onRefresh={() => {}} onSignOut={() => {}} />;
}
