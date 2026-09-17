from django.contrib import admin
from .models import Product, Customer, Attendance, Invoice, InvoiceItem, Payment, Expense, Purchase

admin.site.register([Product, Customer, Attendance, Invoice, InvoiceItem, Payment, Expense, Purchase])
