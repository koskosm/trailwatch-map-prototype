import type { ReactNode } from 'react';
import type { DesignSystem, Page, SlideMeta } from '@open-slide/core';
import { useSlidePageNumber } from '@open-slide/core';

import mapHome from './assets/map-home.png';
import sheetForyou from './assets/sheet-foryou.png';
import exploreEditorial from './assets/explore-editorial.png';
import searchSamples from './assets/search-samples.png';
import searchFilters from './assets/search-filters.png';
import searchResults from './assets/search-results.png';
import trailDetail from './assets/trail-detail.png';
import reportCamera from './assets/report-camera.png';
import sheetIncidents from './assets/sheet-incidents.png';
import recordTrack from './assets/record-track.png';
import finishSummary from './assets/finish-summary.png';
import youActivities from './assets/you-activities.png';

export const design: DesignSystem = {
  palette: { bg: '#f4f6f2', text: '#102018', accent: '#1a7f37' },
  fonts: {
    display: 'ui-rounded, "SF Pro Display", system-ui, -apple-system, sans-serif',
    body: 'ui-sans-serif, "SF Pro Text", system-ui, -apple-system, sans-serif',
  },
  typeScale: { hero: 120, body: 34 },
  radius: 18,
};

const muted = '#5f6f64';
const soft = '#e6ece6';
const ink = '#0b421a';
const card = '#ffffff';
const dark = '#0d1712';

const fillBase = {
  width: '100%',
  height: '100%',
  fontFamily: 'var(--osd-font-body)',
  color: 'var(--osd-text)',
  boxSizing: 'border-box' as const,
};

const fill = {
  ...fillBase,
  backgroundColor: 'var(--osd-bg)',
};

function Footer() {
  const { current, total } = useSlidePageNumber();
  return (
    <div
      style={{
        position: 'absolute',
        left: 120,
        right: 120,
        bottom: 48,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: muted,
        fontSize: 22,
        fontWeight: 500,
      }}
    >
      <span style={{ letterSpacing: '0.04em' }}>TRAILWATCH · UX REVIEW</span>
      <span>
        {String(current).padStart(2, '0')} / {String(total).padStart(2, '0')}
      </span>
    </div>
  );
}

function Eyebrow({ children }: { children: string }) {
  return (
    <div
      style={{
        fontSize: 24,
        fontWeight: 700,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'var(--osd-accent)',
        marginBottom: 20,
      }}
    >
      {children}
    </div>
  );
}

function PhoneShot({ src, alt }: { src: string; alt: string }) {
  // Full `.phone-frame` captures at 424×896 — clip to a device-like outer radius.
  return (
    <div
      style={{
        height: 780,
        width: 369,
        flexShrink: 0,
        borderRadius: 48,
        overflow: 'hidden',
        boxShadow: '0 28px 80px rgba(13, 23, 18, 0.28)',
        background: '#0d1712',
      }}
    >
      <img
        src={src}
        alt={alt}
        style={{
          height: '100%',
          width: '100%',
          objectFit: 'cover',
          display: 'block',
        }}
      />
    </div>
  );
}

function FlowPhone({
  src,
  alt,
  caption,
  action,
  size = 'md',
}: {
  src?: string;
  alt: string;
  caption: string;
  action?: string;
  size?: 'md' | 'sm';
}) {
  const h = size === 'sm' ? 340 : 500;
  const w = Math.round(h * (424 / 896));
  const radius = size === 'sm' ? 26 : 34;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: size === 'sm' ? 10 : 12, flexShrink: 0 }}>
      <div
        style={{
          height: h,
          width: w,
          borderRadius: radius,
          overflow: 'hidden',
          boxShadow: '0 18px 48px rgba(13, 23, 18, 0.22)',
          background: dark,
          border: src ? 'none' : `2px solid ${soft}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {src ? (
          <img src={src} alt={alt} style={{ height: '100%', width: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div
            style={{
              flex: 1,
              padding: size === 'sm' ? '18px 14px' : '24px 18px',
              backgroundColor: '#0d1712',
              backgroundImage: 'linear-gradient(180deg, #1a2a20 0%, #0d1712 55%, #14241a 100%)',
              color: '#f5faf6',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div
                style={{
                  width: size === 'sm' ? 52 : 68,
                  height: 8,
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.18)',
                  margin: size === 'sm' ? '0 auto 16px' : '0 auto 22px',
                }}
              />
              <div
                style={{
                  fontSize: size === 'sm' ? 17 : 20,
                  fontWeight: 750,
                  letterSpacing: '-0.02em',
                  lineHeight: 1.25,
                }}
              >
                {alt}
              </div>
              <div style={{ marginTop: 8, fontSize: size === 'sm' ? 13 : 15, lineHeight: 1.35, color: '#9ed4b0' }}>
                {caption}
              </div>
            </div>
            <div
              style={{
                borderRadius: 12,
                padding: size === 'sm' ? '10px 12px' : '12px 14px',
                background: 'rgba(255,255,255,0.08)',
                fontSize: size === 'sm' ? 12 : 14,
                color: '#c7e6d1',
                lineHeight: 1.35,
              }}
            >
              Next step in flow
            </div>
          </div>
        )}
      </div>
      <div style={{ textAlign: 'center', maxWidth: w + 16 }}>
        <div style={{ fontSize: size === 'sm' ? 17 : 20, fontWeight: 750, letterSpacing: '-0.02em' }}>{caption}</div>
        {action ? (
          <div
            style={{
              marginTop: 4,
              fontSize: size === 'sm' ? 14 : 16,
              color: 'var(--osd-accent)',
              fontWeight: 650,
            }}
          >
            {action}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function FlowStepArrow({ label, size = 'md' }: { label: string; size?: 'md' | 'sm' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
        padding: '0 2px',
        flexShrink: 0,
        alignSelf: 'center',
        marginBottom: size === 'sm' ? 36 : 44,
      }}
    >
      <div
        style={{
          fontSize: size === 'sm' ? 13 : 14,
          fontWeight: 700,
          color: muted,
          textAlign: 'center',
          maxWidth: size === 'sm' ? 88 : 100,
          lineHeight: 1.25,
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: size === 'sm' ? 22 : 26, fontWeight: 800, color: 'var(--osd-accent)' }} aria-hidden>
        →
      </div>
    </div>
  );
}

const Cover: Page = () => (
  <div
    style={{
      ...fillBase,
      // Solid base survives PDF export (open-slide strips CSS gradients).
      backgroundColor: dark,
      backgroundImage: `radial-gradient(1200px 700px at 70% 20%, #1f9a4a 0%, transparent 55%), linear-gradient(145deg, ${dark} 0%, #143222 55%, #0b421a 100%)`,
      color: '#f5faf6',
      padding: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
    }}
  >
    <div>
      <div style={{ fontSize: 26, fontWeight: 650, letterSpacing: '0.14em', color: '#9ed4b0' }}>
        MAP-FIRST PROTOTYPE · NOV 2026
      </div>
      <h1
        style={{
          margin: '28px 0 0',
          fontFamily: 'var(--osd-font-display)',
          fontSize: 'var(--osd-size-hero)',
          lineHeight: 1.02,
          letterSpacing: '-0.04em',
          fontWeight: 800,
          maxWidth: 1400,
        }}
      >
        TrailWatch UI/UX
        <br />
        findings &amp; changes
      </h1>
      <p style={{ marginTop: 36, fontSize: 36, lineHeight: 1.45, color: '#c7e6d1', maxWidth: 1100 }}>
        Critique of the original map-first prototype, then the redesigned IA, screen flows,
        and walkthrough aligned with live TrailWatch Explore.
      </p>
    </div>
    <div style={{ display: 'flex', gap: 48, fontSize: 24, color: '#9ed4b0' }}>
      <span>UX critique</span>
      <span>Suggested user flow</span>
      <span>Screen flows</span>
      <span>Walkthrough</span>
    </div>
  </div>
);

