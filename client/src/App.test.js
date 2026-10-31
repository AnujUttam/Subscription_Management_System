import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import App from './App';

test('renders Subscriptify application without crashing', () => {
  render(
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
  const brandElements = screen.getAllByText(/Subscriptify/i);
  expect(brandElements.length).toBeGreaterThan(0);
});
