type FooterProps = {
  productName: string;
  dictionary: {
    note: string;
  };
};

function TwitterXIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M17.98 4H20.9l-6.38 7.3L22 20h-5.86l-4.59-5.34L6.88 20H3.95l6.82-7.8L2 4h6.01l4.15 4.84L17.98 4Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M12 3.75a8.25 8.25 0 0 0-2.61 16.08c.41.07.56-.18.56-.4v-1.56c-2.3.5-2.78-1.1-2.78-1.1-.38-.95-.92-1.2-.92-1.2-.75-.51.06-.5.06-.5.83.06 1.27.85 1.27.85.74 1.26 1.94.9 2.41.69.08-.54.29-.9.53-1.1-1.84-.21-3.77-.92-3.77-4.08 0-.9.33-1.65.86-2.23-.08-.21-.38-1.06.09-2.2 0 0 .7-.22 2.3.85a8.06 8.06 0 0 1 4.18 0c1.6-1.07 2.3-.84 2.3-.84.47 1.14.17 1.98.08 2.2.54.58.86 1.33.86 2.23 0 3.17-1.94 3.87-3.79 4.08.3.25.57.76.57 1.53v2.28c0 .22.14.48.57.4A8.25 8.25 0 0 0 12 3.75Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function BookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M4 6.5c0-1.1.9-2 2-2h6v14H6a2 2 0 0 0-2 2v-14ZM20 6.5c0-1.1-.9-2-2-2h-6v14h6a2 2 0 0 1 2 2v-14Z"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinejoin="round"
      />
      <path d="M12 6v12" stroke="currentColor" strokeWidth="1.35" />
    </svg>
  );
}

export function Footer({ dictionary, productName }: FooterProps) {
  return (
    <footer className="mt-auto w-full px-3 pb-4 pt-4 sm:px-4 sm:pb-5 md:px-7 md:pb-6 md:pt-6">
      <div className="mx-auto w-full max-w-6xl border-t border-border/10 pt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2.5 text-secondary">
            <p className="mr-1">{productName}</p>
            <a
              href="https://x.com/Nurarihyasa"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/[0.18] bg-surface-2/[0.72] px-3 py-1.5 text-[11px] tracking-[0.02em] text-secondary transition-colors hover:border-border-strong hover:text-foreground"
            >
              <TwitterXIcon />
              Twitter / X
            </a>
            <a
              href="https://github.com/Pterodactyl681/GhostTab/"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border/[0.18] bg-surface-2/[0.72] px-3 py-1.5 text-[11px] tracking-[0.02em] text-secondary transition-colors hover:border-border-strong hover:text-foreground"
            >
              <GitHubIcon />
              GitHub
            </a>
            <span
              aria-disabled="true"
              className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-xl border border-border/[0.14] bg-surface-2/[0.5] px-3 py-1.5 text-[11px] tracking-[0.02em] text-secondary/65"
            >
              <BookIcon />
              README / Docs
            </span>
          </div>
          <p className="text-[10px] leading-5">{dictionary.note}</p>
        </div>
      </div>
    </footer>
  );
}
