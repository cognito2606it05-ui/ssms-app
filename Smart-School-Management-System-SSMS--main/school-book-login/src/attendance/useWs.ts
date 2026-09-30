import { useEffect, useRef, useState } from 'react';
import { WS_URL } from './api';

export interface WsEvent { type: string; [k: string]: any }

// Live WebSocket hook for an attendance session (or the global 'live' feed).
export function useWs(session: string | number | null) {
  const [connected, setConnected] = useState(false);
  const [events, setEvents] = useState<WsEvent[]>([]);
  const [counts, setCounts] = useState<any>(null);
  const [tick, setTick] = useState(0); // bumps on any event, for refetch triggers
  const ref = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (session == null) return;
    let alive = true;
    const connect = () => {
      const ws = new WebSocket(`${WS_URL}?session=${session}`);
      ref.current = ws;
      ws.onopen = () => alive && setConnected(true);
      ws.onclose = () => { if (alive) { setConnected(false); setTimeout(connect, 1500); } };
      ws.onerror = () => ws.close();
      ws.onmessage = (m) => {
        try {
          const data = JSON.parse(m.data);
          if (data.type === 'connected') return;
          setEvents((e) => [{ ...data }, ...e].slice(0, 50));
          if (data.counts) setCounts(data.counts);
          setTick((t) => t + 1);
        } catch { /* ignore */ }
      };
    };
    connect();
    return () => { alive = false; ref.current?.close(); };
  }, [session]);

  return { connected, events, counts, tick };
}
