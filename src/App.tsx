/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Bell,
  Volume2,
  Headphones,
  AlertTriangle,
  Mic,
  ThumbsUp,
  CheckCircle2,
  Wifi,
  WifiOff,
  Radio,
  Music,
  Sliders,
  Settings,
  Share2,
  Copy,
  Check,
  X,
  RotateCcw,
  Download,
  VolumeX,
  Eye,
  Flame,
  ArrowRight,
  ArrowLeft,
  Send,
  Monitor,
  RefreshCw,
  ShieldCheck,
  User,
  Sparkles,
  Clock,
  Layers,
} from 'lucide-react';

// ==========================================
// TYPES & DATA STRUCTURES
// ==========================================

export type UserRole = 'stage' | 'booth';

export interface StageCue {
  id: string;
  clientId: string;
  type: 'CALL' | 'CUE';
  code: string;
  title: string;
  senderName: string;
  instrument?: string;
  location?: string;
  musicianName?: string;
  timestamp: number;
  acknowledgedAt: number | null;
  status: 'pending' | 'acknowledged';
  notes?: string;
}

export interface ConnectedClient {
  id: string;
  role: UserRole;
  name: string;
  instrument?: string;
  location?: string;
  lastPing: number;
}

export interface RoomState {
  code: string;
  activeAlert: StageCue | null;
  activeAlerts: StageCue[];
  history: StageCue[];
  connectedClients: ConnectedClient[];
  engineerMessage?: {
    text: string;
    timestamp: number;
  } | null;
}

export interface InstrumentBadgeInfo {
  icon: string;
  label: string;
  colorClass: string;
  borderClass: string;
  bgClass: string;
  cardHeaderClass: string;
}

export function getInstrumentBadge(instrument?: string): InstrumentBadgeInfo {
  const lower = (instrument || '').toLowerCase();
  if (lower.includes('key') || lower.includes('piano') || lower.includes('synth')) {
    return {
      icon: '🎹',
      label: 'Keys',
      colorClass: 'text-cyan-400',
      borderClass: 'border-cyan-500/50',
      bgClass: 'bg-cyan-950/40 text-cyan-300',
      cardHeaderClass: 'bg-cyan-950/80 border-cyan-500/40 text-cyan-200',
    };
  }
  if (lower.includes('lead voc') || lower.includes('lead sing') || lower.includes('worship lead')) {
    return {
      icon: '🎤',
      label: 'Lead Vocals',
      colorClass: 'text-rose-400',
      borderClass: 'border-rose-500/50',
      bgClass: 'bg-rose-950/40 text-rose-300',
      cardHeaderClass: 'bg-rose-950/80 border-rose-500/40 text-rose-200',
    };
  }
  if (lower.includes('voc') || lower.includes('backing') || lower.includes('bv')) {
    return {
      icon: '🎤',
      label: 'Backing Vocals',
      colorClass: 'text-fuchsia-400',
      borderClass: 'border-fuchsia-500/50',
      bgClass: 'bg-fuchsia-950/40 text-fuchsia-300',
      cardHeaderClass: 'bg-fuchsia-950/80 border-fuchsia-500/40 text-fuchsia-200',
    };
  }
  if (lower.includes('acoustic')) {
    return {
      icon: '🎸',
      label: 'Acoustic',
      colorClass: 'text-amber-400',
      borderClass: 'border-amber-500/50',
      bgClass: 'bg-amber-950/40 text-amber-300',
      cardHeaderClass: 'bg-amber-950/80 border-amber-500/40 text-amber-200',
    };
  }
  if (lower.includes('electric') || lower.includes('guitar')) {
    return {
      icon: '🎸',
      label: 'Elec Guitar',
      colorClass: 'text-orange-400',
      borderClass: 'border-orange-500/50',
      bgClass: 'bg-orange-950/40 text-orange-300',
      cardHeaderClass: 'bg-orange-950/80 border-orange-500/40 text-orange-200',
    };
  }
  if (lower.includes('bass')) {
    return {
      icon: '🎸',
      label: 'Bass',
      colorClass: 'text-indigo-400',
      borderClass: 'border-indigo-500/50',
      bgClass: 'bg-indigo-950/40 text-indigo-300',
      cardHeaderClass: 'bg-indigo-950/80 border-indigo-500/40 text-indigo-200',
    };
  }
  if (lower.includes('drum') || lower.includes('percussion')) {
    return {
      icon: '🥁',
      label: 'Drums',
      colorClass: 'text-emerald-400',
      borderClass: 'border-emerald-500/50',
      bgClass: 'bg-emerald-950/40 text-emerald-300',
      cardHeaderClass: 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200',
    };
  }
  if (lower.includes('choir')) {
    return {
      icon: '👥',
      label: 'Choir',
      colorClass: 'text-purple-400',
      borderClass: 'border-purple-500/50',
      bgClass: 'bg-purple-950/40 text-purple-300',
      cardHeaderClass: 'bg-purple-950/80 border-purple-500/40 text-purple-200',
    };
  }
  if (lower.includes('sax') || lower.includes('brass') || lower.includes('horn')) {
    return {
      icon: '🎷',
      label: 'Horns',
      colorClass: 'text-yellow-400',
      borderClass: 'border-yellow-500/50',
      bgClass: 'bg-yellow-950/40 text-yellow-300',
      cardHeaderClass: 'bg-yellow-950/80 border-yellow-500/40 text-yellow-200',
    };
  }
  if (lower.includes('violin') || lower.includes('string')) {
    return {
      icon: '🎻',
      label: 'Strings',
      colorClass: 'text-pink-400',
      borderClass: 'border-pink-500/50',
      bgClass: 'bg-pink-950/40 text-pink-300',
      cardHeaderClass: 'bg-pink-950/80 border-pink-500/40 text-pink-200',
    };
  }
  return {
    icon: '🎵',
    label: instrument || 'Stage',
    colorClass: 'text-cyan-400',
    borderClass: 'border-neutral-700',
    bgClass: 'bg-neutral-900 text-neutral-300',
    cardHeaderClass: 'bg-neutral-900 border-neutral-700 text-neutral-200',
  };
}

export interface CueDefinition {
  code: string;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'cyan' | 'amber' | 'rose' | 'emerald' | 'purple';
  borderClass: string;
  bgClass: string;
  textClass: string;
}

const QUICK_CUES: CueDefinition[] = [
  {
    code: 'VOCALS_UP',
    label: 'Vocals Up',
    sub: 'More vocal in my mix',
    icon: Volume2,
    color: 'cyan',
    borderClass: 'border-cyan-500/40 hover:border-cyan-400',
    bgClass: 'bg-cyan-950/20 active:bg-cyan-900/40',
    textClass: 'text-cyan-400',
  },
  {
    code: 'MORE_IN_EAR',
    label: 'More In-Ear',
    sub: 'Boost overall IEM level',
    icon: Headphones,
    color: 'purple',
    borderClass: 'border-purple-500/40 hover:border-purple-400',
    bgClass: 'bg-purple-950/20 active:bg-purple-900/40',
    textClass: 'text-purple-400',
  },
  {
    code: 'TOO_LOUD',
    label: 'Too Loud',
    sub: 'Harsh or clipping mix',
    icon: AlertTriangle,
    color: 'rose',
    borderClass: 'border-rose-500/40 hover:border-rose-400',
    bgClass: 'bg-rose-950/20 active:bg-rose-900/40',
    textClass: 'text-rose-400',
  },
  {
    code: 'CHECK_MIC',
    label: 'Check Mic',
    sub: 'Mic mute / battery / pack',
    icon: Mic,
    color: 'amber',
    borderClass: 'border-amber-500/40 hover:border-amber-400',
    bgClass: 'bg-amber-950/20 active:bg-amber-900/40',
    textClass: 'text-amber-400',
  },
  {
    code: 'ALL_GOOD',
    label: 'All Good',
    sub: 'Mix is locked & good',
    icon: ThumbsUp,
    color: 'emerald',
    borderClass: 'border-emerald-500/40 hover:border-emerald-400',
    bgClass: 'bg-emerald-950/20 active:bg-emerald-900/40',
    textClass: 'text-emerald-400',
  },
];

