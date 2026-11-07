import { SignOutButton } from '@/components/layout/sign-out-button';

type HeaderProps = {
  email: string;
  statusLabel: string;
};

export function Header({ email, statusLabel }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-neutral-800 bg-neutral-950/80 px-4 py-3 backdrop-blur sm:px-6 lg:px-10">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-neutral-200">{email}</p>
        <p className="truncate text-xs text-neutral-500">{statusLabel}</p>
      </div>
      <SignOutButton />
    </header>
  );
}
