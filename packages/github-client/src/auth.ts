import * as jwt from 'jsonwebtoken';

const GITHUB_API = 'https://api.github.com';

/**
 * Signs a short-lived JWT (10 min max) using the GitHub App's private key.
 * The JWT is used only to exchange for an installation token — never sent to GitHub directly
 * for user-facing operations.
 */
function signAppJwt(appId: string, privateKey: string): string {
  const now = Math.floor(Date.now() / 1000);
  return jwt.sign(
    { iat: now - 60, exp: now + 540, iss: appId },
    privateKey,
    { algorithm: 'RS256' },
  );
}

/**
 * Returns a short-lived installation access token (~1 hour TTL) for the given
 * GitHub App installation. Call this fresh per webhook invocation — do not cache.
 */
export async function getInstallationToken(
  appId: string,
  privateKey: string,
  installationId: string,
): Promise<string> {
  const appJwt = signAppJwt(appId, privateKey);

  const res = await fetch(
    `${GITHUB_API}/app/installations/${installationId}/access_tokens`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${appJwt}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    },
  );

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`GitHub auth failed (${res.status}): ${body}`);
  }

  const data = (await res.json()) as { token: string };
  return data.token;
}
