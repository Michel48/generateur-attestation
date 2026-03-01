'use client';

import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues with canvas/jspdf
const Generator = dynamic(() => import('@/components/Generator'), { ssr: false });

export default function Home() {
  return <Generator />;
}
