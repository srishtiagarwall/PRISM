import type { PRFile } from './types';

const GITHUB_API = 'https://api.github.com';
const PR_FILES_TRUNCATION_LIMIT = 3000;

function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

/**
 * Fetches the list of files changed in a PR.
 * GitHub paginates this endpoint at 30 per page, max 3000 files total.
 * Fetches all pages and warns if the cap is hit.
 */
export async function fetchPRFiles(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<PRFile[]> {
  const allFiles: PRFile[] = [];
  let page = 1;

  while (true) {
    const res = await fetch(
      `${GITHUB_API}/repos/${owner}/${repo}/pulls/${prNumber}/files?per_page=100&page=${page}`,
      { headers: githubHeaders(token) },
    );

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`fetchPRFiles failed (${res.status}): ${body}`);
    }

    const batch = (await res.json()) as PRFile[];
    if (batch.length === 0) break;

    allFiles.push(...batch);
    if (batch.length < 100) break;
    page++;
  }

  if (allFiles.length >= PR_FILES_TRUNCATION_LIMIT) {
    console.warn(
      `[github-client] PR #${prNumber} has ${allFiles.length} files — GitHub diff may be truncated at 3000 files.`,
    );
  }

  return allFiles;
}

/**
 * Posts a markdown comment on a PR (uses the issues comments endpoint,
 * which is correct — PR comments are issue comments in GitHub's API).
 */
export async function postPRComment(
  token: string,
  owner: string,
  repo: string,
  prNumber: number,
  body: string,
): Promise<void> {
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/issues/${prNumber}/comments`,
    {
      method: 'POST',
      headers: {
        ...githubHeaders(token),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ body }),
    },
  );

  if (!res.ok) {
    const responseBody = await res.text();
    throw new Error(`postPRComment failed (${res.status}): ${responseBody}`);
  }
}
