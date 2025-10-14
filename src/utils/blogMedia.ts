import { API } from '../config/api';
import { extractBlogMediaPath } from './image';

export async function deleteBlogMediaByUrl(url: string, getAccessToken?: () => Promise<string | null | undefined>) {
  const path = extractBlogMediaPath(url);
  if (!path) return;
  try {
    const token = await getAccessToken?.();
    const normalized = path.includes('%2F') ? decodeURIComponent(path) : path;
    const urlPath = encodeURI(normalized);
    await fetch(API.BLOG_MEDIA_UPLOAD + '/' + urlPath, {
      method: 'DELETE',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    // ignore
  }
}
