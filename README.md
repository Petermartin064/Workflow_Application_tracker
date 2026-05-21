# Application Workflow Tracker

**Author:** Peter Martin  
**Email:** petermartin602@gmail.com

A small, secure workflow tracking application built with a **Django/Django Ninja** backend and a **React/Vite** frontend.

## Features & Requirements Met

The application rigorously follows all the prompt requirements:
- **Django + Django Ninja**: Full REST API built with Ninja schemas.
- **Application Model**: Contains all required fields including `tracking_number`, `applicant_name`, `company_name`, timestamps, etc.
- **Workflow State Machine Enforcement**:
  - `Draft` applications can be edited or submitted.
  - `Submitted` applications can only be moved to `Under Review`.
  - `Under Review` applications accept decisions (`Approved`, `Rejected`, or `Need More Information`).
  - Decisions for `Rejected` or `Need More Information` **must** include a reviewer comment.
  - `Need More Information` applications can be edited by the applicant and resubmitted.
  - `Approved` and `Rejected` applications are locked.
- **Frontend Views**: List view (showing correct columns), Detail view (showing contextual action buttons), Create/Edit form, and Reviewer Decision forms.

**Additional Polish (Exceeding Requirements):**
- **Data Isolation & Role Separation**: The backend supports full applicant registration and authentication. Applicants only see and edit their *own* applications. Admins can see everything.
- **Beautiful UI**: Modern, light-theme UI using a custom CSS design system, responsive grids, and smooth animations.
- **Search & Filtering**: The dashboard allows real-time status filtering and global searching.

---

##  Setup Instructions

### Option A: Using Docker (Recommended)

The easiest way to run the application is using Docker. Ensure you have Docker and Docker Compose installed.

```bash
# In the root directory of the project, run:
docker-compose up --build
```
This single command will:
1. Build the backend and frontend containers.
2. Automatically run Django migrations.
3. Start the backend API on `http://localhost:8000`.
4. Start the React frontend on `http://localhost:5173`.

> **Note:** To create an admin account when running via Docker, open a new terminal window while the containers are running and execute:
> `docker-compose exec backend python manage.py createsuperuser`

---

### Option B: Manual Setup

If you don't have Docker installed, you can run the services manually.

#### 1. Backend (Django)

The backend uses Python. Navigate to the `backend` folder.

```bash
cd backend

# 1. Create and activate a virtual environment
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Run migrations to setup the SQLite database
python manage.py makemigrations
python manage.py migrate

# 4. Create an Admin user (Superuser)
# You will use this account to login as an Admin/Reviewer
python manage.py createsuperuser

# 5. Start the server (runs on http://localhost:8000)
python manage.py runserver
```

#### 2. Frontend (React + Vite)

The frontend uses React and Vite. Navigate to the `frontend` folder.

```bash
cd frontend

# 1. Install Node dependencies
npm install

# 2. Start the development server (runs on http://localhost:5173)
npm run dev
```

---

##  How to use

1. Open `http://localhost:5173`.
2. Click **Log In / Register** in the sidebar. 
3. **Applicant Flow:** Choose "Register", enter your details. You will see an empty dashboard. Click "+ New Application", fill it out, and submit it.
4. **Admin Flow:** Log out. Click "Log In" and enter the credentials of the Django superuser you created. You will see the Applicant's submission. Open it, click "Start Review", and make a decision.

---

##  Assumptions Made

1. **Authentication Scope:** The prompt didn't explicitly demand user accounts, but building a production-grade tracker usually requires applicants to securely see *their* data without seeing others'. We assumed that implementing a lightweight JWT auth system with `Applicant` vs `Admin` roles would demonstrate "good structure".
2. **Reviewer Decision Flow:** We assumed the reviewer should be able to type their comment in a modal/form exactly when they click "Reject" or "Need More Info", rather than saving the comment separately.
3. **Database:** SQLite is used for simplicity and ease of review, though Postgres would be used in a real scenario.

##  What I would improve with more time

1. **Email Notifications:** Hook up Django's email backend or SendGrid to notify applicants when their status changes (e.g., when they receive a "Need More Information" request).
2. **Pagination:** The `GET /applications` API currently returns all applications. For production, this should use Django Ninja's built-in pagination (e.g., limit/offset).
3. **Audit Logging:** Add a `History` model to track *who* changed the status and *when*, rather than just relying on the `updated_at` timestamp.
4. **Form Validation:** Stricter email validation, character limits, and visual field-level validation errors on the React side before submitting to the API.
