/**
 * Brand Scraper — Extracts logo and brand colors from a league's website.
 * 
 * Uses a CORS proxy to fetch the page HTML, then parses:
 * - Favicon / apple-touch-icon for logo
 * - Open Graph image (og:image) for logo
 * - Theme color meta tag
 * - Dominant colors from CSS custom properties or inline styles
 */

export interface ScrapedBrand {
  logoUrl: string | null;
  colors: string[];
  siteName: string | null;
  description: string | null;
}

/**
 * Attempt to extract brand assets from a website URL.
 * Uses allorigins.win as a CORS proxy for client-side fetching.
 */
export async function scrapeWebsiteBrand(url: string): Promise<ScrapedBrand> {
  const result: ScrapedBrand = {
    logoUrl: null,
    colors: [],
    siteName: null,
    description: null,
  };

  try {
    // Normalize URL
    if (!url.startsWith('http')) url = 'https://' + url;
    const baseUrl = new URL(url);
    const origin = baseUrl.origin;

    // Fetch via CORS proxy
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw new Error(`Failed to fetch: ${response.status}`);
    const html = await response.text();

    // Parse with DOMParser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // ── Extract site name ──
    const ogSiteName = doc.querySelector('meta[property="og:site_name"]');
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    const titleTag = doc.querySelector('title');
    result.siteName = ogSiteName?.getAttribute('content')
      || ogTitle?.getAttribute('content')
      || titleTag?.textContent
      || null;

    // ── Extract description ──
    const ogDesc = doc.querySelector('meta[property="og:description"]');
    const metaDesc = doc.querySelector('meta[name="description"]');
    result.description = ogDesc?.getAttribute('content')
      || metaDesc?.getAttribute('content')
      || null;

    // ── Extract logo ──
    // Priority: og:image > apple-touch-icon > large favicon > favicon
    const ogImage = doc.querySelector('meta[property="og:image"]');
    const appleTouchIcon = doc.querySelector('link[rel="apple-touch-icon"]')
      || doc.querySelector('link[rel="apple-touch-icon-precomposed"]');
    const icon192 = doc.querySelector('link[rel="icon"][sizes="192x192"]')
      || doc.querySelector('link[rel="icon"][sizes="180x180"]')
      || doc.querySelector('link[rel="icon"][sizes="128x128"]');
    const favicon = doc.querySelector('link[rel="icon"]')
      || doc.querySelector('link[rel="shortcut icon"]');

    const logoSrc = ogImage?.getAttribute('content')
      || appleTouchIcon?.getAttribute('href')
      || icon192?.getAttribute('href')
      || favicon?.getAttribute('href');

    if (logoSrc) {
      // Resolve relative URLs
      try {
        result.logoUrl = new URL(logoSrc, origin).href;
      } catch {
        result.logoUrl = logoSrc.startsWith('http') ? logoSrc : `${origin}${logoSrc.startsWith('/') ? '' : '/'}${logoSrc}`;
      }
    } else {
      // Fallback: try /favicon.ico
      result.logoUrl = `${origin}/favicon.ico`;
    }

    // ── Extract colors ──
    const foundColors: Set<string> = new Set();

    // 1. Theme color meta tag
    const themeColor = doc.querySelector('meta[name="theme-color"]');
    if (themeColor?.getAttribute('content')) {
      foundColors.add(themeColor.getAttribute('content')!);
    }

    // 2. MS tile color
    const msColor = doc.querySelector('meta[name="msapplication-TileColor"]');
    if (msColor?.getAttribute('content')) {
      foundColors.add(msColor.getAttribute('content')!);
    }

    // 3. Scan inline styles and style tags for hex colors
    const styleContent = Array.from(doc.querySelectorAll('style'))
      .map(s => s.textContent || '')
      .join(' ');
    
    // Also check inline styles on key elements
    const bodyStyle = doc.querySelector('body')?.getAttribute('style') || '';
    const headerStyle = doc.querySelector('header')?.getAttribute('style') || '';
    const navStyle = doc.querySelector('nav')?.getAttribute('style') || '';
    const allStyles = styleContent + ' ' + bodyStyle + ' ' + headerStyle + ' ' + navStyle;

    // Extract hex colors (skip very common ones like #fff, #000, #333, etc.)
    const hexPattern = /#([0-9a-fA-F]{3,8})\b/g;
    const skipColors = new Set([
      '000', '000000', 'fff', 'ffffff', '333', '333333', '666', '666666',
      '999', '999999', 'ccc', 'cccccc', 'ddd', 'dddddd', 'eee', 'eeeeee',
      'f5f5f5', 'e5e5e5', 'fafafa', 'f0f0f0', '111', '111111', '222', '222222',
      '444', '444444', '555', '555555', '777', '777777', '888', '888888',
      'aaa', 'aaaaaa', 'bbb', 'bbbbbb',
    ]);

    let match;
    while ((match = hexPattern.exec(allStyles)) !== null) {
      const hex = match[1].toLowerCase();
      if (!skipColors.has(hex) && hex.length >= 3) {
        foundColors.add('#' + hex);
      }
    }

    result.colors = Array.from(foundColors).slice(0, 6);

  } catch (err) {
    console.warn('Brand scrape failed:', err);
  }

  return result;
}

/**
 * Generate a dimmed version of a hex color (for hover states).
 */
export function dimColor(hex: string, amount = 0.3): string {
  try {
    const clean = hex.replace('#', '');
    const full = clean.length === 3
      ? clean.split('').map(c => c + c).join('')
      : clean;
    const r = Math.round(parseInt(full.slice(0, 2), 16) * (1 - amount));
    const g = Math.round(parseInt(full.slice(2, 4), 16) * (1 - amount));
    const b = Math.round(parseInt(full.slice(4, 6), 16) * (1 - amount));
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  } catch {
    return hex;
  }
}
