
/// <reference types="@types/google.maps" />

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// --- Configuration ----------------------------------------------------------
const API_KEY: string = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? '';
const MAP_ID: string = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID ?? '';
const KEY_PLACEHOLDERS = ['', 'YOUR_API_KEY', 'your_key_here'];
const MISSING_KEY = KEY_PLACEHOLDERS.includes(API_KEY);

// const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: 27.8, lng: -81.4 };
// const DEFAULT_ZOOM = 7;

// World view — the dataset now spans multiple countries.
const DEFAULT_CENTER: google.maps.LatLngLiteral = { lat: 25, lng: -40 };
const DEFAULT_ZOOM = 2;


export { API_KEY, MAP_ID, MISSING_KEY, DEFAULT_CENTER, DEFAULT_ZOOM };