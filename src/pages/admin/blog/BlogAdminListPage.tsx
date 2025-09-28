import React, { useEffect, useState } from 'react';
import { fetchPosts } from '../../../services/blog';
import { useAuth } from '../../../contexts/useAuth';
import Button from '../../../components/ui/Button';
import Card from '../../../components/ui/Card';
import Skeleton from '../../../components/ui/Skeleton';
import { Link } from 'react-router-dom';

interface PostRow { id: string; slug: string; title: string; status?: string; published_at?: string; read_time_min: number; category?: string; views?: number; }

const BlogAdminListPage: React.FC = () => {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string|null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const canManage = user && user.role === 'admin';

  useEffect(()=> { if(!canManage) return; let ignore=false; (async()=>{ setLoading(true); setError(null); try { const data = await fetchPosts({ page, limit, preview: true }); if(!ignore){ setPosts(data.results as any); setTotal(data.total);} } catch(e){ if(!ignore) setError('Falha ao carregar'); } finally { if(!ignore) setLoading(false);} })(); return ()=> { ignore=true; }; }, [page, canManage]);

  if(!canManage) return <div className='p-8 text-center text-gray-600'>Sem permissão.</div>;

  return <div className='max-w-6xl mx-auto p-4 md:p-6'>
    <div className='flex items-center justify-between flex-wrap gap-3 mb-6'>
      <div>
        <h1 className='text-2xl font-semibold tracking-tight'>Gerenciar Blog</h1>
        <p className='text-xs text-gray-500 mt-1'>Artigos, status de publicação e métricas básicas.</p>
      </div>
      <div className='flex gap-2'>
        <Button variant='secondary' disabled={loading} onClick={()=> setPage(1)}>Recarregar</Button>
        <Link to='/admin/blog/new'><Button>+ Novo Artigo</Button></Link>
      </div>
    </div>
    {error && <div className='text-red-600 text-sm mb-4'>{error}</div>}
    <div className='space-y-3'>
      {loading && Array.from({length:4}).map((_,i)=> <Card key={i} className='p-4'><Skeleton lines={2} /></Card>)}
      {!loading && !error && posts.length===0 && <Card className='p-8 text-center text-sm text-gray-500'>Nenhum post.</Card>}
      {!loading && !error && posts.map(p=> <Card key={p.id} className='p-4 flex items-center justify-between gap-4'>
        <div className='min-w-0'>
          <div className='font-medium truncate'>{p.title}</div>
          <div className='text-[11px] text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-1'>
            <span>Status: <span className={p.status==='published'?'text-green-600':'text-amber-600'}>{p.status}</span></span>
            {p.published_at && <span>Publicado: {new Date(p.published_at).toLocaleDateString('pt-BR')}</span>}
            <span>{p.read_time_min} min</span>
            {typeof p.views === 'number' && <span>{p.views} views</span>}
            {p.category && <span>Categoria: {p.category}</span>}
            <span className='text-gray-400'>/blog/{p.slug}</span>
          </div>
        </div>
        <div className='flex gap-2 shrink-0'>
          <Link to={`/blog/${p.slug}`} target='_blank'><Button variant='secondary'>Ver</Button></Link>
          <Link to={`/admin/blog/edit/${p.id}`}><Button variant='secondary'>Editar</Button></Link>
        </div>
      </Card>)}
    </div>
    {total>limit && <div className='flex justify-center gap-4 mt-6'>
      <Button variant='secondary' disabled={page===1} onClick={()=> setPage(p=> p-1)}>Anterior</Button>
      <span className='text-sm text-gray-600'>Página {page} de {Math.ceil(total/limit)}</span>
      <Button variant='secondary' disabled={page>= Math.ceil(total/limit)} onClick={()=> setPage(p=> p+1)}>Próxima</Button>
    </div>}
  </div>;
};

export default BlogAdminListPage;
