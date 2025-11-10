import { Routes, Route } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';

// Componentes de Layout
import ProtectedRoute from './components/common/ProtectedRoute'; // O "Gatekeeper"

function App() {
  return (
    <div>
      <main className="container mx-auto p-4">
        <Routes>
          {/* --- Rotas Públicas --- */}
          <Route path="/login" element={<LoginPage />} />
          {/* <Route path="/register" element={<RegisterPage />} /> */}

          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;