function SectionTitle({ eyebrow, title, blurb }: { eyebrow: string; title: string; blurb: string }) {
  return (
    <>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 56,
          letterSpacing: '-0.03em',
          fontWeight: 800,
          lineHeight: 1.1,
          maxWidth: 1600,
        }}
      >
        {title}
      </h2>
      <p style={{ margin: '18px 0 0', fontSize: 26, lineHeight: 1.45, color: muted, maxWidth: 1500 }}>{blurb}</p>
    </>
  );
}

function CritiqueFinding({
  n,
  title,
  evidence,
  whyItMatters,
}: {
  n: string;
  title: string;
  evidence: string[];
  whyItMatters: string;
}) {
  return (
    <div style={{ ...fill, padding: '80px 100px 72px' }}>
      <Eyebrow>{`Problem ${n}`}</Eyebrow>
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 56,
          letterSpacing: '-0.03em',
          fontWeight: 800,
          lineHeight: 1.1,
          maxWidth: 1500,
        }}
      >
        {title}
      </h2>
      <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 22 }}>
        <div
          style={{
            background: card,
            border: `1px solid ${soft}`,
            borderRadius: 20,
            padding: '32px 36px',
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 750,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#a65d3b',
              marginBottom: 18,
            }}
          >
            What was wrong
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: 18 }}>
            {evidence.map((e) => (
              <li key={e} style={{ display: 'flex', gap: 14, fontSize: 30, lineHeight: 1.4, color: muted }}>
                <span style={{ color: '#a65d3b', fontWeight: 800 }}>·</span>
                <span>{e}</span>
              </li>
            ))}
          </ul>
        </div>
        <div
          style={{
            background: '#f7f3f0',
            borderRadius: 20,
            padding: '32px 34px',
            border: '1px solid #eadfd6',
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 750,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: '#a65d3b',
              marginBottom: 14,
            }}
          >
            Why it matters
          </div>
          <div style={{ fontSize: 32, lineHeight: 1.4, fontWeight: 650, color: '#4a352c' }}>{whyItMatters}</div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

