// Agent Geospatial Map POC_V2

import { createRoot } from 'react-dom/client';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Marker } from '@googlemaps/markerclusterer';
import { sample_agents_dataset } from './data/sample_agents';
import { styles } from './styles';
import { Agent, ImportMetaEnv, ImportMeta } from '../types';
import { API_KEY, MAP_ID, MISSING_KEY, DEFAULT_CENTER, DEFAULT_ZOOM } from '../configs'
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';

// --- Derived display helpers ------------------------------------------------
// Deterministic so the same agent always looks the same between renders.
function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h);
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return (first + last).toUpperCase();
}

// A small, muted palette for the initials avatars.
const AVATAR_COLORS = ['#0B1F3A', '#274B6D', '#1F6F54', '#7A5A1E', '#5B3A6B', '#2A5A7A'];
function avatarColor(seed: string): string {
  return AVATAR_COLORS[hashString(seed) % AVATAR_COLORS.length];
}

// Insurance/financial category -> drives the tiny pill icon.
type Category = 'Medicare' | 'Life' | 'Annuities' | 'Health' | 'Financial';
function primaryCategory(agent: Agent): Category {
  const hay = `${agent.title} ${(agent.industries ?? []).join(' ')}`.toLowerCase();
  if (hay.includes('medicare')) return 'Medicare';
  if (hay.includes('annuit')) return 'Annuities';
  if (hay.includes('health')) return 'Health';
  if (hay.includes('financ') || hay.includes('wealth') || hay.includes('invest')) return 'Financial';
  return 'Life';
}

// Normalize once: fill optional fields with deterministic fallbacks.
const AGENTS: Agent[] = (sample_agents_dataset as Agent[]).map((a) => ({
  ...a,
  verified: a.verified ?? hashString(a.id) % 5 !== 0, // ~80% verified
  experienceYears: a.experienceYears ?? (hashString(a.name) % 18) + 3,
  industries:
    a.industries && a.industries.length
      ? a.industries
      : [a.title.replace(/\b(agent|senior|specialist)\b/gi, '').trim() || 'Insurance'],
}));

