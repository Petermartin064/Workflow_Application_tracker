import { useEffect, useState, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AlertTriangle, ClipboardList, Plus } from "lucide-react";
import { listApplications } from "../api/applications";
import type { ApplicationListItem, ApplicationStatus } from "../types";
import { APPLICATION_STATUSES } from "../types";
import StatusBadge from "../components/StatusBadge";
import { useAuth } from "../context/AuthContext";

const ALL_TABS: (ApplicationStatus | "All")[] = ["All", ...APPLICATION_STATUSES];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric", month: "short", day: "numeric",
  });
}

export default function ApplicationList() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const q = searchParams.get("q") || undefined;

  const [apps, setApps] = useState<ApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<ApplicationStatus | "All">("All");

  const fetchApps = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await listApplications(activeTab === "All" ? undefined : activeTab, q);
      setApps(data);
    } catch {
      setError("Failed to load applications. Is the backend running?");
    } finally {
      setLoading(false);
    }
  }, [activeTab, q]);

  useEffect(() => {
    fetchApps();
  }, [fetchApps]);

  // Compute stats from full list (use unfiltered count if "All" or show filtered)
  const statusCounts = APPLICATION_STATUSES.reduce((acc, s) => {
    acc[s] = apps.filter(a => a.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="animate-in">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Application <span>Tracker</span>
          </h1>
          <p className="page-subtitle">Manage and track all workflow applications</p>
        </div>
        {role === "Applicant" && (
          <button className="btn btn-dark" onClick={() => navigate("/applications/new")}>
            <Plus size={15} /> New Application
          </button>
        )}
      </div>

      {role !== "Guest" ? (
        <>
          {/* Stats Row */}
          {activeTab === "All" && !loading && (
            <div className="stats-row">
              <div className="stat-card">
                <div className="stat-value" style={{ color: "var(--color-primary)" }}>{apps.length}</div>
                <div className="stat-label">Total</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "var(--status-draft-text)" }}>{statusCounts["Draft"] || 0}</div>
                <div className="stat-label">Draft</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "var(--status-submitted-text)" }}>{statusCounts["Submitted"] || 0}</div>
                <div className="stat-label">Submitted</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "var(--status-review-text)" }}>{statusCounts["Under Review"] || 0}</div>
                <div className="stat-label">Under Review</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "var(--status-approved-text)" }}>{statusCounts["Approved"] || 0}</div>
                <div className="stat-label">Approved</div>
              </div>
              <div className="stat-card">
                <div className="stat-value" style={{ color: "var(--status-rejected-text)" }}>{statusCounts["Rejected"] || 0}</div>
                <div className="stat-label">Rejected</div>
              </div>
            </div>
          )}

          {/* Filter Tabs */}
          <div className="filter-tabs">
            {ALL_TABS.map(tab => (
              <button
                key={tab}
                id={`tab-${tab.replace(/\s+/g, "-")}`}
                className={`filter-tab ${activeTab === tab ? "active" : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="alert alert-danger" style={{ marginBottom: "1.5rem" }}>
              <AlertTriangle size={15} /> {error}
            </div>
          )}

          {/* Loading */}
          {loading ? (
            <div className="loading-spinner">
              <div className="spinner" />
              Loading applications…
            </div>
          ) : apps.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon"><ClipboardList size={48} strokeWidth={1.2} /></div>
              <h3>No applications found</h3>
              <p>
                {activeTab === "All"
                  ? "No applications have been created yet."
                  : `No applications with status "${activeTab}".`}
              </p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Tracking #</th>
                    <th>Applicant</th>
                    <th>Company</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => navigate(`/applications/${app.id}`)}
                      className="clickable-row"
                    >
                      <td style={{ fontWeight: 500, color: "var(--color-primary)" }}>{app.tracking_number}</td>
                      <td>{app.applicant_name}</td>
                      <td>{app.company_name}</td>
                      <td>{app.application_type}</td>
                      <td>
                        <StatusBadge status={app.status} />
                      </td>
                      <td style={{ color: "var(--color-text-muted)" }}>
                        {new Date(app.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      ) : (
        <div className="empty-state" style={{ marginTop: "4rem" }}>
          <div className="empty-icon"><ClipboardList size={48} strokeWidth={1.2} /></div>
          <h3>Welcome to Application Tracker</h3>
          <p style={{ maxWidth: 400, margin: "0 auto 1.5rem", color: "var(--color-text-muted)" }}>
            If you need to submit a new application, click the button below to get started. 
            Once submitted, you will receive a tracking link.
          </p>
          <button className="btn btn-primary" style={{ padding: "0.75rem 1.5rem", fontSize: "1rem" }} onClick={() => navigate("/applications/new")}>
            Start New Application
          </button>
        </div>
      )}
    </div>
  );
}
