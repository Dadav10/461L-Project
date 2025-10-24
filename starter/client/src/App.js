import React from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import MyLoginPage from './pages/MyLoginPage';
import MyRegistrationPage from './pages/MyRegistrationPage';
import MyUserPortal from './pages/MyUserPortal';
import ForgotMyPassword from './pages/ForgotMyPassword';
import ProjectDetails from './pages/ProjectDetails';
import HardwareList from './pages/HardwareList';
import { initSeed } from './lib/storage';
import './App.css';

function App() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  const location = useLocation();
  const onLogin = location.pathname === '/' || location.pathname === '/login';

  // initialize sample data for demo
  React.useEffect(()=>{ initSeed(); },[]);

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Team Project Portal</h1>
        <nav>
          {(!currentUser || onLogin) && <Link to="/login">Login</Link>}
          {(!currentUser || onLogin) && <Link to="/register">Register</Link>}
          {!onLogin && currentUser && <Link to="/portal">Portal</Link>}
          {!onLogin && currentUser && <button onClick={logout} className="btn btn-secondary">Logout</button>}
        </nav>
      </header>

      <main>
        <Routes>
          <Route path="/" element={<MyLoginPage />} />
          <Route path="/login" element={<MyLoginPage />} />
          <Route path="/register" element={<MyRegistrationPage />} />
          <Route path="/portal" element={<MyUserPortal />} />
          <Route path="/project/:id" element={<ProjectDetails />} />
          <Route path="/hardware" element={<HardwareList />} />
          <Route path="/forgot" element={<ForgotMyPassword />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;