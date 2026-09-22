import type { ReactNode } from 'react';

/**
 * Shell for the terms and privacy pages.
 *
 * <p>Shared rather than duplicated so the two cannot drift apart in measure or spacing. The prose
 * is capped at `max-w-2xl` to keep lines under roughly 75 characters, which is the one thing that
 * makes a page of continuous text readable at all.
 */
export function LegalPage({ title, updated, intro, children }: {
  title: string;
  /** When the text last changed. Readers need this to know whether it covers their booking. */
  updated: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="container-page py-12 lg:py-16">
      <div className="mx-auto w-full max-w-2xl">
        <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">{title}</h1>
        <p className="mt-3 text-sm font-semibold text-slate-500">Last updated {updated}</p>
        <p className="mt-6 text-base leading-relaxed text-slate-600">{intro}</p>
        <div className="mt-10 space-y-10">{children}</div>
      </div>
    </main>
  );
}

export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="text-lg font-bold text-slate-950">{heading}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-slate-600">{children}</div>
    </section>
  );
}
