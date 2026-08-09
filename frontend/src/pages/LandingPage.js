// src/pages/LandingPage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  FolderKanban,
  ShieldCheck,
  CalendarClock,
  Share2,
  Sparkles,
  Star,
  FileText,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import Avatar from '../components/ui/Avatar';

// Real sequence — upload, assign, approve mirrors the actual backend workflow,
// so numbered steps encode a true order rather than decorating a flat list.
const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Upload & organize',
    description: 'Drop a file into a workspace your team already shares — no folder hunting, no email attachments.',
  },
  {
    step: '02',
    title: 'Route it to reviewers',
    description: 'Assign it to the people who need to sign off. They see exactly what\u2019s waiting on them, nothing else.',
  },
  {
    step: '03',
    title: 'Approve & lock',
    description: 'Once approved, the document locks. No quiet edits after sign-off \u2014 changes require reopening it first.',
  },
];

// Copy pulled from real backend capability, not generic SaaS filler
const FEATURES = [
  {
    icon: FolderKanban,
    title: 'A status for every document',
    description: 'Draft, in review, approved \u2014 enforced by the backend, not just a label you set and forget.',
    spotlight: true,
  },
  {
    icon: ShieldCheck,
    title: 'Workspace permissions that mean it',
    description: 'View, edit, add, delete, invite \u2014 set per member, not inferred from a role name.',
  },
  {
    icon: CalendarClock,
    title: 'Due dates you can see coming',
    description: 'Every document carries its own deadline, laid out on a calendar built for it.',
  },
  {
    icon: Share2,
    title: 'Share outside the workspace',
    description: 'Send one document to someone who isn\u2019t a member \u2014 read-only or editable, your call.',
  },
  {
    icon: Star,
    title: 'Favorites for fast recall',
    description: 'Star what you check often. It surfaces first, every time you come back.',
  },
];

const scrollToFeatures = () => {
  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
};

