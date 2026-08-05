import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--ot-border)] bg-[var(--ot-navy)] text-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3 sm:px-6">
        <div>
          <p className="text-lg font-semibold">
            Talent<span className="text-[var(--ot-ocean)]">Quest</span>
          </p>
          <p className="mt-2 text-sm tracking-[0.16em] text-white/70 uppercase">
            Discover. Connect. Succeed.
          </p>
        </div>
        <div className="text-sm text-white/80">
          <p className="font-semibold text-white">Explore</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/industries" className="hover:text-white">
              Industries we serve
            </Link>
            <Link href="/about" className="hover:text-white">
              About us
            </Link>
            <Link href="/careers" className="hover:text-white">
              Careers at TQ
            </Link>
          </div>
        </div>
        <div className="text-sm text-white/80">
          <p className="font-semibold text-white">Portals</p>
          <div className="mt-3 flex flex-col gap-2">
            <Link href="/signup" className="hover:text-white">
              Get started
            </Link>
            <Link href="/login" className="hover:text-white">
              Client sign in
            </Link>
            <Link href="/careers/login" className="hover:text-white">
              Employee sign in
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
