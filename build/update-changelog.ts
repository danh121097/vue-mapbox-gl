/**
 * Generates the changelog section for the version in `package.json` and injects
 * it under the `# Changelog` title in `docs/changelog.md`, preserving every
 * curated entry below it.
 *
 * This used to run in CI, which committed the result and pushed it to `master`.
 * That cannot work while `master` requires pull requests: the push is rejected
 * with GH006, the step fails, and the release step after it never runs — so a
 * protected branch silently meant no releases at all.
 *
 * Running it locally makes the changelog part of the same reviewed commit as
 * the version bump, and leaves CI with nothing to write back to the repository.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const rootDir = resolve(import.meta.dirname, '..');
const changelogPath = resolve(rootDir, 'docs/changelog.md');
const TITLE = '# Changelog';

const { version } = JSON.parse(
  readFileSync(resolve(rootDir, 'package.json'), 'utf8'),
) as { version: string };
const tag = `v${version}`;

let section: string;
try {
  section = execFileSync(
    'bunx',
    [
      'git-cliff@latest',
      '--unreleased',
      '--tag',
      tag,
      '--config',
      'cliff.toml',
    ],
    { cwd: rootDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  ).trim();
} catch (error) {
  console.error('git-cliff failed.');
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

if (!section) {
  console.log(`No unreleased commits for ${tag}; changelog left unchanged.`);
  process.exit(0);
}

const changelog = readFileSync(changelogPath, 'utf8');
if (!changelog.startsWith(TITLE)) {
  console.error(`docs/changelog.md does not start with "${TITLE}".`);
  process.exit(1);
}

// Refuse to stack a second section for a version already written up. Rerunning
// after amending commits is normal; silently duplicating the heading is not.
if (changelog.includes(`\n## ${tag}\n`)) {
  console.error(
    `docs/changelog.md already has a section for ${tag}. Remove it before regenerating.`,
  );
  process.exit(1);
}

const rest = changelog.slice(TITLE.length).replace(/^\n+/, '');
writeFileSync(changelogPath, `${TITLE}\n\n${section}\n\n${rest}`);

console.log(`Wrote the ${tag} section to docs/changelog.md. Review, then commit
it together with the version bump.`);