// --- Tiny inline icons ------------------------------------------------------
function CategoryIcon({ category }: { category: Category }) {
  const common = { width: 12, height: 12, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (category) {
    case 'Medicare':
      return (<svg {...common}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" /><path d="M12 8v6M9 11h6" /></svg>);
    case 'Health':
      return (<svg {...common}><path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7Z" /></svg>);
    case 'Annuities':
      return (<svg {...common}><path d="M3 17l6-6 4 4 7-7" /><path d="M14 8h6v6" /></svg>);
    case 'Financial':
      return (<svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v10M9.5 9.5a2.5 2 0 0 1 5 0c0 2.5-5 1.5-5 4a2.5 2 0 0 0 5 0" /></svg>);
    default: // Life
      return (<svg {...common}><path d="M12 3a7 7 0 0 1 7 7v6H5v-6a7 7 0 0 1 7-7Z" /><path d="M12 16v5M9 21h6" /></svg>);
  }
}

function CheckBadge() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-label="Verified" role="img">
      <circle cx="12" cy="12" r="11" fill="#1F8A5B" />
      <path d="M7 12.5l3.2 3.2L17 9" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? '#B8862F' : 'none'} stroke={filled ? '#B8862F' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 14c1.5-1.5 3-3.3 3-5.5A4.5 4.5 0 0 0 12 5 4.5 4.5 0 0 0 2 8.5c0 2.2 1.5 4 3 5.5l7 7Z" />
    </svg>
  );
}

// --- Avatar -----------------------------------------------------------------
function Avatar({ agent, size = 40 }: { agent: Agent; size?: number }) {
  return (
    <span
      className="avatar"
      style={{ width: size, height: size, background: avatarColor(agent.id), fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {initials(agent.name)}
    </span>
  );
}

// --- Map: pill marker (replaces <Pin>) --------------------------------------
interface PillProps {
  agent: Agent;
  active: boolean;
  onSelect: (id: string) => void;
  onRef: (marker: Marker | null, key: string) => void;
}

function AgentPill({ agent, active, onSelect, onRef }: PillProps) {
  const map = useMap();
  const handleRef = useCallback((marker: Marker | null) => onRef(marker, agent.id), [agent.id, onRef]);
  const category = primaryCategory(agent);
  const firstName = agent.name.split(' ')[0];

  return (
    <AdvancedMarker
      position={{ lat: agent.lat, lng: agent.lng }}
      ref={handleRef}
      zIndex={active ? 999 : undefined}
      clickable
      onClick={() => {
        onSelect(agent.id);
        map?.panTo({ lat: agent.lat, lng: agent.lng });
      }}
    >
      <button type="button" className={`pill${active ? ' pill--active' : ''}`} aria-label={`${agent.name}, ${agent.city}`}>
        <span className="pill__icon"><CategoryIcon category={category} /></span>
        <span className="pill__name">{firstName}</span>
        {agent.verified && <span className="pill__check"><CheckBadge /></span>}
      </button>
    </AdvancedMarker>
  );
}

// --- Map: reset-view button -------------------------------------------------
function ResetViewButton() {
  const map = useMap();
  return (
    <button
      type="button"
      className="reset-view"
      aria-label="Reset map to Florida"
      onClick={() => {
        map?.setCenter(DEFAULT_CENTER);
        map?.setZoom(DEFAULT_ZOOM);
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    </button>
  );
}

// --- Map: marker layer (clustering + info window) ---------------------------
interface AgentMarkersProps {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

function AgentMarkers({ agents, selectedId, onSelect }: AgentMarkersProps) {
  const map = useMap();
  const [markers, setMarkers] = useState<Record<string, Marker>>({});
  const clusterer = useRef<MarkerClusterer | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) clusterer.current = new MarkerClusterer({ map });
  }, [map]);

  useEffect(() => {
    if (!clusterer.current) return;
    clusterer.current.clearMarkers();
    clusterer.current.addMarkers(Object.values(markers));
  }, [markers]);

  const setMarkerRef = useCallback((marker: Marker | null, key: string) => {
    setMarkers((prev) => {
      const exists = Boolean(prev[key]);
      if (marker && exists) return prev;
      if (!marker && !exists) return prev;
      if (marker) return { ...prev, [key]: marker };
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }, []);

  const selected = agents.find((a) => a.id === selectedId) ?? null;

  return (
    <>
      {agents.map((agent) => (
        <AgentPill
          key={agent.id}
          agent={agent}
          active={selectedId === agent.id}
          onSelect={onSelect}
          onRef={setMarkerRef}
        />
      ))}

      {selected && (
        <InfoWindow
          position={{ lat: selected.lat, lng: selected.lng }}
          pixelOffset={[0, -44]}
          onCloseClick={() => onSelect(null)}
        >
          <div className="agent-card">
            <div className="agent-card__head">
              <Avatar agent={selected} size={38} />
              <div>
                <div className="agent-card__name">
                  {selected.name}
                  {selected.verified && <span className="agent-card__check"><CheckBadge /></span>}
                </div>
                <div className="agent-card__title">{selected.title}</div>
              </div>
            </div>
            <dl className="agent-card__meta">
              <div><dt>Location</dt><dd>{selected.city}, {selected.state} {selected.zip}</dd></div>
              <div><dt>Experience</dt><dd>{selected.experienceYears} years</dd></div>
              <div><dt>Specialties</dt><dd>{selected.industries?.join(', ')}</dd></div>
            </dl>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

// --- Verified toggle --------------------------------------------------------
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" className="toggle" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}>
      <span className={`toggle__track${checked ? ' is-on' : ''}`}><span className="toggle__thumb" /></span>
      <span className="toggle__label">{label}</span>
    </button>
  );
}

// --- Filters popover --------------------------------------------------------
interface FiltersProps {
  states: string[];
  industries: string[];
  state: string;
  industry: string;
  onState: (v: string) => void;
  onIndustry: (v: string) => void;
  activeCount: number;
}

function Filters({ states, industries, state, industry, onState, onIndustry, activeCount }: FiltersProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="filters" ref={ref}>
      <button type="button" className={`filters__btn${activeCount ? ' is-active' : ''}`} onClick={() => setOpen((o) => !o)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M3 5h18M6 12h12M10 19h4" />
        </svg>
        Filters{activeCount > 0 && <span className="filters__count">{activeCount}</span>}
      </button>

      {open && (
        <div className="filters__panel">
          <label className="field">
            <span>State</span>
            <select value={state} onChange={(e) => onState(e.target.value)}>
              <option value="">All states</option>
              {states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Specialty</span>
            <select value={industry} onChange={(e) => onIndustry(e.target.value)}>
              <option value="">All specialties</option>
              {industries.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </label>
          <button type="button" className="filters__clear" onClick={() => { onState(''); onIndustry(''); }}>
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

// --- App --------------------------------------------------------------------
function App() {
  const [query, setQuery] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [stateFilter, setStateFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [panelOpen, setPanelOpen] = useState(true);

  const rowRefs = useRef<Record<string, HTMLLIElement | null>>({});

  const states = useMemo(() => Array.from(new Set(AGENTS.map((a) => a.state))).sort(), []);
  const industries = useMemo(
    () => Array.from(new Set(AGENTS.flatMap((a) => a.industries ?? []))).sort(),
    [],
  );

  const filtered = useMemo<Agent[]>(() => {
    const q = query.trim().toLowerCase();
    return AGENTS.filter((a) => {
      if (q && !(a.name.toLowerCase().includes(q) || a.zip.includes(q))) return false;
      if (verifiedOnly && !a.verified) return false;
      if (stateFilter && a.state !== stateFilter) return false;
      if (industryFilter && !(a.industries ?? []).includes(industryFilter)) return false;
      return true;
    });
  }, [query, verifiedOnly, stateFilter, industryFilter]);

  // Drop selection if it falls out of the filtered set.
  useEffect(() => {
    if (selectedId && !filtered.some((a) => a.id === selectedId)) setSelectedId(null);
  }, [filtered, selectedId]);

  // Scroll the selected card into view (e.g. when chosen from the map).
  useEffect(() => {
    if (selectedId && rowRefs.current[selectedId]) {
      rowRefs.current[selectedId]?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [selectedId]);

  const toggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const activeFilterCount = (stateFilter ? 1 : 0) + (industryFilter ? 1 : 0) + (verifiedOnly ? 1 : 0);

  return (
    <div className="app">
      <style>{styles}</style>

      {/* Top bar */}
      <header className="topbar">
        <div className="brand">
          <span className="brand__mark" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#C9A24B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 21s7-5.5 7-11a7 7 0 0 0-14 0c0 5.5 7 11 7 11Z" /><circle cx="12" cy="10" r="2.5" />
            </svg>
          </span>
          <span className="brand__name">Agent Locator</span>
        </div>
        <nav className="nav">
          <a className="nav__link nav__link--active" href="#agents">Agents</a>
          <a className="nav__link" href="#territories">Territories</a>
          <a className="nav__link" href="#reports">Reports</a>
        </nav>
        <div className="topbar__right">
          <span className="topbar__tag">Prototype · synthetic data</span>
        </div>
      </header>

      {/* Content */}
      <div className={`layout${panelOpen ? '' : ' layout--collapsed'}`}>
        <aside className="panel" aria-hidden={!panelOpen}>
          <div className="panel__bar">
            <p className="result-count"><strong>{filtered.length}</strong> of {AGENTS.length} agents</p>
            <div className="panel__controls">
              <Toggle checked={verifiedOnly} onChange={setVerifiedOnly} label="Verified only" />
              <Filters
                states={states}
                industries={industries}
                state={stateFilter}
                industry={industryFilter}
                onState={setStateFilter}
                onIndustry={setIndustryFilter}
                activeCount={activeFilterCount}
              />
            </div>
          </div>

          <label className="search">
            <svg className="search__icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
            </svg>
            <input
              className="search__input"
              type="search"
              placeholder="Search by name or ZIP"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
            />
          </label>

          <ul className="result-list">
            {filtered.map((agent) => {
              const active = selectedId === agent.id;
              const fav = favorites.has(agent.id);
              return (
                <li
                  key={agent.id}
                  ref={(el) => { rowRefs.current[agent.id] = el; }}
                  className={`row${active ? ' row--active' : ''}`}
                >
                  <button type="button" className="row__main" onClick={() => setSelectedId(agent.id)}>
                    <Avatar agent={agent} />
                    <span className="row__body">
                      <span className="row__line1">
                        <span className="row__name">{agent.name}</span>
                        {agent.verified && <span className="row__check"><CheckBadge /></span>}
                        <span className="row__loc">· {agent.city}, {agent.state}</span>
                      </span>
                      <span className="row__line2">
                        {agent.industries?.join(', ')} · {agent.experienceYears}y experience
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`row__fav${fav ? ' is-fav' : ''}`}
                    aria-label={fav ? 'Remove favorite' : 'Add favorite'}
                    aria-pressed={fav}
                    onClick={() => toggleFavorite(agent.id)}
                  >
                    <HeartIcon filled={fav} />
                  </button>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="result-empty">
                No agents match these filters. Clear the search or filters to see everyone.
              </li>
            )}
          </ul>
        </aside>

        <main className="map-area">
          <button
            type="button"
            className="panel-toggle"
            aria-label={panelOpen ? 'Collapse list' : 'Expand list'}
            onClick={() => setPanelOpen((o) => !o)}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d={panelOpen ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
            </svg>
          </button>

          {MISSING_KEY ? (
            <div className="map-placeholder">
              <div>
                <p className="map-placeholder__title">Map key needed</p>
                <p>Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code> file, then restart the dev server.</p>
              </div>
            </div>
          ) : (
            <APIProvider apiKey={API_KEY}>
              <Map
                mapId={MAP_ID}
                defaultCenter={DEFAULT_CENTER}
                defaultZoom={DEFAULT_ZOOM}
                gestureHandling="greedy"
                disableDefaultUI={false}
                clickableIcons={false}
                style={{ width: '100%', height: '100%' }}
              >
                <AgentMarkers agents={filtered} selectedId={selectedId} onSelect={setSelectedId} />
                <ResetViewButton />
              </Map>
            </APIProvider>
          )}
        </main>
      </div>

      <footer className="footer">
        <span>© 2026 AmeriLife · Enterprise Data &amp; AI Platforms</span>
        <span className="footer__muted">Internal prototype</span>
      </footer>
    </div>
  );
}
// --- Mount ------------------------------------------------------------------
const container = document.getElementById('app') || document.getElementById('root');
if (container) createRoot(container).render(<App />);

export default App;
