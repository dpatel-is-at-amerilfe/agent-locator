/**
 * Agent Geospatial Map — prototype
 * -------------------------------------------------------------------
 * Demonstrates a Google Maps geospatial visualization in React using the
 * vis.gl/react-google-maps library, matching the approach in:
 * https://developers.google.com/codelabs/maps-platform/maps-platform-101-react-js
 *
 * Features
 *   - Maps JavaScript API loaded declaratively via <APIProvider>
 *   - Agent locations plotted from latitude/longitude as AdvancedMarkers
 *   - Clickable markers open an InfoWindow with the agent's profile
 *   - Search/filter by agent name or ZIP code
 *   - Marker clustering via @googlemaps/markerclusterer
 *   - Responsive layout (control panel + map; stacks on narrow screens)
 *
 * Setup (drop-in for the codelab starter project)
 *   1. cd starter && npm install
 *   2. npm install @vis.gl/react-google-maps @googlemaps/markerclusterer
 *   3. Replace src/app.tsx with this file.
 *   4. Add your key to a .env file at the project root:
 *        VITE_GOOGLE_MAPS_API_KEY=your_key_here
 *        VITE_GOOGLE_MAPS_MAP_ID=your_map_id_here   (Advanced Markers require a Map ID)
 *   5. npm start
 *
 * Note: the data below is synthetic sample data — no real agent PII.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  InfoWindow,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import { MarkerClusterer } from '@googlemaps/markerclusterer';
import type { Marker } from '@googlemaps/markerclusterer';
import {sample_agents_dataset} from './data/sample_agents';

// --- Types ------------------------------------------------------------------
interface Agent {
  id: string;
  name: string;
  title: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
}

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// --- Configuration ----------------------------------------------------------
const API_KEY: string = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? 'YOUR_API_KEY';
const MAP_ID: string = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID';

// --- Sample dataset (synthetic) ---------------------------------------------
const AGENTS: Agent[] = sample_agents_dataset;

// Center the initial view on the geographic middle of the dataset.
const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: 27.8, lng: -81.4 };
const DEFAULT_ZOOM = 7;

// --- Marker layer: renders markers + handles clustering + selection ---------
interface AgentMarkersProps {
  agents: Agent[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

interface AgentMarkerItemProps {
  agent: Agent;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onRef: (marker: Marker | null, key: string) => void;
}

function AgentMarkerItem({ agent, selectedId, onSelect, onRef }: AgentMarkerItemProps) {
  const map = useMap();
  const handleRef = useCallback(
    (marker: Marker | null) => onRef(marker, agent.id),
    [agent.id, onRef],
  );
  return (
    <AdvancedMarker
      position={{ lat: agent.lat, lng: agent.lng }}
      ref={handleRef}
      clickable
      onClick={() => {
        onSelect(agent.id);
        map?.panTo({ lat: agent.lat, lng: agent.lng });
      }}
    >
      <Pin
        background={selectedId === agent.id ? '#C9A24B' : '#0B1F3A'}
        glyphColor="#F4EFE3"
        borderColor={selectedId === agent.id ? '#0B1F3A' : '#C9A24B'}
      />
    </AdvancedMarker>
  );
}

function AgentMarkers({ agents, selectedId, onSelect }: AgentMarkersProps) {
  const map = useMap();
  const [markers, setMarkers] = useState<Record<string, Marker>>({});
  const clusterer = useRef<MarkerClusterer | null>(null);

  useEffect(() => {
    if (!map) return;
    if (!clusterer.current) {
      clusterer.current = new MarkerClusterer({ map });
    }
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

  return (
    <>
      {agents.map((agent) => (
        <AgentMarkerItem
          key={agent.id}
          agent={agent}
          selectedId={selectedId}
          onSelect={onSelect}
          onRef={setMarkerRef}
        />
      ))}

      {agents
        .filter((agent) => agent.id === selectedId)
        .map((agent) => (
          <InfoWindow
            key={`info-${agent.id}`}
            position={{ lat: agent.lat, lng: agent.lng }}
            pixelOffset={[0, -40]}
            onCloseClick={() => onSelect(null)}
          >
            <div className="agent-card">
              <div className="agent-card__name">{agent.name}</div>
              <div className="agent-card__title">{agent.title}</div>
              <dl className="agent-card__meta">
                <div><dt>Location</dt><dd>{agent.city}, {agent.state} {agent.zip}</dd></div>
                <div><dt>Coordinates</dt><dd>{agent.lat.toFixed(4)}, {agent.lng.toFixed(4)}</dd></div>
              </dl>
            </div>
          </InfoWindow>
        ))}
    </>
  );
}

// --- App shell: search/filter panel + map -----------------------------------
function App() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filtered = useMemo<Agent[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return AGENTS;
    return AGENTS.filter(
      (a) => a.name.toLowerCase().includes(q) || a.zip.includes(q),
    );
  }, [query]);

  // Drop the selection if the selected agent is filtered out of view.
  useEffect(() => {
    if (selectedId && !filtered.some((a) => a.id === selectedId)) {
      setSelectedId(null);
    }
  }, [filtered, selectedId]);

  const missingKey = !API_KEY;

  return (
    <div className="layout">
      <style>{STYLES}</style>

      <aside className="panel">
        <header className="panel__header">
          <p className="panel__eyebrow">Enterprise Data &amp; AI Platforms</p>
          <h1 className="panel__title">Agent Geospatial Map</h1>
          <p className="panel__subtitle">Prototype · synthetic sample data</p>
        </header>

        <label className="search">
          <span className="search__label">Search by agent name or ZIP</span>
          <input
            className="search__input"
            type="search"
            placeholder="e.g. Sarah or 33101"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>

        <p className="result-count">
          {filtered.length} of {AGENTS.length} agents
        </p>

        <ul className="result-list">
          {filtered.map((agent) => (
            <li key={agent.id}>
              <button
                type="button"
                className={`result${selectedId === agent.id ? ' result--active' : ''}`}
                onClick={() => setSelectedId(agent.id)}
              >
                <span className="result__name">{agent.name}</span>
                <span className="result__meta">
                  {agent.title} · {agent.city}, {agent.state} {agent.zip}
                </span>
              </button>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="result-empty">
              No agents match that name or ZIP. Clear the search to see all locations.
            </li>
          )}
        </ul>
      </aside>

      <main className="map-area">
        {missingKey ? (
          <div className="map-placeholder">
            <p>Add <code>VITE_GOOGLE_MAPS_API_KEY</code> to your <code>.env</code> file to load the map.</p>
          </div>
        ) : (
          <APIProvider apiKey={API_KEY}>
            <Map
              mapId={MAP_ID}
              defaultCenter={DEFAULT_CENTER}
              defaultZoom={DEFAULT_ZOOM}
              gestureHandling="greedy"
              disableDefaultUI={false}
              style={{ width: '100%', height: '100%' }}
            >
              <AgentMarkers
                agents={filtered}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </Map>
          </APIProvider>
        )}
      </main>
    </div>
  );
}

// --- Styles -----------------------------------------------------------------
const STYLES = `
  * { box-sizing: border-box; }
  html, body, #app, #root { height: 100%; margin: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #0B1F3A;
  }
  .layout {
    display: grid;
    grid-template-columns: 340px 1fr;
    height: 100vh;
    width: 100%;
  }
  .panel {
    background: #0B1F3A;
    color: #F4EFE3;
    padding: 28px 24px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .panel__eyebrow {
    margin: 0;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: #C9A24B;
  }
  .panel__title {
    margin: 6px 0 0;
    font-family: Georgia, "Times New Roman", serif;
    font-size: 26px;
    font-weight: 600;
    line-height: 1.15;
  }
  .panel__subtitle { margin: 4px 0 0; font-size: 13px; color: #9FB0C6; }
  .search { display: flex; flex-direction: column; gap: 8px; }
  .search__label { font-size: 12px; color: #9FB0C6; letter-spacing: 0.02em; }
  .search__input {
    width: 100%;
    padding: 11px 13px;
    border: 1px solid #2A4569;
    border-radius: 8px;
    background: #122B4D;
    color: #F4EFE3;
    font-size: 14px;
    outline: none;
  }
  .search__input::placeholder { color: #6E83A0; }
  .search__input:focus { border-color: #C9A24B; box-shadow: 0 0 0 2px rgba(201,162,75,0.25); }
  .result-count { margin: 0; font-size: 12px; color: #9FB0C6; }
  .result-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
  .result {
    width: 100%;
    text-align: left;
    background: #122B4D;
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 12px 14px;
    color: #F4EFE3;
    cursor: pointer;
    display: flex;
    flex-direction: column;
    gap: 3px;
    transition: border-color 0.15s ease, background 0.15s ease;
  }
  .result:hover { border-color: #33507A; background: #16335A; }
  .result:focus-visible { outline: 2px solid #C9A24B; outline-offset: 2px; }
  .result--active { border-color: #C9A24B; background: #16335A; }
  .result__name { font-weight: 600; font-size: 14px; }
  .result__meta { font-size: 12px; color: #9FB0C6; }
  .result-empty { font-size: 13px; color: #9FB0C6; line-height: 1.4; }
  .map-area { position: relative; }
  .map-placeholder {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 24px;
    background: #EEF1F5;
    color: #44505F;
  }
  .map-placeholder code { background: #DDE3EB; padding: 2px 5px; border-radius: 4px; }
  .agent-card { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; min-width: 200px; }
  .agent-card__name { font-size: 15px; font-weight: 700; color: #0B1F3A; }
  .agent-card__title { font-size: 13px; color: #C9A24B; margin-top: 2px; font-weight: 600; }
  .agent-card__meta { margin: 10px 0 0; display: flex; flex-direction: column; gap: 7px; }
  .agent-card__meta div { display: flex; flex-direction: column; }
  .agent-card__meta dt { font-size: 10px; text-transform: uppercase; letter-spacing: 0.08em; color: #7A879A; }
  .agent-card__meta dd { margin: 1px 0 0; font-size: 13px; color: #1E2A3A; }

  @media (max-width: 760px) {
    .layout { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
    .panel { max-height: 42vh; }
  }
`;

// --- Mount (matches the codelab's index.html container) ---------------------
const container = document.getElementById('app') || document.getElementById('root');
if (container) {
  createRoot(container).render(<App />);
}

export default App;
