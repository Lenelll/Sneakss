import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell flex min-h-[65vh] items-center py-20">
      <div className="w-full border-t border-line pt-8">
        <p className="eyebrow text-vault">404 · Outside the vault</p>
        <div className="mt-8 grid gap-10 lg:grid-cols-[1.5fr_0.5fr] lg:items-end">
          <h1 className="display-type max-w-5xl">This pair has moved on.</h1>
          <div>
            <p className="text-base leading-7 text-muted">
              The page may have been removed, renamed, or never added to the
              collection.
            </p>
            <Link
              href="/shop"
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-vault px-6 text-sm font-bold uppercase tracking-[0.13em] text-white transition-colors hover:bg-vault-dark"
            >
              Return to shop
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
