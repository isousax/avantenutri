import Card from "../ui/Card";
import { useState, useEffect } from "react";
import { API } from "../../config/api";
import { useAuth } from "../../contexts";

const PASSWORD_POLICY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}\[\]:";'<>?,.\/]).{8,64}$/;

const Perfil: React.FC = () => {
  const { authenticatedFetch } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [displayName, setDisplayName] = useState("");
  useEffect(()=>{
    try { const raw = localStorage.getItem('@AvanteNutri:user'); if (raw) { const u = JSON.parse(raw); if (u?.display_name) setDisplayName(u.display_name); } } catch {}
  },[]);
  const [profileSaving, setProfileSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setMessage(null);
    if (newPassword !== confirmPassword) {
      setError("Senhas não coincidem");
      return;
    }
    if (!PASSWORD_POLICY.test(newPassword)) {
      setError("Senha não atende à política (8+ caracteres, maiúscula, minúscula, número e símbolo)");
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
      if (!token) {
        setError('Sessão expirada. Faça login novamente.');
        return;
      }
      const resp = await fetch(API.CHANGE_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword })
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        setError(data?.error || 'Falha ao alterar senha');
      } else {
        // Se header indicar troca, força logout seguro multi-aba
        const changed = resp.headers.get('X-Password-Changed') === '1';
        if (changed) {
          setMessage('Senha alterada. Será necessário autenticar novamente.');
          // Limpa tokens e usuário armazenados
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          sessionStorage.removeItem('access_token');
          sessionStorage.removeItem('refresh_token');
          localStorage.removeItem('@AvanteNutri:user');
          // Broadcast logout para outras abas
          try { if (typeof BroadcastChannel !== 'undefined') { const bc = new BroadcastChannel('avante-auth'); bc.postMessage({ type: 'logout' }); bc.close(); } } catch {}
        } else if (data.access_token) {
          localStorage.setItem('access_token', data.access_token);
          setMessage('Senha alterada com sucesso.');
        }
        setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      }
    } catch (err: any) {
      setError('Erro inesperado');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl space-y-8">
      <Card className="p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Meu Perfil</h2>
  <form onSubmit={async (e)=>{ e.preventDefault(); setMessage(null); setError(null); if (!displayName.trim()) { setError('Display Name obrigatório'); return; } setProfileSaving(true); try { const token = localStorage.getItem('access_token') || sessionStorage.getItem('access_token'); if (!token) { setError('Sessão expirada'); return; } const r = await fetch('/api/auth/profile', { method: 'PATCH', headers: { 'Content-Type':'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ display_name: displayName }) }); const data = await r.json().catch(()=>({})); if (!r.ok) { setError(data?.error || 'Falha ao salvar'); } else { setMessage('Perfil atualizado'); if (data.access_token) { localStorage.setItem('access_token', data.access_token); sessionStorage.setItem('access_token', data.access_token); try { const meResp = await authenticatedFetch('/api/auth/me', { method: 'POST', autoLogout: true }); if (meResp.ok) { const me = await meResp.json(); localStorage.setItem('@AvanteNutri:user', JSON.stringify(me)); } } catch {} } } } catch { setError('Erro ao salvar perfil'); } finally { setProfileSaving(false); } }} className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium mb-1">Display Name</label>
            <input value={displayName} onChange={e=>setDisplayName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="Seu nome curto" />
          </div>
          <button type="submit" disabled={profileSaving} className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50 text-sm">{profileSaving ? 'Salvando...' : 'Salvar Perfil'}</button>
        </form>
      </Card>

      <Card className="p-6">
        <h3 className="text-xl font-semibold mb-4">Alterar Senha</h3>
        <form onSubmit={handleChangePassword} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium mb-1">Senha Atual</label>
            <input type="password" value={currentPassword} onChange={e=>setCurrentPassword(e.target.value)} required className="w-full border rounded px-3 py-2" autoComplete="current-password" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Nova Senha</label>
            <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)} required className="w-full border rounded px-3 py-2" autoComplete="new-password" />
            <p className="text-xs text-gray-500 mt-1">8-64 caracteres, incluir maiúscula, minúscula, número e símbolo.</p>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirmar Nova Senha</label>
            <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} required className="w-full border rounded px-3 py-2" autoComplete="new-password" />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          {message && <div className="text-sm text-green-600">{message}</div>}
          <button type="submit" disabled={loading} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-50">
            {loading ? 'Salvando...' : 'Salvar Nova Senha'}
          </button>
        </form>
      </Card>
    </div>
  );
};
export default Perfil;
