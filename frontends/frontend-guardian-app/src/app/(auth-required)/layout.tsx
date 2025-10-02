'use client';

import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AuthRequiredLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // This layout requires authentication but NOT students
  return <AuthGuard requireStudent={false}>{children}</AuthGuard>;
}