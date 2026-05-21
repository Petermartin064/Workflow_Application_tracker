import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import {
  createApplication,
  getApplication,
  updateApplication,
} from "../api/applications";
import { useAuth } from "../context/AuthContext";
import type { ApplicationType, CreateApplicationPayload } from "../types";
import { APPLICATION_TYPES } from "../types";

interface FormState {
  applicant_name: string;
  applicant_email: string;
  company_name: string;
  application_type: ApplicationType | "";
  description: string;
}

const EMPTY_FORM: FormState = {
  applicant_name: "",
  applicant_email: "",
  company_name: "",
  application_type: "",
  description: "",
};

export default function ApplicationForm() {
  const navigate = useNavigate();
  const { role } = useAuth();
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isEdit && id) {
      getApplication(Number(id))
        .then(app => {
          setForm({
            applicant_name: app.applicant_name,
            applicant_email: app.applicant_email,
            company_name: app.company_name,
            application_type: app.application_type,
            description: app.description,
          });
        })
        .catch(() => setError("Failed to load application."))
        .finally(() => setLoading(false));
    }
  }, [id, isEdit]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.application_type) { setError("Please select an application type."); return; }
    setSubmitting(true);
    setError("");
    try {
    const payload: CreateApplicationPayload = {
      applicant_name: form.applicant_name,
      applicant_email: form.applicant_email,
      company_name: form.company_name,
      application_type: form.application_type as ApplicationType,
      description: form.description || undefined,
    };
    if (isEdit && id) {
        await updateApplication(Number(id), payload);
        navigate(`/applications/${id}`);
      } else {
        const created = await createApplication(payload);
        navigate(`/applications/${created.id}`);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: unknown } } };
      const detail = axiosErr?.response?.data?.detail;
      const msg = typeof detail === "string" ? detail : "Failed to save application.";
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  if (role === "Guest") {
    return (
      <div className="animate-in empty-state" style={{ marginTop: "4rem" }}>
        <h3>Authentication Required</h3>
        <p>Please log in or register to submit an application.</p>
        <button className="btn btn-primary" onClick={() => navigate("/")} style={{ marginTop: "1rem" }}>
          Go to Home
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner" /> Loading…
      </div>
    );
  }

  return (
    <div className="animate-in" style={{ maxWidth: 760, margin: "0 auto" }}>
      <button className="back-link" onClick={() => navigate(isEdit ? `/applications/${id}` : "/")}>
        <ArrowLeft size={15} /> Back
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isEdit ? "Edit " : "New "}<span>Application</span>
          </h1>
          <p className="page-subtitle">
            {isEdit ? "Update your draft application." : "Fill in the details to create a draft application."}
          </p>
        </div>
      </div>

      <div className="card">
        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="applicant_name">Applicant Name</label>
              <input
                id="applicant_name"
                name="applicant_name"
                type="text"
                placeholder="Full name"
                value={form.applicant_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="applicant_email">Applicant Email</label>
              <input
                id="applicant_email"
                name="applicant_email"
                type="email"
                placeholder="email@example.com"
                value={form.applicant_email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="company_name">Company Name</label>
              <input
                id="company_name"
                name="company_name"
                type="text"
                placeholder="Company or organization"
                value={form.company_name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="application_type">Application Type</label>
              <select
                id="application_type"
                name="application_type"
                value={form.application_type}
                onChange={handleChange}
                required
              >
                <option value="">— Select type —</option>
                {APPLICATION_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

            <div className="form-group full-width">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Describe the purpose or details of this application…"
                value={form.description}
                onChange={handleChange}
                rows={5}
              />
            </div>
          </div>

          <hr className="divider" />

          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate(isEdit ? `/applications/${id}` : "/")}
            >
              Cancel
            </button>
            <button
              id="save-draft-btn"
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? "Saving…" : isEdit ? "Save Changes" : "Save as Draft"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
