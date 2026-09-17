from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from decimal import Decimal

class TimeStamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

class Product(TimeStamped):
    name = models.CharField(max_length=150)
    sku = models.CharField(max_length=80, unique=True)
    category = models.CharField(max_length=100, blank=True)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    stock = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    unit = models.CharField(max_length=30, default="pcs")
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.name} ({self.sku})"

class Customer(TimeStamped):
    name = models.CharField(max_length=150)
    business_name = models.CharField(max_length=150, blank=True)
    gstin = models.CharField(max_length=15, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    address = models.TextField(blank=True)
    opening_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def __str__(self):
        return self.name


class Attendance(TimeStamped):
    STATUS = [
        ("present", "Present"),
        ("absent", "Absent"),
        ("leave", "On Leave"),
    ]
    employee_name = models.CharField(max_length=150)
    department = models.CharField(max_length=100, blank=True)
    attendance_date = models.DateField(default=timezone.localdate)
    status = models.CharField(max_length=20, choices=STATUS, default="present")
    check_in = models.TimeField(null=True, blank=True)
    check_out = models.TimeField(null=True, blank=True)
    note = models.CharField(max_length=255, blank=True)

    def __str__(self):
        return f"{self.employee_name} - {self.attendance_date}"

class Invoice(TimeStamped):
    STATUS = [
        ("draft", "Draft"),
        ("paid", "Paid"),
        ("partial", "Partially Paid"),
        ("unpaid", "Unpaid"),
    ]
    invoice_number = models.CharField(max_length=40, unique=True)
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="invoices")
    invoice_date = models.DateField(auto_now_add=True)
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    discount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS, default="unpaid")

    def __str__(self):
        return self.invoice_number

class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    quantity = models.DecimalField(max_digits=12, decimal_places=2, default=1)
    price = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    line_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        self.line_total = Decimal(self.quantity) * Decimal(self.price)
        super().save(*args, **kwargs)

class Payment(TimeStamped):
    PAYMENT_METHODS = [
        ("cash", "Cash"),
        ("upi", "UPI"),
        ("card", "Card"),
        ("bank", "Bank Transfer"),
    ]
    customer = models.ForeignKey(Customer, on_delete=models.PROTECT, related_name="payments")
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    method = models.CharField(max_length=30, choices=PAYMENT_METHODS, default="cash")
    reference = models.CharField(max_length=100, blank=True)
    note = models.CharField(max_length=255, blank=True)

class Expense(TimeStamped):
    category = models.CharField(max_length=100)
    description = models.CharField(max_length=255)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    expense_date = models.DateField(auto_now_add=True)

class Purchase(TimeStamped):
    product = models.ForeignKey(Product, on_delete=models.PROTECT, related_name="purchases")
    quantity = models.DecimalField(max_digits=12, decimal_places=2)
    unit_cost = models.DecimalField(max_digits=12, decimal_places=2)
    total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    supplier = models.CharField(max_length=150, blank=True)
    purchase_date = models.DateField(auto_now_add=True)
    note = models.CharField(max_length=255, blank=True)
