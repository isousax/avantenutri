import Card from "../ui/Card";
import { useState, useEffect, useRef } from "react";
import { API } from "../../config/api";
import { useAuth } from "../../contexts";
import { normalizePhone } from "../../utils/normalizePhone";

const PASSWORD_POLICY =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]:";'<>?,./]).{8,64}$/;

const Perfil: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  // Guarda valores originais para detectar mudanças e permitir reset
  const originalRef = useRef<{display_name?: string; full_name?: string; phone?: string | undefined}>({});
  useEffect(() => {
    if (user) {
      setDisplayName(user.display_name || "");
      setFullName(user.full_name || "");
      setPhone(user.phone || "");
      originalRef.current = {
        display_name: user.display_name || "",
        full_name: user.full_name || "",
        phone: user.phone || "",
      };
    }
  }, [user?.id, user?.display_name, user?.full_name, user?.phone]);

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
  const [profileSaving, setProfileSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
        // Se header indicar troca, força logout seguro multi-aba
        const changed = resp.headers.get("X-Password-Changed") === "1";
        if (changed) {
          setMessage("Senha alterada. Será necessário autenticar novamente.");
          // Limpa tokens e usuário armazenados
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          sessionStorage.removeItem("access_token");
          sessionStorage.removeItem("refresh_token");
          localStorage.removeItem("@AvanteNutri:user");
          // Broadcast logout para outras abas
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
    <div className="max-w-4xl space-y-8">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h2>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setMessage(null);
            setError(null);
            // Validações locais
            const localErrors: string[] = [];
            const trimmedDisplay = displayName.trim();
            const trimmedFull = fullName.trim();
            if (trimmedDisplay.length > 60) localErrors.push("Display Name excede 60 caracteres");
            if (trimmedFull.length > 120) localErrors.push("Nome completo excede 120 caracteres");
            const invalidCtrl = /[\n\r\t]/;
            if (invalidCtrl.test(trimmedDisplay)) localErrors.push("Display Name contém caracteres inválidos");
            if (invalidCtrl.test(trimmedFull)) localErrors.push("Nome completo contém caracteres inválidos");
            if (localErrors.length) {
              setError(localErrors.join("; "));
              return;
            }
            const payload: any = {};
            if (trimmedDisplay !== originalRef.current.display_name) payload.display_name = trimmedDisplay;
            if (trimmedFull !== originalRef.current.full_name) payload.full_name = trimmedFull;
            // Lógica de telefone: se havia e limpou -> enviar vazio (remover). Se mudou para algo não vazio -> normalizar.
            if (phone.trim() !== originalRef.current.phone) {
              if (phone.trim() === "") {
                // confirmar remoção
                const confirmed = window.confirm("Remover telefone do perfil?");
                if (!confirmed) {
                  // cancela submit
                  return;
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
              const result = await (updateProfile?.(payload) ?? Promise.resolve({ ok: false, error: "Função indisponível" }));
              if (!result.ok) {
                setError(result.error || "Falha ao salvar");
              } else {
                setMessage("Perfil atualizado");
                // Atualiza referência original após salvar
                Object.assign(originalRef.current, payload);
              }
            } catch {
              setError("Erro ao salvar perfil");
            } finally {
              setProfileSaving(false);
            }
          }}
          className="space-y-4 max-w-md"
        >
          <div className="relative">
            <label className="block text-sm font-medium mb-1">
              Display Name
            </label>
            <input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="w-full border rounded px-3 py-2"
              placeholder="Seu nome curto"
              maxLength={70}
            />
            <div className="flex justify-between text-[11px] mt-1">
              <span className="text-gray-500">Até 60 caracteres. Usado em listagens rápidas.</span>
              <span className={displayName.trim().length > 60 ? "text-red-600" : displayName.trim().length > 50 ? "text-amber-600" : "text-gray-400"}>
                {displayName.trim().length}/60
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nome Completo</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => {
                // Auto-capitalização simples (mantém preposições minúsculas comuns)
                const lowers = ["da","de","do","das","dos","e"];  
                const formatted = fullName
                  .trim()
                  .split(/\s+/)
                  .map(w => {
                    const wl = w.toLowerCase();
                    if (lowers.includes(wl)) return wl;
                    return wl.charAt(0).toUpperCase() + wl.slice(1);
                  })
                  .join(" ");
                setFullName(formatted);
              }}
              className="w-full border rounded px-3 py-2"
              placeholder="Seu nome completo"
              maxLength={140}
            />
            <div className="flex justify-between text-[11px] mt-1">
              <span className="text-gray-500">Até 120 caracteres. Será usado em documentos e PDFs.</span>
              <span className={fullName.trim().length > 120 ? "text-red-600" : fullName.trim().length > 100 ? "text-amber-600" : "text-gray-400"}>
                {fullName.trim().length}/120
              </span>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Telefone</label>
            <input
              value={phone}
              onChange={(e) => {
                const raw = e.target.value;
                // Mantém estado 'visual', não normalizado (normalização só no submit)
                setPhone(formatPhoneLocal(raw));
              }}
              className="w-full border rounded px-3 py-2"
              placeholder="(DDD) 9xxxx-xxxx"
              inputMode="tel"
              maxLength={25}
            />
            <p className="text-[11px] text-gray-500 mt-1">Aceita formato livre – será normalizado (ex: +55DDD...).</p>
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {message && <div className="text-sm text-green-600">{message}</div>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={profileSaving || !isDirty}
              className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 text-sm"
            >
              {profileSaving ? "Salvando..." : isDirty ? "Salvar Perfil" : "Sem alterações"}
            </button>
            <button
              type="button"
              onClick={() => {
                setDisplayName(originalRef.current.display_name || "");
                setFullName(originalRef.current.full_name || "");
                setPhone(originalRef.current.phone || "");
                setError(null); setMessage(null);
              }}
              className="px-4 py-2 rounded border text-sm bg-white hover:bg-gray-50"
            >
              Resetar
            </button>
          </div>
        </form>
        {profileSaving && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded">
            <div className="animate-spin h-6 w-6 border-2 border-green-600 border-t-transparent rounded-full" />
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Alterar Senha</h3>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium mb-1">
              Senha Atual
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
              autoComplete="current-password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nova Senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
              autoComplete="new-password"
            />
            <p className="text-xs text-gray-500 mt-1">
              8-64 caracteres, incluir maiúscula, minúscula, número e símbolo.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full border rounded px-3 py-2"
              autoComplete="new-password"
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {message && <div className="text-sm text-green-600">{message}</div>}
          <button
            type="submit"
            disabled={loading}
            className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Salvar Nova Senha"}
          </button>
        </form>
      </Card>
    </div>
  );
};
export default Perfil;
