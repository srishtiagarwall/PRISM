import { buildDependencyMap } from './index';

describe('buildDependencyMap', () => {
  it('maps imports and inverts to importedBy', () => {
    const files = new Map([
      [
        'src/payments/retry.ts',
        `import { Queue } from '../queue/processor';
         import { notify } from '../notifications/email';
         import express from 'express';`,
      ],
      [
        'src/queue/processor.ts',
        `import { DB } from '../db/connection';`,
      ],
      [
        'src/notifications/email.ts',
        `import nodemailer from 'nodemailer';`,
      ],
    ]);

    const result = buildDependencyMap(files);

    const payments = result.find((m) => m.module === 'payments')!;
    expect(payments.imports).toEqual(['notifications', 'queue']);
    expect(payments.importedBy).toEqual([]);

    const queue = result.find((m) => m.module === 'queue')!;
    expect(queue.imports).toEqual(['db']);
    expect(queue.importedBy).toEqual(['payments']);

    const notifications = result.find((m) => m.module === 'notifications')!;
    expect(notifications.imports).toEqual([]);
    expect(notifications.importedBy).toEqual(['payments']);

    // db only appears as an import target — still included
    const db = result.find((m) => m.module === 'db')!;
    expect(db).toBeDefined();
    expect(db.importedBy).toEqual(['queue']);
  });

  it('does not add self-imports', () => {
    const files = new Map([
      ['src/payments/retry.ts', `import { util } from './helper';`],
    ]);
    const result = buildDependencyMap(files);
    const payments = result.find((m) => m.module === 'payments')!;
    expect(payments.imports).toEqual([]);
  });

  it('ignores external npm imports', () => {
    const files = new Map([
      ['src/auth/login.ts', `import bcrypt from 'bcrypt'; import jwt from 'jsonwebtoken';`],
    ]);
    const result = buildDependencyMap(files);
    expect(result).toHaveLength(1);
    expect(result[0].imports).toEqual([]);
  });

  it('returns empty array for empty input', () => {
    expect(buildDependencyMap(new Map())).toEqual([]);
  });

  it('returns sorted results', () => {
    const files = new Map([
      ['src/zebra/a.ts', `import { x } from '../alpha/x';`],
      ['src/alpha/x.ts', ``],
    ]);
    const result = buildDependencyMap(files);
    expect(result.map((m) => m.module)).toEqual(['alpha', 'zebra']);
  });
});
