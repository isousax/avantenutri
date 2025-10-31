/**
 * YouTube URL processing utilities
 */

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
    /m\.youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
}

/**
 * Check if a URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  return extractYouTubeId(url) !== null;
}

/**
 * Generate YouTube embed HTML
 */
export function createYouTubeEmbed(videoId: string, options?: {
  width?: number;
  height?: number;
  autoplay?: boolean;
  privacy?: boolean; // Use youtube-nocookie.com
}): string {
  const {
    width = 560,
    height = 315,
    autoplay = false,
    privacy = true
  } = options || {};

  const domain = privacy ? 'youtube-nocookie.com' : 'youtube.com';
  const params = new URLSearchParams();
  
  if (autoplay) {
    params.set('autoplay', '1');
  }

  // Add privacy and UX improvements
  params.set('rel', '0'); // Don't show related videos
  params.set('modestbranding', '1'); // Minimal YouTube branding
  params.set('enablejsapi', '1'); // Enable JavaScript API

  const paramString = params.toString();
  const src = `https://www.${domain}/embed/${videoId}${paramString ? '?' + paramString : ''}`;

  return `<iframe 
    src="${src}" 
    width="${width}" 
    height="${height}" 
    frameborder="0" 
    allowfullscreen 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    class="my-4 mx-auto block max-w-full"
    style="aspect-ratio: 16/9;"
    loading="lazy"
  ></iframe>`;
}

/**
 * Convert YouTube URLs in text to embeds
 */
export function convertYouTubeUrls(html: string): string {
  // Find YouTube URLs that are not already in iframes or links
  const urlPattern = /(?<!<iframe[^>]*src=["']|<a[^>]*href=["'])https?:\/\/(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^<\s]*)?(?!["'][^>]*>)/gi;
  
  return html.replace(urlPattern, (match) => {
    const videoId = extractYouTubeId(match);
    if (!videoId) return match;
    
    return createYouTubeEmbed(videoId, {
      width: 560,
      height: 315,
      privacy: true
    });
  });
}

/**
 * Extract YouTube thumbnail URL
 */
export function getYouTubeThumbnail(videoId: string, quality: 'default' | 'medium' | 'high' | 'standard' | 'maxres' = 'medium'): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}default.jpg`;
}