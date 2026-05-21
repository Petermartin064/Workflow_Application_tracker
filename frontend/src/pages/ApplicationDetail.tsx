import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getApplication,
  submitApplication,
  startReview,
  recordDecision,
} from "../api/applications";
import type { Application, DecisionPayload } from "../types";
import StatusBadge from "../components/StatusBadge";
import { useToast, ToastContainer } from "../hooks/useToast";
import { useAuth } from "../context/AuthContext";
import {
  ArrowLeft, Pencil, Send, Search,
  CheckCircle, XCircle, ClipboardList,
  RotateCcw, AlertTriangle, AlertCircle,
} from "lucide-react";

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

// Decision Modal
interface DecisionModalProps {
  decisionType: "Approved" | "Need More Information" | "Rejected";
  onConfirm: (comment: string) => void;
  onClose: () => void;
  loading: boolean;
}

function DecisionModal({ decisionType, onConfirm, onClose, loading }: DecisionModalProps) {
  const [comment, setComment] = useState("");
  const [err, setErr] = useState("");

  const requiresComment = decisionType !== "Approved";

  const CONFIG: Record<
    "Approved" | "Need More Information" | "Rejected",
    { icon: React.ReactNode; color: string; btnClass: string; label: string }
  > = {
    Approved:               { icon: <CheckCircle size={22} />,   color: "var(--color-success)", btnClass: "btn-success", label: "Approve Application" },
    "Need More Information": { icon: <ClipboardList size={22} />, color: "var(--color-warning)", btnClass: "btn-warning", label: "Request More Information" },
    Rejected:               { icon: <XCircle size={22} />,      color: "var(--color-danger)",  btnClass: "btn-danger",  label: "Reject Application" },
  };
  const cfg = CONFIG[decisionType];

  function handleSubmit() {
    if (requiresComment && !comment.trim()) {
      setErr("A reviewer comment is required for this decision.");
      return;
    }
    onConfirm(comment);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ fontSize: "2rem", marginBottom: "8px" }}>{cfg.icon}</div>
          <div className="modal-title" style={{ color: cfg.color }}>{cfg.label}</div>
          <div className="modal-subtitle">
            {requiresComment
              ? "A reviewer comment is required."
              : "You can optionally include a comment."}
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="reviewer-comment">
            Reviewer Comment {requiresComment ? "(Required)" : "(Optional)"}
          </label>
          <textarea
            id="reviewer-comment"
            rows={4}
            placeholder="Enter your review comments here…"
            value={comment}
            onChange={e => { setComment(e.target.value); setErr(""); }}
          />
          {err && <span className="error-msg">{err}</span>}
        </div>

        <div className="modal-footer">
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            id={`confirm-${decisionType.replace(/\s+/g, "-")}-btn`}
            className={`btn ${cfg.btnClass}`}
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Processing…" : cfg.label}
          </button>
        </div>
      </div>
    </div>
  );
}