const CritiqueIntro: Page = () => (
  <div style={{ ...fill, padding: '88px 100px 72px' }}>
    <SectionTitle
      eyebrow="UX review"
      title="What went wrong in the first map app"
      blurb="We looked at the first iPhone map prototype and listed the main problems hikers would hit. Later slides show how we fixed them."
    />
    <div style={{ marginTop: 40, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
      {[
        ['01', 'Confusing buttons', 'Hard to tell browsing options from filters.'],
        ['02', 'Empty search', 'Search opened, but gave no help on what to type.'],
        ['03', 'Hidden best routes', 'Editor’s Choice and themes were hard to find.'],
        ['04', 'Weak report & finish', 'Reporting issues and ending a hike felt incomplete.'],
      ].map(([n, title, body]) => (
        <div
          key={n}
          style={{
            background: card,
            border: `1px solid ${soft}`,
            borderRadius: 20,
            padding: '32px 34px',
            display: 'flex',
            gap: 22,
            alignItems: 'flex-start',
          }}
        >
          <div style={{ fontSize: 28, fontWeight: 800, color: '#a65d3b' }}>{n}</div>
          <div>
            <div style={{ fontSize: 34, fontWeight: 750, letterSpacing: '-0.02em', marginBottom: 10 }}>{title}</div>
            <div style={{ fontSize: 26, lineHeight: 1.45, color: muted }}>{body}</div>
          </div>
        </div>
      ))}
    </div>
    <Footer />
  </div>
);

const CritiqueScope: Page = () => (
  <div style={{ ...fill, padding: '88px 100px 72px' }}>
    <SectionTitle
      eyebrow="UX review"
      title="Parts of the app we checked"
      blurb="We focused on the everyday map experience — finding trails, searching, and reporting problems."
    />
    <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      {[
        ['Map home', 'Search bar, layer tools, the + report button, and pins on the map'],
        ['Bottom sheet', 'The panel that slides up with For you, Explore, Incidents, and more'],
        ['Search', 'The full search screen after tapping the search bar'],
        ['Report & hike', 'Reporting a trail issue, and saving a hike when you finish'],
      ].map(([title, body]) => (
        <div
          key={title}
          style={{
            background: card,
            border: `1px solid ${soft}`,
            borderRadius: 20,
            padding: '32px 34px',
          }}
        >
          <div style={{ fontSize: 34, fontWeight: 750, letterSpacing: '-0.02em', marginBottom: 12 }}>{title}</div>
          <div style={{ fontSize: 28, lineHeight: 1.45, color: muted }}>{body}</div>
        </div>
      ))}
    </div>
    <Footer />
  </div>
);

const CritiqueNav: Page = () => (
  <CritiqueFinding
    n="01"
    title="Too many similar buttons in one row"
    evidence={[
      'For you, Explore, Incidents, and filters all looked like the same kind of chip.',
      'People couldn’t tell if they were changing the list or applying a filter.',
      'Under Explore, theme filters felt like another set of tabs.',
    ]}
    whyItMatters="Easy to tap the wrong thing. Browsing the map felt messy and unclear."
  />
);

const CritiqueSearch: Page = () => (
  <CritiqueFinding
    n="02"
    title="Search felt empty and stuck"
    evidence={[
      'Opening search showed a blank screen with no tips.',
      'There were no sample searches like trail names or themes to try.',
      'Filters for place, difficulty, time, and distance were missing or incomplete.',
    ]}
    whyItMatters="If you don’t know the exact trail name, search doesn’t help you start."
  />
);

const CritiqueExplore: Page = () => (
  <CritiqueFinding
    n="03"
    title="Best routes were hard to find"
    evidence={[
      'The live TrailWatch website already highlights Editor’s Choice and themes.',
      'The first map app didn’t show those picks clearly in the bottom sheet.',
      'There was no simple way to browse by theme, like Coastal or Heritage.',
    ]}
    whyItMatters="Recommended routes stayed hidden, so the map felt poorer than the website."
  />
);

const CritiqueReport: Page = () => (
  <CritiqueFinding
    n="04"
    title="Reporting and finishing a hike felt incomplete"
    evidence={[
      'You could start a report, but taking photos and picking a problem type felt unclear.',
      'Ending a hike didn’t clearly ask about privacy or sharing.',
      'These steps felt added on, not part of a smooth flow.',
    ]}
    whyItMatters="Reporting trail problems and saving a hike are core jobs — they need to feel solid."
  />
);

const CritiqueSynthesis: Page = () => (
  <div style={{ ...fill, padding: '80px 100px 72px' }}>
    <SectionTitle
      eyebrow="Critique · Synthesis"
      title="Severity stack for the original prototype"
      blurb="Use this board to align before we walk the redesigned IA and screen flows."
    />
    <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 18 }}>
      <div
        style={{
          background: '#f7f3f0',
          border: '1px solid #eadfd6',
          borderRadius: 20,
          padding: '28px 30px',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 750, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#a65d3b', marginBottom: 16 }}>
          P0 · Blocks discovery
        </div>
        <div style={{ display: 'grid', gap: 14, fontSize: 26, lineHeight: 1.4, color: '#4a352c', fontWeight: 650 }}>
          <div>Modes vs filters chip collision</div>
          <div>Empty search with no samples / filters</div>
        </div>
      </div>
      <div
        style={{
          background: card,
          border: `1px solid ${soft}`,
          borderRadius: 20,
          padding: '28px 30px',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 750, letterSpacing: '0.08em', textTransform: 'uppercase', color: ink, marginBottom: 16 }}>
          P1 · Weakens trust
        </div>
        <div style={{ display: 'grid', gap: 14, fontSize: 26, lineHeight: 1.4, color: muted, fontWeight: 650 }}>
          <div>Editor’s Choice / themes missing</div>
          <div>Report + hike finish incomplete</div>
        </div>
      </div>
      <div
        style={{
          background: soft,
          borderRadius: 20,
          padding: '28px 30px',
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 750, letterSpacing: '0.08em', textTransform: 'uppercase', color: ink, marginBottom: 16 }}>
          Open for room
        </div>
        <div style={{ display: 'grid', gap: 14, fontSize: 24, lineHeight: 1.4, color: muted }}>
          <div>Default sheet tab on map open?</div>
          <div>Editor’s Choice default chip?</div>
          <div>Report from Map, Record, or both?</div>
        </div>
      </div>
    </div>
    <div
      style={{
        marginTop: 28,
        fontSize: 28,
        fontWeight: 650,
        color: ink,
        letterSpacing: '-0.02em',
      }}
    >
      Next: suggested user flow → IA → screen walkthrough
    </div>
    <Footer />
  </div>
);

function UfNode({
  label,
  sub,
  tone = 'default',
}: {
  label: string;
  sub?: string;
  tone?: 'default' | 'start' | 'end' | 'action';
}) {
  const styles =
    tone === 'start'
      ? { bg: ink, color: '#f5faf6', border: 'none', subColor: '#9ed4b0' }
      : tone === 'end'
        ? { bg: '#e8f5ec', color: ink, border: `1.5px solid #b7dcc4`, subColor: muted }
        : tone === 'action'
          ? { bg: '#f7f3f0', color: '#4a352c', border: '1.5px solid #eadfd6', subColor: '#8a6a55' }
          : { bg: card, color: 'var(--osd-text)', border: `1.5px solid ${soft}`, subColor: muted };

  return (
    <div
      style={{
        background: styles.bg,
        color: styles.color,
        border: styles.border,
        borderRadius: 16,
        padding: sub ? '16px 18px' : '14px 18px',
        textAlign: 'center',
        minWidth: 150,
        maxWidth: 220,
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 750, letterSpacing: '-0.02em', lineHeight: 1.2 }}>{label}</div>
      {sub ? <div style={{ marginTop: 6, fontSize: 16, lineHeight: 1.35, color: styles.subColor }}>{sub}</div> : null}
    </div>
  );
}

function UfArrow({ label }: { label?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
        padding: '0 6px',
        flexShrink: 0,
        color: 'var(--osd-accent)',
        fontWeight: 800,
      }}
    >
      {label ? <div style={{ fontSize: 14, fontWeight: 650, color: muted, maxWidth: 90, textAlign: 'center', lineHeight: 1.2 }}>{label}</div> : null}
      <span style={{ fontSize: 22 }} aria-hidden>
        →
      </span>
    </div>
  );
}

function UfDown({ label }: { label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '6px 0', color: 'var(--osd-accent)', fontWeight: 800 }}>
      {label ? <div style={{ fontSize: 15, fontWeight: 650, color: muted, marginBottom: 2 }}>{label}</div> : null}
      <span style={{ fontSize: 20 }} aria-hidden>
        ↓
      </span>
    </div>
  );
}

const SuggestedUserflowOverview: Page = () => (
  <div style={{ ...fill, padding: '64px 72px 56px' }}>
    <SectionTitle
      eyebrow="Suggested user flow"
      title="How we want hikers to move through the app"
      blurb="Based on the latest map prototype. Start on Map home, then pick a job: browse, search, report, or record a hike."
    />

    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <UfNode tone="start" label="Open TrailWatch" sub="Land on Map home" />
      <UfDown />
      <UfNode tone="start" label="Map home" sub="Search bar · bottom sheet · + report · tabs" />
      <UfDown label="Choose a job" />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 14, width: '100%' }}>
        {[
          ['Browse trails', 'Open sheet → Explore → pick theme → open trail'],
          ['Search', 'Tap search → sample or type → filters → open trail'],
          ['Report issue', 'Tap + → photos → problem type → submit'],
          ['Record hike', 'Record tab → Start → Finish → save to You'],
        ].map(([title, body]) => (
          <div
            key={title}
            style={{
              background: card,
              border: `1px solid ${soft}`,
              borderRadius: 18,
              padding: '22px 20px',
              minHeight: 168,
            }}
          >
            <div style={{ fontSize: 24, fontWeight: 750, letterSpacing: '-0.02em', marginBottom: 10, color: 'var(--osd-accent)' }}>
              {title}
            </div>
            <div style={{ fontSize: 20, lineHeight: 1.4, color: muted }}>{body}</div>
          </div>
        ))}
      </div>
    </div>
    <Footer />
  </div>
);

