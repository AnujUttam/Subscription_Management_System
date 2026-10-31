import React, { createContext, useContext, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("currentUser");
    const token = localStorage.getItem("authToken");
    if (savedUser && token) {
      try {
        return JSON.parse(savedUser);
      } catch (e) {
        localStorage.removeItem("currentUser");
        localStorage.removeItem("authToken");
        return null;
      }
    }
    return null;
  });

  const login = (userData, token) => {
    setUser(userData);
    localStorage.setItem("currentUser", JSON.stringify(userData));
    if (token) {
      localStorage.setItem("authToken", token);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: Boolean(user && localStorage.getItem("authToken")),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