// Small illustrative mock of the real DocumentRow/StatusPill/Avatar UI \u2014
// this is what the product actually looks like, not a stock screenshot.
const ProductPreviewCard = () => (
  <div
    className="rounded-2xl border border-border bg-surface shadow-panel p-5 animate-slide-up"
    style={{ animationDelay: '150ms', animationFillMode: 'backwards' }}
  >
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-xs text-ink-muted">Workspace</p>
        <p className="text-sm font-semibold text-ink">Q3 Marketing</p>
      </div>
      <Avatar
        isGroup
        size="sm"
        groupMembers={[{ name: 'Priya Shah' }, { name: 'Leo Cohen' }, { name: 'Ana Reyes' }]}
        maxGroupDisplay={3}
      />
    </div>

    <div className="space-y-2">
      {[
        { name: 'brand-guidelines.pdf', status: 'approved', meta: 'Updated 2 days ago' },
        { name: 'campaign-brief.docx', status: 'in-review', meta: 'Due in 3 days' },
        { name: 'budget-2026.xlsx', status: 'draft', meta: 'Not shared yet' },
      ].map((doc) => (
        <div
          key={doc.name}
          className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-3 py-2.5"
        >
          <FileText className="h-4 w-4 shrink-0 text-ink-muted" />
          <div className="min-w-0 flex-1">
            <p className="text-sm text-ink truncate">{doc.name}</p>
            <p className="text-xs text-ink-muted">{doc.meta}</p>
          </div>
          <Badge
            variant={doc.status === 'approved' ? 'success' : doc.status === 'in-review' ? 'warning' : 'gray'}
            size="sm"
          >
            {doc.status === 'approved' ? 'Approved' : doc.status === 'in-review' ? 'In review' : 'Draft'}
          </Badge>
        </div>
      ))}
    </div>
  </div>
);

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-bg">

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-1.5 mb-5 text-sm font-medium text-primary-700 dark:text-primary-400">
              <Sparkles className="h-4 w-4" />
              <span>Document workflow, not just storage</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-bold text-ink tracking-tight leading-[1.1] mb-6">
              Give every document a<br />clear path to approved.
            </h1>

            <p className="text-lg text-ink-muted mb-8 max-w-lg">
              DocManager organizes your team's files into workspaces, moves each one through
              draft, review, and approval, and keeps due dates from slipping through email threads.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <Button size="lg" onClick={() => navigate('/register')} rightIcon={<ArrowRight className="h-4 w-4" />}>
                Get started free
              </Button>
              <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
                Explore as a guest
              </Button>
            </div>
            <p className="text-sm text-ink-muted">No credit card. No signup for the guest workspace.</p>
          </div>

          <ProductPreviewCard />
        </div>
      </section>

      {/* How it works — real 3-step sequence, so numbering carries information */}
      <section className="border-y border-border bg-surface-2/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-xl mb-14">
            <h2 className="text-3xl font-bold text-ink mb-3">How a document actually moves</h2>
            <p className="text-ink-muted text-lg">Three steps, enforced by the backend — not left to whoever remembers to follow up.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {HOW_IT_WORKS.map((item, i) => (
              <div
                key={item.step}
                className="animate-slide-up"
                style={{ animationDelay: `${i * 100}ms`, animationFillMode: 'backwards' }}
              >
                <p className="text-sm font-mono text-primary-600 dark:text-primary-400 mb-3">{item.step}</p>
                <h3 className="text-lg font-semibold text-ink mb-2">{item.title}</h3>
                <p className="text-ink-muted text-sm leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="mb-14">
          <h2 className="text-3xl font-bold text-ink mb-3">What's actually built in</h2>
          <p className="text-ink-muted text-lg">No add-ons to configure. This is what a workspace does out of the box.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className={`rounded-2xl border border-border bg-surface p-6 hover:border-primary-300 dark:hover:border-primary-700 transition-colors ${
                feature.spotlight ? 'md:col-span-2 md:flex md:items-center md:gap-8' : ''
              }`}
            >
              <div className={feature.spotlight ? 'md:flex-1' : ''}>
                <div className="icon-badge icon-badge-2 h-11 w-11 mb-4">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-ink mb-2">{feature.title}</h3>
                <p className="text-ink-muted text-sm leading-relaxed">{feature.description}</p>
              </div>
              {feature.spotlight && (
                <div className="hidden md:flex items-center gap-2 shrink-0 mt-6 md:mt-0">
                  {['Draft', 'In review', 'Approved'].map((label, i) => (
                    <React.Fragment key={label}>
                      <Badge variant={i === 0 ? 'gray' : i === 1 ? 'warning' : 'success'} size="sm">
                        {label}
                      </Badge>
                      {i < 2 && <ArrowRight className="h-3.5 w-3.5 text-ink-muted" />}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="rounded-2xl border border-border bg-surface p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="icon-badge icon-badge-1 h-12 w-12">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-ink mb-3">Ready to see it on your own files?</h2>
          <p className="text-ink-muted text-lg mb-8 max-w-md mx-auto">
            Create a workspace in under a minute, or open the guest demo and skip signup entirely.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" onClick={() => navigate('/register')}>
              Create your workspace
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate('/login')}>
              Try the guest demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
                <span className="text-lg font-bold text-ink">DocManager</span>
              </div>
              <p className="text-ink-muted text-sm">Document review, tracked from draft to approved.</p>
            </div>
            <div>
              <h3 className="text-ink font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-ink-muted text-sm">
                <li>
                  <button onClick={scrollToFeatures} className="hover:text-ink transition-colors">
                    Features
                  </button>
                </li>
                <li><a href="#pricing" className="hover:text-ink transition-colors">Pricing</a></li>
                <li><a href="#security" className="hover:text-ink transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-ink font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-ink-muted text-sm">
                <li><a href="#about" className="hover:text-ink transition-colors">About</a></li>
                <li><a href="#contact" className="hover:text-ink transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="text-ink font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-ink-muted text-sm">
                <li><a href="#privacy" className="hover:text-ink transition-colors">Privacy</a></li>
                <li><a href="#terms" className="hover:text-ink transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-border text-center text-ink-muted text-sm">
            <p>&copy; 2026 DocManager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;