import { useEffect, useRef, useState, type ReactNode } from "react";
import type { User, AuthContextType } from "../types/auth";
import { AuthContext } from "./AuthContext";
import { decodeJwt } from "../utils/decodeJwt";

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

const API_LOGIN = "/api/login/login";
const API_REFRESH = "/api/login/refresh";
const API_LOGOUT = "/api/logout/logout";

// Leader election keys / timing
const LEADER_KEY = "@AvanteNutri:leader";
const LEADER_TTL_MS = 5000;
const LEADER_HEARTBEAT_MS = 2000;

function nowMs() {
  return Date.now();
}
function readStorage(rememberMe: boolean) {
  return rememberMe ? localStorage : sessionStorage;
}

function normalizeRole(role: unknown): "patient" | "admin" {
  if (role === "admin") return "admin";
  return "patient";
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

  const saveUserToStorage = (userData: User, rememberMe: boolean) => {
    const payload = {
      user: userData,
      expiresAt: nowMs() + SESSION_EXPIRY,
      rememberMe,
    };
    try {
      if (rememberMe) {
        localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(payload));
        // copy tokens from sessionStorage to localStorage if present
        const s = sessionStorage.getItem(STORAGE_ACCESS_KEY);
        if (s) localStorage.setItem(STORAGE_ACCESS_KEY, s);
        const r = sessionStorage.getItem(STORAGE_REFRESH_KEY);
        if (r) localStorage.setItem(STORAGE_REFRESH_KEY, r);
        const e = sessionStorage.getItem(STORAGE_EXPIRES_KEY);
        if (e) localStorage.setItem(STORAGE_EXPIRES_KEY, e);
      } else {
        sessionStorage.setItem(STORAGE_USER_KEY, JSON.stringify(payload));
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
    const storage = readStorage(rememberMe);
    try {
      storage.setItem(STORAGE_ACCESS_KEY, accessToken);
      if (refreshToken) storage.setItem(STORAGE_REFRESH_KEY, refreshToken);
      if (expiresAtIso) storage.setItem(STORAGE_EXPIRES_KEY, expiresAtIso);
      const other = storage === localStorage ? sessionStorage : localStorage;
      other.removeItem(STORAGE_ACCESS_KEY);
      other.removeItem(STORAGE_REFRESH_KEY);
      other.removeItem(STORAGE_EXPIRES_KEY);
      // notify other tabs (both BroadcastChannel and storage fallback)
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
      const storage = sessionStorage.getItem(STORAGE_ACCESS_KEY)
        ? sessionStorage
        : localStorage;
      const refresh = storage.getItem(STORAGE_REFRESH_KEY);
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
            navigator.sendBeacon(API_LOGOUT, blob);
          } else {
            // fire-and-forget fetch
            void fetch(API_LOGOUT, {
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
    const maxAttempts = 4; // 1 + 3 retries
    let attempt = 0;
    let delayMs = 0;

    while (attempt < maxAttempts) {
      if (!isLeaderRef.current) return false; // lost leadership
      if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
      try {
        const res = await fetch(API_REFRESH, {
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

    // capture the chosen storage mode at schedule time (uses rememberMe param)
    const storageForCallback = rememberMe ? localStorage : sessionStorage;

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
      const storage = sessionStorage.getItem(STORAGE_ACCESS_KEY)
        ? sessionStorage
        : localStorage;
      const access = storage.getItem(STORAGE_ACCESS_KEY);
      const refresh = storage.getItem(STORAGE_REFRESH_KEY);
      const expiresAt = storage.getItem(STORAGE_EXPIRES_KEY);
      if (access && refresh) {
        scheduleRefreshLeader(
          access,
          refresh,
          expiresAt,
          storage === localStorage
        );
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
      const storage = sessionStorage.getItem(STORAGE_ACCESS_KEY)
        ? sessionStorage
        : localStorage;
      const access = storage.getItem(STORAGE_ACCESS_KEY);
      const refresh = storage.getItem(STORAGE_REFRESH_KEY) ?? null;
      const expiresAtIso = storage.getItem(STORAGE_EXPIRES_KEY) ?? null;

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
        };
        setUser(derived);
        const rememberFlag = storage === localStorage;
        saveUserToStorage(derived, rememberFlag);

        if (isLeaderRef.current && refresh) {
          scheduleRefreshLeader(access, refresh, expiresAtIso, rememberFlag);
        }
        return;
      }

      // fallback to persisted user object
      const rawUser =
        sessionStorage.getItem(STORAGE_USER_KEY) ||
        localStorage.getItem(STORAGE_USER_KEY);
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
        const storage = sessionStorage.getItem(STORAGE_ACCESS_KEY)
          ? sessionStorage
          : localStorage;
        const refresh = storage.getItem(STORAGE_REFRESH_KEY);
        if (refresh && navigator.sendBeacon) {
          const blob = new Blob([JSON.stringify({ refresh_token: refresh })], {
            type: "application/json",
          });
          navigator.sendBeacon(API_LOGOUT, blob);
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

  const contextValue: AuthContextType = {
    user,
    login: async (
      email: string,
      password: string,
      rememberMe: boolean = false
    ) => {
      try {
        const res = await fetch(API_LOGIN, {
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

          let userObj: User = { id: "", email, role: "patient", full_name: "" };
          if (access) {
            const p = decodeJwt(access);
            if (p) {
              userObj = {
                id: (p.sub ?? p.user_id ?? p.id) as string,
                email: (p.email ?? email) as string,
                role: normalizeRole(p.role),
                full_name: (p.full_name ?? p.name ?? "") as string,
              };
            }
          } else {
            const returnedUser = {
              id: body?.user_id ?? body?.id,
              role: body?.role ?? "client",
              email: body?.email ?? email,
              full_name: body?.full_name ?? "",
            };
            userObj = {
              id: returnedUser.id ?? "",
              email: returnedUser.email ?? email,
              role: normalizeRole(returnedUser.role),
              full_name: returnedUser.full_name ?? "",
            };
          }

          if (access)
            persistTokens(access, refresh, expiresAt ?? undefined, rememberMe);

          setUser(userObj);
          saveUserToStorage(userObj, rememberMe);

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
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
