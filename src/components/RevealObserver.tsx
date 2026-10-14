'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

/** Adds .is-visible to every .reveal element as it scrolls into view. */
export function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
    );
    const watch = (root: ParentNode) =>
      root.querySelectorAll('.reveal:not(.is-visible)').forEach((el) => io.observe(el));
    watch(document);

    // Content rendered later (filters, carousels) gets picked up too.
    const mo = new MutationObserver((records) => {
      for (const r of records) r.addedNodes.forEach((n) => n instanceof Element && (n.matches('.reveal') ? io.observe(n) : watch(n)));
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, [pathname]);

  return null;
}
