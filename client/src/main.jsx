import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ItemsPage from './pages/ItemsPage.jsx';
import ItemDetailPage from './pages/ItemDetailPage.jsx';
import RegisterItemPage from './pages/RegisterItemPage.jsx';
import AccessLogsPage from './pages/AccessLogsPage.jsx';
import './styles.css';

function Layout({ children }) {
  const { user, logout } = useAuth();
  return <><nav><Link to="/items">Chain-of-Custody Vault</Link>{user && <><span>{user.name} · {user.role}</span><button onClick={logout}>Logout</button></>}</nav><main>{children}</main></>;
}

function App() {
  return <AuthProvider><BrowserRouter><Layout><Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/items" element={<ProtectedRoute permission="item:read"><ItemsPage /></ProtectedRoute>} />
    <Route path="/items/new" element={<ProtectedRoute permission="item:create"><RegisterItemPage /></ProtectedRoute>} />
    <Route path="/items/:id" element={<ProtectedRoute permission="item:read"><ItemDetailPage /></ProtectedRoute>} />
    <Route path="/audit" element={<ProtectedRoute permission="audit:read"><AccessLogsPage /></ProtectedRoute>} />
    <Route path="/403" element={<div className="card"><h1>403 Forbidden</h1><p>You do not have permission for this action.</p></div>} />
    <Route path="/404" element={<div className="card"><h1>404 Not found</h1></div>} />
    <Route path="*" element={<Navigate to="/items" replace />} />
  </Routes></Layout></BrowserRouter></AuthProvider>;
}

createRoot(document.getElementById('root')).render(<App />);
