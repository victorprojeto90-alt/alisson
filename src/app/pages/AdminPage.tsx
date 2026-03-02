import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Building2,
  Users,
  Trees,
  Crown,
  Clock,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { projectId } from '/utils/supabase/info';

interface EmpresaAdmin {
  id: string;
  name: string;
  plan: string;
  trial_ends_at: string;
  created_at: string;
  owner_id: string;
  profiles: { id: string; name: string; role: string }[];
  projetos: { id: string }[];
}

interface Stats {
  totalEmpresas: number;
  totalProjetos: number;
  totalUsers: number;
}

async function adminFetch(path: string, token: string, options?: RequestInit) {
  const res = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-eed79e88${path}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options?.headers ?? {}),
      },
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? 'Erro na requisição');
  }
  return res.json();
}

export default function AdminPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [empresas, setEmpresas] = useState<EmpresaAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Sem sessão');

      const [statsData, empresasData] = await Promise.all([
        adminFetch('/admin/stats', token),
        adminFetch('/admin/empresas', token),
      ]);
      setStats(statsData);
      setEmpresas(empresasData.empresas ?? []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error('Erro ao carregar dados: ' + msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changePlan = async (empresaId: string, newPlan: string) => {
    setUpdatingId(empresaId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('Sem sessão');

      await adminFetch(`/admin/empresas/${empresaId}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ plan: newPlan }),
      });
      toast.success(`Plano atualizado para ${newPlan === 'profissional' ? 'Profissional' : 'Trial'}!`);
      await load();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Erro desconhecido';
      toast.error('Erro ao atualizar plano: ' + msg);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#0B3D2E]" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-400/20 rounded-xl flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Painel Superadmin</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Logado como <strong>{user?.email}</strong>
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={load}
          disabled={loading}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0B3D2E]/10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#0B3D2E]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalEmpresas}</p>
                  <p className="text-xs text-gray-500">Empresas cadastradas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
                  <p className="text-xs text-gray-500">Usuários ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                  <Trees className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProjetos}</p>
                  <p className="text-xs text-gray-500">Inventários criados</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empresas Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-base">Clientes ({empresas.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-y border-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Empresa</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Usuários</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Projetos</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Plano</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Trial até</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Cadastro</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-600">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {empresas.map((emp, i) => {
                  const trialEndsAt = emp.trial_ends_at ? new Date(emp.trial_ends_at) : null;
                  const trialExpired = trialEndsAt ? trialEndsAt < new Date() : false;
                  const trialDays = trialEndsAt
                    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                    : 0;
                  const isUpdating = updatingId === emp.id;

                  return (
                    <tr key={emp.id} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{emp.name}</p>
                          {emp.profiles?.[0]?.name && (
                            <p className="text-xs text-gray-400">{emp.profiles[0].name}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {emp.profiles?.length ?? 0}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {emp.projetos?.length ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        {emp.plan === 'profissional' ? (
                          <Badge className="bg-[#16A34A]/10 text-[#16A34A] border-0 gap-1">
                            <Crown className="w-3 h-3" /> Profissional
                          </Badge>
                        ) : (
                          <Badge variant="outline" className={
                            trialExpired
                              ? 'text-red-600 border-red-200 bg-red-50'
                              : 'text-yellow-600 border-yellow-200 bg-yellow-50'
                          }>
                            {trialExpired
                              ? <><AlertTriangle className="w-3 h-3 mr-1" />Trial expirado</>
                              : <><Clock className="w-3 h-3 mr-1" />Trial</>
                            }
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {trialEndsAt
                          ? trialExpired
                            ? <span className="text-red-500">Expirado</span>
                            : <span className="text-green-600">{trialDays}d restantes</span>
                          : '—'
                        }
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {new Date(emp.created_at).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-4 py-3">
                        {isUpdating ? (
                          <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                        ) : emp.plan === 'profissional' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs h-7 border-gray-200 text-gray-600 hover:bg-gray-50"
                            onClick={() => changePlan(emp.id, 'trial')}
                          >
                            Rebaixar para Trial
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="text-xs h-7 bg-[#16A34A] hover:bg-[#15803d] text-white gap-1"
                            onClick={() => changePlan(emp.id, 'profissional')}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Ativar Pro
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {empresas.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                <Building2 className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p>Nenhuma empresa cadastrada ainda</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
