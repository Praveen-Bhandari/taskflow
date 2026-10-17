import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useTheme from '../hooks/useTheme';

export default function Layout() {
  const { user, logout } = useAuth();
  const { theme, toggle } = useTheme();

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
          <button
            className="btn btn-outline"
            onClick={toggle}
            aria-label="Toggle dark mode"
          >
            {theme === 'dark' ? 'Light mode' : 'Dark mode'}
          </button>
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