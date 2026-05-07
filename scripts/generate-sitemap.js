const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const SITE_URL = 'https://stroy-zamer.ru';
const SITEMAP_PATHS = [
  path.join(root, 'sitemap.xml'),
  path.join(root, 'seo', 'sitemap.xml')
];

const pageSources = [
  { directory: '.', file: 'index.html', priority: '1.0' },
  { directory: 'calculators', priority: '0.9' },
  { directory: 'programmatic', priority: '0.8' },
  { directory: 'seo', priority: '0.5' }
];

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function normalizeRelativePath(relativePath) {
  return relativePath.replace(/\\/g, '/').replace(/^\/+/, '');
}

function isAllowedRelativePath(relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  return normalized
    && !normalized.startsWith('../')
    && !normalized.includes('/../')
    && !path.isAbsolute(normalized)
    && normalized.endsWith('.html');
}

function urlFromRelativePath(relativePath) {
  const normalized = normalizeRelativePath(relativePath);
  const urlPath = normalized === 'index.html' ? '/' : `/${normalized}`;
  return `${SITE_URL}${urlPath}`;
}

function relativePathFromUrl(loc) {
  if (!loc.startsWith(`${SITE_URL}/`)) {
    return null;
  }

  const urlPath = loc.slice(SITE_URL.length);
  if (urlPath === '/') {
    return 'index.html';
  }

  let decoded;
  try {
    decoded = decodeURI(urlPath).replace(/^\/+/, '');
  } catch {
    return null;
  }

  return isAllowedRelativePath(decoded) ? decoded : null;
}

function pageLastmod(relativePath) {
  return formatDate(fs.statSync(path.join(root, relativePath)).mtime);
}

function sitemapEntry({ loc, lastmod, priority }) {
  return `<url>
  <loc>${loc}</loc>
  <lastmod>${lastmod}</lastmod>
  <priority>${priority}</priority>
</url>`;
}

function htmlPagesIn(directory) {
  const absoluteDirectory = path.join(root, directory);
  if (!fs.existsSync(absoluteDirectory)) {
    return [];
  }

  return fs.readdirSync(absoluteDirectory)
    .filter((fileName) => fileName.endsWith('.html'))
    .sort()
    .map((fileName) => normalizeRelativePath(path.join(directory, fileName)))
    .filter(isAllowedRelativePath);
}

function discoverPages() {
  const pages = [];

  pageSources.forEach((source) => {
    if (source.file) {
      const relativePath = normalizeRelativePath(path.join(source.directory, source.file));
      if (fs.existsSync(path.join(root, relativePath)) && isAllowedRelativePath(relativePath)) {
        pages.push({ relativePath, priority: source.priority });
      }
      return;
    }

    htmlPagesIn(source.directory).forEach((relativePath) => {
      pages.push({ relativePath, priority: source.priority });
    });
  });

  return pages;
}

function readExistingEntries() {
  const entries = [];

  SITEMAP_PATHS.forEach((sitemapPath) => {
    if (!fs.existsSync(sitemapPath)) {
      return;
    }

    const xml = fs.readFileSync(sitemapPath, 'utf8');
    const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) || [];

    urlBlocks.forEach((block) => {
      const loc = block.match(/<loc>(.*?)<\/loc>/)?.[1]?.trim();
      const lastmod = block.match(/<lastmod>(.*?)<\/lastmod>/)?.[1]?.trim();
      const priority = block.match(/<priority>(.*?)<\/priority>/)?.[1]?.trim();

      if (!loc || !relativePathFromUrl(loc)) {
        return;
      }

      entries.push({
        loc,
        lastmod: /^\d{4}-\d{2}-\d{2}$/.test(lastmod || '') ? lastmod : formatDate(new Date()),
        priority: /^(?:0(?:\.\d+)?|1(?:\.0+)?)$/.test(priority || '') ? priority : '0.8'
      });
    });
  });

  return entries;
}

function buildEntries() {
  const entriesByLoc = new Map();

  readExistingEntries().forEach((entry) => {
    entriesByLoc.set(entry.loc, entry);
  });

  discoverPages().forEach(({ relativePath, priority }) => {
    const loc = urlFromRelativePath(relativePath);
    entriesByLoc.set(loc, {
      loc,
      lastmod: pageLastmod(relativePath),
      priority
    });
  });

  return Array.from(entriesByLoc.values()).sort((a, b) => {
    if (a.loc === `${SITE_URL}/`) return -1;
    if (b.loc === `${SITE_URL}/`) return 1;
    return a.loc.localeCompare(b.loc);
  });
}

function renderSitemap() {
  const entries = buildEntries().map(sitemapEntry).join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>\n`;
}

function writeSitemaps() {
  const sitemap = renderSitemap();

  SITEMAP_PATHS.forEach((sitemapPath) => {
    fs.mkdirSync(path.dirname(sitemapPath), { recursive: true });
    fs.writeFileSync(sitemapPath, sitemap, 'utf8');
  });

  return sitemap;
}

if (require.main === module) {
  writeSitemaps();
  console.log(`Sitemap updated: ${buildEntries().length} URLs`);
}

module.exports = {
  renderSitemap,
  writeSitemaps
};
