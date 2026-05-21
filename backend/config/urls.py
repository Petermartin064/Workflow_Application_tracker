"""
URL configuration for the Application Workflow Tracker.
"""
from django.contrib import admin
from django.urls import path
from apps.applications.api import router
from ninja import NinjaAPI

api = NinjaAPI(title="Application Workflow Tracker API", version="1.0.0")
api.add_router("/applications", router)

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", api.urls),
]
