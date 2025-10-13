// Blog service client
// Provides typed helpers for blog API

const BASE = import.meta.env.VITE_API_AUTH_BASE || 'https://login-service.avantenutri.workers.dev';

export interface BlogListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  tags: string[];
  cover_image_url?: string;
  read_time_min: number;
  published_at?: string;
  status?: string;
  views?: number;
}

export interface BlogListResponse {
  ok: boolean;
  page: number;
  limit: number;
  total: number;
  results: BlogListItem[];
}

export interface BlogPostDetail {
  id: string;
  slug: string;
  title: string;
  excerpt?: string;
  content_html: string;
  author_name?: string;
  category?: string;
  tags: string[];
  cover_image_url?: string;
  status: 'draft' | 'published' | 'archived';
  read_time_min: number;
  published_at?: string;
  created_at?: string;
  updated_at?: string;
  views?: number;
}

export interface BlogPostResponse { ok: boolean; post: BlogPostDetail }

export async function fetchPosts(params: { page?: number; limit?: number; search?: string; category?: string; tag?: string; status?: 'draft' | 'published' | 'archived'; preview?: boolean; accessToken?: string } = {}): Promise<BlogListResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  if (params.category && params.category !== 'todos') qs.set('category', params.category);
  if (params.tag) qs.set('tag', params.tag);
  if (params.status) qs.set('status', params.status);
  if (params.preview) qs.set('preview', '1');
  const headers: Record<string, string> = {};
  if (params.preview && params.accessToken) {
    headers['Authorization'] = `Bearer ${params.accessToken}`;
  }
  const res = await fetch(`${BASE}/blog/posts?${qs.toString()}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function fetchCategories(): Promise<{ ok: boolean; categories: { category: string; count: number }[] }> {
  const res = await fetch(`${BASE}/blog/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function fetchPost(slug: string, preview = false, accessToken?: string): Promise<BlogPostResponse> {
  const qs = preview ? '?preview=1' : '';
  const headers: Record<string, string> = {};
  if (preview && accessToken) headers['Authorization'] = `Bearer ${accessToken}`;
  const res = await fetch(`${BASE}/blog/posts/${slug}${qs}`, { headers });
  if (!res.ok) throw new Error('Failed to fetch post');
  return res.json();
}

export async function fetchRelated(slug: string): Promise<{ ok: boolean; results: BlogListItem[] }> {
  const res = await fetch(`${BASE}/blog/posts/${slug}/related`);
  if (!res.ok) throw new Error('Failed to fetch related');
  return res.json();
}

export async function updatePostStatus(id: string, status: 'draft' | 'published' | 'archived', accessToken: string): Promise<{ ok: boolean }> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`,
  };
  const res = await fetch(`${BASE}/blog/posts/${id}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || 'Failed to update status');
  }
  return res.json();
}
