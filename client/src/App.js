
import React from "react";
import { Routes, Route } from "react-router-dom";

import Signup from "./pages/Signup";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";
import DashboardLayout from "./layouts/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Plans from "./pages/Plans";
import Customers from "./pages/Customers";
import Subscriptions from "./pages/Subscriptions";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <Routes>
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route element={<ProtectedRoute allowedRoles={["admin", "staff"]} />}>
    <Route element={<DashboardLayout />}>
      <Route path="/" element={<Dashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/plans" element={<Plans />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/subscriptions" element={<Subscriptions />} />
      <Route path="/invoices" element={<Invoices />} />
      <Route path="/payments" element={<Payments />} />
    </Route>
  </Route>
    </Routes>
  );
}

export default App;
