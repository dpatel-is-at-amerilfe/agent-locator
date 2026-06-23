// --- Types ------------------------------------------------------------------
// Fields like verified / industries / experienceYears are OPTIONAL. Fallbacks in place.
interface Agent {
  id: string;
  name: string;
  title: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lng: number;
  verified?: boolean;
  industries?: string[];
  experienceYears?: number;
}

interface ImportMetaEnv {
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly VITE_GOOGLE_MAPS_MAP_ID?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}

export type { Agent, ImportMetaEnv, ImportMeta };