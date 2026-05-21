from typing import List, Optional
from django.db.models import Q
from django.utils import timezone
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from ninja import Router
from ninja.errors import HttpError
from .auth import create_access_token, AdminBearer, AuthBearer

from .models import Application, ApplicationStatus, ApplicationType
from .schemas import (
    ApplicationCreateSchema,
    ApplicationUpdateSchema,
    ApplicationDetailSchema,
    ApplicationListSchema,
    DecisionSchema,
    MessageSchema,
    LoginSchema,
    RegistrationSchema,
    TokenSchema,
)

router = Router(tags=["Applications"])

VALID_TYPES = [t.value for t in ApplicationType]


# Auth Endpoint

@router.post("/auth/login", response=TokenSchema, summary="Login")
def login(request, payload: LoginSchema):
    user = authenticate(username=payload.username, password=payload.password)
    if not user:
        raise HttpError(401, "Invalid credentials")
    
    token = create_access_token(user.id, user.username, user.is_superuser)
    return {"access_token": token, "token_type": "bearer"}

@router.post("/auth/register", response=TokenSchema, summary="Register Applicant")
def register(request, payload: RegistrationSchema):
    if User.objects.filter(username=payload.username).exists():
        raise HttpError(400, "Username already exists")
    user = User.objects.create_user(
        username=payload.username,
        email=payload.email,
        password=payload.password,
        is_superuser=False,
        is_staff=False
    )
    token = create_access_token(user.id, user.username, user.is_superuser)
    return {"access_token": token, "token_type": "bearer"}


# Create Draft

@router.post("/", response={201: ApplicationDetailSchema}, summary="Create application draft", auth=AuthBearer())
def create_application(request, payload: ApplicationCreateSchema):
    if payload.application_type not in VALID_TYPES:
        raise HttpError(400, f"Invalid application_type. Choose from: {VALID_TYPES}")

    app = Application.objects.create(
        user_id=request.auth['user_id'],
        applicant_name=payload.applicant_name,
        applicant_email=payload.applicant_email,
        company_name=payload.company_name,
        application_type=payload.application_type,
        description=payload.description or "",
        status=ApplicationStatus.DRAFT,
    )
    return 201, app


# List Applications

@router.get("/", response=List[ApplicationListSchema], summary="List all applications", auth=AuthBearer())
def list_applications(request, status: Optional[str] = None, q: Optional[str] = None):
    qs = Application.objects.all()
    if request.auth['role'] == 'Applicant':
        qs = qs.filter(user_id=request.auth['user_id'])
    
    if status:
        qs = qs.filter(status=status)
    if q:
        qs = qs.filter(
            Q(tracking_number__icontains=q) | 
            Q(applicant_name__icontains=q) | 
            Q(company_name__icontains=q)
        )
    return qs


# Application Detail

@router.get("/{app_id}", response=ApplicationDetailSchema, summary="Get single application", auth=AuthBearer())
def get_application(request, app_id: int):
    try:
        app = Application.objects.get(id=app_id)
        if request.auth['role'] == 'Applicant' and app.user_id != request.auth['user_id']:
            raise HttpError(403, "Not authorized to view this application")
        return app
    except Application.DoesNotExist:
        raise HttpError(404, "Application not found")


# Update Application (Draft or NMI)

@router.patch("/{app_id}", response=ApplicationDetailSchema, summary="Update application (Draft/NMI)", auth=AuthBearer())
def update_application(request, app_id: int, payload: ApplicationUpdateSchema):
    try:
        app = Application.objects.get(id=app_id)
    except Application.DoesNotExist:
        raise HttpError(404, "Application not found")

    if request.auth['role'] == 'Applicant' and app.user_id != request.auth['user_id']:
        raise HttpError(403, "Not authorized to edit this application")

    if not app.is_editable:
        raise HttpError(400, f"Only Draft or Need More Information applications can be edited. Current status: {app.status}")

    update_data = payload.model_dump(exclude_unset=True)
    if "application_type" in update_data and update_data["application_type"] not in VALID_TYPES:
        raise HttpError(400, f"Invalid application_type. Choose from: {VALID_TYPES}")

    for field, value in update_data.items():
        setattr(app, field, value)
    app.save()
    return app


# Submit Application

@router.post("/{app_id}/submit", response=ApplicationDetailSchema, summary="Submit application", auth=AuthBearer())
def submit_application(request, app_id: int):
    try:
        app = Application.objects.get(id=app_id)
    except Application.DoesNotExist:
        raise HttpError(404, "Application not found")

    if request.auth['role'] == 'Applicant' and app.user_id != request.auth['user_id']:
        raise HttpError(403, "Not authorized to submit this application")

    if not app.can_submit:
        raise HttpError(400, f"Only Draft or Need More Information applications can be submitted. Current status: {app.status}")

    app.status = ApplicationStatus.SUBMITTED
    app.submitted_at = timezone.now()
    app.save()
    return app


# Admin Actions

@router.post("/{app_id}/start-review", response=ApplicationDetailSchema, summary="Start review process", auth=AdminBearer())
def start_review(request, app_id: int):
    try:
        app = Application.objects.get(id=app_id)
    except Application.DoesNotExist:
        raise HttpError(404, "Application not found")

    if not app.can_start_review:
        raise HttpError(400, f"Only Submitted applications can move to Under Review. Current status: {app.status}")

    app.status = ApplicationStatus.UNDER_REVIEW
    app.save()
    return app


# Reviewer Decision

@router.post("/{app_id}/decision", response=ApplicationDetailSchema, summary="Record reviewer decision", auth=AdminBearer())
def record_decision(request, app_id: int, payload: DecisionSchema):
    try:
        app = Application.objects.get(id=app_id)
    except Application.DoesNotExist:
        raise HttpError(404, "Application not found")

    if not app.can_receive_decision:
        raise HttpError(400, f"Only Under Review applications can receive a decision. Current status: {app.status}")

    # Comment required for Need More Information and Rejected
    if payload.decision in [ApplicationStatus.NEED_MORE_INFO.value, ApplicationStatus.REJECTED.value]:
        if not payload.reviewer_comment or not payload.reviewer_comment.strip():
            raise HttpError(400, f"A reviewer comment is required when decision is '{payload.decision}'")

    app.status = payload.decision
    app.reviewer_comment = payload.reviewer_comment or ""
    app.reviewed_at = timezone.now()
    app.save()
    return app
