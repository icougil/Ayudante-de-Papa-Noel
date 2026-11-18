// Stamps the published copy of index.html with the release's commit and date,
// so browsers fetch fresh scripts and stylesheets after each release.
const fs = require('node:fs');

const META_TAG = '<meta name="version" content="">';
const LOCAL_REFERENCE = /\b(src|href)="((?!https?:|\/)[^"?]+\.(?:js|css))"/g;

function formatVersion(date, commit) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Madrid',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23'
    }).formatToParts(date).map((part) => [part.type, part.value])
  );
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute} · ${commit.slice(0, 7)}`;
}

function stampRelease(html, commit, date) {
  if (!/^[0-9a-f]{7,40}$/.test(commit)) {
    throw new Error(`Commit must be 7 to 40 hexadecimal characters, got "${commit}"`);
  }
  if (!html.includes(META_TAG)) {
    throw new Error('Missing <meta name="version" content=""> in the page');
  }
  let found = 0;
  const stamped = html.replace(LOCAL_REFERENCE, (match, attribute, url) => {
    found += 1;
    return `${attribute}="${url}?v=${commit.slice(0, 7)}"`;
  });
  if (found === 0) {
    throw new Error('No local script or stylesheet reference found in the page');
  }
  return stamped.replace(META_TAG, `<meta name="version" content="${formatVersion(date, commit)}">`);
}

function main(argv) {
  const file = argv[2];
  if (!file) {
    console.log('Usage: node scripts/stamp-release.js <path/to/index.html>');
    process.exit(1);
  }
  try {
    const date = new Date();
    const commit = process.env.GITHUB_SHA;
    fs.writeFileSync(file, stampRelease(fs.readFileSync(file, 'utf8'), commit, date));
    console.log(`Stamped ${file} as ${formatVersion(date, commit)}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

if (require.main === module) main(process.argv);

module.exports = { formatVersion, stampRelease };
