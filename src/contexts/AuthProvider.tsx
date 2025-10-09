import { useEffect, useRef, useState, type ReactNode } from "react";
import type { User, AuthContextType } from "../types/auth";
import { AuthContext } from "./AuthContext";
import { decodeJwt } from "../utils/decodeJwt";
import { API } from "../config/api";

/**
 * AuthProvider
 * - Leader election multi-tab (localStorage + BroadcastChannel)
 * - Refresh with exponential backoff and retry, leader-only
 * - Persist tokens to sessionStorage or localStorage depending on rememberMe
 * - BroadcastChannel + storage event sync
 * - beforeunload / visibilitychange cleanup & attempt to assume leadership
 *
 * Adapte constantes API_* para os seus proxies.
 */

const STORAGE_USER_KEY = "@AvanteNutri:user";
const STORAGE_ACCESS_KEY = "@AvanteNutri:access_token";
const STORAGE_REFRESH_KEY = "@AvanteNutri:refresh_token";
const STORAGE_EXPIRES_KEY = "@AvanteNutri:expires_at";

const SESSION_EXPIRY = 4 * 60 * 60 * 1000; // 4h meta expiry

// Leader election keys / timing
const LEADER_KEY = "@AvanteNutri:leader";
const LEADER_TTL_MS = 5000;
const LEADER_HEARTBEAT_MS = 2000;
// Cross-tab refresh lock to evitar corrida de rotação simultânea
const REFRESH_LOCK_KEY = "@AvanteNutri:refresh_lock";
const REFRESH_LOCK_TTL_MS = 15000; // 15s máximo para uma tentativa de refresh

function nowMs() {
  return Date.now();
}

