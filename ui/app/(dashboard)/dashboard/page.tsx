'use client';

import { DailyPlannerClient } from '@/components/DailyPlannerClient';

export default function DashboardPage() {
  // Calculate today's date
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  
  // Pass null for initial data - DailyPlannerClient will fetch it client-side
  return (
    <DailyPlannerClient 
      initialPlanResponse={null} 
      availableDates={null}
      initialSelectedDate={today}
    />
  );
}