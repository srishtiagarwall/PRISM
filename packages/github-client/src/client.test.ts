import { fetchPRFiles, postPRComment } from './client';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const TOKEN = 'ghs_test';
const OWNER = 'acme';
const REPO = 'backend';
const PR = 42;

describe('fetchPRFiles', () => {
  afterEach(() => jest.resetAllMocks());

  it('fetches a single page and returns files', async () => {
    const files = [
      { filename: 'src/payments/retry.ts', patch: '@@...', status: 'modified' },
    ];
    mockFetch.mockResolvedValue({ ok: true, json: async () => files });

    const result = await fetchPRFiles(TOKEN, OWNER, REPO, PR);
    expect(result).toEqual(files);
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url] = mockFetch.mock.calls[0] as [string];
    expect(url).toContain(`/repos/${OWNER}/${REPO}/pulls/${PR}/files`);
  });

  it('paginates until an empty page is returned', async () => {
    const page1 = Array.from({ length: 100 }, (_, i) => ({
      filename: `file-${i}.ts`,
      patch: '',
      status: 'modified',
    }));
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => page1 })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    const result = await fetchPRFiles(TOKEN, OWNER, REPO, PR);
    expect(result).toHaveLength(100);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it('logs a warning when file count hits the truncation limit', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const bigBatch = Array.from({ length: 3000 }, (_, i) => ({
      filename: `file-${i}.ts`,
      patch: '',
      status: 'modified',
    }));
    // Return 3000 files in one shot then empty to stop pagination
    mockFetch
      .mockResolvedValueOnce({ ok: true, json: async () => bigBatch })
      .mockResolvedValueOnce({ ok: true, json: async () => [] });

    await fetchPRFiles(TOKEN, OWNER, REPO, PR);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('truncated'));
    warnSpy.mockRestore();
  });

  it('throws when GitHub returns an error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 404, text: async () => 'Not Found' });
    await expect(fetchPRFiles(TOKEN, OWNER, REPO, PR)).rejects.toThrow('fetchPRFiles failed (404)');
  });
});

describe('postPRComment', () => {
  afterEach(() => jest.resetAllMocks());

  it('posts to the issues comments endpoint', async () => {
    mockFetch.mockResolvedValue({ ok: true });

    await postPRComment(TOKEN, OWNER, REPO, PR, '## PRISM context card');

    const [url, options] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(`https://api.github.com/repos/${OWNER}/${REPO}/issues/${PR}/comments`);
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body as string)).toEqual({ body: '## PRISM context card' });
  });

  it('throws when GitHub returns an error', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 403, text: async () => 'Forbidden' });
    await expect(
      postPRComment(TOKEN, OWNER, REPO, PR, 'body'),
    ).rejects.toThrow('postPRComment failed (403)');
  });
});