function normalizeRole(role: unknown): "patient" | "admin" {
  if (typeof role === "string" && role.toLowerCase() === "admin")
    return "admin";
  return "patient"; // qualquer outro valor cai em 'patient'
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const raw =
        localStorage.getItem(STORAGE_USER_KEY) ||
        sessionStorage.getItem(STORAGE_USER_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as {
        user: User;
        expiresAt: number;
        rememberMe?: boolean;
      };
      if (!parsed) return null;
      if (
        parsed.expiresAt &&
        parsed.expiresAt < nowMs() &&
        !parsed.rememberMe
      ) {
        localStorage.removeItem(STORAGE_USER_KEY);
        sessionStorage.removeItem(STORAGE_USER_KEY);
        return null;
      }
      return parsed.user;
    } catch {
      return null;
    }
  });

  // refs + timers
  const refreshTimeoutRef = useRef<number | null>(null);
  const leaderIntervalRef = useRef<number | null>(null);
  const leaderHeartbeatRef = useRef<number | null>(null);
  const tabIdRef = useRef<string>(Math.random().toString(36).slice(2));
  const isLeaderRef = useRef<boolean>(false);
  const bcRef = useRef<BroadcastChannel | null>(null);
  // Verificação periódica de sessão
  const [sessionLastVerified, setSessionLastVerified] = useState<number | null>(
    null
  );
  const [sessionVerified, setSessionVerified] = useState<boolean | null>(null);
  const verifyIntervalRef = useRef<number | null>(null);
  // Controle de estado para evitar chamadas múltiplas
  const verificationInProgressRef = useRef<boolean>(false);
  const refreshInProgressRef = useRef<Promise<boolean> | null>(null);

  const saveUserToStorage = (userData: User, rememberMe: boolean) => {
    const payload = {
      user: userData,
      expiresAt: nowMs() + SESSION_EXPIRY,
      rememberMe,
    };
    try {
      // Sempre salva em localStorage para compartilhamento entre abas
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(payload));
      if (!rememberMe) {
        // Espelha também em sessionStorage (opcional / para limpeza automática se todas abas fecharem)
        sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(payload));
      } else {
        // Se rememberMe true, remove possível cópia antiga de sessão curta
        sessionStorage.removeItem(STORAGE_USER_KEY);
      }
    } catch (err) {
      console.warn("[AuthProvider] saveUserToStorage failed", err);
    }
  };

  const clearAllStorage = async () => {
    try {
      localStorage.removeItem(STORAGE_USER_KEY);
      localStorage.removeItem(STORAGE_ACCESS_KEY);
      localStorage.removeItem(STORAGE_REFRESH_KEY);
      localStorage.removeItem(STORAGE_EXPIRES_KEY);
    } catch (err) {
      console.warn("[AuthProvider] Failed to clear localStorage", err);
    }
    try {
      sessionStorage.removeItem(STORAGE_USER_KEY);
      sessionStorage.removeItem(STORAGE_ACCESS_KEY);
      sessionStorage.removeItem(STORAGE_REFRESH_KEY);
      sessionStorage.removeItem(STORAGE_EXPIRES_KEY);
    } catch (err) {
      console.warn("[AuthProvider] Failed to clear sessionStorage", err);
    }
  };

  const persistTokens = (
    accessToken: string,
    refreshToken: string | null,
    expiresAtIso?: string,
    rememberMe = false
  ) => {
    try {
      // Fonte de verdade sempre localStorage
      localStorage.setItem(STORAGE_ACCESS_KEY, accessToken);
      if (refreshToken) localStorage.setItem(STORAGE_REFRESH_KEY, refreshToken);
      if (expiresAtIso) localStorage.setItem(STORAGE_EXPIRES_KEY, expiresAtIso);

      if (!rememberMe) {
        // Espelha para sessionStorage para ciclo de vida curto
        sessionStorage.setItem(STORAGE_ACCESS_KEY, accessToken);
        if (refreshToken)
          sessionStorage.setItem(STORAGE_REFRESH_KEY, refreshToken);
        if (expiresAtIso)
          sessionStorage.setItem(STORAGE_EXPIRES_KEY, expiresAtIso);
      } else {
        // Garante remoção de cópias antigas de sessão curta
        sessionStorage.removeItem(STORAGE_ACCESS_KEY);
        sessionStorage.removeItem(STORAGE_REFRESH_KEY);
        sessionStorage.removeItem(STORAGE_EXPIRES_KEY);
      }

      // notify other tabs
      try {
        if (bcRef.current) {
          bcRef.current.postMessage({ type: "tokens_updated", ts: Date.now() });
        }
      } catch (err) {
        console.warn("[AuthProvider] bc.postMessage failed", err);
      }
      try {
        localStorage.setItem(
          "@AvanteNutri:tokens_updated",
          JSON.stringify({ t: Date.now() })
        );
      } catch (err) {
        console.warn(
          "[AuthProvider] persistTokens: localStorage sync fallback failed",
          err
        );
      }
    } catch (err) {
      console.warn("[AuthProvider] persistTokens failed", err);
    }
  };

  // cancel scheduled refresh
  const cancelScheduledRefresh = () => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
  };

  function getExpiryMsFrom(
    accessToken: string | null,
    expiresAtIso?: string | null
  ) {
    if (accessToken) {
      const payload = decodeJwt(accessToken);
      if (payload && payload.exp) return Number(payload.exp) * 1000;
    }
    if (expiresAtIso) {
      const parsed = Date.parse(expiresAtIso);
      if (!isNaN(parsed)) return parsed;
    }
    return null;
  }

  // contextual logout used by provider & refresh failure
  const contextLogout = async () => {
    try {
      const refresh =
        localStorage.getItem(STORAGE_REFRESH_KEY) ||
        sessionStorage.getItem(STORAGE_REFRESH_KEY);
      if (refresh) {
        // try navigator.sendBeacon first (best-effort)
        try {
          if (navigator.sendBeacon) {
            const blob = new Blob(
              [JSON.stringify({ refresh_token: refresh })],
              {
                type: "application/json",
              }
            );
            navigator.sendBeacon(API.LOGOUT, blob);
          } else {
            // fire-and-forget fetch
            void fetch(API.LOGOUT, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh_token: refresh }),
            }).catch(() => {});
          }
        } catch (err) {
          console.warn("[AuthProvider] notify logout failed", err);
        }
      }
    } catch (err) {
      console.warn("[AuthProvider] best-effort notify backend failed ", err);
    }

    stopLeaderElection();
    cancelScheduledRefresh();
    await clearAllStorage();
    setUser(null);
    try {
      window.dispatchEvent(new CustomEvent("auth:logout"));
      if (bcRef.current) bcRef.current.postMessage({ type: "logout" });
    } catch (err) {
      console.warn("[AuthProvider] logout event broadcast failed", err);
    }
  };

  // doRefresh with retry/backoff (leader only calls)
  const doRefreshWithRetry = async (
    refreshToken: string,
    rememberMe = false
  ) => {
    // Aquisição de lock global para evitar duas abas batendo /auth/refresh ao mesmo tempo
    if (!(await acquireRefreshLock())) {
      // Outra aba está fazendo refresh. Aguardar e reidratar.
      const ok = await waitForOtherTabRefresh();
      return ok;
    }
    const maxAttempts = 4; // 1 + 3 retries
    let attempt = 0;
    let delayMs = 0;

    while (attempt < maxAttempts) {
      if (!isLeaderRef.current) return false; // lost leadership
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
      try {
        const res = await fetch(API.REFRESH, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (res.status === 200) {
          const body = await res.json();
          const newAccess = body?.access_token;
          const newRefresh = body?.refresh_token ?? null;
          let expiresAt = body?.expires_at ?? null;
          if (!expiresAt && newAccess) {
            const p = decodeJwt(newAccess);
            if (p && p.exp)
              expiresAt = new Date(Number(p.exp) * 1000).toISOString();
          }

          if (newAccess)
            persistTokens(
              newAccess,
              newRefresh,
              expiresAt ?? undefined,
              rememberMe
            );

          if (newAccess) {
            const p = decodeJwt(newAccess);
            if (p) {
              const derived: User = {
                id: (p.sub ?? p.user_id ?? p.id) as string,
                email: (p.email ?? "") as string,
                role: normalizeRole(p.role),
                full_name: (p.full_name ?? p.name ?? "") as string,
                display_name: (p.display_name ?? p.full_name ?? p.name ?? "") as string,
                phone: (p.phone ?? p.phone_number ?? p.tel ?? "") as string,
              };
              setUser(derived);
              saveUserToStorage(derived, rememberMe);
            }
          }

          if (newAccess)
            scheduleRefreshLeader(newAccess, newRefresh, expiresAt, rememberMe);

          return true;
        }

        if (res.status === 401 || res.status === 403) {
          await contextLogout();
          return false;
        }

        // transient error -> retry
        console.warn("[AuthProvider] refresh returned status", res.status);
      } catch (err) {
        console.warn("[AuthProvider] refresh attempt failed", err);
      }

      attempt++;
      delayMs = attempt === 1 ? 1000 : attempt === 2 ? 2000 : 4000;
    }

    // exhausted attempts -> logout
    await contextLogout();
    releaseRefreshLock();
    return false;
  };

  // scheduleRefresh but only for leader
  const scheduleRefreshLeader = (
    accessToken: string,
    refreshToken: string | null,
    expiresAtIso?: string | null,
    rememberMe = false
  ) => {
    cancelScheduledRefresh();
    if (!refreshToken) return;
    const expMs = getExpiryMsFrom(accessToken, expiresAtIso);
    if (!expMs) return;
    const msLeft = expMs - Date.now();
    const buffer = 60 * 1000; // refresh 60s before expiry
    const when = Math.max(0, msLeft - buffer);
    const timeout = when <= 0 ? 200 : when;

    // Agora tokens sempre em localStorage (espelho opcional em sessionStorage)
    const storageForCallback = localStorage;

    refreshTimeoutRef.current = window.setTimeout(() => {
      try {
        const storedRefresh = storageForCallback.getItem(STORAGE_REFRESH_KEY);
        if (!isLeaderRef.current || !storedRefresh) return;
        void doRefreshWithRetry(storedRefresh, rememberMe).catch((err) => {
          console.warn("[AuthProvider] scheduled doRefresh failed:", err);
        });
      } catch (err) {
        console.warn("[AuthProvider] scheduled refresh callback failed:", err);
      }
    }, timeout) as unknown as number;
  };

  // leader election
  const tryToBecomeLeader = () => {
    try {
      const currentRaw = localStorage.getItem(LEADER_KEY);
      const now = Date.now();
      if (!currentRaw) {
        const payload = { id: tabIdRef.current, ts: now };
        localStorage.setItem(LEADER_KEY, JSON.stringify(payload));
        const confirm = JSON.parse(localStorage.getItem(LEADER_KEY) || "{}");
        if (confirm?.id === tabIdRef.current) {
          becomeLeader();
        }
        return;
      }
      const parsed = JSON.parse(currentRaw) as {
        id?: string;
        ts?: number;
      } | null;
      if (!parsed || !parsed.ts || parsed.ts + LEADER_TTL_MS < now) {
        const payload = { id: tabIdRef.current, ts: now };
        localStorage.setItem(LEADER_KEY, JSON.stringify(payload));
        const confirm = JSON.parse(localStorage.getItem(LEADER_KEY) || "{}");
        if (confirm?.id === tabIdRef.current) becomeLeader();
      } else {
        if (parsed.id === tabIdRef.current) {
          becomeLeader();
        } else {
          if (isLeaderRef.current) resignLeadership();
        }
      }
    } catch (err) {
      console.warn("[AuthProvider] leader election error", err);
    }
  };

  const becomeLeader = () => {
    if (isLeaderRef.current) return;
    isLeaderRef.current = true;
    // heartbeat
    leaderHeartbeatRef.current = window.setInterval(() => {
      try {
        const payload = { id: tabIdRef.current, ts: Date.now() };
        localStorage.setItem(LEADER_KEY, JSON.stringify(payload));
      } catch (err) {
        console.warn("[AuthProvider] heartbeat failed", err);
      }
    }, LEADER_HEARTBEAT_MS) as unknown as number;

    // schedule refresh if tokens available
    try {
      const access = localStorage.getItem(STORAGE_ACCESS_KEY);
      const refresh = localStorage.getItem(STORAGE_REFRESH_KEY);
      const expiresAt = localStorage.getItem(STORAGE_EXPIRES_KEY);
      if (access && refresh) {
        // Detecta rememberMe pela ausência de espelho em sessionStorage
        const rememberFlag = !sessionStorage.getItem(STORAGE_ACCESS_KEY);
        scheduleRefreshLeader(access, refresh, expiresAt, rememberFlag);
      }
    } catch (err) {
      console.warn("[AuthProvider] becomeLeader schedule error", err);
    }
  };

  const resignLeadership = () => {
    if (!isLeaderRef.current) return;
    isLeaderRef.current = false;
    if (leaderHeartbeatRef.current) {
      clearInterval(leaderHeartbeatRef.current);
      leaderHeartbeatRef.current = null;
    }
    cancelScheduledRefresh();
  };

  const startLeaderElection = () => {
    tryToBecomeLeader();
    if (!leaderIntervalRef.current) {
      leaderIntervalRef.current = window.setInterval(() => {
        tryToBecomeLeader();
      }, LEADER_HEARTBEAT_MS) as unknown as number;
    }
  };

  const stopLeaderElection = () => {
    if (leaderIntervalRef.current) {
      clearInterval(leaderIntervalRef.current);
      leaderIntervalRef.current = null;
    }
    resignLeadership();
    try {
      const cur = localStorage.getItem(LEADER_KEY);
      if (cur) {
        const parsed = JSON.parse(cur) as { id?: string };
        if (parsed?.id === tabIdRef.current) {
          localStorage.removeItem(LEADER_KEY);
        }
      }
    } catch (err) {
      console.warn("[AuthProvider] remove LEADER_KEY failed", err);
    }
  };

  // rehydrate tokens + user on startup or when other tabs update tokens
  const rehydrateFromStorage = () => {
    try {
      // Sempre tenta a fonte de verdade localStorage
      const access = localStorage.getItem(STORAGE_ACCESS_KEY);
      const refresh = localStorage.getItem(STORAGE_REFRESH_KEY) ?? null;
      const expiresAtIso = localStorage.getItem(STORAGE_EXPIRES_KEY) ?? null;

      if (!access) {
        const rawUser =
          sessionStorage.getItem(STORAGE_USER_KEY) ||
          localStorage.getItem(STORAGE_USER_KEY);
        if (!rawUser) return;
        const parsed = JSON.parse(rawUser) as {
          user: User;
          expiresAt: number;
          rememberMe?: boolean;
        };
        if (parsed && parsed.expiresAt && parsed.expiresAt > nowMs()) {
          setUser(parsed.user);
        } else {
          clearAllStorage();
          setUser(null);
        }
        return;
      }

      const payload = decodeJwt(access);
      if (payload) {
        const derived: User = {
          id: (payload.sub ?? payload.user_id ?? payload.id) as string,
          email: (payload.email ?? "") as string,
          role: normalizeRole(payload.role),
          full_name: (payload.full_name ?? payload.name ?? "") as string,
          display_name: (payload.display_name ?? payload.full_name ?? payload.name ?? "") as string,
          phone: (payload.phone ?? payload.phone_number ?? payload.tel ?? "") as string,
        };
        setUser(derived);
        // detecta rememberMe pela existência no sessionStorage (espelho) – se não existir assume rememberMe=true
        const sessionAccess = sessionStorage.getItem(STORAGE_ACCESS_KEY);
        const rememberFlag = !sessionAccess; // se não há espelho, é uma sessão persistente (rememberMe)

        if (isLeaderRef.current && refresh) {
          scheduleRefreshLeader(access, refresh, expiresAtIso, rememberFlag);
        }

        // Chamada de sincronização não bloqueante: tenta obter /me e só então persiste o usuário
        try {
          void (async () => {
            try {
              const r = await fetch(API.ME, {
                method: "GET",
                headers: { Authorization: `Bearer ${access}` },
              });

              if (!r.ok) {
                if (r.status === 401) {
                  const payload = await (async () => {
                    try {
                      return await r.json();
                    } catch {
                      return null;
                    }
                  })();
                  if (payload && payload.error === "Token outdated") {
                    const hadRefresh = !!(
                      localStorage.getItem(STORAGE_REFRESH_KEY) ||
                      sessionStorage.getItem(STORAGE_REFRESH_KEY)
                    );
                    if (hadRefresh) {
                      const refreshed = await contextValue.refreshSession?.();
                      if (!refreshed) await contextLogout();
                    } else {
                      await contextLogout();
                    }
                  }
                }
                // Persist derived user as fallback quando /me falhar
                try {
                  saveUserToStorage(derived, rememberFlag);
                } catch (syncErr) { console.warn('[AuthProvider] /me sync parse failed', syncErr); }
                return;
              }

              const me = await (async () => {
                try {
                  return await r.json();
                } catch {
                  return null;
                }
              })();

              if (me && typeof me === "object") {
                const updated: User = {
                  id: (me.id || me.user_id || derived.id) as string,
                  email: (me.email || derived.email) as string,
                  role: normalizeRole(me.role || derived.role),
                  full_name: (me.full_name || me.name || derived.full_name) as string,
                  // Prefer the token-derived/user display_name if /me doesn't provide one
                  display_name: (me.display_name ?? derived.display_name ?? me.full_name ?? me.name ?? "") as string,
                  phone: (me.phone ?? me.phone_number ?? me.tel ?? derived.phone ?? "") as string,
                };
                setUser(updated);
                saveUserToStorage(updated, rememberFlag);
                return;
              }

              // se /me não retornou objeto válido, persiste derived como fallback
              saveUserToStorage(derived, rememberFlag);
            } catch (networkErr) {
              // Em caso de erro de rede, persiste derived como fallback
              console.warn('[AuthProvider] /me sync failed', networkErr);
              try {
                saveUserToStorage(derived, rememberFlag);
              } catch (saveErr) {
                console.warn('[AuthProvider] failed to save derived user', saveErr);
              }
            }
          })();
        } catch (outerErr) {
          console.warn("[AuthProvider] sync failed", outerErr);
          try {
            saveUserToStorage(derived, rememberFlag);
          } catch (saveErr) {
            console.warn('[AuthProvider] failed to save derived user', saveErr);
          }
        }
        return;
      }

      // fallback to persisted user object
      const rawUser =
        localStorage.getItem(STORAGE_USER_KEY) ||
        sessionStorage.getItem(STORAGE_USER_KEY);
      if (rawUser) {
        const parsed = JSON.parse(rawUser) as {
          user: User;
          expiresAt: number;
          rememberMe?: boolean;
        };
        if (parsed && parsed.expiresAt && parsed.expiresAt > nowMs()) {
          setUser(parsed.user);
        } else {
          clearAllStorage();
          setUser(null);
        }
      }
    } catch (err) {
      console.warn("[AuthProvider] rehydrate failed", err);
    }
  };

  useEffect(() => {
    // init BroadcastChannel
    try {
      if (typeof BroadcastChannel !== "undefined") {
        const bc = new BroadcastChannel("avante-auth");
        bc.onmessage = (ev) => {
          if (!ev.data) return;
          if (ev.data.type === "tokens_updated" || ev.data.type === "login") {
            rehydrateFromStorage();
          }
          if (ev.data.type === "logout") {
            // remote logout
            clearAllStorage();
            setUser(null);
          }
        };
        bcRef.current = bc;
      }
    } catch (err) {
      console.warn("[AuthProvider] BroadcastChannel init failed", err);
      bcRef.current = null;
    }

    // on mount: start election and rehydrate
    rehydrateFromStorage();
    startLeaderElection();

    // storage events from other tabs
    const onStorage = (e: StorageEvent) => {
      if (!e.key) return;
      if (e.key === "@AvanteNutri:tokens_updated") {
        rehydrateFromStorage();
      }
      if (e.key === LEADER_KEY) {
        tryToBecomeLeader();
      }
      if (e.key === STORAGE_ACCESS_KEY || e.key === STORAGE_REFRESH_KEY) {
        rehydrateFromStorage();
      }
      if (e.key === STORAGE_USER_KEY && e.newValue === null) {
        setUser(null);
      }
    };
    window.addEventListener("storage", onStorage);

    // visibilitychange -> try to become leader when tab becomes visible
    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        tryToBecomeLeader();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    // beforeunload -> if leader remove LEADER_KEY and try to notify backend (sendBeacon best-effort)
    const onBeforeUnload = () => {
      try {
        const cur = JSON.parse(localStorage.getItem(LEADER_KEY) || "{}");
        if (cur?.id === tabIdRef.current) {
          localStorage.removeItem(LEADER_KEY);
        }
      } catch (err) {
        console.warn(
          "[AuthProvider] Failed to release leader key on unload",
          err
        );
      }
      try {
        const refresh =
          localStorage.getItem(STORAGE_REFRESH_KEY) ||
          sessionStorage.getItem(STORAGE_REFRESH_KEY);
        if (refresh && navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify({ refresh_token: refresh })], {
            type: "application/json",
          });
          navigator.sendBeacon(API.LOGOUT, blob);
        }
      } catch (err) {
        console.warn(
          "[AuthProvider] Failed to send logout beacon on unload",
          err
        );
      }
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("storage", onStorage);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("beforeunload", onBeforeUnload);
      stopLeaderElection();
      cancelScheduledRefresh();
      if (verifyIntervalRef.current) {
        clearInterval(verifyIntervalRef.current);
        verifyIntervalRef.current = null;
      }
      if (bcRef.current) {
        try {
          bcRef.current.close();
        } catch (err) {
          console.warn("[AuthProvider] BroadcastChannel close failed", err);
        }
        bcRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Função interna para verificar sessão via /me (não exposta diretamente)
  const runSessionVerification = async (force = false) => {
    try {
      // Evita múltiplas verificações simultâneas
      if (verificationInProgressRef.current && !force) {
        return sessionVerified ?? false;
      }
      
      const access = localStorage.getItem(STORAGE_ACCESS_KEY);
      if (!access) {
        setSessionVerified(false);
        setSessionLastVerified(Date.now());
        return false;
      }
      
      // throttle: se não for force e última verificação < 2 minutos, pula
      if (
        !force &&
        sessionLastVerified &&
        Date.now() - sessionLastVerified < 120000 // 2 minutos ao invés de 1
      ) {
        return sessionVerified ?? false;
      }
      
      verificationInProgressRef.current = true;
      
      const r = await fetch(API.ME, {
        method: "GET",
        headers: { Authorization: `Bearer ${access}` },
      });
      
      setSessionLastVerified(Date.now());
      
      if (!r.ok) {
        try {
          if (r.status === 401) {
            const payload = await (async () => {
              try {
                return await r.json();
              } catch {
                return null;
              }
            })();
            if (payload && payload.error === "Token outdated") {
              // Agenda refresh para depois da verificação atual terminar
              setTimeout(async () => {
                const refreshed = await contextValue.refreshSession?.();
                if (refreshed) {
                  // Reagenda uma nova verificação para um pouco depois do refresh
                  setTimeout(() => {
                    void runSessionVerification(true);
                  }, 1000);
                }
              }, 100);
              
              verificationInProgressRef.current = false;
              return false;
            }
          }
        } catch (err) {
          console.warn("[setSessionLastVerified] erro: ", err);
        }
        if (r.status === 401 || r.status === 403) {
          setSessionVerified(false);
          verificationInProgressRef.current = false;
          await contextLogout();
          return false;
        }
        setSessionVerified(false);
        verificationInProgressRef.current = false;
        return false;
      }
      const data = await (async () => {
        try {
          return await r.json();
        } catch {
          return null;
        }
      })();
          if (data && typeof data === "object") {
        // Atualiza user se houver diferenças relevantes
        const updated: User = {
          id: (data.id || data.user_id || user?.id || "") as string,
          email: (data.email || user?.email || "") as string,
          role: normalizeRole((data.role || user?.role) as string),
          full_name: (data.full_name || data.name || user?.full_name || "") as string,
          // keep existing user.display_name when /me doesn't provide display_name
          display_name: (data.display_name ?? user?.display_name ?? data.full_name ?? data.name ?? user?.full_name ?? "") as string,
          phone: (data.phone ?? user?.phone ?? "") as string,
        };
        const changed = JSON.stringify(updated) !== JSON.stringify(user);
        if (changed) {
          setUser(updated);
          const rememberFlag = !sessionStorage.getItem(STORAGE_ACCESS_KEY);
          saveUserToStorage(updated, rememberFlag);
        }
      }
      setSessionVerified(true);
      verificationInProgressRef.current = false;
      return true;
    } catch (err) {
      console.warn("[AuthProvider] runSessionVerification error", err);
      setSessionVerified(false);
      setSessionLastVerified(Date.now());
      verificationInProgressRef.current = false;
      return false;
    }
  };

  // Intervalo periódico a cada 15 minutos somente se usuário autenticado
  useEffect(() => {
    if (user) {
      // Verifica imediatamente apenas se não verificou recentemente
      if (!sessionLastVerified || Date.now() - sessionLastVerified > 120000) {
        void runSessionVerification(false);
      }
      if (verifyIntervalRef.current) {
        clearInterval(verifyIntervalRef.current);
      }
      verifyIntervalRef.current = window.setInterval(() => {
        void runSessionVerification(false);
      }, 15 * 60 * 1000) as unknown as number; // 15 min ao invés de 10
      const onFocus = () => {
        if (document.visibilityState === "visible") {
          // Só verifica no focus se faz mais de 5 minutos desde a última verificação
          if (!sessionLastVerified || Date.now() - sessionLastVerified > 300000) {
            void runSessionVerification(false);
          }
        }
      };
      window.addEventListener("focus", onFocus);
      return () => {
        window.removeEventListener("focus", onFocus);
        if (verifyIntervalRef.current) {
          clearInterval(verifyIntervalRef.current);
          verifyIntervalRef.current = null;
        }
      };
    } else {
      if (verifyIntervalRef.current) {
        clearInterval(verifyIntervalRef.current);
        verifyIntervalRef.current = null;
      }
      setSessionVerified(null);
      setSessionLastVerified(null);
      verificationInProgressRef.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const contextValue: AuthContextType = {
    user,
    sessionLastVerified,
    sessionVerified,
    forceVerify: async () => runSessionVerification(true),
    getAccessToken: async () => {
      const access = localStorage.getItem(STORAGE_ACCESS_KEY) ||
        sessionStorage.getItem(STORAGE_ACCESS_KEY);
      if (access) {
        try {
          const p = decodeJwt(access);
          if (p?.exp && Date.now() < Number(p.exp) * 1000 - 120000) { // 2 minutos
            return access;
          }
        } catch {
          console.warn("Erro na serealização do json");
        }
      }
      // Se já há refresh em progresso, aguarda
      if (refreshInProgressRef.current) {
        await refreshInProgressRef.current;
        return localStorage.getItem(STORAGE_ACCESS_KEY) ||
          sessionStorage.getItem(STORAGE_ACCESS_KEY);
      }
      const refreshed = await contextValue.refreshSession();
      if (!refreshed) return null;
      return localStorage.getItem(STORAGE_ACCESS_KEY) ||
        sessionStorage.getItem(STORAGE_ACCESS_KEY);
    },
    login: async (
      email: string,
      password: string,
      rememberMe: boolean = false
    ) => {
      try {
        const res = await fetch(API.LOGIN, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, remember: rememberMe }),
        });

        const body = await (async () => {
          try {
            return await res.json();
          } catch {
            return null;
          }
        })();

        if (res.status === 200 || res.status === 201) {
          const access = body?.access_token;
          const refresh = body?.refresh_token ?? null;
          let expiresAt = body?.expires_at ?? null;
          if (!expiresAt && access) {
            const p = decodeJwt(access);
            if (p && p.exp)
              expiresAt = new Date(Number(p.exp) * 1000).toISOString();
          }

          let userObj: User = {
            id: "",
            email,
            role: "patient",
            full_name: "",
            display_name: "",
          };
          if (access) {
            const p = decodeJwt(access);
            if (p) {
              userObj = {
                id: (p.sub ?? p.user_id ?? p.id) as string,
                email: (p.email ?? email) as string,
                role: normalizeRole(p.role),
                full_name: (p.full_name ?? p.name ?? "") as string,
                display_name: (p.display_name ?? p.full_name ?? p.name ?? "") as string,
              };
            }
          } else {
            const returnedUser = {
              id: body?.user_id ?? body?.id,
              role: normalizeRole(body?.role),
              email: body?.email ?? email,
              full_name: body?.full_name ?? "",
              display_name: body?.full_name ?? "",
            };
            userObj = {
              id: returnedUser.id ?? "",
              email: returnedUser.email ?? email,
              role: returnedUser.role,
              full_name: returnedUser.full_name ?? "",
              display_name: returnedUser.display_name ?? returnedUser.full_name ?? "",
            };
          }

          if (access)
            persistTokens(access, refresh, expiresAt ?? undefined, rememberMe);

          setUser(userObj);
          saveUserToStorage(userObj, rememberMe);

          // Validação adicional opcional com /api/auth/me (se upstream suportar) – não bloqueante
          if (access) {
            try {
              const meResp = await fetch(API.ME, {
                method: "GET",
                headers: { Authorization: `Bearer ${access}` },
              });
              if (meResp.ok) {
                const meData = await (async () => {
                  try {
                    return await meResp.json();
                  } catch {
                    return null;
                  }
                })();
                if (meData && typeof meData === "object") {
                  const updated = {
                    id: (meData.id || meData.user_id || userObj.id) as string,
                    email: (meData.email || userObj.email) as string,
                    role: normalizeRole(
                      (meData.role || userObj.role) as string
                    ),
                    full_name: (meData.full_name ||
                      meData.name ||
                      userObj.full_name) as string,
                    display_name: (meData.display_name ?? userObj.display_name ?? meData.full_name ?? meData.name ?? userObj.full_name) as string,
                    phone: (meData.phone ?? userObj.phone ?? "") as string,
                  } as User;
                  setUser(updated);
                  saveUserToStorage(updated, rememberMe);
                }
              }
            } catch (err) {
              // Silencioso – se /me falhar não quebra login
              console.warn("[AuthProvider] /me sync skipped", err);
            }
          }

          // schedule refresh if leader
          if (isLeaderRef.current && access && refresh) {
            scheduleRefreshLeader(access, refresh, expiresAt, rememberMe);
          }

          // Inform other tabs
          try {
            if (bcRef.current) bcRef.current.postMessage({ type: "login" });
            localStorage.setItem(
              "@AvanteNutri:tokens_updated",
              JSON.stringify({ t: Date.now() })
            );
          } catch (err) {
            console.warn(
              "[AuthProvider] Failed to notify other tabs about login",
              err
            );
          }

          try {
            window.dispatchEvent(
              new CustomEvent("auth:login", { detail: { from: "provider" } })
            );
          } catch (err) {
            console.warn(
              "[AuthProvider] Failed to dispatch auth:login event",
              err
            );
          }

          return true;
        }

        if (res.status === 401) return false;
        if (res.status === 403) return false;
        return false;
      } catch (err) {
        console.error("[AuthProvider] login error", err);
        return false;
      }
    },
    logout: async () => {
      await contextLogout();
    },
    updateUser: (partial) => {
      if (!user) return;
      const updated = { ...user, ...partial } as User;
      setUser(updated);
      try {
        const raw =
          sessionStorage.getItem(STORAGE_USER_KEY) ||
          localStorage.getItem(STORAGE_USER_KEY);
        let rememberMe = false;
        if (raw) {
          const parsed = JSON.parse(raw) as { rememberMe?: boolean };
          rememberMe = !!parsed?.rememberMe;
        }
        saveUserToStorage(updated, rememberMe);
      } catch (err) {
        console.warn("[AuthProvider] updateUser storage failed", err);
      }
    },
    refreshSession: async () => {
      try {
        // Se já há um refresh em progresso, aguarda ele terminar
        if (refreshInProgressRef.current) {
          return await refreshInProgressRef.current;
        }
        
        const refreshPromise = (async () => {
          try {
            const refresh =
              localStorage.getItem(STORAGE_REFRESH_KEY) ||
              sessionStorage.getItem(STORAGE_REFRESH_KEY);
            if (!refresh) return false;
            // Tenta lock cross-tab
            if (!(await acquireRefreshLock())) {
              // Outra aba já está atualizando – aguarda resultado
              const ok = await waitForOtherTabRefresh();
              return ok;
            }
            // Se líder, usa fluxo de retry existente
            if (isLeaderRef.current) {
              const res = await doRefreshWithRetry(
                refresh,
                !sessionStorage.getItem(STORAGE_ACCESS_KEY)
              );
              releaseRefreshLock();
              return res;
            }
            const r = await fetch(API.REFRESH, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refresh_token: refresh }),
            });
            if (!r.ok) {
              // Caso 401 pode ser corrida: outra aba rotacionou e nosso refresh antigo ficou inválido.
              if (r.status === 401) {
                // Tenta reidratar rapidamente para ver se já existe novo access token
                await new Promise((res) => setTimeout(res, 300));
                const maybeAccess = localStorage.getItem(STORAGE_ACCESS_KEY);
                if (maybeAccess) {
                  try {
                    const p = decodeJwt(maybeAccess);
                    if (p?.exp && Date.now() < Number(p.exp) * 1000 - 30000) {
                      releaseRefreshLock();
                      return true; // outro tab já renovou
                    }
                  } catch {
                    console.warn("Erro ao reidratar refresh");
                  }
                }
              }
              releaseRefreshLock();
              return false;
            }
            const data = await r.json();
            const newAccess = data?.access_token;
            const newRefresh = data?.refresh_token ?? refresh;
            let expiresAt = data?.expires_at ?? null;
            if (!expiresAt && newAccess) {
              const p = decodeJwt(newAccess);
              if (p?.exp) expiresAt = new Date(Number(p.exp) * 1000).toISOString();
            }
            if (newAccess) {
              const rememberFlag = !sessionStorage.getItem(STORAGE_ACCESS_KEY);
              persistTokens(
                newAccess,
                newRefresh,
                expiresAt ?? undefined,
                rememberFlag
              );
              const p = decodeJwt(newAccess);
              if (p) {
                setUser({
                  id: (p.sub ?? p.user_id ?? p.id) as string,
                  email: (p.email ?? "") as string,
                  role: normalizeRole(p.role),
                  full_name: (p.full_name ?? p.name ?? "") as string,
                  display_name: (p.display_name ?? p.full_name ?? p.name ?? "") as string,
                  phone: (p.phone ?? p.phone_number ?? p.tel ?? "") as string,
                });
              }
              releaseRefreshLock();
              
              // Agenda uma verificação de sessão para um pouco depois
              setTimeout(() => {
                void runSessionVerification(true);
              }, 1500);
              
              return true;
            }
            releaseRefreshLock();
            return false;
          } catch (err) {
            console.warn("[AuthProvider] refreshSession failed", err);
            releaseRefreshLock();
            return false;
          }
        })();
        
        refreshInProgressRef.current = refreshPromise;
        const result = await refreshPromise;
        refreshInProgressRef.current = null;
        
        return result;
      } catch (err) {
        console.warn("[AuthProvider] refreshSession outer failed", err);
        refreshInProgressRef.current = null;
        return false;
      }
    },
    authenticatedFetch: async (input, init = {}) => {
      const { autoLogout = true, ...rest } = init as RequestInit & {
        autoLogout?: boolean;
      };
      let access = localStorage.getItem(STORAGE_ACCESS_KEY);
      // Heurística: se expira em < 60s tenta refresh
      const needsRefresh = (() => {
        if (!access) return true;
        try {
          const p = decodeJwt(access);
          if (p?.exp) return Date.now() > Number(p.exp) * 1000 - 60000;
        } catch (err) {
          console.warn("Erro na tentativa de refresh ", err);
        }
        return false;
      })();
      if (needsRefresh) {
        await contextValue.refreshSession?.();
        access = localStorage.getItem(STORAGE_ACCESS_KEY);
      }
      const headers = new Headers(rest.headers || {});
      if (access) headers.set("Authorization", `Bearer ${access}`);
      let response = await fetch(input, { ...rest, headers });
      if (response.status === 401 || response.status === 403) {
        const retried = await contextValue.refreshSession?.();
        if (retried) {
          const newAccess = localStorage.getItem(STORAGE_ACCESS_KEY);
          if (newAccess) headers.set("Authorization", `Bearer ${newAccess}`);
          response = await fetch(input, { ...rest, headers });
          if (
            (response.status === 401 || response.status === 403) &&
            autoLogout
          ) {
            await contextLogout();
          }
        } else if (autoLogout) {
          await contextLogout();
        }
      }
      return response;
    },
    syncUser: async () => {
      try {
        const access = localStorage.getItem(STORAGE_ACCESS_KEY);
        if (!access) return false;
        const r = await fetch(API.ME, {
          method: "GET",
          headers: { Authorization: `Bearer ${access}` },
        });
        if (!r.ok) {
          try {
            if (r.status === 401) {
              const payload = await (async () => {
                try {
                  return await r.json();
                } catch {
                  return null;
                }
              })();
              if (payload && payload.error === "Token outdated") {
                const refreshed = await contextValue.refreshSession?.();
                if (refreshed) {
                  return await contextValue.syncUser?.();
                }
              }
            }
          } catch (err) {
            console.warn("Erro ao realizar SyncUser", err);
          }
          if (r.status === 401 || r.status === 403) {
            await contextLogout();
          }
          return false;
        }
        const data = await (async () => {
          try {
            return await r.json();
          } catch {
            return null;
          }
        })();
        if (data && typeof data === "object") {
          const updated: User = {
            id: (data.id || data.user_id || user?.id || "") as string,
            email: (data.email || user?.email || "") as string,
            role: normalizeRole((data.role || user?.role) as string),
            full_name: (data.full_name ||
              data.name ||
              user?.full_name ||
              "") as string,
            display_name: (data.display_name ?? data.full_name ?? data.name ?? user?.full_name ?? "") as string,
            phone: (data.phone ?? user?.phone ?? "") as string,
            birthDate: (data.birth_date ?? user?.birthDate) as string | undefined,
            height: (data.height ?? user?.height) as number | undefined,
          };
          setUser(updated);
          const rememberFlag = !sessionStorage.getItem(STORAGE_ACCESS_KEY);
          saveUserToStorage(updated, rememberFlag);
          return true;
        }
        return false;
      } catch (err) {
        console.warn("[AuthProvider] syncUser failed", err);
        return false;
      }
    },
    updateProfile: async (payload) => {
      try {
        const access = localStorage.getItem(STORAGE_ACCESS_KEY);
        if (!access) return { ok: false, error: "Sem sessão" } as const;
        const r = await fetch(API.PROFILE, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${access}`,
          },
          body: JSON.stringify(payload),
        });
        const data = await (async () => {
          try {
            return await r.json();
          } catch {
            return null;
          }
        })();
        if (!r.ok) {
          const err =
            (data && (data.error || data.message)) || "Falha ao atualizar";
          // Se backend sinalizar token outdated, tenta refresh silencioso
          if (r.status === 401 && data?.error === "Token outdated") {
            const refreshed = await contextValue.refreshSession?.();
            if (refreshed) {
              return (
                (await contextValue.updateProfile?.(payload)) ?? {
                  ok: false,
                  error: err,
                }
              );
            }
          }
          return { ok: false, error: err } as const;
        }
        // Se veio novo access token (session_version mudou), persistir sem exigir logout
        if (data?.access_token) {
          const rememberFlag = !sessionStorage.getItem(STORAGE_ACCESS_KEY);
          persistTokens(
            data.access_token,
            localStorage.getItem(STORAGE_REFRESH_KEY) ||
              sessionStorage.getItem(STORAGE_REFRESH_KEY),
            data.expires_at,
            rememberFlag
          );
        }
        // Atualiza user local se campos retornados
  const updatedPartial: Partial<User> = {};
        if (data?.display_name) updatedPartial.display_name = data.display_name;
        if (data?.full_name) updatedPartial.full_name = data.full_name;
        if (data?.phone !== undefined) updatedPartial.phone = data.phone;
  if (data?.birth_date !== undefined) updatedPartial.birthDate = data.birth_date ?? undefined;
  if (data?.height !== undefined) updatedPartial.height = data.height ?? undefined;
        if (Object.keys(updatedPartial).length > 0 && user) {
          const merged = { ...user, ...updatedPartial } as User;
          setUser(merged);
          saveUserToStorage(
            merged,
            !sessionStorage.getItem(STORAGE_ACCESS_KEY)
          );
          // Ensure server canonical /me is fetched and persisted (in case backend changed display_name stored in users table)
          try {
            void contextValue.syncUser?.();
          } catch (err) {
            console.warn('[AuthProvider] syncUser after updateProfile failed', err);
          }
        }
        return { ok: true, updated: updatedPartial } as const;
      } catch {
        return { ok: false, error: "Erro inesperado" } as const;
      }
    },
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;

// ===== Helper de Lock Global de Refresh =====
function getLockData() {
  try {
    const raw = localStorage.getItem(REFRESH_LOCK_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { id: string; ts: number } | null;
  } catch {
    return null;
  }
}

async function acquireRefreshLock(): Promise<boolean> {
  try {
    const now = Date.now();
    const existing = getLockData();
    if (existing && existing.ts + REFRESH_LOCK_TTL_MS > now) {
      return false; // lock ativo
    }
    const newLock = {
      id:
        (window as unknown as { _avTabId?: string })._avTabId || "tab" + Math.random().toString(36).slice(2),
      ts: now,
    };
    localStorage.setItem(REFRESH_LOCK_KEY, JSON.stringify(newLock));
    // Verifica se realmente é nosso
    const confirm = getLockData();
    if (confirm && confirm.id === newLock.id) {
      return true;
    }
    return false;
  } catch (err) {
    console.warn("[AuthProvider] acquireRefreshLock falhou", err);
    return true; // fallback: não bloquear refresh
  }
}

function releaseRefreshLock() {
  try {
    const existing = getLockData();
    if (!existing) return;
    // Simplesmente remove (não precisamos do id do tab aqui porque geração é best-effort)
    localStorage.removeItem(REFRESH_LOCK_KEY);
  } catch {
    console.warn("erro ao remover id do tab");
  }
}

async function waitForOtherTabRefresh(): Promise<boolean> {
  // Aguarda até 5s tokens serem atualizados ou lock sumir
  const start = Date.now();
  const initialAccess = localStorage.getItem(STORAGE_ACCESS_KEY);
  while (Date.now() - start < 5000) {
    await new Promise((r) => setTimeout(r, 300));
    const lock = getLockData();
    const currentAccess = localStorage.getItem(STORAGE_ACCESS_KEY);
    if (!lock) {
      // lock liberado – se access mudou e é válido, sucesso; senão sai para permitir tentativa
      if (currentAccess && currentAccess !== initialAccess) {
        try {
          const p = decodeJwt(currentAccess);
          if (p?.exp && Date.now() < Number(p.exp) * 1000 - 30000) return true;
        } catch {
        console.warn("erro no decode do jwt");}
      }
      return !!currentAccess;
    }
    if (currentAccess && currentAccess !== initialAccess) {
      try {
        const p = decodeJwt(currentAccess);
        if (p?.exp && Date.now() < Number(p.exp) * 1000 - 30000) return true;
      } catch {
        console.warn("erro no decode do jwt");
      }
    }
  }
  return false;
}
