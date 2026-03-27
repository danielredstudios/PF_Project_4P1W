import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth/AuthContext';
import PrivateRoute from './auth/PrivateRoute';
import AdminRoute from './auth/AdminRoute';

import Login from './pages/Login';
import Register from './pages/Register';
import Packs from './pages/Packs';
import Play from './pages/Play';
import Profile from './pages/Profile';
import AdminImages from './pages/admin/AdminImages';
import AdminTags from './pages/admin/AdminTags';
import AdminPacks from './pages/admin/AdminPacks';
import AdminPuzzles from './pages/admin/AdminPuzzles';

function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar">
      <Link to="/" className="brand">4 Pics 1 Word</Link>
      <div className="links">
        {user ? (
          <>
            {user.role === 'admin' && (
              <>
                <Link to="/admin/images">Images</Link>
                <Link to="/admin/tags">Tags</Link>
                <Link to="/admin/puzzles">Puzzles</Link>
                <Link to="/admin/packs">Manage Packs</Link>
              </>
            )}
            <Link to="/packs">Play</Link>
            <Link to="/profile">Profile</Link>
            <a href="#" onClick={(e) => { e.preventDefault(); logout(); }}>Logout</a>
          </>
        ) : (
          <>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Player Routes */}
          <Route path="/packs" element={<PrivateRoute><Packs /></PrivateRoute>} />
          <Route path="/play/:packId" element={<PrivateRoute><Play /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/images" element={<AdminRoute><AdminImages /></AdminRoute>} />
          <Route path="/admin/tags" element={<AdminRoute><AdminTags /></AdminRoute>} />
          <Route path="/admin/puzzles" element={<AdminRoute><AdminPuzzles /></AdminRoute>} />
          <Route path="/admin/packs" element={<AdminRoute><AdminPacks /></AdminRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
