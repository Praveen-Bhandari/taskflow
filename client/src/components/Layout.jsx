import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Layout() {
  const { user, logout } = useAuth();

  return (
    <div>
      <header className="navbar">
        <span className="brand">TaskFlow</span>
        <nav className="nav-links">
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/projects">Projects</NavLink>
          <NavLink to="/tasks">Tasks</NavLink>
        </nav>
        <div className="nav-user">
          <span>{user?.name}</span>
          <button className="btn btn-outline" onClick={logout}>Logout</button>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
    </div>
  );
}