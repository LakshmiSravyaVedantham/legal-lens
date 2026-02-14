import { describe, it, expect, beforeEach } from 'vitest';
import { saveAuth, loadAuth, clearAuth, type User, type AuthTokens } from '../auth';

const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'admin',
  organization_id: 'org-1',
  organization_name: 'Test Org',
};

const mockTokens: AuthTokens = {
  access_token: 'access-123',
  refresh_token: 'refresh-456',
  token_type: 'bearer',
};

describe('auth storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('saves and loads auth data', () => {
    saveAuth(mockUser, mockTokens);
    const { user, tokens } = loadAuth();
    expect(user).toEqual(mockUser);
    expect(tokens).toEqual(mockTokens);
  });

  it('returns nulls when nothing is stored', () => {
    const { user, tokens } = loadAuth();
    expect(user).toBeNull();
    expect(tokens).toBeNull();
  });

  it('clears stored auth data', () => {
    saveAuth(mockUser, mockTokens);
    clearAuth();
    const { user, tokens } = loadAuth();
    expect(user).toBeNull();
    expect(tokens).toBeNull();
  });

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem('legallens_tokens', 'not-json');
    const { user, tokens } = loadAuth();
    expect(user).toBeNull();
    expect(tokens).toBeNull();
  });
});