// Workflow Timeline
function WorkflowTimeline({ status }: { status: string }) {
  const steps = ["Draft", "Submitted", "Under Review", "Decision"];
  const decisionStatuses = ["Approved", "Rejected", "Need More Information"];
  const stepIndex = decisionStatuses.includes(status)
    ? 4
    : steps.indexOf(status === "Under Review" ? "Under Review" : status);

  return (
    <div style={{ marginBottom: "1rem" }}>
      <div className="action-panel-title">Workflow Progress</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((step, i) => {
          const done = i < stepIndex;
          const active = i === stepIndex || (step === "Decision" && decisionStatuses.includes(status));
          return (
            <div key={step} style={{ display: "flex", gap: 12, paddingBottom: i < steps.length - 1 ? 20 : 0, position: "relative" }}>
              {i < steps.length - 1 && (
                <div style={{
                  position: "absolute", left: 13, top: 28, bottom: 0, width: 2,
                  background: done ? "var(--color-primary)" : "var(--color-border)",
                  transition: "background 0.3s",
                }} />
              )}
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "0.75rem", fontWeight: 700, zIndex: 1,
                border: `2px solid ${done ? "var(--color-primary)" : active ? "var(--color-warning)" : "var(--color-border)"}`,
                background: done ? "var(--color-primary-light)" : active ? "rgba(217,119,6,0.1)" : "var(--color-surface-2)",
                color: done ? "var(--color-primary)" : active ? "var(--color-warning)" : "var(--color-text-faint)",
              }}>
                {done ? "✓" : i + 1}
              </div>
              <div style={{ paddingTop: 4 }}>
                <div style={{ fontSize: "0.85rem", fontWeight: 600, color: active || done ? "var(--color-text)" : "var(--color-text-muted)" }}>
                  {step === "Decision" && decisionStatuses.includes(status) ? status : step}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Main Detail Page
export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();

  const [app, setApp] = useState<Application | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [modal, setModal] = useState<"Approved" | "Need More Information" | "Rejected" | null>(null);
  const { toasts, addToast, removeToast } = useToast();

  useEffect(() => {
    if (id) fetchApp();
  }, [id]);

  async function fetchApp() {
    setLoading(true);
    try {
      const data = await getApplication(Number(id));
      setApp(data);
    } catch {
      setError("Application not found.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit() {
    setActionLoading(true); setError("");
    try {
      const updated = await submitApplication(Number(id));
      setApp(updated);
      addToast("Application submitted successfully!");
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { detail?: unknown } } };
      const detail = axiosErr?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to submit.");
    } finally { setActionLoading(false); }
  }

  async function handleStartReview() {
    setActionLoading(true); setError("");
    try {
      const updated = await startReview(Number(id));
      setApp(updated);
      addToast("Application is now Under Review.");
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { detail?: unknown } } };
      const detail = axiosErr?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to start review.");
    } finally { setActionLoading(false); }
  }

  async function handleDecision(comment: string) {
    if (!modal) return;
    setActionLoading(true); setError("");
    try {
      const payload: DecisionPayload = { decision: modal, reviewer_comment: comment };
      const updated = await recordDecision(Number(id), payload);
      setApp(updated);
      setModal(null);
      addToast(`Decision recorded: ${modal}`);
    } catch (e: unknown) {
      const axiosErr = e as { response?: { data?: { detail?: unknown } } };
      const detail = axiosErr?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Failed to record decision.");
    } finally { setActionLoading(false); }
  }

  if (loading) return <div className="loading-spinner"><div className="spinner" /> Loading…</div>;
  if (!app) return <div className="alert alert-danger">{error || "Application not found."}</div>;

  const commentBoxClass =
    app.status === "Approved" ? "approved" :
    app.status === "Rejected" ? "rejected" : "";

  return (
    <div className="animate-in">
      <ToastContainer toasts={toasts} onRemove={removeToast} />
      <button className="back-link" onClick={() => navigate("/")}>
        <ArrowLeft size={15} /> Back to List
      </button>

      {error && <div className="alert alert-danger"><AlertTriangle size={15} /> {error}</div>}

      <div className="page-header" style={{ marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
            <h1 className="page-title" style={{ fontSize: "1.5rem" }}>
              <span className="detail-value mono">{app.tracking_number}</span>
            </h1>
            <StatusBadge status={app.status} />
          </div>
          <p className="page-subtitle">{app.applicant_name} · {app.company_name}</p>
        </div>
      </div>

      <div className="detail-grid">
        {/* ── Left: Application Info ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {/* Core Info */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Application Details</span>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                Created {formatDate(app.created_at)}
              </span>
            </div>

            <div className="form-grid">
              <div className="detail-field">
                <div className="detail-label">Applicant Name</div>
                <div className="detail-value">{app.applicant_name}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Applicant Email</div>
                <div className="detail-value">{app.applicant_email}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Company</div>
                <div className="detail-value">{app.company_name}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Application Type</div>
                <div className="detail-value">{app.application_type}</div>
              </div>
            </div>

            <div className="detail-field" style={{ marginTop: "0.5rem" }}>
              <div className="detail-label">Description</div>
              <div className="detail-value description">
                {app.description || <span style={{ color: "var(--color-text-faint)" }}>No description provided.</span>}
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="card">
            <div className="card-header"><span className="card-title">Timeline</span></div>
            <div className="form-grid">
              <div className="detail-field">
                <div className="detail-label">Created At</div>
                <div className="detail-value">{formatDate(app.created_at)}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Last Updated</div>
                <div className="detail-value">{formatDate(app.updated_at)}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Submitted At</div>
                <div className="detail-value">{formatDate(app.submitted_at)}</div>
              </div>
              <div className="detail-field">
                <div className="detail-label">Reviewed At</div>
                <div className="detail-value">{formatDate(app.reviewed_at)}</div>
              </div>
            </div>
          </div>

          {/* Reviewer Comment (if any) */}
          {app.reviewer_comment && (
            <div className="card">
              <div className="card-header"><span className="card-title">Reviewer Comment</span></div>
              <div className={`reviewer-comment-box ${commentBoxClass}`}>
                {app.reviewer_comment}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Action Panel ── */}
        <div>
          <div className="action-panel">
            <WorkflowTimeline status={app.status} />
            <hr className="divider" style={{ margin: "1rem 0" }} />
            <div className="action-panel-title">Available Actions</div>
            <div className="action-list">

              {/* Applicant Actions */}
              {role === "Applicant" && (
                <>
                  {/* Draft: Edit + Submit */}
                  {app.status === "Draft" && (
                    <>
                      <button
                        id="edit-btn"
                        className="btn btn-secondary"
                        onClick={() => navigate(`/applications/${app.id}/edit`)}
                      >
                        <Pencil size={15} /> Edit Application
                      </button>
                      <button
                        id="submit-btn"
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Submitting…" : <><Send size={15} /> Submit Application</>}
                      </button>
                    </>
                  )}

                  {/* Need More Information: Edit + Resubmit */}
                  {app.status === "Need More Information" && (
                    <>
                      <div className="alert alert-warning" style={{ fontSize: "0.8rem", padding: "10px 14px" }}>
                        Please address the reviewer's comments before resubmitting.
                      </div>
                      <button
                        id="edit-nmi-btn"
                        className="btn btn-secondary"
                        onClick={() => navigate(`/applications/${app.id}/edit`)}
                      >
                        <Pencil size={15} /> Edit Application
                      </button>
                      <button
                        id="resubmit-btn"
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={actionLoading}
                      >
                        {actionLoading ? "Resubmitting…" : <><RotateCcw size={15} /> Resubmit Application</>}
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Admin Actions */}
              {role === "Admin" && (
                <>
                  {/* Submitted: Start Review */}
                  {app.status === "Submitted" && (
                    <button
                      id="start-review-btn"
                      className="btn btn-warning"
                      onClick={handleStartReview}
                      disabled={actionLoading}
                    >
                      {actionLoading ? "Processing…" : <><Search size={15} /> Start Review</>}
                    </button>
                  )}

                  {/* Under Review: Approve / NMI / Reject */}
                  {app.status === "Under Review" && (
                    <>
                      <button
                        id="approve-btn"
                        className="btn btn-success"
                        onClick={() => setModal("Approved")}
                        disabled={actionLoading}
                      >
                        <CheckCircle size={15} /> Approve
                      </button>
                      <button
                        id="nmi-btn"
                        className="btn btn-warning"
                        onClick={() => setModal("Need More Information")}
                        disabled={actionLoading}
                      >
                        <ClipboardList size={15} /> Need More Information
                      </button>
                      <button
                        id="reject-btn"
                        className="btn btn-danger"
                        onClick={() => setModal("Rejected")}
                        disabled={actionLoading}
                      >
                        <XCircle size={15} /> Reject
                      </button>
                    </>
                  )}
                </>
              )}

              {/* Approved / Rejected: Read only */}
              {(app.status === "Approved" || app.status === "Rejected") && (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", color: "var(--color-text-muted)", fontSize: "0.85rem", padding: "1rem 0", textAlign: "center" }}>
                  {app.status === "Approved"
                    ? <><CheckCircle size={20} style={{ color: "var(--color-success)" }} /> This application has been approved. No further actions available.</>
                    : <><XCircle size={20} style={{ color: "var(--color-danger)" }} /> This application has been rejected. No further actions available.</>
                  }
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      {modal && (
        <DecisionModal
          decisionType={modal}
          onConfirm={handleDecision}
          onClose={() => { setModal(null); setError(""); }}
          loading={actionLoading}
        />
      )}
    </div>
  );
}
