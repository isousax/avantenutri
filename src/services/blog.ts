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

export async function fetchPosts(params: { page?: number; limit?: number; search?: string; category?: string; tag?: string; preview?: boolean } = {}): Promise<BlogListResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  if (params.search) qs.set('search', params.search);
  if (params.category && params.category !== 'todos') qs.set('category', params.category);
  if (params.tag) qs.set('tag', params.tag);
  if (params.preview) qs.set('preview', '1');
  const res = await fetch(`${BASE}/blog/posts?${qs.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch posts');
  return res.json();
}

export async function fetchCategories(): Promise<{ ok: boolean; categories: { category: string; count: number }[] }> {
  const res = await fetch(`${BASE}/blog/categories`);
  if (!res.ok) throw new Error('Failed to fetch categories');
  return res.json();
}

export async function fetchPost(slug: string, preview = false): Promise<any> {
  const qs = preview ? '?preview=1' : '';
  const res = await fetch(`${BASE}/blog/posts/${slug}${qs}`);
  if (!res.ok) throw new Error('Failed to fetch post');
  return res.json();
}

export async function fetchRelated(slug: string): Promise<{ ok: boolean; results: BlogListItem[] }> {
  const res = await fetch(`${BASE}/blog/posts/${slug}/related`);
  if (!res.ok) throw new Error('Failed to fetch related');
  return res.json();
}
