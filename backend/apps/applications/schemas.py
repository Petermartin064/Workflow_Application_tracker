from datetime import datetime
from typing import Optional, List, Literal
from ninja import Schema
from pydantic import EmailStr, Field, ConfigDict


# Input Schemas

class ApplicationCreateSchema(Schema):
    applicant_name: str = Field(min_length=1, max_length=255)
    applicant_email: EmailStr
    company_name: str = Field(min_length=1, max_length=255)
    application_type: str
    description: Optional[str] = ""


class ApplicationUpdateSchema(Schema):
    applicant_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    applicant_email: Optional[EmailStr] = None
    company_name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    application_type: Optional[str] = None
    description: Optional[str] = None


class DecisionSchema(Schema):
    decision: Literal["Approved", "Need More Information", "Rejected"]
    reviewer_comment: Optional[str] = ""


# Output Schemas

class ApplicationListSchema(Schema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tracking_number: str
    applicant_name: str
    company_name: str
    application_type: str
    status: str
    created_at: datetime


class ApplicationDetailSchema(Schema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    tracking_number: str
    applicant_name: str
    applicant_email: str
    company_name: str
    application_type: str
    description: str
    status: str
    reviewer_comment: str
    created_at: datetime
    updated_at: datetime
    submitted_at: Optional[datetime]
    reviewed_at: Optional[datetime]


class MessageSchema(Schema):
    message: str

class LoginSchema(Schema):
    username: str
    password: str

class RegistrationSchema(Schema):
    username: str
    password: str
    email: EmailStr

class TokenSchema(Schema):
    access_token: str
    token_type: str