const SuggestedUserflowDiscover: Page = () => (
  <div style={{ ...fill, padding: '56px 64px 48px' }}>
    <SectionTitle
      eyebrow="Suggested user flow · Discover"
      title="Find a trail from the map"
      blurb="Two ways: browse the bottom sheet, or search by name / theme."
    />

    <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <div style={{ background: '#f7faf7', border: `1px solid ${soft}`, borderRadius: 20, padding: '22px 20px 26px' }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 750,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--osd-accent)',
            marginBottom: 16,
          }}
        >
          Path A · Browse
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
          <UfNode label="Map home" tone="start" />
          <UfArrow label="pull up" />
          <UfNode label="Bottom sheet" sub="For you / Explore…" />
          <UfArrow label="Explore" />
          <UfNode label="Theme chips" sub="Editor’s Choice…" />
          <UfArrow />
          <UfNode label="Trail card" />
          <UfArrow />
          <UfNode label="Trail detail" tone="end" sub="Save or Start route" />
        </div>
      </div>

      <div style={{ background: '#f7faf7', border: `1px solid ${soft}`, borderRadius: 20, padding: '22px 20px 26px' }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 750,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--osd-accent)',
            marginBottom: 16,
          }}
        >
          Path B · Search
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
          <UfNode label="Map home" tone="start" />
          <UfArrow label="search bar" />
          <UfNode label="Search screen" sub="Samples / Recent" />
          <UfArrow label="optional" />
          <UfNode label="Filters" sub="Place · level · time · km" tone="action" />
          <UfArrow />
          <UfNode label="Results" />
          <UfArrow />
          <UfNode label="Trail detail" tone="end" />
        </div>
      </div>
    </div>

    <div
      style={{
        marginTop: 18,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        flexWrap: 'wrap',
        background: card,
        border: `1px solid ${soft}`,
        borderRadius: 16,
        padding: '16px 20px',
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 750, color: muted }}>From trail detail</div>
      <UfArrow />
      <UfNode label="Start route" tone="action" />
      <UfArrow />
      <UfNode label="Record · Track" />
      <UfArrow />
      <UfNode label="Finish hike" tone="end" sub="Privacy → You › Activities" />
    </div>
    <Footer />
  </div>
);

const SuggestedUserflowAct: Page = () => (
  <div style={{ ...fill, padding: '56px 64px 48px' }}>
    <SectionTitle
      eyebrow="Suggested user flow · Act"
      title="Report a problem or finish a hike"
      blurb="Field actions stay short: capture on the spot, or wrap up tracking when the hike ends."
    />

    <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
      <div style={{ background: '#f7faf7', border: `1px solid ${soft}`, borderRadius: 20, padding: '22px 20px 26px' }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 750,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--osd-accent)',
            marginBottom: 16,
          }}
        >
          Report a trail issue
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
          <UfNode label="Map home" tone="start" />
          <UfArrow label="tap +" />
          <UfNode label="Camera" sub="Take photos" tone="action" />
          <UfArrow />
          <UfNode label="Pick type" sub="Dumping, vandalism…" />
          <UfArrow />
          <UfNode label="Submit" />
          <UfArrow />
          <UfNode label="Incidents list" tone="end" sub="Also on the map" />
        </div>
      </div>

      <div style={{ background: '#f7faf7', border: `1px solid ${soft}`, borderRadius: 20, padding: '22px 20px 26px' }}>
        <div
          style={{
            fontSize: 16,
            fontWeight: 750,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--osd-accent)',
            marginBottom: 16,
          }}
        >
          Finish & save a hike
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
          <UfNode label="Record tab" tone="start" />
          <UfArrow />
          <UfNode label="Start tracking" tone="action" />
          <UfArrow label="on trail" />
          <UfNode label="Pause / Resume" />
          <UfArrow />
          <UfNode label="Finish" sub="Title · Public/Private" />
          <UfArrow />
          <UfNode label="You › Activities" tone="end" />
        </div>
      </div>
    </div>

    <div
      style={{
        marginTop: 18,
        background: soft,
        borderRadius: 16,
        padding: '18px 24px',
        fontSize: 24,
        color: muted,
        lineHeight: 1.4,
      }}
    >
      Also available anytime from the bottom tabs: <strong style={{ color: ink }}>Community</strong> for posts & group
      hikes, and <strong style={{ color: ink }}>You</strong> for saved items, plans, and map preferences.
    </div>
    <Footer />
  </div>
);

function FlowBox({
  label,
  sub,
  accent,
  wide,
  compact,
}: {
  label: string;
  sub?: string;
  accent?: boolean;
  wide?: boolean;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        background: accent ? ink : card,
        color: accent ? '#f5faf6' : 'var(--osd-text)',
        border: accent ? 'none' : `1.5px solid ${soft}`,
        borderRadius: compact ? 12 : 16,
        padding: compact ? (sub ? '12px 14px' : '10px 14px') : sub ? '16px 18px' : '14px 16px',
        minWidth: wide ? 200 : compact ? 0 : 140,
        textAlign: 'center',
        boxShadow: accent ? '0 12px 32px rgba(11, 66, 26, 0.28)' : 'none',
      }}
    >
      <div
        style={{
          fontSize: compact ? 20 : 22,
          fontWeight: 750,
          letterSpacing: '-0.02em',
          lineHeight: 1.2,
        }}
      >
        {label}
      </div>
      {sub ? (
        <div
          style={{
            marginTop: 5,
            fontSize: compact ? 15 : 17,
            lineHeight: 1.35,
            color: accent ? '#9ed4b0' : muted,
          }}
        >
          {sub}
        </div>
      ) : null}
    </div>
  );
}

function FlowArrow() {
  return (
    <div
      style={{
        color: 'var(--osd-accent)',
        fontWeight: 800,
        fontSize: 20,
        padding: '0 6px',
        flexShrink: 0,
      }}
      aria-hidden
    >
      →
    </div>
  );
}

function FlowDown({ label }: { label?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        color: 'var(--osd-accent)',
        fontWeight: 800,
        fontSize: 20,
        padding: '4px 0',
      }}
    >
      {label ? <div style={{ fontSize: 15, fontWeight: 650, color: muted, marginBottom: 2 }}>{label}</div> : null}
      <span aria-hidden>↓</span>
    </div>
  );
}

function IaPanel({
  title,
  children,
  span,
}: {
  title: string;
  children: ReactNode;
  span?: number;
}) {
  return (
    <div
      style={{
        background: '#f7faf7',
        border: `1px solid ${soft}`,
        borderRadius: 18,
        padding: '18px 20px 20px',
        gridColumn: span ? `span ${span}` : undefined,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 16,
          fontWeight: 750,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: 'var(--osd-accent)',
          marginBottom: 12,
        }}
      >
        {title}
      </div>
      {children}
    </div>
  );
}

