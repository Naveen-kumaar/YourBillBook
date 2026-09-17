# BizBook – Billing & Business Management Web App

A professional full-stack business billing dashboard inspired by modern billing apps and the
sidebar layout shown in the reference image. It is **not an exact copy of myBillBook** and does
not use their proprietary branding/assets.

## Stack
- Frontend: React + Vite + Bootstrap 5 + Bootstrap Icons + Axios
- Backend: Django + Django REST Framework + Simple JWT
- Database: MySQL
- CORS: django-cors-headers

## Modules
Dashboard, Billing, Invoices, Sales, Purchases, Products, Customers, Suppliers, Payments, Expenses.

## 1. MySQL
Create a database:

```sql
CREATE DATABASE bizbook_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Update `backend/config/settings.py` if your MySQL username/password is different.

## 2. Backend

```bash
cd backend
python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

Backend: http://127.0.0.1:8000

Admin: http://127.0.0.1:8000/admin

## 3. Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173

## 4. Login
Use the superuser credentials you created.

## Important
The default database configuration is:

- DB: `bizbook_db`
- User: `root`
- Password: `root`
- Host: `127.0.0.1`
- Port: `3306`

Change these values before running if needed.
