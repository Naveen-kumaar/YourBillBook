from django.db import IntegrityError, transaction
from django.db.models import Sum, Count
from django.db.models.deletion import ProtectedError
from django.contrib.auth.models import User
from rest_framework import serializers, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from .models import Product, Customer, Attendance, Invoice, Payment, Expense, Purchase
from .serializers import (
    ProductSerializer, CustomerSerializer,InvoiceSerializer, PaymentSerializer, ExpenseSerializer,
    AttendanceSerializer, PurchaseSerializer
)

class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.filter(active=True).order_by("-created_at")
    serializer_class = ProductSerializer

    def perform_destroy(self, instance):
        try:
            instance.delete()
        except ProtectedError:
            Product.objects.filter(pk=instance.pk).update(active=False)

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all().order_by("-created_at")
    serializer_class = CustomerSerializer


class AttendanceViewSet(viewsets.ModelViewSet):
    queryset = Attendance.objects.all().order_by("-attendance_date", "-created_at")
    serializer_class = AttendanceSerializer

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.select_related("customer").prefetch_related("items").all().order_by("-created_at")
    serializer_class = InvoiceSerializer

    @transaction.atomic
    def perform_destroy(self, instance):
        for item in instance.items.select_related("product").all():
            product = item.product
            product.stock += item.quantity
            product.save(update_fields=["stock", "updated_at"])
        instance.delete()

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("customer").all().order_by("-created_at")
    serializer_class = PaymentSerializer

class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all().order_by("-created_at")
    serializer_class = ExpenseSerializer

class PurchaseViewSet(viewsets.ModelViewSet):
    queryset = Purchase.objects.select_related("product").all().order_by("-purchase_date", "-created_at")
    serializer_class = PurchaseSerializer

    @transaction.atomic
    def perform_create(self, serializer):
        purchase = serializer.save(total=serializer.validated_data["quantity"] * serializer.validated_data["unit_cost"])
        product = Product.objects.select_for_update().get(pk=purchase.product_id)
        product.stock += purchase.quantity
        product.save(update_fields=["stock", "updated_at"])

    @transaction.atomic
    def perform_destroy(self, instance):
        product = Product.objects.select_for_update().get(pk=instance.product_id)
        if product.stock < instance.quantity:
            raise serializers.ValidationError("This purchase cannot be deleted because some stock has already been sold.")
        product.stock -= instance.quantity
        product.save(update_fields=["stock", "updated_at"])
        instance.delete()

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def dashboard(request):
    sales = Invoice.objects.aggregate(total=Sum("total"))["total"] or 0
    paid = Payment.objects.aggregate(total=Sum("amount"))["total"] or 0
    expenses = Expense.objects.aggregate(total=Sum("amount"))["total"] or 0
    products = Product.objects.aggregate(total=Count("id"))["total"] or 0
    customers = Customer.objects.aggregate(total=Count("id"))["total"] or 0
    invoices = Invoice.objects.aggregate(total=Count("id"))["total"] or 0
    low_stock = Product.objects.filter(stock__lte=5, active=True).count()

    return Response({
        "sales": sales,
        "payments": paid,
        "expenses": expenses,
        "products": products,
        "customers": customers,
        "invoices": invoices,
        "low_stock": low_stock,
        "net": float(sales) - float(expenses),
    })

@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    username = request.data.get("username", "").strip()
    email = request.data.get("email", "").strip()
    password = request.data.get("password", "")
    password_confirmation = request.data.get("password_confirmation", "")

    if not username or not password or not password_confirmation:
        return Response(
            {"detail": "Username and both password fields are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if password != password_confirmation:
        return Response(
            {"detail": "Passwords do not match."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if User.objects.filter(username__iexact=username).exists():
        return Response(
            {"detail": "That username is already registered."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
        )
    except IntegrityError:
        return Response(
            {"detail": "That username is already registered."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response(
        {"detail": "Account created successfully.", "username": user.username},
        status=status.HTTP_201_CREATED,
    )
