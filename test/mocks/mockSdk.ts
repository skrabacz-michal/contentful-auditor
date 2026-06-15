import { vi } from 'vitest';

export const mockSdk: any = {
  ids: {
    app: 'test-app',
    space: 'test-space',
    environment: 'master',
  },
  location: {
    is: vi.fn().mockReturnValue(true),
  },
  navigator: {
    openEntry: vi.fn(),
    openContentType: vi.fn(),
  },
  cma: {
    contentType: {
      getMany: vi.fn().mockResolvedValue({ items: [], total: 0, skip: 0, limit: 1000 }),
    },
    entry: {
      getMany: vi.fn().mockResolvedValue({ items: [], total: 0, skip: 0, limit: 1000 }),
    },
    asset: {
      getMany: vi.fn().mockResolvedValue({ items: [], total: 0, skip: 0, limit: 1000 }),
    },
  },
};
