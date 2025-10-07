import Card from "../ui/Card";
import { useState, useEffect, useRef } from "react";
import { API } from "../../config/api";
import { useAuth } from "../../contexts";
import { normalizePhone } from "../../utils/normalizePhone";

const PASSWORD_POLICY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]:";'<>?,./]).{8,64}$/;

const Perfil: React.FC = () => {
  const { authenticatedFetch, user, updateProfile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  // Guarda valores originais para detectar mudanças e permitir reset
  const originalRef = useRef<{
    display_name?: string;
    full_name?: string;
    phone?: string | undefined;
  }>({});

  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || "");
      setFullName(user.full_name || "");
      // Format phone for local display (keeps original normalization for submit)
      setPhone(user.phone ? formatPhoneLocal(user.phone) : "");
      originalRef.current = {
        display_name: user.display_name || "",
        full_name: user.full_name || "",
        phone: user.phone || "",
      };
    }
  }, [user]);

  // Note: phone is provided by AuthProvider; no token decode needed here.

  // Deriva flag de mudança (dirty) para habilitar / desabilitar botão de salvar
  const isDirty = (() => {
    if (!originalRef.current) return false;
    const od = originalRef.current.display_name || "";
    const of = originalRef.current.full_name || "";
    const op = originalRef.current.phone || "";
    return (
      displayName.trim() !== od.trim() ||
      fullName.trim() !== of.trim() ||
      phone.trim() !== op.trim()
    );
  })();

  // Função de formatação local de telefone (não altera normalização enviada)
  function formatPhoneLocal(v: string): string {
    // Mantém + no início se já existir
    const plus = v.trim().startsWith("+");
    const digits = v.replace(/\D/g, "");
    if (!digits) return "";
    // Se for internacional com +55...
    const d = digits;
    // Formatação Brasil básica: (DD) 9XXXX-XXXX
    if (d.length >= 10 && d.length <= 11) {
      const dd = d.slice(0, 2);
      const mid = d.length === 11 ? d.slice(2, 7) : d.slice(2, 6);
      const end = d.length === 11 ? d.slice(7) : d.slice(6);
      return `(${dd}) ${mid}${end ? "-" + end : ""}`;
    }
    if (plus && d.startsWith("55") && d.length > 4) {
      // +55DD9XXXXXXX -> +55 (DD) 9XXXX-XXXX
      const cc = d.slice(0, 2); // 55
      const dd = d.slice(2, 4);
      const rest = d.slice(4);
      if (rest.length >= 9) {
        return `+${cc} (${dd}) ${rest.slice(0, 5)}-${rest.slice(5, 9)}`;
      }
      return `+${cc} (${dd}) ${rest}`;
    }
    return (plus ? "+" : "") + d; // fallback
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    if (newPassword !== confirmPassword) {
      setError("Senhas não coincidem");
      return;
    }
    if (!PASSWORD_POLICY.test(newPassword)) {
      setError(
        "Senha não atende à política (8+ caracteres, maiúscula, minúscula, número e símbolo)"
      );
      return;
    }
    setLoading(true);
    try {
      const token =
        localStorage.getItem("access_token") ||
        sessionStorage.getItem("access_token");
      if (!token) {
        setError("Sessão expirada. Faça login novamente.");
        return;
      }
      const resp = await fetch(API.CHANGE_PASSWORD, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setError(data?.error || "Falha ao alterar senha");
      } else {
        const changed = resp.headers.get("X-Password-Changed") === "1";
        if (changed) {
          setMessage("Senha alterada. Será necessário autenticar novamente.");
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("refresh_token");
          localStorage.removeItem("@AvanteNutri:user");
          try {
            if (typeof BroadcastChannel !== "undefined") {
              const bc = new BroadcastChannel("avante-auth");
              bc.postMessage({ type: "logout" });
              bc.close();
            }
          } catch {
            console.warn("Erro no processamento do logout");
          }
        } else if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          setMessage("Senha alterada com sucesso.");
        }
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    } catch {
      setError("Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4 pb-20">
      {/* Header do Perfil */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <img
            src={
              user?.photoUrl ||
              `https://ui-avatars.com/api/?name=${
                user?.full_name || "User"
              }&background=22c55e&color=fff&size=128`
            }
            alt={user?.full_name}
            className="w-16 h-16 md:w-20 md:h-20 rounded-full border-4 border-white shadow-lg"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
            <svg
              className="w-3 h-3 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 truncate">
            {user?.display_name || user?.full_name || "Usuário"}
          </h1>
          <p className="text-gray-600 text-sm md:text-base truncate">
            {user?.email}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
              Ativo
            </span>
          </div>
        </div>
      </div>

      {/* Informações do Perfil */}
      <Card className="p-6 md:p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-100 rounded-xl">
            <svg
              className="w-5 h-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">
            Informações Pessoais
          </h2>
        </div>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setMessage(null);
            setError(null);

            // Validações locais
            const localErrors: string[] = [];
            const trimmedDisplay = displayName.trim();
            const trimmedFull = fullName.trim();
            if (trimmedDisplay.length > 60)
              localErrors.push("Nome de exibição excede 60 caracteres");
            if (trimmedFull.length > 120)
              localErrors.push("Nome completo excede 120 caracteres");
            const invalidCtrl = /[\n\r\t]/;
            if (invalidCtrl.test(trimmedDisplay))
              localErrors.push("Nome de exibição contém caracteres inválidos");
            if (invalidCtrl.test(trimmedFull))
              localErrors.push("Nome completo contém caracteres inválidos");
            if (localErrors.length) {
              setError(localErrors.join("; "));
              return;
            }

            const payload: Partial<{
              display_name: string;
              full_name: string;
              phone?: string | null;
            }> = {};
            if (trimmedDisplay !== originalRef.current.display_name)
              payload.display_name = trimmedDisplay;
            if (trimmedFull !== originalRef.current.full_name)
              payload.full_name = trimmedFull;

            // Lógica de telefone: se havia e limpou -> enviar vazio (remover). Se mudou para algo não vazio -> normalizar.
            if (phone.trim() !== (originalRef.current.phone || "")) {
              if (phone.trim() === "") {
                const confirmed = window.confirm(
                  "Remover telefone do perfil?"
                );
                if (!confirmed) {
                  return; // cancela submit
                }
                payload.phone = ""; // backend interpretará como remoção
              } else {
                payload.phone = normalizePhone(phone.trim());
              }
            }

            if (Object.keys(payload).length === 0) {
              setError("Nenhuma alteração para salvar");
              return;
            }

            setProfileSaving(true);
            try {
              // Tenta usar helper updateProfile se disponível
              if (typeof updateProfile === "function") {
                const result = await updateProfile(payload);
                if (!result.ok) {
                  setError(result.error || "Falha ao salvar");
                } else {
                  setMessage("Perfil atualizado com sucesso!");
                  // Atualiza referência original após salvar
                  Object.assign(originalRef.current, payload);
                }
              } else {
                // Fallback: chamada direta à API
                const token =
                  localStorage.getItem("access_token") ||
                  sessionStorage.getItem("access_token");
                if (!token) {
                  setError("Sessão expirada");
                  return;
                }
                const r = await fetch(API.PROFILE, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify(payload),
                });
                const data = await r.json().catch(() => ({}));
                if (!r.ok) {
                  setError(data?.error || "Falha ao salvar");
                } else {
                  setMessage("Perfil atualizado com sucesso!");
                  if (data.access_token) {
                    localStorage.setItem("access_token", data.access_token);
                    sessionStorage.setItem("access_token", data.access_token);
                    try {
                      const meResp = await authenticatedFetch(API.ME, {
                        method: "POST",
                        autoLogout: true,
                      });
                      if (meResp.ok) {
                        const me = await meResp.json();
                        localStorage.setItem("@AvanteNutri:user", JSON.stringify(me));
                      }
                    } catch {
                      console.warn("Erro no /me");
                    }
                  }
                  Object.assign(originalRef.current, payload);
                }
              }
            } catch {
              setError("Erro ao salvar perfil");
            } finally {
              setProfileSaving(false);
            }
          }}
          className="space-y-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome Completo
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => {
                  // Auto-capitalização simples (mantém preposições minúsculas comuns)
                  const lowers = ["da", "de", "do", "das", "dos", "e"];
                  const formatted = fullName
                    .trim()
                    .split(/\s+/)
                    .map((w) => {
                      const wl = w.toLowerCase();
                      if (lowers.includes(wl)) return wl;
                      return wl.charAt(0).toUpperCase() + wl.slice(1);
                    })
                    .join(" ");
                  setFullName(formatted);
                }}
                className="flex w-full px-4 py-3 rounded-xl border bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 placeholder:text-gray-400 focus:border-green-800 focus:ring-green-700/20"
                placeholder="Seu nome completo"
                maxLength={140}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nome de Exibição
              </label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="flex w-full px-4 py-3 rounded-xl border bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 placeholder:text-gray-400 focus:border-green-800 focus:ring-green-700/20"
                placeholder="Como você quer ser chamado"
                maxLength={70}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Email
              </label>
              <input
                value={user?.email || ""}
                disabled
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Telefone
              </label>
              <input
                value={phone}
                onChange={(e) => {
                  const raw = e.target.value;
                  // Mantém estado 'visual', não normalizado (normalização só no submit)
                  setPhone(formatPhoneLocal(raw));
                }}
                className="flex w-full px-4 py-3 rounded-xl border bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 placeholder:text-gray-400 focus:border-green-800 focus:ring-green-700/20"
                placeholder="(DDD) 9xxxx-xxxx"
                inputMode="tel"
                maxLength={25}
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-green-800">{message}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={profileSaving || !isDirty}
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {profileSaving ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Salvando...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </Card>

      {/* Alteração de Senha */}
      <Card className="p-6 md:p-8 bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-100 rounded-xl">
            <svg
              className="w-5 h-5 text-red-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Alterar Senha</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Senha Atual
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="flex w-full px-4 py-3 rounded-xl border bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 placeholder:text-gray-400 focus:border-green-800 focus:ring-green-700/20"
                autoComplete="current-password"
                placeholder="Digite sua senha atual"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nova Senha
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="flex w-full px-4 py-3 rounded-xl border bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 placeholder:text-gray-400 focus:border-green-800 focus:ring-green-700/20"
                autoComplete="new-password"
                placeholder="Crie uma nova senha"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Confirmar Nova Senha
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="flex w-full px-4 py-3 rounded-xl border bg-background ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-0 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 border-gray-300 placeholder:text-gray-400 focus:border-green-800 focus:ring-green-700/20"
                autoComplete="new-password"
                placeholder="Confirme a nova senha"
              />
            </div>
          </div>

          {/* Dicas de Senha */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  clipRule="evenodd"
                />
              </svg>
              Requisitos da senha:
            </h4>
            <ul className="text-xs text-blue-800 space-y-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                Min de 8 caracteres
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                Pelo menos uma letra maiúscula
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                Pelo menos uma letra minúscula
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                Pelo menos um número
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
                Pelo menos um símbolo especial
              </li>
            </ul>
          </div>

          {/* Mensagens de Feedback */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-red-800">{error}</span>
            </div>
          )}

          {message && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-start gap-3">
              <svg
                className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="text-sm text-green-800">{message}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Alterando Senha...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                  Alterar Senha
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Perfil;