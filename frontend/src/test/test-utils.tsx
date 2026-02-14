import { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext, type AuthContextType } from '../lib/auth';
import { ToastProvider } from '../components/Toast';

const defaultAuth: AuthContextType = {
  user: null,
  tokens: null,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  isAuthenticated: false,
};

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  auth?: Partial<AuthContextType>;
  route?: string;
}

export function renderWithProviders(
  ui: ReactElement,
  { auth = {}, route = '/', ...options }: CustomRenderOptions = {},
) {
  const authValue: AuthContextType = { ...defaultAuth, ...auth };

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <AuthContext.Provider value={authValue}>
        <ToastProvider>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </ToastProvider>
      </AuthContext.Provider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}
