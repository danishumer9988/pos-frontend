# React frontend + Django backend

Run Django on port 8000:

```powershell
cd ..
python manage.py runserver 8000
```

Then run the React frontend separately:

```powershell
cd frontend
npm install
npm run dev
```

Set `frontend/.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
```

The frontend uses the same API paths as the original backend, so no major React routing rewrite is required.