const INSTRUMENT_OPTIONS = [
  'Keys / Piano',
  'Lead Vocalist',
  'Acoustic Guitar',
  'Electric Guitar',
  'Bass Guitar',
  'Drums / Percussion',
  'Backing Vocal',
  'Worship Leader',
  'Choir',
  'Sax / Horns',
  'Strings / Violin',
  'Other / Guest',
];

const STAGE_LOCATIONS = [
  'Stage Left',
  'Center Stage',
  'Stage Right',
  'Drum Shield',
  'Choir Loft',
  'Pit / Floor',
];

// Shallow comparator to prevent unnecessary mobile re-renders
function isRoomStateEqual(a: RoomState | null, b: RoomState | null): boolean {
  if (!a || !b) return false;
  if (a.code !== b.code) return false;
  const aAlertId = a.activeAlert ? `${a.activeAlert.id}_${a.activeAlert.status}` : null;
  const bAlertId = b.activeAlert ? `${b.activeAlert.id}_${b.activeAlert.status}` : null;
  if (aAlertId !== bAlertId) return false;
  if ((a.activeAlerts?.length || 0) !== (b.activeAlerts?.length || 0)) return false;
  if (a.activeAlerts && b.activeAlerts) {
    for (let i = 0; i < a.activeAlerts.length; i++) {
      if (
        a.activeAlerts[i].id !== b.activeAlerts[i].id ||
        a.activeAlerts[i].status !== b.activeAlerts[i].status
      ) {
        return false;
      }
    }
  }
  if (a.history.length !== b.history.length) return false;
  if (a.history[0]?.id !== b.history[0]?.id) return false;
  if (a.engineerMessage?.timestamp !== b.engineerMessage?.timestamp) return false;
  if (a.connectedClients.length !== b.connectedClients.length) return false;
  for (let i = 0; i < a.connectedClients.length; i++) {
    if (
      a.connectedClients[i].id !== b.connectedClients[i].id ||
      a.connectedClients[i].name !== b.connectedClients[i].name
    ) {
      return false;
    }
  }
  return true;
}

// ==========================================
// HAPTIC FEEDBACK HELPER (Audio-Free Guarantee)
// ==========================================

function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'call' | 'ack') {
  if (typeof window === 'undefined' || typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    switch (type) {
      case 'light':
        navigator.vibrate(25);
        break;
      case 'medium':
        navigator.vibrate(50);
        break;
      case 'heavy':
        navigator.vibrate([60, 40, 60]);
        break;
      case 'call':
        navigator.vibrate([120, 50, 150, 50, 200]);
        break;
      case 'ack':
        navigator.vibrate([80, 40, 100]);
        break;
    }
  } catch {
    // Graceful fallback if device restricts vibration
  }
}

// ==========================================
// PWA INSTALL HOOK
// ==========================================

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      return true;
    }
    return false;
  };

  return { isInstallable: !!deferredPrompt, isInstalled, isIOS, install };
}

// ==========================================
// SCREEN WAKE LOCK HOOK (BUG-FREE & GLITCH-FREE)
// ==========================================

function useWakeLock() {
  const [isLocked, setIsLocked] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const desiredLockedRef = useRef(false);

  const requestLock = useCallback(async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
    try {
      if (wakeLockRef.current) return;
      const sentinel = await navigator.wakeLock.request('screen');
      wakeLockRef.current = sentinel;
      setIsLocked(true);
      sentinel.addEventListener('release', () => {
        wakeLockRef.current = null;
        if (!desiredLockedRef.current) {
          setIsLocked(false);
        }
      });
    } catch {
      setIsLocked(false);
    }
  }, []);

  const releaseLock = useCallback(async () => {
    desiredLockedRef.current = false;
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
      } catch {
        // ignore
      }
      wakeLockRef.current = null;
    }
    setIsLocked(false);
  }, []);

  const toggleWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      releaseLock();
    } else {
      desiredLockedRef.current = true;
      requestLock();
    }
  }, [requestLock, releaseLock]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && desiredLockedRef.current) {
        requestLock();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (wakeLockRef.current) {
        try {
          wakeLockRef.current.release();
        } catch {
          // ignore
        }
        wakeLockRef.current = null;
      }
    };
  }, [requestLock]);

  return { isLocked, requestWakeLock: requestLock, releaseWakeLock: releaseLock, toggleWakeLock };
}

// ==========================================
// MAIN APP COMPONENT
// ==========================================

