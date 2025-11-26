import { Routes, Route } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import CreateUserPage from "./pages/CreateUserPage";
import OrganizacoesPage from "./pages/OrganizacoesPage";
import OrganizacaoFormPage from "./pages/OrganizacaoFormPage";
import UsuariosPage from "./pages/UsuariosPage";
import EquipesPage from "./pages/EquipesPage";
import EquipeFormPage from "./pages/EquipeFormPage";
import TournamentList from "./pages/TournamentList";
import TournamentForm from "./pages/TournamentForm";
import AtletasPage from "./pages/AtletasPage";
import AtletaFormPage from "./pages/AtletaFormPage";
import ChaveamentoPage from "./pages/ChaveamentoPage";
import PartidasPage from "./pages/PartidasPage";
import PartidaFormPage from "./pages/PartidaFormPage";

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
          path='/usuarios'
          element={
            <ProtectedRoute>
              <UsuariosPage />
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

        <Route
          path="/equipes"
          element={
            <ProtectedRoute>
              <EquipesPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/equipes/nova"
          element={
            <ProtectedRoute>
              <EquipeFormPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/equipes/editar/:id"
          element={
            <ProtectedRoute>
              <EquipeFormPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/torneios"
          element={
            <ProtectedRoute>
              <TournamentList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/torneios/novo"
          element={
            <ProtectedRoute>
              <TournamentForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/torneios/editar/:id"
          element={
            <ProtectedRoute>
              <TournamentForm />
            </ProtectedRoute>
          }
        />

        <Route
          path="/torneios/:id/chaveamento"
          element={
            <ProtectedRoute>
              <ChaveamentoPage />
            </ProtectedRoute>
          }
        />

        {/* Partidas */}
        <Route
          path="/partidas"
          element={
            <ProtectedRoute>
              <PartidasPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/partidas/:id/registrar"
          element={
            <ProtectedRoute>
              <PartidaFormPage />
            </ProtectedRoute>
          }
        />

        {/* Atletas */}
        <Route
          path="/atletas"
          element={
            <ProtectedRoute>
              <AtletasPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/atletas/novo"
          element={
            <ProtectedRoute>
              <AtletaFormPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/atletas/editar/:id"
          element={
            <ProtectedRoute>
              <AtletaFormPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
