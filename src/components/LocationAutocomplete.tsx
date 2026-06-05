import { useEffect, useRef, useState } from 'react';

/**
 * Location autocomplete powered by Google Places API.
 *
 * Loads the Google Maps Places script lazily (once per session). Uses the
 * AutocompleteService for city-level predictions, restricted to the US.
 *
 * Requires VITE_GOOGLE_PLACES_API_KEY in env.
 *
 * Falls back to a plain text input if no API key is set or the script fails
 * to load, so the CRM still works without Google Places configured.
 */

// Minimal local type stand-ins so we don't need @types/google.maps as a dep
interface PredictionTerm {
  offset: number;
  value: string;
}
interface AutocompletePrediction {
  description: string;
  place_id: string;
  structured_formatting?: {
    main_text: string;
    secondary_text?: string;
  };
  terms?: PredictionTerm[];
}
interface AutocompleteService {
  getPlacePredictions: (
    request: { input: string; types?: string[]; componentRestrictions?: { country: string | string[] } },
    callback: (predictions: AutocompletePrediction[] | null, status: string) => void
  ) => void;
}

declare global {
  interface Window {
    google?: {
      maps?: {
        places?: {
          AutocompleteService: new () => AutocompleteService;
        };
      };
    };
    __anfPlacesScriptLoading?: Promise<void>;
  }
}

const API_KEY = import.meta.env.VITE_GOOGLE_PLACES_API_KEY as string | undefined;

function loadPlacesScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.maps?.places) return Promise.resolve();
  if (window.__anfPlacesScriptLoading) return window.__anfPlacesScriptLoading;
  if (!API_KEY) return Promise.reject(new Error('No API key'));

  window.__anfPlacesScriptLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Places'));
    document.head.appendChild(script);
  });

  return window.__anfPlacesScriptLoading;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export default function LocationAutocomplete({ value, onChange, placeholder, className, id }: Props) {
  const [predictions, setPredictions] = useState<AutocompletePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);
  const serviceRef = useRef<AutocompleteService | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let mounted = true;
    loadPlacesScript()
      .then(() => {
        if (!mounted) return;
        if (window.google?.maps?.places) {
          serviceRef.current = new window.google.maps.places.AutocompleteService();
          setScriptReady(true);
        } else {
          setScriptFailed(true);
        }
      })
      .catch(() => {
        if (mounted) setScriptFailed(true);
      });
    return () => {
      mounted = false;
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const fetchPredictions = (q: string) => {
    if (!serviceRef.current) return;
    if (q.trim().length < 2) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    serviceRef.current.getPlacePredictions(
      {
        input: q,
        types: ['(cities)'],
        componentRestrictions: { country: 'us' },
      },
      (results) => {
        const list = results ?? [];
        setPredictions(list);
        setOpen(list.length > 0);
      }
    );
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    onChange(newVal);
    if (!scriptReady) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(newVal), 150);
  };

  const handleSelect = (p: AutocompletePrediction) => {
    // Prefer "Main Text, Secondary Text" if available (e.g. "Cleveland, OH, USA")
    let formatted = p.description;
    if (p.structured_formatting?.main_text) {
      const city = p.structured_formatting.main_text;
      const region = p.structured_formatting.secondary_text;
      // Trim trailing ", USA" for cleaner display
      const cleanedRegion = region?.replace(/,\s*USA\s*$/i, '');
      formatted = cleanedRegion ? `${city}, ${cleanedRegion}` : city;
    }
    onChange(formatted);
    setPredictions([]);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleBlur = () => {
    // Delay so click handlers on predictions fire first
    setTimeout(() => setOpen(false), 150);
  };

  const baseClass =
    className ??
    'w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-flame-500 focus:border-transparent';

  return (
    <div className="relative">
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => predictions.length > 0 && setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder ?? 'Start typing a city or town...'}
        className={baseClass}
        autoComplete="off"
      />

      {open && predictions.length > 0 && (
        <ul
          className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-64 overflow-y-auto"
          role="listbox"
        >
          {predictions.map((p) => (
            <li
              key={p.place_id}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelect(p);
              }}
              className="px-3 py-2 hover:bg-flame-50 cursor-pointer text-sm border-b border-slate-100 last:border-0"
              role="option"
              aria-selected="false"
            >
              <div className="font-medium text-slate-900">
                {p.structured_formatting?.main_text ?? p.description}
              </div>
              {p.structured_formatting?.secondary_text && (
                <div className="text-xs text-slate-500">
                  {p.structured_formatting.secondary_text.replace(/,\s*USA\s*$/i, '')}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {!scriptReady && !scriptFailed && API_KEY && (
        <p className="text-[11px] text-slate-400 mt-1">Loading suggestions...</p>
      )}
      {scriptFailed && (
        <p className="text-[11px] text-slate-400 mt-1">
          Address suggestions unavailable. Type any location manually.
        </p>
      )}
      {!API_KEY && (
        <p className="text-[11px] text-slate-400 mt-1">
          Set VITE_GOOGLE_PLACES_API_KEY in env to enable suggestions. Free text still works.
        </p>
      )}
    </div>
  );
}
