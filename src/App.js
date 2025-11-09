import React, { useEffect, useMemo, useState } from "react";

// Smart Commute – Uber‑inspired, dark‑first web UI
// - Global theme toggle in header (persists to localStorage)
// - Minimal, bold, map‑first cards
// - Metrics removed

const ThemeSwitch = ({ night, setNight }) => (
  <button
    className="theme-switch"
    aria-label="Toggle theme"
    title="Toggle Night Mode"
    onClick={() => setNight(v => !v)}
  >
    <span className="theme-switch__dot" />
  </button>
);

const Header = ({ tab, setTab, night, setNight }) => (
  <header className="appbar">
    <div className="container appbar__row">
      <div className="brand">
        <div className="brand__logo">SC</div>
        <div>
          <div className="brand__title">Smart Commute</div>
          <div className="brand__sub">Shift‑friendly navigation</div>
        </div>
      </div>

      <nav className="nav hide-sm">
        {[ ["Home","home"], ["Routes","routes"], ["Safety","safety"], ["Checkout","checkout"] ].map(([label,key]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`nav__btn ${tab===key?"is-active":""}`}
          >{label}</button>
        ))}
      </nav>

      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <span className="text-muted hide-sm" style={{fontSize:12}}>{night?"Night":"Light"}</span>
        <ThemeSwitch night={night} setNight={setNight} />
      </div>
    </div>
  </header>
);

const Pill = ({ tone = "blue", children }) => (
  <span className={`pill ${
    tone==="green"?"pill--green": tone==="amber"?"pill--amber":"pill--blue"
  }`}>{children}</span>
);

const MapChrome = ({ title, eta, distance }) => (
  <div className="map__chrome">
    <div className="map__row">
      <Pill tone="blue">{title}</Pill>
      <div className="map__meta">ETA {eta} • {distance} km</div>
    </div>
    <div className="map__row">
      <div className="map__meta">Prototype preview</div>
    </div>
  </div>
);

const FakeMap = ({ route }) => (
  <div className="map">
    <MapChrome title={route.title} eta={route.eta} distance={route.distance} />
  </div>
);

const RouteCard = ({ route, onStart }) => (
  <div className="card" style={{display:"grid", gap:12}}>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <h3 style={{margin:0, fontSize:"var(--h3)", fontWeight:700}}>{route.title}</h3>
        {route.badges.map(b => <Pill key={b.text} tone={b.tone}>{b.text}</Pill>)}
      </div>
      <div className="text-muted" style={{fontSize:13}}>{route.distance} km • {route.eta} min</div>
    </div>
    <FakeMap route={route} />
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",fontSize:14}}>
      <span className="text-muted">Lighting: <b>{route.lighting}</b> • Activity: <b>{route.activity}</b></span>
      <button className="btn btn--primary" onClick={()=>onStart(route)}>Start</button>
    </div>
  </div>
);

