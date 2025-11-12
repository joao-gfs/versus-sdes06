import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CreateUserPage from "./pages/CreateUserPage";
import OrganizacoesPage from "./pages/OrganizacoesPage";
import OrganizacaoFormPage from "./pages/OrganizacaoFormPage";

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

        <Route
          path="/organizacoes"
          element={
            <ProtectedRoute>
              <OrganizacoesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizacoes/nova"
          element={
            <ProtectedRoute>
              <OrganizacaoFormPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/organizacoes/editar/:id"
          element={
            <ProtectedRoute>
              <OrganizacaoFormPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
