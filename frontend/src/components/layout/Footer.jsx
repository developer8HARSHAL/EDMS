import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="border-t border-border bg-bg">
      <div className="mx-auto flex min-h-14 max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <div>
        <div className="flex items-center gap-2 mb-2">
                <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
                <span className="text-lg font-bold text-ink">DocManager</span>
              </div>
              <p className="text-ink-muted text-sm">Document review, tracked from draft to approved.</p>
            </div>

        <nav
          aria-label="Footer"
          className="flex items-center gap-4 text-xs text-ink-muted"
        >
          <Link
            to="/help"
            className="transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Help
          </Link>

          <span
            className="h-3.5 w-px bg-border"
            aria-hidden="true"
          />

          <Link
            to="/privacy"
            className="transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Privacy
          </Link>

          <span
            className="h-3.5 w-px bg-border"
            aria-hidden="true"
          />

          <Link
            to="/terms"
            className="transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
          >
            Terms
          </Link>
        </nav>
      </div>
    </footer>
  );
};

export default Footer;