export default function App() {
  const queryParams = new URLSearchParams(window.location.search);
  const queryRoom = queryParams.get('room') || '';
  const queryRole = (queryParams.get('role') as UserRole) || null;

  // Local storage state initialization
  const [roomCode, setRoomCode] = useState<string>(() => {
    if (queryRoom) return queryRoom.toUpperCase();
    return localStorage.getItem('stagesync_room') || 'SUNDAY';
  });

  const [role, setRole] = useState<UserRole>(() => {
    if (queryRole === 'stage' || queryRole === 'booth') return queryRole;
    const saved = localStorage.getItem('stagesync_role');
    if (saved === 'stage' || saved === 'booth') return saved;
    return 'stage';
  });

  // When opening or reopening the app, always show the setup screen first!
  const [hasJoinedSession, setHasJoinedSession] = useState<boolean>(false);

  const [instrument, setInstrument] = useState<string>(() => {
    return localStorage.getItem('stagesync_instrument') || 'Keys / Piano';
  });

  const [location, setLocation] = useState<string>(() => {
    return localStorage.getItem('stagesync_location') || 'Stage Left';
  });

  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('stagesync_name') || '';
  });

  // Unique client ID per session
  const [clientId] = useState<string>(() => {
    let id = sessionStorage.getItem('stagesync_client_id');
    if (!id) {
      id = `dev_${Math.random().toString(36).substring(2, 9)}`;
      sessionStorage.setItem('stagesync_client_id', id);
    }
    return id;
  });

  // Realtime state
  const [roomState, setRoomState] = useState<RoomState>({
    code: roomCode,
    activeAlert: null,
    activeAlerts: [],
    history: [],
    connectedClients: [],
    engineerMessage: null,
  });

  const [isConnected, setIsConnected] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number>(12);
  const [acknowledgedFlash, setAcknowledgedFlash] = useState(false);
  const [lastAckMessage, setLastAckMessage] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showIOSInstallGuide, setShowIOSInstallGuide] = useState(false);
  const [showIdentityModal, setShowIdentityModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [customCueText, setCustomCueText] = useState('');
  const [showCustomCueModal, setShowCustomCueModal] = useState(false);
  const [maxStrobeMode, setMaxStrobeMode] = useState(true);

  // Sound engineer test flash simulation
  const [testFlashActive, setTestFlashActive] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const lastPingSentRef = useRef<number>(0);
  const ackTimeoutRef = useRef<number | null>(null);
  const testFlashTimeoutRef = useRef<number | null>(null);

  const { isInstallable, isInstalled, isIOS, install: promptInstall } = usePWAInstall();
  const { isLocked, toggleWakeLock } = useWakeLock();

  const formattedSenderName = `${userName ? `${userName} • ` : ''}${instrument} (${location})`;
  const senderNameRef = useRef(formattedSenderName);
  senderNameRef.current = formattedSenderName;

  // Save config changes
  useEffect(() => {
    if (roomCode) localStorage.setItem('stagesync_room', roomCode);
    if (role) localStorage.setItem('stagesync_role', role);
    localStorage.setItem('stagesync_instrument', instrument);
    localStorage.setItem('stagesync_location', location);
    localStorage.setItem('stagesync_name', userName);
  }, [roomCode, role, instrument, location, userName]);

  // Flash acknowledgement on stage view
  const triggerAckFlash = useCallback((note?: string) => {
    triggerHaptic('ack');
    setAcknowledgedFlash(true);
    setLastAckMessage(note || 'Sound Guy Acknowledged!');
    if (ackTimeoutRef.current) window.clearTimeout(ackTimeoutRef.current);
    ackTimeoutRef.current = window.setTimeout(() => {
      setAcknowledgedFlash(false);
      setLastAckMessage(null);
    }, 3800);
  }, []);

  // Sync state via WebSocket + REST Fallback
  useEffect(() => {
    if (!hasJoinedSession || !role || !roomCode) return;

    let isUnmounted = false;
    let ws: WebSocket | null = null;
    let reconnectTimeout: number | null = null;
    let pollInterval: number | null = null;
    let pingInterval: number | null = null;
    let wsFailures = 0;

    // HTTP polling fallback if WS disconnects or on flaky mobile data
    const fetchLatestStateHttp = async () => {
      try {
        const res = await fetch(`/api/rooms/${encodeURIComponent(roomCode)}`);
        if (res.ok && !isUnmounted) {
          const data: RoomState = await res.json();
          setRoomState(prev => {
            // Check if this client's alert was acknowledged
            const prevMyAlert = (prev.activeAlerts || []).find(a => a.clientId === clientId && a.status === 'pending');
            const newMyAlert = (data.activeAlerts || []).find(a => a.clientId === clientId && a.status === 'pending');
            if (prevMyAlert && !newMyAlert) {
              triggerAckFlash(data.engineerMessage?.text);
            }
            if (isRoomStateEqual(prev, data)) {
              return prev;
            }
            return data;
          });
          setIsConnected(true);
        }
      } catch {
        // silent retry
      }
    };

    fetchLatestStateHttp();
    pollInterval = window.setInterval(fetchLatestStateHttp, 2500);

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    function connectWs() {
      if (isUnmounted) return;
      try {
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (isUnmounted) return;
          wsFailures = 0;
          setIsConnected(true);
          ws?.send(
            JSON.stringify({
              type: 'JOIN_ROOM',
              payload: {
                roomCode,
                role,
                name: role === 'booth' ? 'Sound Booth' : senderNameRef.current,
                instrument: role === 'stage' ? instrument : 'Console',
                location: role === 'stage' ? location : 'FOH Booth',
                id: clientId,
              },
            })
          );

          if (pingInterval) clearInterval(pingInterval);
          pingInterval = window.setInterval(() => {
            if (ws?.readyState === WebSocket.OPEN) {
              lastPingSentRef.current = performance.now();
              ws.send(JSON.stringify({ type: 'PING' }));
            }
          }, 8000);
        };

        ws.onmessage = (event) => {
          if (isUnmounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'PONG') {
              const rtt = Math.round(performance.now() - lastPingSentRef.current);
              setLatencyMs(Math.max(5, rtt));
            } else if (data.type === 'INIT_STATE' || data.type === 'STATE_UPDATE') {
              const newRoom = data.payload as RoomState;
              setRoomState(prev => {
                const prevMyAlert = (prev.activeAlerts || []).find(a => a.clientId === clientId && a.status === 'pending');
                const newMyAlert = (newRoom.activeAlerts || []).find(a => a.clientId === clientId && a.status === 'pending');
                if (prevMyAlert && !newMyAlert) {
                  triggerAckFlash(newRoom.engineerMessage?.text);
                }
                if (isRoomStateEqual(prev, newRoom)) return prev;
                return newRoom;
              });
            } else if (data.type === 'ALERT_ACKNOWLEDGED') {
              const { room: newRoom, alertId, note } = data.payload;
              // Check if acknowledged alert applies to this client
              setRoomState(prev => {
                const prevMyAlert = (prev.activeAlerts || []).find(a => a.clientId === clientId);
                if (prevMyAlert && (alertId === 'ALL' || alertId === prevMyAlert.id)) {
                  triggerAckFlash(note);
                }
                return isRoomStateEqual(prev, newRoom) ? prev : newRoom;
              });
            }
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };

        ws.onclose = () => {
          if (isUnmounted) return;
          wsFailures++;
          const delay = Math.min(8000, 1500 * Math.pow(1.5, Math.min(wsFailures, 4)));
          reconnectTimeout = window.setTimeout(connectWs, delay);
        };

        ws.onerror = () => {
          // Handled by close event
        };
      } catch {
        wsFailures++;
        reconnectTimeout = window.setTimeout(connectWs, 3500);
      }
    }

    connectWs();

    return () => {
      isUnmounted = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (pollInterval) clearInterval(pollInterval);
      if (pingInterval) clearInterval(pingInterval);
      if (ws) {
        ws.onclose = null;
        ws.onerror = null;
        ws.close();
      }
      wsRef.current = null;
    };
  }, [hasJoinedSession, role, roomCode, clientId, instrument, location, triggerAckFlash]);

  // Send cue
  const sendCue = useCallback(
    async (code: string, title: string, type: 'CALL' | 'CUE' = 'CUE') => {
      triggerHaptic(type === 'CALL' ? 'call' : 'heavy');
      const cuePayload = {
        clientId,
        code,
        title,
        type,
        senderName: formattedSenderName,
        instrument,
        location,
        musicianName: userName || instrument,
      };

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'SEND_CUE',
            payload: { roomCode, cue: cuePayload },
          })
        );
      } else {
        try {
          await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/cue`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cuePayload),
          });
        } catch {
          // ignore
        }
      }
    },
    [roomCode, clientId, formattedSenderName, instrument, location, userName]
  );

  // Acknowledge alert (Sound engineer)
  const acknowledgeAlert = useCallback(
    async (alertId?: string, note?: string) => {
      triggerHaptic('ack');
      const targetAlertId = alertId || 'ALL';

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'ACKNOWLEDGE_CUE',
            payload: { roomCode, alertId: targetAlertId, note },
          })
        );
      } else {
        try {
          await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/acknowledge`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ alertId: targetAlertId, note }),
          });
        } catch {
          // ignore
        }
      }
    },
    [roomCode]
  );

  // Engineer quick reply broadcast
  const sendEngineerReply = useCallback(
    async (text: string) => {
      triggerHaptic('light');
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'ENGINEER_RESPONSE',
            payload: { roomCode, text },
          })
        );
      } else {
        try {
          await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/response`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text }),
          });
        } catch {
          // ignore
        }
      }
    },
    [roomCode]
  );

  // Clear history
  const clearSessionHistory = async () => {
    try {
      await fetch(`/api/rooms/${encodeURIComponent(roomCode)}/clear-history`, {
        method: 'POST',
      });
      setRoomState(prev => ({ ...prev, history: [] }));
    } catch {
      // ignore
    }
  };

  const copyRoomShareUrl = () => {
    const url = `${window.location.origin}${window.location.pathname}?room=${encodeURIComponent(roomCode)}`;
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    triggerHaptic('light');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const triggerTestFlash = () => {
    triggerHaptic('call');
    setTestFlashActive(true);
    if (testFlashTimeoutRef.current) clearTimeout(testFlashTimeoutRef.current);
    testFlashTimeoutRef.current = window.setTimeout(() => {
      setTestFlashActive(false);
    }, 4500);
  };

  // Always show the setup screen first on open / reload with every saved detail ready!
  if (!hasJoinedSession) {
    return (
      <RoleSelectionView
        roomCode={roomCode}
        setRoomCode={setRoomCode}
        selectedRole={role}
        setSelectedRole={setRole}
        instrument={instrument}
        setInstrument={setInstrument}
        location={location}
        setLocation={setLocation}
        userName={userName}
        setUserName={setUserName}
        onConnect={() => {
          triggerHaptic('medium');
          // Persist all selections to localStorage immediately
          localStorage.setItem('stagesync_room', roomCode);
          localStorage.setItem('stagesync_role', role);
          localStorage.setItem('stagesync_instrument', instrument);
          localStorage.setItem('stagesync_location', location);
          localStorage.setItem('stagesync_name', userName);
          setHasJoinedSession(true);
        }}
        isInstallable={isInstallable}
        isInstalled={isInstalled}
        isIOS={isIOS}
        onInstall={promptInstall}
        onShowIOSGuide={() => setShowIOSInstallGuide(true)}
      />
    );
  }

  // ==========================================
  // ROOT OLED VIEWPORT (GLITCH-FREE MOBILE ARCHITECTURE)
  // ==========================================
  return (
    <div className="min-h-[100dvh] h-full flex flex-col bg-black text-neutral-100 font-sans select-none antialiased relative overflow-x-hidden">
      {/* ACKNOWLEDGED SUCCESS FLASH OVERLAY (Stage View) */}
      {acknowledgedFlash && role === 'stage' && (
        <div className="fixed inset-0 z-50 animate-stage-ack flex flex-col items-center justify-center p-6 text-black">
          <div className="bg-white/20 p-5 sm:p-7 rounded-full mb-4 shadow-2xl">
            <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-black stroke-[3]" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-center">
            ACKNOWLEDGED!
          </h2>
          <p className="mt-2 text-xl sm:text-2xl font-bold tracking-wide text-neutral-900 text-center max-w-md">
            {lastAckMessage || 'Sound engineer is taking care of it'}
          </p>
          <div className="mt-6 px-4 py-1.5 rounded-full bg-black/20 text-xs font-semibold uppercase tracking-widest">
            Screen resetting automatically...
          </div>
        </div>
      )}

      {/* AUDIO-FREE STATUS BANNER */}
      <div className="bg-neutral-950 border-b border-neutral-900 text-[11px] text-neutral-400 py-1.5 px-3 sm:px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-1.5 font-medium truncate">
          <VolumeX className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
          <span className="truncate">Audio-Free • High-Luminance Flash &amp; Haptic Only</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleWakeLock}
            className={`flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded transition ${
              isLocked
                ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>{isLocked ? 'Awake ON' : 'Keep Awake'}</span>
          </button>
        </div>
      </div>

      {/* TOP HEADER */}
      <header className="bg-[#08080a] border-b border-neutral-800/80 px-3 sm:px-5 py-2.5 flex items-center justify-between shrink-0 z-40">
        <div className="flex items-center gap-2 min-w-0">
          {/* Return to Setup button */}
          <button
            onClick={() => {
              triggerHaptic('light');
              setHasJoinedSession(false);
            }}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white hover:border-cyan-500/50 transition active:scale-95 flex items-center gap-1 shrink-0"
            title="Return to Station Setup Screen"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono font-bold hidden sm:inline">Setup</span>
          </button>

          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-amber-500 flex items-center justify-center text-black font-black text-sm shadow-lg shadow-cyan-500/20 shrink-0">
            SS
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white truncate">
                StageSync
              </span>
              <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase font-bold tracking-wide bg-neutral-900 border border-neutral-700 text-cyan-300 shrink-0">
                #{roomCode}
              </span>
            </div>
            <div className="text-[10px] text-neutral-400 flex items-center gap-1 truncate">
              {role === 'stage' ? (
                <>
                  <Music className="w-2.5 h-2.5 text-cyan-400 shrink-0" />
                  <span className="text-neutral-300 font-medium truncate">
                    {userName ? `${userName} (${instrument})` : instrument}
                  </span>
                </>
              ) : (
                <>
                  <Sliders className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  <span className="text-amber-300 font-medium truncate">Sound Desk Console</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CONNECTION & ACTIONS */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Live Sync Status */}
          <div
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
              isConnected
                ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-400'
                : 'bg-rose-950/30 border-rose-800/40 text-rose-400'
            }`}
          >
            {isConnected ? (
              <>
                <Wifi className="w-2.5 h-2.5 text-emerald-400" />
                <span>{latencyMs}ms</span>
              </>
            ) : (
              <>
                <WifiOff className="w-2.5 h-2.5 text-rose-400" />
                <span>Syncing</span>
              </>
            )}
          </div>

          {/* Share Room Button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition active:scale-95"
            title="Share Room Code"
          >
            <Share2 className="w-3.5 h-3.5" />
          </button>

          {/* Settings / Switch Role */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-300 hover:text-white transition active:scale-95"
            title="Settings & Role Switch"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* MAIN VIEW CONTENT */}
      <main className="flex-1 flex flex-col p-3 sm:p-5 max-w-4xl w-full mx-auto overflow-y-auto overscroll-contain safe-pb">
        {role === 'stage' ? (
          <StageRemoteView
            roomCode={roomCode}
            clientId={clientId}
            roomState={roomState}
            engineerMessage={roomState.engineerMessage}
            instrument={instrument}
            location={location}
            userName={userName}
            onSendCue={sendCue}
            onOpenCustom={() => setShowCustomCueModal(true)}
            onOpenIdentityEdit={() => setShowIdentityModal(true)}
          />
        ) : (
          <BoothDashboardView
            roomCode={roomCode}
            roomState={roomState}
            maxStrobeMode={maxStrobeMode}
            onToggleMaxStrobe={() => setMaxStrobeMode(prev => !prev)}
            onAcknowledge={acknowledgeAlert}
            onSendReply={sendEngineerReply}
            onClearHistory={clearSessionHistory}
            isTestFlashActive={testFlashActive}
            onTriggerTestFlash={triggerTestFlash}
          />
        )}
      </main>

      {/* SHARE ROOM MODAL */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#0f0f13] border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800/50 text-cyan-400">
                <Share2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Connect Stage &amp; Sound Booth</h3>
                <p className="text-xs text-neutral-400">Sub-second synchronization across all church devices</p>
              </div>
            </div>

            <div className="bg-black/60 border border-neutral-800 rounded-xl p-4 mb-4 text-center">
              <div className="text-xs uppercase tracking-wider text-neutral-400 mb-1">Shared Room Code</div>
              <div className="text-3xl font-black font-mono tracking-widest text-cyan-400">
                {roomCode}
              </div>
              <div className="mt-2 text-xs text-neutral-400">
                Musicians and sound engineers enter this code to connect instantly.
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <button
                onClick={copyRoomShareUrl}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold bg-neutral-800 hover:bg-neutral-700 text-white transition border border-neutral-700"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Link Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Direct Connect URL</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-neutral-900/60 rounded-xl p-3 text-xs text-neutral-400 border border-neutral-800 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <strong>Cross-Network Ready:</strong> Works whether stage musicians are on phone data (5G/LTE) and sound desk is on church Wi-Fi.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STAGE MUSICIAN IDENTITY QUICK EDIT MODAL */}
      {showIdentityModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#101015] border border-neutral-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl relative">
            <button
              onClick={() => setShowIdentityModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-cyan-400" /> Your Stage Identity
            </h3>
            <p className="text-xs text-neutral-400 mb-4">
              This helps the sound engineer identify who is calling when 3+ band members are on stage.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Your Name / Nickname
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dave, Sarah, Pastor Mark"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  maxLength={18}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Instrument / Mic Station
                </label>
                <select
                  value={instrument}
                  onChange={(e) => setInstrument(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                >
                  {INSTRUMENT_OPTIONS.map((inst) => (
                    <option key={inst} value={inst}>
                      {inst}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                  Stage Position
                </label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                >
                  {STAGE_LOCATIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => setShowIdentityModal(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-black font-bold text-sm transition"
            >
              Save Identity
            </button>
          </div>
        </div>
      )}

      {/* SETTINGS / ROLE SWITCH MODAL */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#0f0f13] border border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5 text-cyan-400" />
              StageSync Setup
            </h3>

            <div className="space-y-4">
              {/* Role Switch */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                  Current View Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setRole('stage');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition ${
                      role === 'stage'
                        ? 'bg-cyan-950/60 border-cyan-500 text-cyan-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Music className="w-4 h-4" /> Musician Remote
                  </button>
                  <button
                    onClick={() => {
                      triggerHaptic('light');
                      setRole('booth');
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 transition ${
                      role === 'booth'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                    }`}
                  >
                    <Sliders className="w-4 h-4" /> Sound Booth
                  </button>
                </div>
              </div>

              {/* Room Code */}
              <div>
                <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1.5">
                  Change Room Code
                </label>
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white font-mono tracking-wider focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* If Stage Role, Edit Identity */}
              {role === 'stage' && (
                <div className="space-y-3 pt-2 border-t border-neutral-800">
                  <div>
                    <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
                      Your Name / Nickname
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dave"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      maxLength={18}
                      className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                        Instrument
                      </label>
                      <select
                        value={instrument}
                        onChange={(e) => setInstrument(e.target.value)}
                        className="w-full bg-black border border-neutral-800 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                      >
                        {INSTRUMENT_OPTIONS.map((inst) => (
                          <option key={inst} value={inst}>
                            {inst}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider text-neutral-400 mb-1">
                        Location
                      </label>
                      <select
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full bg-black border border-neutral-800 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-cyan-500"
                      >
                        {STAGE_LOCATIONS.map((loc) => (
                          <option key={loc} value={loc}>
                            {loc}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Haptic Test */}
              <div className="pt-2 border-t border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-white">Test Vibration</div>
                  <div className="text-xs text-neutral-400">Silent tactile feedback</div>
                </div>
                <button
                  onClick={() => triggerHaptic('call')}
                  className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold rounded-lg text-white"
                >
                  Pulse Haptics
                </button>
              </div>

              {/* PWA Install */}
              {!isInstalled && (
                <div className="pt-2 border-t border-neutral-800">
                  <div className="text-xs text-neutral-400 mb-2">Install StageSync on Home Screen:</div>
                  <PWAInstallRow
                    isInstallable={isInstallable}
                    isInstalled={isInstalled}
                    isIOS={isIOS}
                    onInstall={promptInstall}
                    onShowIOSGuide={() => setShowIOSInstallGuide(true)}
                  />
                </div>
              )}
              {/* Return to Setup Screen */}
              <div className="pt-2 border-t border-neutral-800">
                <button
                  onClick={() => {
                    triggerHaptic('light');
                    setShowSettingsModal(false);
                    setHasJoinedSession(false);
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold border border-neutral-800 flex items-center justify-center gap-2 transition active:scale-95"
                >
                  <ArrowLeft className="w-4 h-4 text-cyan-400" />
                  <span>Return to Setup / Change Station</span>
                </button>
              </div>
            </div>

            <button
              onClick={() => setShowSettingsModal(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-black font-bold transition"
            >
              Done &amp; Return
            </button>
          </div>
        </div>
      )}

      {/* CUSTOM CUE MODAL */}
      {showCustomCueModal && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#101015] border border-neutral-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-cyan-400" /> Custom Quick Note
              </h3>
              <button
                onClick={() => setShowCustomCueModal(false)}
                className="text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-xs text-neutral-400 mb-3">
              Keep it short (1-3 words) so the sound engineer can read it across the booth.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {['Less Reverb', 'Guitar Pack #2', 'Click Louder', 'More Bass in IEM', 'Mute My Mic', 'Bridge Cue'].map(
                (preset) => (
                  <button
                    key={preset}
                    onClick={() => {
                      sendCue('CUSTOM', preset);
                      setShowCustomCueModal(false);
                    }}
                    className="p-2 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 rounded-lg text-neutral-300 text-left transition active:scale-95"
                  >
                    {preset}
                  </button>
                )
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Cut acoustic guitar"
                value={customCueText}
                onChange={(e) => setCustomCueText(e.target.value)}
                maxLength={30}
                className="flex-1 bg-black border border-neutral-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={() => {
                  if (customCueText.trim()) {
                    sendCue('CUSTOM', customCueText.trim());
                    setCustomCueText('');
                    setShowCustomCueModal(false);
                  }
                }}
                className="px-4 py-2 bg-cyan-400 hover:bg-cyan-300 text-black font-bold rounded-xl text-sm"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IOS INSTALL GUIDE */}
      {showIOSInstallGuide && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4">
          <div className="bg-[#121217] border border-neutral-800 rounded-2xl max-w-sm w-full p-6 text-center">
            <h3 className="text-lg font-bold text-white mb-2">Install on iPhone / iPad</h3>
            <p className="text-sm text-neutral-300 mb-4">
              To keep the screen unlocked and install full-screen PWA:
            </p>
            <ol className="text-left text-xs text-neutral-300 space-y-2 mb-6 bg-neutral-900 p-4 rounded-xl border border-neutral-800 font-mono">
              <li>1. Tap the Safari <strong>Share</strong> button (box with arrow)</li>
              <li>2. Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>3. Tap <strong>Add</strong> at top right</li>
            </ol>
            <button
              onClick={() => setShowIOSInstallGuide(false)}
              className="w-full py-2.5 rounded-xl bg-neutral-800 text-white font-semibold text-sm hover:bg-neutral-700"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// ROLE SELECTION COMPONENT (LAUNCH SCREEN)
// ==========================================

interface RoleSelectionProps {
  roomCode: string;
  setRoomCode: (c: string) => void;
  selectedRole: UserRole;
  setSelectedRole: (role: UserRole) => void;
  instrument: string;
  setInstrument: (i: string) => void;
  location: string;
  setLocation: (l: string) => void;
  userName: string;
  setUserName: (n: string) => void;
  onConnect: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstall: () => void;
  onShowIOSGuide: () => void;
}

function RoleSelectionView({
  roomCode,
  setRoomCode,
  selectedRole,
  setSelectedRole,
  instrument,
  setInstrument,
  location,
  setLocation,
  userName,
  setUserName,
  onConnect,
  isInstallable,
  isInstalled,
  isIOS,
  onInstall,
  onShowIOSGuide,
}: RoleSelectionProps) {

  return (
    <div className="min-h-[100dvh] h-full bg-black text-neutral-100 flex flex-col justify-between p-4 sm:p-6 max-w-md mx-auto overflow-y-auto safe-pb">
      {/* Brand Header */}
      <div className="pt-4 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-500 via-cyan-400 to-amber-500 text-black shadow-2xl shadow-cyan-500/20 mb-3">
          <Radio className="w-9 h-9 stroke-[2.5]" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
          StageSync
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-neutral-400 max-w-xs mx-auto">
          Silent stage-to-sound-booth communication for church worship services &amp; rehearsals.
        </p>
      </div>

      {/* Main Setup Card */}
      <div className="bg-[#0c0c0f] border border-neutral-800/80 rounded-2xl p-5 shadow-2xl space-y-5 my-4">
        {/* Step 1: Room Code */}
        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-cyan-400 mb-1.5 flex items-center justify-between">
            <span>1. Shared Room Code</span>
            <span className="text-[10px] text-neutral-500 font-normal">Same on all devices</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
              placeholder="e.g. SUNDAY"
              maxLength={12}
              className="flex-1 bg-black border border-neutral-700/80 rounded-xl px-4 py-2.5 text-center text-lg font-mono font-black tracking-widest text-white uppercase focus:outline-none focus:border-cyan-400"
            />
            <button
              onClick={() => {
                const words = ['SUNDAY', 'WORSHIP', 'SANCTUARY', 'STAGE1', 'CHAPEL', 'MAIN'];
                const random = words[Math.floor(Math.random() * words.length)];
                setRoomCode(random);
                triggerHaptic('light');
              }}
              className="p-2.5 bg-neutral-900 border border-neutral-700/80 rounded-xl text-neutral-300 hover:text-white hover:bg-neutral-800"
              title="Generate Room"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {['SUNDAY', 'SANCTUARY', 'WORSHIP', 'CHAPEL'].map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  setRoomCode(chip);
                  triggerHaptic('light');
                }}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition ${
                  roomCode === chip
                    ? 'bg-cyan-950/80 border-cyan-500 text-cyan-300'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                }`}
              >
                #{chip}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Role Selection Tabs */}
        <div>
          <label className="block text-xs uppercase font-bold tracking-wider text-cyan-400 mb-1.5">
            2. Choose Your Station
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              onClick={() => {
                setSelectedRole('stage');
                triggerHaptic('medium');
              }}
              className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                selectedRole === 'stage'
                  ? 'bg-cyan-950/50 border-cyan-400 shadow-lg shadow-cyan-950/50'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Music
                  className={`w-6 h-6 ${
                    selectedRole === 'stage' ? 'text-cyan-400' : 'text-neutral-500'
                  }`}
                />
                {selectedRole === 'stage' && (
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                )}
              </div>
              <div
                className={`font-bold text-sm ${
                  selectedRole === 'stage' ? 'text-white' : 'text-neutral-300'
                }`}
              >
                On Stage
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Musician / Vocalist remote
              </div>
            </button>

            <button
              onClick={() => {
                setSelectedRole('booth');
                triggerHaptic('medium');
              }}
              className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                selectedRole === 'booth'
                  ? 'bg-amber-950/50 border-amber-400 shadow-lg shadow-amber-950/50'
                  : 'bg-neutral-900/60 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <Sliders
                  className={`w-6 h-6 ${
                    selectedRole === 'booth' ? 'text-amber-400' : 'text-neutral-500'
                  }`}
                />
                {selectedRole === 'booth' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                )}
              </div>
              <div
                className={`font-bold text-sm ${
                  selectedRole === 'booth' ? 'text-white' : 'text-neutral-300'
                }`}
              >
                Sound Booth
              </div>
              <div className="text-[11px] text-neutral-400 mt-0.5">
                Audio engineer dashboard
              </div>
            </button>
          </div>
        </div>

        {/* Musician Context Form (If on stage) */}
        {selectedRole === 'stage' && (
          <div className="space-y-3 pt-3 border-t border-neutral-800">
            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Your Name / Nickname (Identifies who is calling!)
              </label>
              <input
                type="text"
                placeholder="e.g. Dave, Sarah, Mark"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                maxLength={18}
                className="w-full bg-black border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Quick Instrument Select
              </label>
              <div className="grid grid-cols-3 gap-1.5 mb-2">
                {[
                  { label: 'Keys', full: 'Keys / Piano' },
                  { label: 'Lead Voc', full: 'Lead Vocalist' },
                  { label: 'Acoustic', full: 'Acoustic Guitar' },
                  { label: 'Elec Gtr', full: 'Electric Guitar' },
                  { label: 'Bass', full: 'Bass Guitar' },
                  { label: 'Drums', full: 'Drums / Percussion' },
                ].map((chip) => (
                  <button
                    key={chip.full}
                    type="button"
                    onClick={() => {
                      setInstrument(chip.full);
                      triggerHaptic('light');
                    }}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-medium border text-center transition ${
                      instrument === chip.full
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-300 font-bold'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              <select
                value={instrument}
                onChange={(e) => setInstrument(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {INSTRUMENT_OPTIONS.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-neutral-300 mb-1">
                Stage Position
              </label>
              <select
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-black border border-neutral-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
              >
                {STAGE_LOCATIONS.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Sound Booth Context Card (If at booth) */}
        {selectedRole === 'booth' && (
          <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 text-amber-200 text-xs space-y-1.5 animate-fadeIn">
            <div className="font-bold flex items-center gap-2 text-amber-300 text-sm">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Sound Booth Console Station</span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              You will monitor live calls from all musicians on stage with instant high-visibility strobe beacons, stage caller roster, and 1-tap acknowledgements.
            </p>
          </div>
        )}

        {/* Enter Button */}
        <button
          onClick={onConnect}
          className={`w-full py-4 rounded-xl font-black text-base sm:text-lg uppercase tracking-wider flex items-center justify-center gap-2 shadow-xl transition active:scale-[0.98] ${
            selectedRole === 'stage'
              ? 'bg-cyan-400 hover:bg-cyan-300 text-black shadow-cyan-500/25'
              : 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-500/25'
          }`}
        >
          <span>Connect to Room #{roomCode}</span>
          <ArrowRight className="w-5 h-5 stroke-[3]" />
        </button>
      </div>

      {/* PWA Home Screen Install Banner */}
      <div className="text-center pt-2">
        <PWAInstallRow
          isInstallable={isInstallable}
          isInstalled={isInstalled}
          isIOS={isIOS}
          onInstall={onInstall}
          onShowIOSGuide={onShowIOSGuide}
        />
        <div className="mt-3 text-[11px] text-neutral-500 flex items-center justify-center gap-2">
          <span>OLED Stage Friendly</span>
          <span>•</span>
          <span>Zero Audio Chimes</span>
          <span>•</span>
          <span>Multi-Musician ID</span>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// STAGE VIEW (MUSICIAN REMOTE)
// ==========================================

interface StageRemoteProps {
  roomCode: string;
  clientId: string;
  roomState: RoomState;
  engineerMessage?: { text: string; timestamp: number } | null;
  instrument: string;
  location: string;
  userName: string;
  onSendCue: (code: string, title: string, type?: 'CALL' | 'CUE') => void;
  onOpenCustom: () => void;
  onOpenIdentityEdit: () => void;
}

function StageRemoteView({
  roomCode,
  clientId,
  roomState,
  engineerMessage,
  instrument,
  location,
  userName,
  onSendCue,
  onOpenCustom,
  onOpenIdentityEdit,
}: StageRemoteProps) {
  // Find this specific musician's active pending cue
  const myActiveAlert =
    (roomState.activeAlerts || []).find(
      (a) =>
        (a.clientId === clientId || (a.instrument === instrument && a.location === location)) &&
        a.status === 'pending'
    ) || (roomState.activeAlert?.clientId === clientId ? roomState.activeAlert : null);

  const isPending = !!myActiveAlert;
  const isCallPending = isPending && myActiveAlert?.type === 'CALL';

  // Other musicians on stage with pending alerts
  const otherStageAlerts = (roomState.activeAlerts || []).filter(
    (a) => a.id !== myActiveAlert?.id && a.status === 'pending'
  );

  // Calculate elapsed seconds for pending alert
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  useEffect(() => {
    if (!myActiveAlert || !isPending) {
      setElapsedSec(0);
      return;
    }
    const updateElapsed = () => {
      setElapsedSec(Math.max(0, Math.floor((Date.now() - myActiveAlert.timestamp) / 1000)));
    };
    updateElapsed();
    const timer = setInterval(updateElapsed, 1000);
    return () => clearInterval(timer);
  }, [myActiveAlert, isPending]);

  const badge = getInstrumentBadge(instrument);

  return (
    <div className="flex-1 flex flex-col justify-between py-1 space-y-3">
      {/* IDENTITY BANNER (KNOW YOUR STATION) */}
      <div className="bg-[#0c0c10] border border-neutral-800/80 rounded-xl px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xl shrink-0">{badge.icon}</span>
          <div className="min-w-0">
            <div className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
              <span>{userName || 'Musician'}</span>
              <span className="text-neutral-500">•</span>
              <span className="text-cyan-400 truncate">{instrument}</span>
            </div>
            <div className="text-[10px] text-neutral-400 font-mono truncate">
              📍 {location}
            </div>
          </div>
        </div>
        <button
          onClick={onOpenIdentityEdit}
          className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 px-2 py-1 rounded bg-neutral-900 border border-neutral-800 shrink-0"
        >
          Edit
        </button>
      </div>

      {/* Sound Engineer live reply banner if present */}
      {engineerMessage && (
        <div className="bg-emerald-950/80 border border-emerald-500/60 rounded-xl p-3 flex items-center justify-between text-emerald-200 shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="text-[10px] uppercase font-mono font-bold text-emerald-400">
                Booth Replied:
              </div>
              <div className="text-sm font-semibold text-white">{engineerMessage.text}</div>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Just now</span>
        </div>
      )}

      {/* DOMINANT MASSIVE PRIMARY BUTTON: CALL SOUND GUY */}
      <div className="flex-1 flex flex-col items-center justify-center my-1 sm:my-2">
        <button
          onClick={() => {
            if (!isPending) {
              onSendCue('CALL_SOUND_GUY', 'CALL SOUND GUY: PUT ON HEADSET', 'CALL');
            }
          }}
          disabled={isCallPending}
          className={`relative w-full max-w-md min-h-[145px] sm:min-h-[185px] py-4 sm:py-6 px-4 rounded-3xl flex flex-col items-center justify-center text-center transition-all duration-150 shadow-2xl active:scale-[0.98] select-none touch-manipulation ${
            isCallPending
              ? 'bg-amber-950/90 border-4 border-amber-400 shadow-amber-500/40 animate-pulse'
              : 'bg-gradient-to-b from-neutral-900 via-black to-[#050508] border-2 border-cyan-400/50 hover:border-cyan-400 shadow-cyan-500/20'
          }`}
        >
          {isCallPending ? (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center mb-1.5 shadow-lg">
                <Bell className="w-7 h-7 stroke-[3]" />
              </div>
              <span className="text-xl sm:text-3xl font-black uppercase tracking-tight text-amber-300">
                CALL SENT TO BOOTH
              </span>
              <span className="text-xs sm:text-sm font-mono font-bold text-amber-200/90 mt-0.5">
                WAITING FOR SOUND GUY • {elapsedSec}s AGO
              </span>
              <span className="mt-1.5 text-[10px] uppercase font-mono tracking-widest px-2.5 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-700">
                Put on headset / Look at me
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-cyan-400 text-black flex items-center justify-center mb-2 shadow-lg shadow-cyan-400/50">
                <Bell className="w-7 h-7 sm:w-9 sm:h-9 stroke-[3]" />
              </div>
              <span className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-white drop-shadow-md">
                CALL SOUND GUY
              </span>
              <span className="text-xs sm:text-sm font-semibold tracking-wider text-cyan-300 mt-0.5">
                PUT ON HEADSET • LISTEN UP
              </span>
              <span className="text-[10px] text-neutral-500 mt-1 font-mono">
                Flashing high-priority beacon on sound desk
              </span>
            </div>
          )}
        </button>

        {/* Other musicians calling notification */}
        {otherStageAlerts.length > 0 && (
          <div className="mt-2 text-[10px] text-amber-300 font-mono flex items-center justify-center gap-1.5 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-800/40">
            <span>👥 Also waiting for sound desk:</span>
            <span className="font-bold text-white">
              {otherStageAlerts
                .map((a) => a.musicianName || a.instrument?.split('/')[0]?.trim() || a.senderName)
                .join(', ')}
            </span>
          </div>
        )}
      </div>

      {/* SECONDARY QUICK-CUES GRID */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase font-mono font-bold text-neutral-400 tracking-wider">
            Quick Mix Cues
          </span>
          <button
            onClick={onOpenCustom}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline flex items-center gap-1"
          >
            <span>+ Custom Note</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {QUICK_CUES.map((cue) => {
            const Icon = cue.icon;
            const isThisPending = isPending && myActiveAlert?.code === cue.code;

            return (
              <button
                key={cue.code}
                onClick={() => onSendCue(cue.code, cue.label, 'CUE')}
                disabled={isPending}
                className={`p-3.5 sm:p-4 rounded-2xl border text-left transition-all active:scale-[0.97] flex flex-col justify-between select-none relative overflow-hidden ${
                  isThisPending
                    ? 'bg-amber-950/70 border-amber-400 text-amber-200 shadow-lg shadow-amber-500/30 animate-pulse'
                    : `${cue.bgClass} ${cue.borderClass} ${cue.textClass}`
                } ${isPending && !isThisPending ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className="w-6 h-6 stroke-[2.2]" />
                  {isThisPending && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-400 text-black font-bold uppercase">
                      SENT
                    </span>
                  )}
                </div>
                <div>
                  <div className="font-extrabold text-sm sm:text-base text-white tracking-tight">
                    {cue.label}
                  </div>
                  <div className="text-[10px] sm:text-[11px] text-neutral-400 mt-0.5 leading-snug">
                    {cue.sub}
                  </div>
                </div>
              </button>
            );
          })}

          {/* Custom Cue Button */}
          <button
            onClick={onOpenCustom}
            disabled={isPending}
            className={`p-3.5 sm:p-4 rounded-2xl border border-neutral-800 bg-neutral-900/40 text-neutral-300 hover:border-neutral-700 active:scale-[0.97] flex flex-col justify-between text-left select-none ${
              isPending ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <Send className="w-5 h-5 text-neutral-400" />
            </div>
            <div>
              <div className="font-extrabold text-sm sm:text-base text-white">Custom Cue</div>
              <div className="text-[10px] text-neutral-400 mt-0.5">Type short request</div>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// BOOTH VIEW (SOUND ENGINEER DASHBOARD)
// ==========================================

interface BoothDashboardProps {
  roomCode: string;
  roomState: RoomState;
  maxStrobeMode: boolean;
  onToggleMaxStrobe: () => void;
  onAcknowledge: (alertId?: string, note?: string) => void;
  onSendReply: (text: string) => void;
  onClearHistory: () => void;
  isTestFlashActive: boolean;
  onTriggerTestFlash: () => void;
}

function BoothDashboardView({
  roomCode,
  roomState,
  maxStrobeMode,
  onToggleMaxStrobe,
  onAcknowledge,
  onSendReply,
  onClearHistory,
  isTestFlashActive,
  onTriggerTestFlash,
}: BoothDashboardProps) {
  // Collect all pending alerts from all musicians
  const pendingAlerts = (roomState.activeAlerts || []).filter((a) => a.status === 'pending');
  const activeAlerts =
    pendingAlerts.length > 0
      ? pendingAlerts
      : roomState.activeAlert && roomState.activeAlert.status === 'pending'
      ? [roomState.activeAlert]
      : [];

  const isIncomingAlert = activeAlerts.length > 0 || isTestFlashActive;
  const hasUrgentCall = activeAlerts.some((a) => a.type === 'CALL') || isTestFlashActive;

  // Filter connected stage musicians
  const stageMusicians = roomState.connectedClients.filter((c) => c.role === 'stage');

  // Elapsed time ticker
  const [, setTicker] = useState(0);
  useEffect(() => {
    if (!isIncomingAlert) return;
    const interval = setInterval(() => setTicker((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [isIncomingAlert]);

  return (
    <div className="flex-1 flex flex-col justify-between space-y-3 py-1 relative">
      {/* 
        ========================================================================
        HIGH-VISIBILITY FULL-SCREEN VISUAL BEACON STROBE (IMPOSSIBLE TO IGNORE)
        ========================================================================
      */}
      {isIncomingAlert && (
        <>
          {/* Peripheral Edge Strobe Border (16px to 24px) */}
          <div
            className={`fixed inset-0 pointer-events-none z-30 border-[14px] sm:border-[24px] ${
              hasUrgentCall ? 'animate-call-border' : 'animate-cue-border'
            }`}
          />
          {/* Full-Screen Luminance Beacon (Flashing screen background) */}
          {maxStrobeMode && (
            <div className="fixed inset-0 pointer-events-none z-20 animate-urgent-beacon" />
          )}
        </>
      )}

      {/* TOP CONTROLS & STAGE ROSTER */}
      <div className="bg-[#0b0b0e] border border-neutral-800/80 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="text-xs font-mono text-neutral-300 font-bold uppercase tracking-wide">
            Live Stage Roster:
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {stageMusicians.length === 0 ? (
              <span className="text-[11px] text-neutral-500 italic">Waiting for musicians to enter #{roomCode}</span>
            ) : (
              stageMusicians.map((m) => {
                const b = getInstrumentBadge(m.instrument || m.name);
                return (
                  <span
                    key={m.id}
                    className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-200"
                  >
                    <span>{b.icon}</span>
                    <strong className="text-white">{m.name.split('•')[0]?.trim()}</strong>
                  </span>
                );
              })
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button
            onClick={onToggleMaxStrobe}
            className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition ${
              maxStrobeMode
                ? 'bg-amber-400 text-black'
                : 'bg-neutral-900 border border-neutral-800 text-neutral-400'
            }`}
            title="Toggle Full-Screen Flashing Strobe"
          >
            {maxStrobeMode ? '⚡ MAX STROBE ON' : '⚡ Max Strobe Off'}
          </button>
          <button
            onClick={onTriggerTestFlash}
            className="px-2 py-1 rounded-lg text-[10px] font-mono font-bold bg-neutral-800 hover:bg-neutral-700 text-cyan-300 border border-neutral-700 transition"
            title="Test what visual strobe looks like in booth"
          >
            Test Strobe
          </button>
        </div>
      </div>

      {/* ACTIVE STAGE CALL QUEUE OR IDLE MONITORING */}
      {isIncomingAlert ? (
        <div className="space-y-3">
          {/* MASSIVE EMERGENCY BANNER */}
          <div
            className={`p-3.5 sm:p-4 rounded-2xl flex items-center justify-between font-black uppercase text-xs sm:text-sm shadow-2xl transition-all ${
              hasUrgentCall
                ? 'bg-gradient-to-r from-red-600 via-amber-500 to-amber-600 text-black shadow-amber-500/60'
                : 'bg-gradient-to-r from-cyan-500 via-teal-400 to-cyan-500 text-black shadow-cyan-500/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6 stroke-[3] animate-bounce shrink-0" />
              <span className="tracking-wider font-extrabold text-sm sm:text-lg">
                {hasUrgentCall
                  ? `🚨 URGENT CALL: PUT ON HEADSET! (${activeAlerts.length} CALLER${activeAlerts.length > 1 ? 'S' : ''})`
                  : `🔊 STAGE MIX ADJUSTMENT (${activeAlerts.length} CALLER${activeAlerts.length > 1 ? 'S' : ''})`}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono bg-black text-white px-3 py-1 rounded-full text-xs font-bold border border-white/20">
                {activeAlerts.length} WAITING
              </span>
            </div>
          </div>

          {/* MASTER ACKNOWLEDGE ALL BUTTON (IF MULTIPLE CALLERS) */}
          {activeAlerts.length > 1 && (
            <button
              onClick={() => onAcknowledge('ALL')}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-emerald-500 via-emerald-400 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-black font-black text-xl sm:text-2xl uppercase tracking-wider shadow-2xl shadow-emerald-500/50 flex items-center justify-center gap-2.5 active:scale-[0.98] transition"
            >
              <CheckCircle2 className="w-7 h-7 stroke-[3]" />
              <span>ACKNOWLEDGE ALL ({activeAlerts.length} MUSICIANS)</span>
            </button>
          )}

          {/* LIST OF CALLING MUSICIANS (EXACTLY WHO IS CALLING) */}
          <div className="space-y-3">
            {activeAlerts.map((alert) => {
              const badge = getInstrumentBadge(alert.instrument || alert.senderName);
              const isThisCall = alert.type === 'CALL';
              const elapsed = Math.max(0, Math.floor((Date.now() - alert.timestamp) / 1000));
              const displayName = alert.musicianName || alert.senderName.split('•')[0]?.trim() || badge.label;

              return (
                <div
                  key={alert.id}
                  className={`rounded-3xl p-4 sm:p-6 border-2 shadow-2xl relative overflow-hidden transition-all ${
                    isThisCall
                      ? 'bg-[#180b03] border-amber-400 shadow-amber-500/40'
                      : 'bg-[#04121a] border-cyan-400 shadow-cyan-500/30'
                  }`}
                >
                  {/* WHO IS CALLING BANNER */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="text-3xl sm:text-4xl p-2.5 rounded-2xl bg-black border border-neutral-700 shadow-inner">
                        {badge.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-2xl sm:text-3xl text-white tracking-tight uppercase">
                            {displayName}
                          </span>
                          <span className={`text-xs font-mono px-2 py-0.5 rounded-full font-bold uppercase ${badge.bgClass}`}>
                            {alert.instrument || badge.label}
                          </span>
                        </div>
                        {alert.location && (
                          <div className="text-xs text-neutral-400 font-mono mt-0.5">
                            📍 {alert.location}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-xs sm:text-sm font-bold text-white bg-black/80 px-3 py-1.5 rounded-full border border-neutral-700 shrink-0">
                      {elapsed}s AGO
                    </span>
                  </div>

                  {/* CUE TITLE */}
                  <div className="my-2 bg-black/40 p-3 rounded-2xl border border-neutral-800">
                    <div className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest mb-0.5">
                      Requested Action:
                    </div>
                    <h3
                      className={`text-2xl sm:text-4xl font-black uppercase tracking-tight leading-tight ${
                        isThisCall ? 'text-amber-300 drop-shadow-md' : 'text-white'
                      }`}
                    >
                      {alert.title}
                    </h3>
                  </div>

                  {/* ACTION BUTTON FOR THIS SPECIFIC MUSICIAN */}
                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      onClick={() => onAcknowledge(alert.id)}
                      className={`w-full py-4 sm:py-5 rounded-2xl font-black text-xl sm:text-2xl uppercase tracking-wider flex items-center justify-center gap-3 active:scale-[0.98] transition shadow-xl ${
                        isThisCall
                          ? 'bg-amber-400 hover:bg-amber-300 text-black shadow-amber-500/40'
                          : 'bg-emerald-400 hover:bg-emerald-300 text-black shadow-emerald-500/40'
                      }`}
                    >
                      <CheckCircle2 className="w-7 h-7 stroke-[3]" />
                      <span>ACKNOWLEDGE {displayName.toUpperCase()} 👍</span>
                    </button>

                    {/* Quick Reassurance Replies */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {[
                        `Turning ${displayName} up 🎚️`,
                        `Got you ${displayName}! 👍`,
                        'Checking mic 🎤',
                        'Turning down 🔉',
                        'Wait 10 sec ⏱️',
                      ].map((msg) => (
                        <button
                          key={msg}
                          onClick={() => onAcknowledge(alert.id, msg)}
                          className="px-2.5 py-1.5 rounded-lg bg-black/70 border border-neutral-700 text-xs font-semibold text-neutral-200 hover:bg-neutral-800 hover:text-white transition"
                        >
                          {msg}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* IDLE MONITORING STATUS */
        <div className="bg-[#09090c] border border-neutral-800 rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center justify-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-cyan-400 mb-3 shadow-inner">
            <Monitor className="w-8 h-8" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            STAGE QUIET • MONITORING
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-sm">
            Listening for stage musicians in Room{' '}
            <strong className="text-cyan-400 font-mono">#{roomCode}</strong>.
            Screen will strobe red/amber/cyan instantly with musician details when called.
          </p>

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {[
              'All good 👍',
              'Mic checked 🎤',
              'Heads up for bridge',
              'Standby 🎧',
            ].map((quickText) => (
              <button
                key={quickText}
                onClick={() => onSendReply(quickText)}
                className="px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs text-neutral-300 font-medium transition active:scale-95"
              >
                Send "{quickText}" to stage
              </button>
            ))}
          </div>
        </div>
      )}

      {/* SESSION AUDIT LOG / CUE HISTORY */}
      <div className="bg-[#09090c] border border-neutral-800 rounded-2xl p-4 flex-1 flex flex-col min-h-[180px] max-h-[300px]">
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-800/80">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-mono font-bold text-neutral-400 tracking-wider">
              Session Audit Log
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-800 text-neutral-400">
              {roomState.history.length} cues
            </span>
          </div>
          {roomState.history.length > 0 && (
            <button
              onClick={onClearHistory}
              className="text-[11px] text-neutral-500 hover:text-neutral-300 flex items-center gap-1 font-mono"
            >
              <RotateCcw className="w-3 h-3" /> Clear log
            </button>
          )}
        </div>

        {/* Scrollable Log Items */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {roomState.history.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-neutral-600 py-6">
              <span className="text-xs font-mono">No cues sent yet this session.</span>
            </div>
          ) : (
            roomState.history.map((item) => {
              const timeStr = new Date(item.timestamp).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              });
              const badge = getInstrumentBadge(item.instrument || item.senderName);

              return (
                <div
                  key={item.id}
                  className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                    item.status === 'pending'
                      ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                      : 'bg-neutral-950 border-neutral-800/80 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{badge.icon}</span>
                    <div>
                      <div className="font-bold text-white flex items-center gap-1.5">
                        <span>{item.title}</span>
                        {item.type === 'CALL' && (
                          <span className="text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-mono">
                            Urgent Call
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-neutral-400">
                        <strong className="text-neutral-300">
                          {item.musicianName || item.instrument || item.senderName}
                        </strong>
                        {item.location && <span> ({item.location})</span>}
                        {item.notes && (
                          <span className="text-emerald-400 ml-1.5 italic">
                            • Reply: "{item.notes}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="text-right font-mono text-[10px] text-neutral-500 shrink-0">
                    <div>{timeStr}</div>
                    <div
                      className={
                        item.status === 'pending'
                          ? 'text-amber-400 font-semibold'
                          : 'text-emerald-400'
                      }
                    >
                      {item.status === 'pending' ? 'PENDING' : 'ACK’D'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// PWA INSTALL BUTTON HELPER COMPONENT
// ==========================================

interface PWAInstallRowProps {
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onInstall: () => void;
  onShowIOSGuide: () => void;
}

function PWAInstallRow({
  isInstallable,
  isInstalled,
  isIOS,
  onInstall,
  onShowIOSGuide,
}: PWAInstallRowProps) {
  if (isInstalled) {
    return (
      <div className="inline-flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        <span>PWA Installed (Standalone Mode)</span>
      </div>
    );
  }

  if (isInstallable) {
    return (
      <button
        onClick={onInstall}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold bg-neutral-800 hover:bg-neutral-700 text-white text-xs border border-neutral-700 transition active:scale-95"
      >
        <Download className="w-4 h-4 text-cyan-400" />
        <span>Install StageSync as PWA</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <button
        onClick={onShowIOSGuide}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold bg-neutral-800 hover:bg-neutral-700 text-white text-xs border border-neutral-700 transition active:scale-95"
      >
        <Download className="w-4 h-4 text-amber-400" />
        <span>Add to Home Screen (iOS Safari)</span>
      </button>
    );
  }

  return null;
}
