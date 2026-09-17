from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, CustomerViewSet, AttendanceViewSet,
    InvoiceViewSet, PaymentViewSet, ExpenseViewSet, PurchaseViewSet, dashboard, register
)

router = DefaultRouter()
router.register("products", ProductViewSet)
router.register("customers", CustomerViewSet)
router.register("attendance", AttendanceViewSet)
router.register("invoices", InvoiceViewSet)
router.register("payments", PaymentViewSet)
router.register("expenses", ExpenseViewSet)
router.register("purchases", PurchaseViewSet)

urlpatterns = [
    path("auth/register/", register),
    path("dashboard/", dashboard),
    path("", include(router.urls)),
]
