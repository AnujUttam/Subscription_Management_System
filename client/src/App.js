
import React from "react";
import { Routes, Route } from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";

import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import Plans from "./pages/Plans";
import Customers from "./pages/Customers";
import Subscriptions from "./pages/Subscriptions";
import Invoices from "./pages/Invoices";
import Payments from "./pages/Payments";

function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="/plans" element={<Plans />} />
        <Route path="/customers" element={<Customers />} />
        <Route path="/subscriptions" element={<Subscriptions />} />
        <Route path="/invoices" element={<Invoices />} />
        <Route path="/payments" element={<Payments />} />
      </Route>
    </Routes>
  );
}

export default App;
