import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import Dashboard from '../Dashboard';
import { renderWithProviders } from '../../test/test-utils';

// Mock the api module
vi.mock('../../lib/api', () => ({
  api: {
    getStats: vi.fn().mockResolvedValue({
      total_documents: 5,
      total_chunks: 120,
      ollama_status: 'connected',
      documents_by_status: { ready: 5 },
      documents_by_type: { '.pdf': 3, '.docx': 2 },
    }),
    getDocuments: vi.fn().mockResolvedValue({ documents: [], total: 0 }),
    getActivityLog: vi.fn().mockResolvedValue({ activity: [] }),
  },
  isDemoMode: vi.fn().mockReturnValue(false),
}));

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard heading', () => {
    renderWithProviders(<Dashboard />, {
      auth: {
        isAuthenticated: true,
        user: {
          id: '1', email: 'test@example.com', full_name: 'Test',
          role: 'admin', organization_id: 'org-1', organization_name: 'Org',
        },
      },
    });
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders smart search section', () => {
    renderWithProviders(<Dashboard />, {
      auth: { isAuthenticated: true },
    });
    expect(screen.getByText('Smart Search')).toBeInTheDocument();
  });

  it('renders quick action links', () => {
    renderWithProviders(<Dashboard />, {
      auth: { isAuthenticated: true },
    });
    expect(screen.getByText('Upload Documents')).toBeInTheDocument();
    expect(screen.getByText('Document Q&A')).toBeInTheDocument();
    expect(screen.getByText('View Analytics')).toBeInTheDocument();
  });

  it('shows privacy footer', () => {
    renderWithProviders(<Dashboard />, {
      auth: { isAuthenticated: true },
    });
    expect(screen.getByText('100% Local Processing')).toBeInTheDocument();
  });
});
