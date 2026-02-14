import { describe, it, expect, beforeEach, vi } from 'vitest';
import { isDemoMode } from '../api';

describe('api module', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('isDemoMode returns false initially or boolean', () => {
    // isDemoMode starts as null (not yet determined) which is falsy
    const result = isDemoMode();
    expect(typeof result === 'boolean').toBe(true);
  });

  it('exports api object with expected methods', async () => {
    const { api } = await import('../api');
    expect(typeof api.getDocuments).toBe('function');
    expect(typeof api.search).toBe('function');
    expect(typeof api.chat).toBe('function');
    expect(typeof api.getStats).toBe('function');
    expect(typeof api.uploadDocument).toBe('function');
    expect(typeof api.getBookmarks).toBe('function');
    expect(typeof api.runAnalysis).toBe('function');
  });

  it('demo mode upload returns mock response', async () => {
    const { api } = await import('../api');
    // Force demo mode by making fetch fail
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const file = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const result = await api.uploadDocument(file);
    expect(result).toHaveProperty('id');
    expect(result).toHaveProperty('filename', 'test.pdf');
  });
});
