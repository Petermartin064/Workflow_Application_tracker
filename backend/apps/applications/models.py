import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User


class ApplicationType(models.TextChoices):
    RECORDATION = "Recordation", "Recordation"
    RENEWAL = "Renewal", "Renewal"
    CHANGE_OF_OWNERSHIP = "Change of Ownership", "Change of Ownership"
    CHANGE_OF_NAME = "Change of Name", "Change of Name"
    DISCONTINUATION = "Discontinuation", "Discontinuation"


class ApplicationStatus(models.TextChoices):
    DRAFT = "Draft", "Draft"
    SUBMITTED = "Submitted", "Submitted"
    UNDER_REVIEW = "Under Review", "Under Review"
    NEED_MORE_INFO = "Need More Information", "Need More Information"
    APPROVED = "Approved", "Approved"
    REJECTED = "Rejected", "Rejected"


def generate_tracking_number():
    """Generate a unique tracking number like TRK-2024-XXXX."""
    year = timezone.now().year
    unique = uuid.uuid4().hex[:6].upper()
    return f"TRK-{year}-{unique}"


class Application(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name="applications")
    tracking_number = models.CharField(
        max_length=30, unique=True, default=generate_tracking_number, editable=False
    )
    applicant_name = models.CharField(max_length=255)
    applicant_email = models.EmailField()
    company_name = models.CharField(max_length=255)
    application_type = models.CharField(
        max_length=50, choices=ApplicationType.choices
    )
    description = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=30,
        choices=ApplicationStatus.choices,
        default=ApplicationStatus.DRAFT,
    )
    reviewer_comment = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    submitted_at = models.DateTimeField(null=True, blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"{self.tracking_number} — {self.applicant_name} ({self.status})"

    @property
    def is_editable(self):
        return self.status in [
            ApplicationStatus.DRAFT,
            ApplicationStatus.NEED_MORE_INFO,
        ]

    @property
    def can_submit(self):
        return self.status in [
            ApplicationStatus.DRAFT,
            ApplicationStatus.NEED_MORE_INFO,
        ]

    @property
    def can_start_review(self):
        return self.status == ApplicationStatus.SUBMITTED

    @property
    def can_receive_decision(self):
        return self.status == ApplicationStatus.UNDER_REVIEW
