import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Signup from './pages/Signup';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import api from './services/api';

// Mock api service
jest.mock('./services/api');

const DummyDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <h1>Dashboard View</h1>
      <p>Welcome, {user?.name}</p>
      <button
        onClick={() => {
          logout();
          navigate('/login');
        }}
      >
        Sign Out
      </button>
    </div>
  );
};

describe('Authentication Flow Integration', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // Scenario 1: Register a new account -> automatically redirect to login
  test('Scenario 1: successful registration shows success banner and redirects to /login without auto-login', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        message: 'User registered successfully.',
        data: {
          token: 'jwt.mock.token',
          user: { id: 'u1', name: 'John Doe', email: 'john@example.com', role: 'staff' },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your full name/i), {
      target: { value: 'John Doe' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Create a password/i), {
      target: { value: 'Secret123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    // 1. Success message is shown immediately
    await waitFor(() => {
      expect(
        screen.getByText(/Account created successfully! Redirecting to login.../i)
      ).toBeInTheDocument();
    });

    // 2. User is NOT automatically logged in (no tokens stored in localStorage)
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();

    // 3. Button is disabled while redirecting
    expect(screen.getByRole('button', { name: /Redirecting.../i })).toBeDisabled();

    // 4. After redirect timer, redirected to /login with prefilled email and banner
    await waitFor(
      () => {
        expect(screen.getByRole('heading', { name: /Welcome Back!/i })).toBeInTheDocument();
        expect(
          screen.getByText(/Account created successfully! Please sign in with your credentials./i)
        ).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/Enter your email/i)).toHaveValue('john@example.com');
      },
      { timeout: 3000 }
    );
  });

  // Scenario 2: Register with an existing email -> show error without redirecting
  test('Scenario 2: registration with existing email shows error banner and stays on /signup', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        status: 409,
        data: {
          success: false,
          error: {
            code: 'DUPLICATE_EMAIL',
            message: 'A user with this email already exists.',
          },
        },
      },
      message: 'A user with this email already exists.',
    });

    render(
      <MemoryRouter initialEntries={['/signup']}>
        <AuthProvider>
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your full name/i), {
      target: { value: 'Duplicate User' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), {
      target: { value: 'duplicate@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Create a password/i), {
      target: { value: 'Secret123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Create Account/i }));

    // Displays error banner
    await waitFor(() => {
      expect(screen.getByText(/A user with this email already exists./i)).toBeInTheDocument();
    });

    // Remains on Signup page
    expect(screen.getByRole('heading', { name: /Create an Account/i })).toBeInTheDocument();
    // Submit button re-enabled
    expect(screen.getByRole('button', { name: /Create Account/i })).not.toBeDisabled();
  });

  // Scenario 3: Log in with newly registered credentials -> open dashboard
  test('Scenario 3: valid credentials log in user, save auth state, and navigate to dashboard', async () => {
    api.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          token: 'valid.jwt.token',
          user: { id: 'u1', name: 'John Doe', email: 'john@example.com', role: 'staff' },
        },
      },
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DummyDashboard />} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: 'Secret123!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    // Reaches dashboard view
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Dashboard View/i })).toBeInTheDocument();
      expect(screen.getByText(/Welcome, John Doe/i)).toBeInTheDocument();
    });

    // Token and user stored in localStorage
    expect(localStorage.getItem('authToken')).toBe('valid.jwt.token');
    expect(JSON.parse(localStorage.getItem('currentUser'))).toEqual({
      id: 'u1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'staff',
    });
  });

  // Scenario 4: Log in with incorrect credentials -> show error
  test('Scenario 4: invalid credentials display error message on login page', async () => {
    api.post.mockRejectedValueOnce({
      response: {
        status: 401,
        data: {
          success: false,
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password. Please try again.',
          },
        },
      },
      message: 'Invalid email or password. Please try again.',
    });

    render(
      <MemoryRouter initialEntries={['/login']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DummyDashboard />} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter your email/i), {
      target: { value: 'john@example.com' },
    });
    fireEvent.change(screen.getByPlaceholderText(/Enter your password/i), {
      target: { value: 'WrongPassword' },
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(
        screen.getByText(/Invalid email or password. Please try again./i)
      ).toBeInTheDocument();
    });

    // User is NOT logged in
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(screen.getByRole('heading', { name: /Welcome Back!/i })).toBeInTheDocument();
  });

  // Scenario 5: Refresh the dashboard -> preserve authentication if the token is valid
  test('Scenario 5: page refresh preserves authentication session from localStorage', () => {
    localStorage.setItem('authToken', 'persistent.jwt.token');
    localStorage.setItem(
      'currentUser',
      JSON.stringify({ id: 'u2', name: 'Preserved User', email: 'pers@test.io', role: 'admin' })
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DummyDashboard />} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Dashboard renders immediately without redirecting to login
    expect(screen.getByRole('heading', { name: /Dashboard View/i })).toBeInTheDocument();
    expect(screen.getByText(/Welcome, Preserved User/i)).toBeInTheDocument();
  });

  // Scenario 6: Log out -> clear authentication data and prevent unauthorized dashboard access
  test('Scenario 6: logout clears authentication data and blocks protected route', async () => {
    localStorage.setItem('authToken', 'persistent.jwt.token');
    localStorage.setItem(
      'currentUser',
      JSON.stringify({ id: 'u2', name: 'Preserved User', email: 'pers@test.io', role: 'admin' })
    );

    render(
      <MemoryRouter initialEntries={['/']}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DummyDashboard />} />
            </Route>
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    // Initial state: logged in
    expect(screen.getByRole('heading', { name: /Dashboard View/i })).toBeInTheDocument();

    // Click Sign Out
    fireEvent.click(screen.getByRole('button', { name: /Sign Out/i }));

    // Navigates to /login
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Welcome Back!/i })).toBeInTheDocument();
    });

    // Storage is cleared
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('currentUser')).toBeNull();
  });
});
