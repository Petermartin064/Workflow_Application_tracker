import { BrowserRouter, Routes, Route, NavLink, useNavigate } from "react-router-dom";
import { Zap, LayoutList, Plus, Search, LogIn, LogOut, User } from "lucide-react";
import ApplicationList from "./pages/ApplicationList";
import ApplicationForm from "./pages/ApplicationForm";
import ApplicationDetail from "./pages/ApplicationDetail";
import LoginModal from "./components/LoginModal";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { useState } from "react";
import "./index.css";

function Sidebar() {
  const { role, username, logout } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      navigate(`/?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div className="sidebar-header">
        <div className="brand-icon">
          <Zap size={16} />
        </div>
        <span className="brand-name">WorkflowTracker</span>
      </div>

      {/* Search */}
      <div className="sidebar-search">
        <div className="sidebar-search-box">
          <Search size={13} />
          <input 
            placeholder="Search…" 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          <span className="nav-section-label">My Hub</span>
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <LayoutList size={15} />
            Applications
          </NavLink>
          {role === "Applicant" && (
            <NavLink
              to="/applications/new"
              className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
            >
              <Plus size={15} />
              New Application
            </NavLink>
          )}
        </div>


      </nav>

      {/* User */}
      <div className="sidebar-footer">
        {role !== "Guest" ? (
          <div className="sidebar-user">
            <div className="sidebar-avatar">{username ? username.charAt(0).toUpperCase() : "U"}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{username}</div>
              <div className="sidebar-user-role" style={{ display: "flex", alignItems: "center", gap: 5 }}>
                {role === "Admin" ? "Reviewer" : "Applicant"}
                <button className="btn btn-ghost btn-sm" onClick={logout} style={{ padding: 2, marginLeft: 10 }} title="Log out">
                  <LogOut size={12} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "flex-start" }} onClick={() => setShowLogin(true)}>
            <LogIn size={15} /> Log In / Register
          </button>
        )}
      </div>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </aside>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">
            <Routes>
              <Route path="/" element={<ApplicationList />} />
              <Route path="/applications/new" element={<ApplicationForm />} />
              <Route path="/applications/:id/edit" element={<ApplicationForm />} />
              <Route path="/applications/:id" element={<ApplicationDetail />} />
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
