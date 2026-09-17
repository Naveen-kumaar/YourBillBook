from decimal import Decimal
from uuid import uuid4

from django.db import transaction
from django.utils import timezone
from rest_framework import serializers

from .models import Product, Customer, Attendance, Invoice, InvoiceItem, Payment, Expense, Purchase

class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = "__all__"

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = "__all__"


class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = "__all__"

    def validate(self, attrs):
        if attrs.get("check_in") == "":
            attrs["check_in"] = None
        if attrs.get("check_out") == "":
            attrs["check_out"] = None
        status = attrs.get("status", getattr(self.instance, "status", "present"))
        check_in = attrs.get("check_in", getattr(self.instance, "check_in", None))
        check_out = attrs.get("check_out", getattr(self.instance, "check_out", None))
        if status == "present" and (not check_in or not check_out):
            raise serializers.ValidationError({"check_in": "Check-in and check-out are required for a present day."})
        if check_in and check_out and check_out <= check_in:
            raise serializers.ValidationError({"check_out": "Check-out must be later than check-in."})
        return attrs

class InvoiceItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)

    class Meta:
        model = InvoiceItem
        fields = ["id", "product", "product_name", "quantity", "price", "tax_rate", "line_total"]
        read_only_fields = ["id", "price", "tax_rate", "line_total"]

class InvoiceSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)
    items = InvoiceItemSerializer(many=True)
    payment_method = serializers.ChoiceField(
        choices=[choice[0] for choice in Payment.PAYMENT_METHODS],
        write_only=True,
        required=False,
        default="cash",
    )
    payment_reference = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = Invoice
        fields = [
            "id", "invoice_number", "customer", "customer_name", "invoice_date",
            "subtotal", "tax", "discount", "total", "paid_amount", "status",
            "items", "payment_method", "payment_reference", "created_at", "updated_at",
        ]
        read_only_fields = [
            "id", "invoice_number", "invoice_date", "subtotal", "tax", "total",
            "status", "created_at", "updated_at",
        ]

    def validate(self, attrs):
        items = attrs.get("items", [])
        if not items:
            raise serializers.ValidationError({"items": "Add at least one product to the bill."})

        product_ids = [item["product"].id for item in items]
        if len(product_ids) != len(set(product_ids)):
            raise serializers.ValidationError({"items": "Each product can appear only once on a bill."})

        paid_amount = attrs.get("paid_amount", Decimal("0"))
        if paid_amount < 0:
            raise serializers.ValidationError({"paid_amount": "Payment cannot be negative."})

        discount = attrs.get("discount", Decimal("0"))
        if discount < 0:
            raise serializers.ValidationError({"discount": "Discount cannot be negative."})
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        items_data = validated_data.pop("items")
        payment_method = validated_data.pop("payment_method", "cash")
        payment_reference = validated_data.pop("payment_reference", "")
        requested_paid = validated_data.pop("paid_amount", Decimal("0"))
        discount = validated_data.pop("discount", Decimal("0"))

        subtotal = Decimal("0")
        tax_total = Decimal("0")
        invoice_items = []

        for item_data in items_data:
            product = Product.objects.select_for_update().get(id=item_data["product"].id)
            quantity = item_data["quantity"]
            if quantity <= 0:
                raise serializers.ValidationError({"items": "Quantity must be greater than zero."})
            if product.stock < quantity:
                raise serializers.ValidationError(
                    {"items": f"Only {product.stock} {product.unit} of {product.name} is available."}
                )

            line_subtotal = quantity * product.price
            line_tax = line_subtotal * product.tax_rate / Decimal("100")
            subtotal += line_subtotal
            tax_total += line_tax
            invoice_items.append((product, quantity, product.price, product.tax_rate, line_subtotal))

        total = max(Decimal("0"), subtotal + tax_total - discount)
        paid_amount = min(requested_paid, total)
        status_value = "paid" if paid_amount == total and total > 0 else "partial" if paid_amount > 0 else "unpaid"
        invoice = Invoice.objects.create(
            invoice_number=f"INV-{timezone.now():%Y%m%d}-{uuid4().hex[:6].upper()}",
            subtotal=subtotal,
            tax=tax_total,
            discount=discount,
            total=total,
            paid_amount=paid_amount,
            status=status_value,
            **validated_data,
        )

        for product, quantity, price, tax_rate, line_total in invoice_items:
            InvoiceItem.objects.create(
                invoice=invoice,
                product=product,
                quantity=quantity,
                price=price,
                tax_rate=tax_rate,
                line_total=line_total,
            )
            product.stock -= quantity
            product.save(update_fields=["stock", "updated_at"])

        if paid_amount > 0:
            Payment.objects.create(
                customer=invoice.customer,
                amount=paid_amount,
                method=payment_method,
                reference=payment_reference,
                note=f"Payment for {invoice.invoice_number}",
            )
        return invoice

class PaymentSerializer(serializers.ModelSerializer):
    customer_name = serializers.CharField(source="customer.name", read_only=True)

    class Meta:
        model = Payment
        fields = "__all__"

class ExpenseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Expense
        fields = "__all__"

class PurchaseSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source="product.name", read_only=True)
    product_sku = serializers.CharField(source="product.sku", read_only=True)

    class Meta:
        model = Purchase
        fields = "__all__"
        read_only_fields = ["total", "purchase_date"]

    def validate(self, attrs):
        if attrs.get("quantity", 0) <= 0:
            raise serializers.ValidationError({"quantity": "Quantity must be greater than zero."})
        if attrs.get("unit_cost", 0) < 0:
            raise serializers.ValidationError({"unit_cost": "Unit cost cannot be negative."})
        return attrs
