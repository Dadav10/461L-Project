import React from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
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

  // initialize sample data for demo
  React.useEffect(()=>{ initSeed(); },[]);

  return (
    <div className="app-root">
      <header className="app-header">
        <h1>Team Project Portal</h1>
        <nav>
          {!currentUser && <Link to="/login">Login</Link>}
          {!currentUser && <Link to="/register">Register</Link>}
          {currentUser && <Link to="/portal">Portal</Link>}
          {currentUser && <button onClick={logout}>Logout</button>}
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
