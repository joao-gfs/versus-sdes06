import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CreateUserPage from "./pages/CreateUserPage";

// Componentes de Layout
import ProtectedRoute from "./components/common/ProtectedRoute"; // O "Gatekeeper"

function App() {
  return (
    <div className="mx-auto p-6">
      <Routes>
        {/* --- Rotas Públicas --- */}
        <Route path="/login" element={<LoginPage />} />

        {/* --- Rotas Protegidas --- */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <HomePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/criar-usuario"
          element={
            <ProtectedRoute>
              <CreateUserPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
