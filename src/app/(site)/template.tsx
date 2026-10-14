import type { ReactNode } from 'react';

// Re-mounted on every navigation, so each page fades in.
export default function SiteTemplate({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