function ChipRow({ items }: { items: string[] }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {items.map((t) => (
        <span
          key={t}
          style={{
            background: card,
            border: `1px solid ${soft}`,
            borderRadius: 999,
            padding: '8px 12px',
            fontSize: 18,
            fontWeight: 650,
            color: ink,
          }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

const IaFlow: Page = () => (
  <div style={{ ...fill, padding: '64px 80px 56px' }}>
    <SectionTitle
      eyebrow="New IA · App shell"
      title="Four tabs · map is the home canvas"
      blurb="Persistent tab bar frames the product. Map owns discovery chrome; Community / Record / You are peer destinations with their own hubs."
    />

    <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch', width: '100%', justifyContent: 'center' }}>
        {[
          ['Map', 'Home canvas · search · sheet · FABs', true],
          ['Community', 'Posts · Group hikes · join / map', false],
          ['Record', 'Track GPS · Plan route · Finish', false],
          ['You', 'Profile · Activities · Prefs · Saved', false],
        ].map(([label, sub, accent]) => (
          <FlowBox key={label as string} label={label as string} sub={sub as string} accent={!!accent} wide />
        ))}
      </div>
      <div style={{ fontSize: 18, color: muted, fontWeight: 650 }}>Tab bar (always visible)</div>
    </div>

    <div
      style={{
        marginTop: 28,
        display: 'grid',
        gridTemplateColumns: '1.1fr 1fr 1fr',
        gap: 16,
      }}
    >
      <IaPanel title="Map home chrome">
        <ChipRow items={['Search pill', 'Layers FAB', 'Recenter', 'Report FAB (+)']} />
        <div style={{ marginTop: 14, fontSize: 20, color: muted, lineHeight: 1.4 }}>
          Pins open the same detail overlays as sheet cards (trail · incident · alert · hiker · group).
        </div>
      </IaPanel>
      <IaPanel title="Sheet height">
        <ChipRow items={['Peek', 'Half ~52%', 'Full ~82%']} />
        <div style={{ marginTop: 14, fontSize: 20, color: muted, lineHeight: 1.4 }}>
          Peek = summary + tabs. Half/Full = scrollable cards. Tab or Explore chip raises peek → half.
        </div>
      </IaPanel>
      <IaPanel title="Onboarding gate">
        <ChipRow items={['Districts', 'Interests', 'Live mode']} />
        <div style={{ marginTop: 14, fontSize: 20, color: muted, lineHeight: 1.4 }}>
          First launch / Reset → prefs applied → Map. Skip or step through.
        </div>
      </IaPanel>
    </div>
    <Footer />
  </div>
);

const IaMapDiscovery: Page = () => (
  <div style={{ ...fill, padding: '64px 80px 56px' }}>
    <SectionTitle
      eyebrow="New IA · Map discovery"
      title="Search, sheet modes, and map actions"
      blurb="Two discovery doors from Map: Search (intent) and the bottom sheet (browse). Layers and Report sit beside them on the canvas."
    />

    <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <IaPanel title="Door A · Search">
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <FlowBox compact label="Search pill" />
          <FlowArrow />
          <FlowBox compact label="Search screen" sub="Samples · Recent" />
          <FlowArrow />
          <FlowBox compact label="Filters" sub="District · L1–5 · duration · distance" />
          <FlowArrow />
          <FlowBox compact label="Results" accent />
          <FlowArrow />
          <FlowBox compact label="Trail detail" accent />
        </div>
        <div style={{ marginTop: 14, fontSize: 19, color: muted, lineHeight: 1.4 }}>
          Samples: Miu Sam, Dragon’s Back, coastal, heritage, accessible, Tai Tam. Active query also filters sheet/map trails.
        </div>
      </IaPanel>

      <IaPanel title="Door B · Bottom sheet tabs">
        <ChipRow
          items={['For you', 'Explore', 'Incidents', 'Alerts', 'New', 'Trending', 'Recommended', 'Live']}
        />
        <div style={{ marginTop: 14, fontSize: 19, color: muted, lineHeight: 1.4 }}>
          <strong style={{ color: ink }}>For you</strong> = mix of nearby incidents + alerts + interest trails ·{' '}
          <strong style={{ color: ink }}>Explore</strong> alone shows outline theme chips · others are single-mode lists.
        </div>
      </IaPanel>

      <IaPanel title="Explore only · outline chips">
        <ChipRow
          items={[
            'All',
            'Editor’s Choice',
            'Latest Feature',
            'Coastal',
            'Backyard',
            'Accessible',
            'Long Trail',
            'Nature & Family',
            'Country Trail',
            'Heritage',
            'Reservoir',
            'Waste Audit',
          ]}
        />
        <div style={{ marginTop: 14, fontSize: 19, color: muted, lineHeight: 1.4 }}>
          Horizontal scroll · live counts · editorial cards include a “why” blurb → Trail detail.
        </div>
      </IaPanel>

      <IaPanel title="Map FABs & layers">
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <FlowBox compact label="Layers" sub="Live Off/Friends/Nearby" />
          <FlowArrow />
          <FlowBox
            compact
            label="Map toggles"
            sub="Incidents · Alerts · New · Trending · Recommended · Groups · Hikers"
          />
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <FlowBox compact label="Report FAB" />
          <FlowArrow />
          <FlowBox compact label="Camera → type → place" />
          <FlowArrow />
          <FlowBox compact label="Submit" accent />
          <FlowArrow />
          <FlowBox compact label="Incidents on map/sheet" accent />
        </div>
      </IaPanel>
    </div>
    <Footer />
  </div>
);

const IaDetails: Page = () => (
  <div style={{ ...fill, padding: '64px 80px 56px' }}>
    <SectionTitle
      eyebrow="New IA · Detail overlays"
      title="What opens from cards, pins, and FABs"
      blurb="Sheet cards and map pins share the same detail destinations. Trail detail is the hub into Record; Finish routes back to You."
    />

    <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <IaPanel title="Trail detail">
        <ChipRow items={['Hero / photos', 'Inline route map', 'Stats', 'About · Why · Route']} />
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <FlowBox compact label="Upvote / Save" />
          <FlowArrow />
          <FlowBox compact label="Edit route → Record Plan" />
          <FlowArrow />
          <FlowBox compact label="Start route → Record Track" accent />
        </div>
        <div style={{ marginTop: 10, fontSize: 18, color: muted }}>Expand map → trail lightbox</div>
      </IaPanel>

      <IaPanel title="Incident · Alert · Hiker · Group">
        <div style={{ display: 'grid', gap: 10 }}>
          <div style={{ fontSize: 20, color: muted, lineHeight: 1.4 }}>
            <strong style={{ color: ink }}>Incident</strong> — type, status, photos · Still there / Not there
          </div>
          <div style={{ fontSize: 20, color: muted, lineHeight: 1.4 }}>
            <strong style={{ color: ink }}>Alert</strong> — Upvote · Save · View on map
          </div>
          <div style={{ fontSize: 20, color: muted, lineHeight: 1.4 }}>
            <strong style={{ color: ink }}>Hiker</strong> — trail + mutuals · View on map
          </div>
          <div style={{ fontSize: 20, color: muted, lineHeight: 1.4 }}>
            <strong style={{ color: ink }}>Group</strong> — Join · Open on map (also from Community / You)
          </div>
        </div>
      </IaPanel>

      <IaPanel title="Record">
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <FlowBox compact label="Track" sub="Start · Pause · Report · Finish" />
          <FlowArrow />
          <FlowBox compact label="Finish summary" sub="Stats · title · Public/Private · Share" />
          <FlowArrow />
          <FlowBox compact label="You › Activities" accent />
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
          <FlowBox compact label="Plan" sub="Start / End / Via / Undo" />
          <FlowArrow />
          <FlowBox compact label="Save plan" accent />
          <FlowArrow />
          <FlowBox compact label="You › Plans" />
        </div>
      </IaPanel>

      <IaPanel title="Community & You">
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: ink, marginBottom: 8 }}>Community</div>
          <ChipRow items={['Posts', 'Group hikes', 'All / Friends / Nearby', 'Hosting']} />
        </div>
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: ink, marginBottom: 8 }}>You</div>
          <ChipRow
            items={['Activities', 'Plans', 'Reports', 'Groups', 'Saved', 'Friends', 'Map prefs']}
          />
        </div>
      </IaPanel>
    </div>
    <Footer />
  </div>
);

const IaPaths: Page = () => {
  const paths = [
    {
      name: 'Discover a route',
      steps: ['Map', 'Explore tab', 'Editor’s Choice / theme', 'Trail detail', 'Start → Record'],
    },
    {
      name: 'Search with intent',
      steps: ['Search pill', 'Sample / type', 'Filters (optional)', 'Result', 'Trail detail'],
    },
    {
      name: 'Scan nearby issues',
      steps: ['Map / For you', 'Incidents or Alerts', 'Incident detail', 'Still there / vote'],
    },
    {
      name: 'File a report',
      steps: ['Report FAB', 'Camera → type → place', 'Submit', 'Map + Incidents tab'],
    },
    {
      name: 'Finish a hike',
      steps: ['Record Track', 'Finish', 'Privacy + share', 'Save', 'You › Activities'],
    },
    {
      name: 'Join a group hike',
      steps: ['Community / Map pin', 'Group detail', 'Join', 'Open on map'],
    },
  ];

  return (
    <div style={{ ...fill, padding: '72px 88px 64px' }}>
      <SectionTitle
        eyebrow="New IA · Key paths"
        title="Six flows to exercise in walkthrough"
        blurb="Covers discovery, search, incidents, reporting, recording, and community — the full map-first loop."
      />
      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        {paths.map((p, i) => (
          <div
            key={p.name}
            style={{
              background: card,
              border: `1px solid ${soft}`,
              borderRadius: 18,
              padding: '22px 24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 14 }}>
              <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--osd-accent)' }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span style={{ fontSize: 28, fontWeight: 750, letterSpacing: '-0.02em' }}>{p.name}</span>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
              {p.steps.map((step, si) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      background: soft,
                      borderRadius: 999,
                      padding: '8px 12px',
                      fontSize: 18,
                      fontWeight: 650,
                      color: ink,
                    }}
                  >
                    {step}
                  </span>
                  {si < p.steps.length - 1 ? (
                    <span style={{ color: 'var(--osd-accent)', fontWeight: 800, fontSize: 18 }}>→</span>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
};

const ScreenFlowBrowse: Page = () => (
  <div style={{ ...fill, padding: '56px 64px 48px' }}>
    <SectionTitle
      eyebrow="Screen flow · Browse"
      title="Map → sheet tabs → Explore → trail"
      blurb="Audience path for discovery without typing. Sheet underline tabs pick the mode; Explore adds outline theme chips before opening a trail."
    />
    <div
      style={{
        marginTop: 28,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
      }}
    >
      <FlowPhone src={mapHome} alt="Map home" caption="01 · Map home" action="Open sheet / pick tab" />
      <FlowStepArrow label="Raise sheet" />
      <FlowPhone src={sheetForyou} alt="For you sheet" caption="02 · For you" action="Browse mix · or switch tab" />
      <FlowStepArrow label="Explore tab" />
      <FlowPhone
        src={exploreEditorial}
        alt="Explore editorial"
        caption="03 · Explore + chips"
        action="Editor’s Choice / theme"
      />
      <FlowStepArrow label="Open card" />
      <FlowPhone
        src={trailDetail}
        alt="Trail detail"
        caption="04 · Trail detail"
        action="Upvote · Save · Start route"
      />
    </div>
    <Footer />
  </div>
);

const ScreenFlowSearchPath: Page = () => (
  <div style={{ ...fill, padding: '56px 64px 48px' }}>
    <SectionTitle
      eyebrow="Screen flow · Search"
      title="Search pill → samples → filters → result"
      blurb="Intent path from the floating search bar. Samples prevent empty states; Filters reuse the live Explore model before landing on trail detail."
    />
    <div
      style={{
        marginTop: 28,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: 8,
        width: '100%',
      }}
    >
      <FlowPhone src={mapHome} alt="Map home" caption="01 · Map home" action="Tap search pill" />
      <FlowStepArrow label="Open search" />
      <FlowPhone
        src={searchSamples}
        alt="Search samples"
        caption="02 · Samples / Recent"
        action="Tap chip or type"
      />
      <FlowStepArrow label="Filter icon" />
      <FlowPhone
        src={searchFilters}
        alt="Search filters"
        caption="03 · Filters sheet"
        action="District · L1–5 · time · km"
      />
      <FlowStepArrow label="Apply" />
      <FlowPhone
        src={searchResults}
        alt="Search results"
        caption="04 · Results"
        action="Open trail → detail"
      />
    </div>
    <Footer />
  </div>
);

const ScreenFlowReportRecord: Page = () => (
  <div style={{ ...fill, padding: '56px 64px 48px' }}>
    <SectionTitle
      eyebrow="Screen flow · Report & record"
      title="Report FAB and hike finish loops"
      blurb="Two map-adjacent loops: filing an incident from the + FAB, and finishing a tracked hike back into You › Activities."
    />
    <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
      <div
        style={{
          background: '#f7faf7',
          border: `1px solid ${soft}`,
          borderRadius: 20,
          padding: '20px 18px 24px',
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 750,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--osd-accent)',
            marginBottom: 16,
          }}
        >
          Report an incident
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 2 }}>
          <FlowPhone size="sm" src={mapHome} alt="Map home" caption="Map + FAB" action="Tap +" />
          <FlowStepArrow size="sm" label="Camera" />
          <FlowPhone size="sm" src={reportCamera} alt="Report camera" caption="Photos → type" action="Location · submit" />
          <FlowStepArrow size="sm" label="Done" />
          <FlowPhone size="sm" src={sheetIncidents} alt="Incidents list" caption="Incidents tab" action="See new report" />
        </div>
      </div>
      <div
        style={{
          background: '#f7faf7',
          border: `1px solid ${soft}`,
          borderRadius: 20,
          padding: '20px 18px 24px',
        }}
      >
        <div
          style={{
            fontSize: 16,
            fontWeight: 750,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--osd-accent)',
            marginBottom: 16,
          }}
        >
          Finish a hike
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 2 }}>
          <FlowPhone size="sm" src={recordTrack} alt="Record track" caption="Record · Track" action="Start / Pause" />
          <FlowStepArrow size="sm" label="Finish" />
          <FlowPhone size="sm" src={finishSummary} alt="Finish summary" caption="Summary" action="Public / Private · Share" />
          <FlowStepArrow size="sm" label="Save" />
          <FlowPhone size="sm" src={youActivities} alt="You activities" caption="You › Activities" action="Activity saved" />
        </div>
      </div>
    </div>
    <Footer />
  </div>
);

const MapScreen: Page = () => (
  <div style={{ ...fill, padding: '72px 100px 64px', display: 'flex', gap: 56, alignItems: 'center' }}>
    <PhoneShot src={mapHome} alt="Map home with search pill and FABs" />
    <div style={{ flex: 1, minWidth: 0 }}>
      <Eyebrow>Screen · Map home</Eyebrow>
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 64,
          letterSpacing: '-0.03em',
          fontWeight: 800,
          lineHeight: 1.08,
        }}
      >
        Map-first home with a floating search bar
      </h2>
      <ul style={{ margin: '36px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 18 }}>
        {[
          'Search pill opens a dedicated search screen',
          'Layers / recenter / report FAB stay map-native',
          'Bottom sheet peeks status, expands into tabs',
        ].map((t) => (
          <li key={t} style={{ fontSize: 30, lineHeight: 1.4, color: muted, display: 'flex', gap: 14 }}>
            <span style={{ color: 'var(--osd-accent)', fontWeight: 800 }}>→</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
    <Footer />
  </div>
);

const SheetTabs: Page = () => (
  <div style={{ ...fill, padding: '72px 100px 64px', display: 'flex', gap: 56, alignItems: 'center' }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <Eyebrow>Change · Sheet hierarchy</Eyebrow>
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 60,
          letterSpacing: '-0.03em',
          fontWeight: 800,
          lineHeight: 1.08,
        }}
      >
        Primary row became underline tabs
      </h2>
      <p style={{ marginTop: 28, fontSize: 30, lineHeight: 1.5, color: muted }}>
        For you · Explore · Incidents · Alerts · New · Trending · Recommended · Live now read as mode tabs —
        not filter chips — so Explore’s outline filters can sit underneath without looking like a second tab bar.
      </p>
      <div
        style={{
          marginTop: 36,
          background: card,
          borderRadius: 'var(--osd-radius)',
          padding: '28px 32px',
          border: `1px solid ${soft}`,
          fontSize: 28,
          color: ink,
          fontWeight: 650,
        }}
      >
        Tabs = what you’re browsing · Outline chips = how you filter inside Explore
      </div>
    </div>
    <PhoneShot src={sheetForyou} alt="Sheet with underline tabs on For you" />
    <Footer />
  </div>
);

const ExploreScreen: Page = () => (
  <div style={{ ...fill, padding: '72px 100px 64px', display: 'flex', gap: 56, alignItems: 'center' }}>
    <PhoneShot src={exploreEditorial} alt="Explore tab with editorial routes and outline chips" />
    <div style={{ flex: 1, minWidth: 0 }}>
      <Eyebrow>Screen · Explore</Eyebrow>
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 60,
          letterSpacing: '-0.03em',
          fontWeight: 800,
          lineHeight: 1.08,
        }}
      >
        Editor’s Choice + theme filters
      </h2>
      <ul style={{ margin: '32px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 16 }}>
        {[
          'Explore tab surfaces editorial routes with “why” blurbs',
          'Outline sub-chips scroll horizontally (All, Editor’s Choice, themes)',
          'Counts update live as search / advanced filters apply',
        ].map((t) => (
          <li key={t} style={{ fontSize: 28, lineHeight: 1.4, color: muted, display: 'flex', gap: 14 }}>
            <span style={{ color: 'var(--osd-accent)', fontWeight: 800 }}>→</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </div>
    <Footer />
  </div>
);

const SearchScreen: Page = () => (
  <div style={{ ...fill, padding: '72px 100px 64px', display: 'flex', gap: 56, alignItems: 'center' }}>
    <div style={{ flex: 1, minWidth: 0 }}>
      <Eyebrow>Screen · Search</Eyebrow>
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 60,
          letterSpacing: '-0.03em',
          fontWeight: 800,
          lineHeight: 1.08,
        }}
      >
        Sample phrases kickstart discovery
      </h2>
      <p style={{ marginTop: 28, fontSize: 30, lineHeight: 1.5, color: muted }}>
        Empty search shows Try searching chips (Miu Sam, Dragon’s Back, coastal, heritage…). Tapping a sample
        fills the query and lists matching trails. Filter icon opens the advanced sheet.
      </p>
    </div>
    <PhoneShot src={searchSamples} alt="Search screen with sample chips" />
    <Footer />
  </div>
);

const FiltersScreen: Page = () => (
  <div style={{ ...fill, padding: '72px 100px 64px', display: 'flex', gap: 56, alignItems: 'center' }}>
    <PhoneShot src={searchFilters} alt="Filters sheet matching live Explore" />
    <div style={{ flex: 1, minWidth: 0 }}>
      <Eyebrow>Screen · Filters</Eyebrow>
      <h2
        style={{
          margin: 0,
          fontFamily: 'var(--osd-font-display)',
          fontSize: 60,
          letterSpacing: '-0.03em',
          fontWeight: 800,
          lineHeight: 1.08,
        }}
      >
        Live Explore filter model
      </h2>
      <ul style={{ margin: '32px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 16 }}>
        {[
          'District dropdown',
          'Difficulty chips · All levels + 1–5',
          'Duration & distance buckets',
          'Reset / Apply with sticky actions',
        ].map((t) => (
          <li key={t} style={{ fontSize: 28, lineHeight: 1.4, color: muted, display: 'flex', gap: 14 }}>
            <span style={{ color: 'var(--osd-accent)', fontWeight: 800 }}>→</span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
      <p style={{ marginTop: 28, fontSize: 24, color: muted }}>
        Pattern mirrored from{' '}
        <span style={{ color: ink, fontWeight: 650 }}>trailwatch-hk Explore filters</span>
      </p>
    </div>
    <Footer />
  </div>
);

const AlsoShipped: Page = () => (
  <div style={{ ...fill, padding: 120 }}>
    <Eyebrow>Also shipped</Eyebrow>
    <h2
      style={{
        margin: 0,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 64,
        letterSpacing: '-0.03em',
        fontWeight: 800,
        lineHeight: 1.1,
      }}
    >
      Reporting & hike finish polish
    </h2>
    <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
      {[
        ['Incident types', 'Five unified types with color only when selected'],
        ['Camera-first report', 'Photos → type tiles → location · fullscreen camera + sheet'],
        ['Hike finish', 'Title, details, stats, iOS privacy segment + share switch'],
      ].map(([title, body]) => (
        <div
          key={title}
          style={{
            background: card,
            borderRadius: 'var(--osd-radius)',
            padding: '36px 32px',
            border: `1px solid ${soft}`,
            minHeight: 280,
          }}
        >
          <div style={{ fontSize: 34, fontWeight: 750, letterSpacing: '-0.02em', marginBottom: 16 }}>{title}</div>
          <div style={{ fontSize: 28, lineHeight: 1.5, color: muted }}>{body}</div>
        </div>
      ))}
    </div>
    <Footer />
  </div>
);

const Principles: Page = () => (
  <div style={{ ...fill, padding: 120 }}>
    <Eyebrow>Design principles</Eyebrow>
    <h2
      style={{
        margin: 0,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 64,
        letterSpacing: '-0.03em',
        fontWeight: 800,
        lineHeight: 1.1,
      }}
    >
      Rules we locked for the prototype
    </h2>
    <div style={{ marginTop: 56, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
      {[
        ['One job per control row', 'Tabs navigate modes. Outline chips only filter inside Explore.'],
        ['Match live where it helps', 'Filters + Editor’s Choice language stay consistent with Explore web.'],
        ['Samples before empty states', 'Search always offers a next action.'],
        ['Horizontal before wrap', 'Filter chips scroll; wrapping looked like a second tab system.'],
      ].map(([title, body]) => (
        <div
          key={title}
          style={{
            padding: '36px 40px',
            borderRadius: 'var(--osd-radius)',
            background: card,
            border: `1px solid ${soft}`,
          }}
        >
          <div style={{ fontSize: 34, fontWeight: 750, marginBottom: 14 }}>{title}</div>
          <div style={{ fontSize: 28, lineHeight: 1.5, color: muted }}>{body}</div>
        </div>
      ))}
    </div>
    <Footer />
  </div>
);

const Closing: Page = () => (
  <div
    style={{
      ...fillBase,
      // Solid base survives PDF export (open-slide strips CSS gradients).
      backgroundColor: dark,
      backgroundImage: `linear-gradient(160deg, ${dark} 0%, #143222 60%, ${ink} 100%)`,
      color: '#f5faf6',
      padding: 120,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
    }}
  >
    <Eyebrow>Next</Eyebrow>
    <h2
      style={{
        margin: 0,
        fontFamily: 'var(--osd-font-display)',
        fontSize: 84,
        letterSpacing: '-0.035em',
        fontWeight: 800,
        lineHeight: 1.05,
        maxWidth: 1500,
      }}
    >
      Prototype is ready for walkthrough QA
    </h2>
    <p style={{ marginTop: 36, fontSize: 34, lineHeight: 1.5, color: '#c7e6d1', maxWidth: 1200 }}>
      Exercise Search → samples → Filters → Explore tabs/sub-chips → open a trail → Report FAB.
      Validate empty states and EN / 繁 strings on each surface.
    </p>
    <div style={{ marginTop: 56, fontSize: 26, color: '#9ed4b0' }}>
      open-slide deck · trailwatch-ux-findings · prototype at :5174
    </div>
  </div>
);

export const meta: SlideMeta = {
  title: 'TrailWatch UI/UX findings',
  createdAt: '2026-11-10T06:37:03.247Z',
};

export const notes: (string | undefined)[] = [
  'Frame the deck: problems in the first map app, then redesign.',
  'Four problems overview in plain language.',
  'What we checked: map home, bottom sheet, search, report & hike.',
  'Problem 01: too many similar buttons.',
  'Problem 02: empty search with no help.',
  'Problem 03: best routes hard to find.',
  'Problem 04: report and finish hike felt incomplete.',
  'Summary of biggest issues, then redesign.',
  'Suggested userflow overview: Map home → browse / search / report / record.',
  'Suggested discover flows: browse sheet vs search path, then Start route.',
  'Suggested act flows: report issue + finish hike; Community / You always available.',
  'IA shell: Map / Community / Record / You + map chrome, sheet heights, onboarding.',
  'IA discovery: Search door, all eight sheet tabs, Explore chips, Layers, Report.',
  'IA details: Trail/Incident/Alert/Hiker/Group overlays + Record + Community/You.',
  'Six key paths including finish hike and join group.',
  'Screen flow browse: Map → For you → Explore → Trail detail.',
  'Screen flow search: pill → samples → filters → results.',
  'Screen flow report & record: FAB incident loop + hike finish to You.',
  'Show the map home: floating search bar is the entry, sheet peeks underneath.',
  'Emphasize underline tabs so the next slide’s outline chips don’t feel duplicated.',
  'Explore screen walkthrough: editorial routes + horizontal theme filters.',
  'Search samples prevent empty-state dead ends.',
  'Filters deliberately mirror live Explore: district, difficulty, duration, distance.',
  'Brief pass on report/hike polish without deep diving.',
  'Restate the four principles as the decision framework.',
  'Close with the QA path for stakeholders.',
];

export default [
  Cover,
  CritiqueIntro,
  CritiqueScope,
  CritiqueNav,
  CritiqueSearch,
  CritiqueExplore,
  CritiqueReport,
  CritiqueSynthesis,
  SuggestedUserflowOverview,
  SuggestedUserflowDiscover,
  SuggestedUserflowAct,
  IaFlow,
  IaMapDiscovery,
  IaDetails,
  IaPaths,
  ScreenFlowBrowse,
  ScreenFlowSearchPath,
  ScreenFlowReportRecord,
  MapScreen,
  SheetTabs,
  ExploreScreen,
  SearchScreen,
  FiltersScreen,
  AlsoShipped,
  Principles,
  Closing,
] satisfies Page[];