const FeedbackSheet = ({ open, onClose, onSubmit }) => {
  const [rating, setRating] = useState(5);
  const [note, setNote] = useState("");
  if (!open) return null;
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",display:"grid",placeItems:"end center",zIndex:60}}>
      <div className="card" style={{width:"min(520px, 100%)", borderRadius:20, margin:10}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
          <h3 style={{margin:0, fontSize:"var(--h2)", fontWeight:700}}>Trip feedback</h3>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <div className="stack-16">
          <div>
            <div className="text-muted" style={{fontSize:14, marginBottom:6}}>How safe did you feel?</div>
            <div style={{display:"flex",gap:8}}>
              {[1,2,3,4,5].map(n => (
                <button key={n}
                  onClick={()=>setRating(n)}
                  className={`btn ${rating>=n?"btn--primary":""}`}
                  style={{width:40,height:40,borderRadius:999}}
                >{n}</button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-muted" style={{fontSize:14, marginBottom:6}}>Anything to report?</div>
            <textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} placeholder="e.g., Poor lighting near Oak St." style={{width:"100%"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"end",gap:10}}>
            <button className="btn" onClick={onClose}>Skip</button>
            <button className="btn btn--primary" onClick={()=>onSubmit({rating,note})}>Submit</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function App(){
  const [tab, setTab] = useState("home");
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [live, setLive] = useState(false);
  const [night, setNight] = useState(() => {
    const saved = localStorage.getItem("smartcommute.theme");
    if (saved) return saved === "dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  const [sosOpen, setSosOpen] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  useEffect(()=>{
    document.documentElement.setAttribute("data-theme", night?"dark":"light");
    localStorage.setItem("smartcommute.theme", night?"dark":"light");
  },[night]);

  const routes = useMemo(()=>[
    { key:"safest", title:"Safest Route", eta:18, distance:6.4, lighting:"Well‑lit", activity:"High", badges:[{text:"Safety 9.2", tone:"green"},{text:"Patrol zone", tone:"blue"}] },
    { key:"fastest", title:"Fastest Route", eta:14, distance:5.8, lighting:"Mixed", activity:"Medium", badges:[{text:"Express", tone:"blue"}] },
    { key:"cheapest", title:"Cheapest Route", eta:20, distance:6.9, lighting:"Well‑lit", activity:"Medium", badges:[{text:"Shared ₹49", tone:"amber"}] },
  ],[]);

  const startTrip = (route) => { setSelectedRoute(route); setLive(true); setTab("routes"); };
  const endTrip = () => { setLive(false); setSelectedRoute(null); setFeedbackOpen(true); };

  const Home = () => (
    <section className="container" style={{paddingTop:24, paddingBottom:24}}>
      <div className="grid-3">
        <div className="card" style={{gridColumn:"span 2"}}>
          <h2 style={{margin:"0 0 6px", fontSize:"var(--h2)", fontWeight:800}}>Safe Commute Now</h2>
          <p className="text-muted" style={{margin:"0 0 16px", fontSize:14}}>End of shift detected • Recommendations based on safety, reliability, and cost.</p>
          <div style={{display:"flex", gap:10, flexWrap:"wrap"}}>
            <button className="btn btn--primary" onClick={()=>setTab("routes")}>View routes</button>
            <button className="btn" onClick={()=>setTab("safety")}>Safety tools</button>
          </div>
        </div>

        <div className="card">
          <h4 style={{margin:"0 0 10px", fontWeight:700}}>Employer perks</h4>
          <ul className="text-muted" style={{margin:0, paddingLeft:18, lineHeight:1.6, fontSize:14}}>
            <li>Sponsored shared rides (up to 50%)</li>
            <li>Priority safety hotline</li>
            <li>Attendance syncing</li>
          </ul>
        </div>
      </div>

      <div className="grid-3" style={{marginTop:20}}>
        {routes.map(r => (
          <RouteCard key={r.key} route={r} onStart={startTrip} />
        ))}
      </div>
    </section>
  );

  const Routes = () => (
    <section className="container" style={{paddingTop:24, paddingBottom:24}}>
      {selectedRoute && live && (
        <div className="card" style={{display:"grid", gap:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div style={{fontWeight:700}}>Live trip • {selectedRoute.title}</div>
            <div className="text-muted" style={{fontSize:14}}>ETA {selectedRoute.eta} min</div>
          </div>
          <FakeMap route={selectedRoute} />
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            <Pill tone="green">Well‑lit zones</Pill>
            <Pill tone="blue">Patrol active</Pill>
            <Pill tone="amber">Shared ride available</Pill>
          </div>
          <div style={{display:"flex",gap:10}}>
            <button className="btn btn--danger" onClick={()=>setSosOpen(true)}>SOS</button>
            <button className="btn" onClick={()=>alert("Trip shared with employer contact.")}>Share trip</button>
            <div style={{marginLeft:"auto"}} />
            <button className="btn btn--primary" onClick={endTrip}>End trip</button>
          </div>
        </div>
      )}

      {!live && (
        <div className="grid-3">
          {routes.map(r => <RouteCard key={r.key} route={r} onStart={startTrip} />)}
        </div>
      )}

      {sosOpen && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.45)",display:"grid",placeItems:"center",zIndex:70}}>
          <div className="card" style={{width:"min(460px, 100%)"}}>
            <h3 style={{marginTop:0}}>Emergency assistance</h3>
            <p className="text-muted" style={{fontSize:14}}>Connecting you to local help and employer hotline…</p>
            <div style={{display:"flex",gap:10,marginTop:10}}>
              <button className="btn" onClick={()=>setSosOpen(false)}>Dismiss</button>
              <button className="btn btn--primary" onClick={()=>{setSosOpen(false); alert("Location sent. Help on the way.");}}>Send location</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );

  const Safety = () => (
    <section className="container" style={{paddingTop:24, paddingBottom:24}}>
      <div className="grid-3">
        <div className="card" style={{gridColumn:"span 2"}}>
          <h3 style={{marginTop:0}}>Safety tools</h3>
          <p className="text-muted" style={{fontSize:14, marginTop:6, marginBottom:16}}>Designed for off‑peak commutes.</p>
          <div className="grid-3">
            <div className="card">
              <h4 style={{marginTop:0}}>One‑tap SOS</h4>
              <p className="text-muted" style={{fontSize:14}}>Alerts local responders and employer line.</p>
              <button className="btn btn--danger" onClick={()=>setSosOpen(true)}>Trigger SOS</button>
            </div>
            <div className="card">
              <h4 style={{marginTop:0}}>Report hazard</h4>
              <p className="text-muted" style={{fontSize:14}}>Improve safety heatmaps for others.</p>
              <button className="btn" onClick={()=>alert("Hazard reported. Thank you!")}>Report</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );

  const Checkout = () => {
    const [sponsored, setSponsored] = useState(true);
    const base = 99; const price = sponsored? Math.max(0, base-50) : base;
    return (
      <section className="container" style={{paddingTop:24, paddingBottom:24}}>
        <div className="card" style={{display:"grid", gap:14}}>
          <h3 style={{margin:"0 0 6px"}}>Checkout</h3>
          <div className="border" style={{padding:14, display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <div>
              <div style={{fontWeight:600}}>Shared ride (off‑peak)</div>
              <div className="text-muted" style={{fontSize:12}}>Sponsored by employer program</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontWeight:800}}>₹{price}</div>
              {sponsored && <div style={{fontSize:12, color:"#10b981"}}>₹50 sponsorship applied</div>}
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
            <label className="text-muted" style={{fontSize:14}}>Apply employer sponsorship</label>
            <button className="theme-switch" onClick={()=>setSponsored(v=>!v)} aria-label="Toggle sponsorship">
              <span className="theme-switch__dot" style={{transform: sponsored?"translateX(22px)":"translateX(0)"}}/>
            </button>
          </div>
          <div style={{display:"flex", gap:10}}>
            <button className="btn btn--primary" onClick={()=>alert("Payment successful. Ride confirmed.")}>Pay now</button>
            <button className="btn" onClick={()=>alert("Subscribed to Premium for ₹149/mo.")}>Try Premium</button>
          </div>
        </div>
      </section>
    );
  };

  const onFeedbackSubmit = ({rating,note}) => {
    setFeedbackOpen(false);
    alert(`Thanks! Safety rating ${rating}/5 submitted. ${note?"Note: "+note:""}`);
    setTab("home");
  };

  return (
    <div style={{minHeight:"100vh", display:"flex", flexDirection:"column"}}>
      <Header tab={tab} setTab={setTab} night={night} setNight={setNight} />

      {tab==="home" && <Home />}
      {tab==="routes" && <Routes />}
      {tab==="safety" && <Safety />}
      {tab==="checkout" && <Checkout />}

      <FeedbackSheet open={feedbackOpen} onClose={()=>setFeedbackOpen(false)} onSubmit={onFeedbackSubmit} />

      <footer className="appfoot" style={{marginTop:"auto"}}>
        <div className="container appfoot__row">
          <div>Prototype • No real data • © {new Date().getFullYear()}</div>
          <div>Use the header switch to toggle Night Mode</div>
        </div>
      </footer>
    </div>
  );
}
