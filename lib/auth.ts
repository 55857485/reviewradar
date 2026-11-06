import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { User } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

export async function getSupabaseUser(): Promise<SupabaseUser | null> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch {
    return null;
  }
}

export async function ensureUserRecord(supabaseUser: SupabaseUser): Promise<User | null> {
  if (!supabaseUser.email) {
    return null;
  }

  const existing = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
  });

  if (existing) {
    if (existing.email !== supabaseUser.email) {
      return prisma.user.update({
        where: { id: existing.id },
        data: { email: supabaseUser.email },
      });
    }

    return existing;
  }

  return prisma.user.upsert({
    where: { id: supabaseUser.id },
    update: { email: supabaseUser.email },
    create: {
      id: supabaseUser.id,
      email: supabaseUser.email,
    },
  });
}

export async function getCurrentDbUser(): Promise<User | null> {
  const supabaseUser = await getSupabaseUser();

  if (!supabaseUser) {
    return null;
  }

  return ensureUserRecord(supabaseUser);
}

export function isSubscriptionActive(status: User['subscriptionStatus']): boolean {
  return status === 'ACTIVE';
}
