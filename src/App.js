import React, { useEffect, useMemo, useState } from "react";

/* App.jsx — updated to use selectedRoute, live, and endTrip so there are no lint warnings.
   Keeps previous UI behavior: sidebar, night-mode toggle, metrics, ride history, ETA, onboarding.
*/

const IconSun = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <circle cx="12" cy="12" r="4" fill="currentColor" />
    <g stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.2" y1="4.2" x2="5.6" y2="5.6" />
      <line x1="18.4" y1="18.4" x2="19.8" y2="19.8" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
    </g>
  </svg>
);

const IconMoon = ({ size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
    <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill="currentColor" />
  </svg>
);

const Sidebar = ({ tab, setTab, night, setNight }) => {
  const items = useMemo(() => [
    ["Routes", "routes"],
    ["Driver ETA", "eta"],
    ["Checkout", "checkout"],
    ["Safety", "safety"],
    ["Metrics", "metrics"],
    ["Onboarding", "onboarding"],
  ], []);

  return (
    <aside className="sidebar" aria-label="Primary navigation">
      <div className="sidebar__brand" aria-hidden>
        <div className="logo">SC</div>
        <div className="brand">
          <div className="brand__title">Smart Commute</div>
          <div className="brand__sub">Shift navigation</div>
        </div>
      </div>

      <nav className="sidenav" role="navigation" aria-label="Main">
        {items.map(([label, key]) => (
          <button
            key={key}
            type="button"
            className={`sidenav__item ${tab === key ? "is-active" : ""}`}
            onClick={() => setTab(key)}
            aria-current={tab === key ? "page" : undefined}
          >
            <span className="initial" aria-hidden>{label[0]}</span>
            <span className="sidenav__label">{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__spacer" />

      <div className="sidebar__footer">
        <button
          type="button"
          className="theme-toggle"
          aria-pressed={!!night}
          title={night ? "Switch to light" : "Switch to dark"}
          onClick={() => setNight((v) => !v)}
        >
          <span className="theme-toggle__icon" aria-hidden>
            {night ? <IconMoon /> : <IconSun />}
          </span>
        </button>
      </div>
    </aside>
  );
};

const Pill = ({ tone = "blue", children }) => {
  const cls = tone === "green" ? "pill--green" : tone === "amber" ? "pill--amber" : tone === "red" ? "pill--red" : "pill--blue";
  return <span className={`pill ${cls}`}>{children}</span>;
};

const FakeMap = ({ title = "Route preview", eta = 10, distance = 4.2 }) => (
  <div className="map" role="img" aria-label={`${title} preview`}>
    <div className="map__chrome">
      <div className="map__row">
        <Pill tone="blue">{title}</Pill>
        <div className="map__meta">ETA {eta} • {distance} km</div>
      </div>
      <div className="map__row"><div className="map__meta">Prototype preview</div></div>
    </div>
  </div>
);

export default function App() {
  const [tab, setTab] = useState("routes");
  const [night, setNight] = useState(() => {
    const s = localStorage.getItem("smartcommute.theme");
    if (s) return s === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // App state used actively
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [live, setLive] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  // MAC metric + history (dummy)
  const [mac, setMac] = useState(() => Number(localStorage.getItem("smartcommute.mac") || 124));
  const [macHistory, setMacHistory] = useState(() => {
    const saved = localStorage.getItem("smartcommute.macHistory");
    return saved ? JSON.parse(saved) : [96, 102, 108, 114, 119, 121, 124];
  });

  // Dummy ride history for Metrics
  const [rideHistory] = useState(() => [
    { id: 1, ts: "2025-11-09 08:12", from: "Hinjawadi", to: "Pune Station", payment: "UPI", mode: "Car", fare: 89 },
    { id: 2, ts: "2025-11-07 18:05", from: "Kharadi", to: "Viman Nagar", payment: "Card", mode: "Bike", fare: 45 },
    { id: 3, ts: "2025-10-28 07:40", from: "Baner", to: "Magarpatta", payment: "UPI", mode: "Car", fare: 99 },
    { id: 4, ts: "2025-10-21 22:10", from: "Aundh", to: "Kothrud", payment: "Cash", mode: "Shared", fare: 39 },
  ]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", night ? "dark" : "light");
    localStorage.setItem("smartcommute.theme", night ? "dark" : "light");
  }, [night]);

  useEffect(() => { localStorage.setItem("smartcommute.mac", String(mac)); }, [mac]);
  useEffect(() => { localStorage.setItem("smartcommute.macHistory", JSON.stringify(macHistory)); }, [macHistory]);

  const routes = useMemo(() => [
    { key: "fastest", title: "Fastest Route", eta: 14, distance: 5.8, lighting: "Mixed", badges: [{ text: "Express", tone: "blue" }] },
    { key: "safest", title: "Safest Route", eta: 18, distance: 6.4, lighting: "Well-lit", badges: [{ text: "Safety 9.2", tone: "green" }] },
    { key: "cheapest", title: "Cheapest Route", eta: 20, distance: 6.9, lighting: "Well-lit", badges: [{ text: "Shared ₹49", tone: "amber" }] },
  ], []);

  // Start a trip: sets selectedRoute and live
  const startTrip = (route, openEta = false) => {
    setSelectedRoute(route);
    setLive(true);
    if (openEta) setTab("eta");
  };

  // End trip: clear selection, flag not-live, open feedback
  const endTrip = () => {
    if (!live) return;
    setLive(false);
    setSelectedRoute(null);
    setFeedbackOpen(true);
  };

  const submitFeedback = (rating = 5) => {
    setFeedbackOpen(false);
    setMac((m) => {
      const next = m + 1;
      setMacHistory((h) => [...h.slice(-19), next]);
      return next;
    });
    setTab("metrics");
    const t = document.createElement("div");
    t.className = "micro-toast";
    t.textContent = `Thanks — safety rating ${rating}/5 recorded`;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("visible"), 50);
    setTimeout(() => { t.classList.remove("visible"); setTimeout(() => t.remove(), 350); }, 2600);
  };

  // UI sections
  const RoutesSection = () => (
    <section className="page" aria-labelledby="routes-heading">
      <div className="card hero card--elev">
        <div className="hero__title" id="routes-heading">Commute, simplified.</div>
        <div className="hero__sub muted">Fastest route, live ETA, sponsorship flow — streamlined.</div>

        <div className="row" style={{ gap: 10, marginTop: 12 }}>
          <button type="button" className="btn btn--primary" onClick={() => startTrip(routes[0], true)} disabled={live}>One-Tap Commute</button>
          <button type="button" className="btn" onClick={() => setTab("eta")} disabled={live}>Open ETA</button>
          <div style={{ marginLeft: "auto" }}>
            {live && selectedRoute && (
              <div className="pill pill--green" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <strong style={{ marginRight: 6 }}>Live</strong>
                <span style={{ opacity: 0.9 }}>{selectedRoute.title} • ETA {selectedRoute.eta}m</span>
                <button className="btn" style={{ marginLeft: 12 }} onClick={endTrip}>End</button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid-3" style={{ marginTop: 18 }}>
        {routes.map((r) => (
          <div key={r.key} className="card card--hover">
            <div className="row-split">
              <div>
                <h3 className="h3" style={{ margin: 0 }}>{r.title}</h3>
                <div className="muted small">{r.distance} km • {r.eta} min</div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                {r.badges.map(b => <Pill key={b.text} tone={b.tone}>{b.text}</Pill>)}
              </div>
            </div>

            <div style={{ marginTop: 12 }}><FakeMap title={r.title} eta={r.eta} distance={r.distance} /></div>

            <div style={{ marginTop: 12 }} className="row-split">
              <div className="muted small">Lighting: {r.lighting}</div>
              <div>
                <button className="btn" onClick={() => startTrip(r, true)} disabled={live}>Start</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Live trip card shown in page when a trip is ongoing */}
      {live && selectedRoute && (
        <div className="card card--elev live-trip" style={{ marginTop: 18 }}>
          <div className="row-split">
            <div className="strong">Live trip • {selectedRoute.title}</div>
            <div className="muted small">ETA {selectedRoute.eta} min</div>
          </div>

          <FakeMap title={selectedRoute.title} eta={selectedRoute.eta} distance={selectedRoute.distance} />

          <div className="row" style={{ gap: 10 }}>
            <button type="button" className="btn btn--danger" onClick={() => {
              // quick SOS behavior: show feedback panel as placeholder for alert flow
              setFeedbackOpen(true);
            }}>SOS</button>
            <div style={{ marginLeft: "auto" }} />
            <button type="button" className="btn btn--primary" onClick={endTrip}>End trip</button>
          </div>
        </div>
      )}
    </section>
  );

  const ETASection = () => (
    <section className="page" aria-labelledby="eta-heading">
      <div className="card card--elev">
        <div className="row-split">
          <div>
            <div className="muted tiny">Driver ETA</div>
            <h3 className="h2" id="eta-heading" style={{ margin: "4px 0 0" }}>Driver ETA Tracker</h3>
          </div>
          <Pill tone="amber">Prototype</Pill>
        </div>

        <div style={{ marginTop: 12 }}>
          <FakeMap title="Assigned Driver" eta={8} distance={4.2} />
        </div>

        <div className="row" style={{ gap: 10, marginTop: 12 }}>
          <button type="button" className="btn btn--primary" onClick={() => setTab("checkout")} disabled={live}>Proceed to Checkout</button>
        </div>
      </div>
    </section>
  );

  const CheckoutSection = () => (
    <section className="page" aria-labelledby="checkout-heading">
      <div className="card card--elev">
        <div className="row-split">
          <h3 className="h2" id="checkout-heading" style={{ margin: 0 }}>Checkout</h3>
          <span className="chip">Last used: UPI • ankur@okicici</span>
        </div>

        <div className="border" style={{ padding: 12, marginTop: 12 }}>
          <div className="row-split">
            <div className="muted small">Shared ride (sponsored)</div>
            <div className="big strong">₹49</div>
          </div>
        </div>

        <div style={{ marginTop: 12 }} className="row">
          <button type="button" className="btn btn--primary" onClick={() => {
            setMac((m) => {
              const n = m + 1;
              setMacHistory((h) => [...h.slice(-19), n]);
              return n;
            });
            setTab("metrics");
          }} disabled={live}>Pay now</button>
        </div>
      </div>
    </section>
  );

  const SafetySection = () => (
    <section className="page" aria-labelledby="safety-heading">
      <div className="card card--elev">
        <h3 className="h2" id="safety-heading" style={{ marginTop: 0 }}>Safety</h3>
        <div className="grid-3" style={{ marginTop: 12 }}>
          <div className="card">
            <h4 className="h3" style={{ marginTop: 0 }}>One-tap SOS</h4>
            <p className="muted small">Alerts local responders and employer line.</p>
            <button type="button" className="btn btn--danger" onClick={() => setFeedbackOpen(true)}>Trigger SOS</button>
          </div>
        </div>
      </div>
    </section>
  );

  const MetricsSection = () => {
    const delta = macHistory.length >= 2 ? macHistory[macHistory.length - 1] - macHistory[macHistory.length - 2] : 0;
    const pos = delta >= 0;
    return (
      <section className="page" aria-labelledby="metrics-heading">
        <div className="card card--elev" style={{ marginBottom: 16 }}>
          <div className="row-split">
            <div>
              <div className="tiny muted">North-Star</div>
              <div className="stat__title">MAC — Monthly Active Commuters</div>
            </div>
            <div className={`stat__delta ${pos ? "up" : "down"}`}>{pos ? "▲" : "▼"} {Math.abs(delta)}</div>
          </div>

          <div className="stat" style={{ marginTop: 12 }}>
            <div className="stat__value">{mac}</div>
            <div className="stat__hint muted" style={{ marginLeft: 8 }}>Updated after trips</div>
          </div>
        </div>

        <div className="card">
          <h4 className="h3" style={{ marginTop: 0 }} id="metrics-heading">Ride history</h4>
          <div className="ride-history">
            {rideHistory.map(r => (
              <div key={r.id} className="ride-row" tabIndex={0}>
                <div className="ride-summary">
                  <div className="ride-ts">{r.ts}</div>
                  <div className="ride-route">{r.from} → {r.to}</div>
                  <div className="ride-fare">₹{r.fare}</div>
                </div>
                <div className="ride-details">
                  <div><strong>Payment:</strong> {r.payment}</div>
                  <div><strong>Transport:</strong> {r.mode}</div>
                  <div><strong>Trip ID:</strong> {`TR-${r.id.toString().padStart(4, "0")}`}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  };

  const OnboardingSection = () => (
    <section className="page" aria-labelledby="onboarding-heading">
      <div className="card card--elev">
        <h3 className="h2" id="onboarding-heading">Employer onboarding</h3>
        <p className="muted small">Quick flow to add a company and enable sponsorships.</p>
        <div style={{ marginTop: 12 }}>
          <button type="button" className="btn btn--primary" onClick={() => setTab("checkout")}>Start onboarding</button>
        </div>
      </div>
    </section>
  );

  return (
    <div className="app">
      <Sidebar tab={tab} setTab={setTab} night={night} setNight={setNight} />
      <main className="main">
        {tab === "routes" && <RoutesSection />}
        {tab === "eta" && <ETASection />}
        {tab === "checkout" && <CheckoutSection />}
        {tab === "safety" && <SafetySection />}
        {tab === "metrics" && <MetricsSection />}
        {tab === "onboarding" && <OnboardingSection />}
      </main>

      {feedbackOpen && (
        <div className="sheet" role="dialog" aria-modal="true">
          <div className="card card--elev sheet__panel" style={{ width: 520 }}>
            <div className="row-split">
              <h3 className="h2" style={{ margin: 0 }}>Trip feedback</h3>
              <button className="btn" onClick={() => setFeedbackOpen(false)}>Close</button>
            </div>
            <div style={{ marginTop: 12 }}>
              <div className="muted small">How safe did you feel?</div>
              <div style={{ marginTop: 8 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} className="btn btn--round" onClick={() => submitFeedback(n)}>{n}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
