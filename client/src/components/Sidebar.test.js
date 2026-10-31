import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Sidebar from './Sidebar';
import { AuthContext } from '../context/AuthContext';

const mockLogout = jest.fn();
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('Sidebar Component Layout and Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderSidebar = (userRole = 'admin') => {
    const authValue = {
      user: { name: 'Aryan Sharma', role: userRole },
      logout: mockLogout,
      login: jest.fn(),
      isAuthenticated: true,
    };

    return render(
      <MemoryRouter initialEntries={['/']}>
        <AuthContext.Provider value={authValue}>
          <Sidebar />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  test('Requirement 1 & 2: Renders sidebar element with brand logo and application name at the top', () => {
    renderSidebar();

    expect(screen.getByText('Subscribly')).toBeInTheDocument();
    expect(screen.getByText('Management Portal')).toBeInTheDocument();
  });

  test('Requirement 3: Renders all main menu navigation items', () => {
    renderSidebar('admin');

    const expectedItems = [
      'Dashboard',
      'Products',
      'Plans',
      'Customers',
      'Subscriptions',
      'Invoices',
      'Payments',
      'Staff',
    ];

    expectedItems.forEach((name) => {
      expect(screen.getByRole('link', { name: new RegExp(name, 'i') })).toBeInTheDocument();
    });
  });

  test('Requirement 4: Anchors Settings, Logout, and User Profile at the bottom', () => {
    renderSidebar('staff');

    // Settings link
    expect(screen.getByRole('link', { name: /Settings/i })).toBeInTheDocument();

    // Logout button
    const logoutBtn = screen.getByRole('button', { name: /Logout/i });
    expect(logoutBtn).toBeInTheDocument();

    // User Profile
    expect(screen.getByText('Aryan Sharma')).toBeInTheDocument();
    expect(screen.getByText('staff')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument(); // Avatar initial
  });

  test('Requirement 5: Logout button invokes logout and navigates to /login', () => {
    renderSidebar();

    const logoutBtn = screen.getByRole('button', { name: /Logout/i });
    fireEvent.click(logoutBtn);

    expect(mockLogout).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  test('Role-based navigation: Staff role does NOT see the Staff management link', () => {
    renderSidebar('staff');

    expect(screen.queryByRole('link', { name: /^Staff$/i })).not.toBeInTheDocument();
  });
});
