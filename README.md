# M-Guru Intern Portal

A role-based intern assessment and payment management portal — built with React, TypeScript, and Tailwind CSS. Matches the coding style of [luxe-e-commerce](https://github.com/sathish2882/luxe-e-commerce).

## Features

- **Single Login** for Admin and User — backend returns `token + user_type`
- **Admin Panel** — Dashboard, Send Email, Customers (full CRUD), Email History
- **User Panel** — Aptitude Test (22 Qs, 45 min), Result with section breakdown
- **Intern Portal** — 5-step registration: Register → OTP Verify → Details → Payment → Done
- Formik + Yup form validation
- Redux Toolkit — authSlice, customerSlice, testSlice
- Cookie-based token storage (`js-cookie`)
- Fully responsive — mobile, tablet, desktop
- Hash Router (`#/login`, `#/admin/dashboard`, `#/intern`)
- Zero inline CSS — 100% Tailwind CSS classes

## Tech Stack

| Layer       | Library                        |
|-------------|--------------------------------|
| Framework   | React 18 + TypeScript          |
| Build       | Vite                           |
| Styling     | Tailwind CSS (no inline CSS)   |
| UI helpers  | Ant Design (minimal usage)     |
| Routing     | React Router DOM (HashRouter)  |
| Forms       | Formik + Yup                   |
| State       | Redux Toolkit                  |
| HTTP        | Axios                          |
| Auth        | js-cookie                      |
| Toasts      | React Toastify                 |

## Folder Structure

```
src/
├── components/
│   ├── layout/     AdminLayout.tsx, UserLayout.tsx
│   └── ui/         ProtectedRoute.tsx
├── screens/
│   ├── auth/       LoginScreen.tsx
│   ├── admin/      AdminDashboard, SendEmail, Customers, EmailHistory
│   ├── user/       UserDashboard, TestPage, ResultPage
│   └── intern/     InternPortal.tsx  (5-step form)
├── redux/
│   ├── slices/     authSlice, customerSlice, testSlice
│   ├── store.ts
│   └── hooks.ts
├── routes/         AppRoutes.tsx
├── services/       authService.ts
├── utils/          authCookies.ts, testData.ts
└── types/          index.ts
```

## Routes

| Path                  | Page                   | Access   |
|-----------------------|------------------------|----------|
| `#/login`             | Login                  | Public   |
| `#/intern`            | Intern Registration    | Public   |
| `#/admin/dashboard`   | Admin Dashboard        | Admin    |
| `#/admin/send-email`  | Send Email             | Admin    |
| `#/admin/customers`   | Customers CRUD         | Admin    |
| `#/admin/email-history` | Email History        | Admin    |
| `#/user/dashboard`    | User Dashboard         | User     |
| `#/user/test`         | Aptitude Test          | User     |
| `#/user/result`       | Test Result            | User     |

## Quick Start

```bash
git clone https://github.com/sathish2882/mguru-intern-portal.git
cd mguru-intern-portal
npm install
cp .env.example .env
# Edit VITE_API_BASE_URL in .env
npm run dev
```

## API Response Format

Your backend `/auth/login` must return:

```json
{
  "id": "1",
  "name": "Sathish M",
  "email": "sathish@mguru.com",
  "user_type": "admin",
  "token": "your_jwt_token"
}
```

---

⭐ Give it a star if you found it useful!
