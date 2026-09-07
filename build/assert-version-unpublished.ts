/**
 * Refuses to start a publish when the manifest's version is already on the
 * registry.
 *
 * npm rejects a republish with E403 anyway, but only after the whole build has
 * run and the browser login has completed, and the message ("You cannot publish
 * over the previously published versions") reads like a permissions problem
 * rather than a forgotten version bump. This fails in a second, before anything
 * is built, and says what to do.
 *
 * Neither publish script picks a version: a script cannot know whether a change
 * is a patch or a break, and one that guessed would eventually ship a major as
 * a minor. So this checks, and leaves the decision where it belongs.
 *
 * Usage: assert-version-unpublished.ts <path to package.json>
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const manifestArg = process.argv[2];
if (!manifestArg) {
  console.error('Usage: assert-version-unpublished.ts <path to package.json>');
  process.exit(1);
}

const manifestPath = resolve(process.cwd(), manifestArg);
const { name, version } = JSON.parse(readFileSync(manifestPath, 'utf8')) as {
  name: string;
  version: string;
};

let publishedVersions: string[] = [];
try {
  const out = execFileSync('npm', ['view', name, 'versions', '--json'], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
  if (out) {
    const parsed = JSON.parse(out) as string | string[];
    publishedVersions = Array.isArray(parsed) ? parsed : [parsed];
  }
} catch (error) {
  // A package that has never been published is an E404, and publishing it is
  // exactly what this script should allow.
  const stderr =
    error && typeof error === 'object' && 'stderr' in error
      ? String(error.stderr)
      : '';
  if (!stderr.includes('E404')) {
    console.error(`Could not query npm for ${name}.`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (publishedVersions.includes(version)) {
  const [major = '0', minor = '0', patch = '0'] = version.split('.');
  const next = {
    patch: `${major}.${minor}.${Number(patch) + 1}`,
    minor: `${major}.${Number(minor) + 1}.0`,
    major: `${Number(major) + 1}.0.0`,
  };
  console.error(
    [
      `${name}@${version} is already published; npm does not allow republishing a version.`,
      '',
      `Set a new version in ${manifestArg}, then run \`bun run changelog\` and retry:`,
      `  ${next.patch}  no behaviour change for consumers`,
      `  ${next.minor}  new functionality, backward compatible`,
      `  ${next.major}  breaking — including a dependency moving to peerDependencies`,
    ].join('\n'),
  );
  process.exit(1);
}

console.log(`${name}@${version} is not on npm yet; safe to publish.`);
