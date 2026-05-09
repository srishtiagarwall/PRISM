import { getInstallationToken } from './auth';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('getInstallationToken', () => {
  afterEach(() => jest.resetAllMocks());

  it('posts to the correct endpoint and returns the token', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'ghs_test123' }),
    });

    // Use a minimal valid RSA private key stub — we mock fetch so JWT signing
    // needs a real key format but the request never leaves the process.
    const { generateKeyPairSync } = await import('crypto');
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;

    const token = await getInstallationToken('app-123', pem, 'install-456');

    expect(token).toBe('ghs_test123');
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.github.com/app/installations/install-456/access_tokens');
    expect(options.method).toBe('POST');
    expect((options.headers as Record<string, string>)['Accept']).toBe(
      'application/vnd.github+json',
    );
  });

  it('throws with status when GitHub returns an error', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    });

    const { generateKeyPairSync } = await import('crypto');
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;

    await expect(
      getInstallationToken('app-123', pem, 'install-456'),
    ).rejects.toThrow('GitHub auth failed (401)');
  });
});
