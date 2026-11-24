# SKR-Global — Marine Logistics Import & Export Management System (MLIEMS)

A full-stack MERN (MongoDB, Express.js, React 18, Node.js) web application built for **SKR-Global** to manage international maritime shipments, ISO 6346 container manifests, customs declarations, and live destination port weather advisories with strict Role-Based Access Control (RBAC).

---

## 1. Application Information & Role Workflows

* **Logistics Operator (`operator@skr-global.com`):** Views the **Shipments Console** only (Customs tab hidden), creates new import/export shipments, checks destination port wind/berthing weather advisories, and clicks shipment status badges to read customs officer clearance messages.
* **Customs Officer (`customs@skr-global.com`):** Views the **Customs Console** only (Shipments/Operators tab hidden), filters declarations by status (`PENDING`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`), clicks any **Bill of Lading (BoL)** to inspect full shipment details, and updates the customs decision with mandatory reason notes (automatically syncing the parent shipment status).
* **Importer / Exporter Client (`client@skr-global.com`):** Views only their own assigned shipments and read-only status badges.
* **System Administrator (`admin@skr-global.com`):** Full access across both consoles plus permission to permanently delete shipment records.

*(Default password for all seeded demo accounts: `Password123!`)*

---

## 2. Technologies Used

| Layer | Technologies |
| :--- | :--- |
| **Front End** | React 18, Vite, React Router v6, Axios, Context API, CSS3 (WCAG 2.1 AA) |
| **Back End** | Node.js, Express.js, Mongoose ODM, JSON Web Tokens (JWT), bcryptjs |
| **Security (OWASP)** | Helmet, CORS allow-listing, Express Rate Limit, Express Mongo Sanitize, Express Validator |
| **Database & API** | MongoDB Atlas (Cloud M0), OpenWeatherMap REST API (with fallback telemetry) |
| **Deployment** | Vercel (Front End SPA), Render (Back End REST API), GitHub CI/CD |

---

## 3. High-Level System Connection

```text
+-----------------------------------+
|            CLIENT SIDE            |
|  Operator | Customs | Client | Admin
+-----------------+-----------------+
                  | HTTPS
                  v
+-----------------------------------+
|             FRONT END             |
|   React 18 + Vite SPA (Vercel)    |
|   Role-Based Consoles & Routing   |
+-----------------+-----------------+
                  | REST API (JSON + JWT)
                  v
+-----------------------------------+
|             BACK END              |
|  Node.js + Express API (Render)   |
|  RBAC, Validation & Weather API   |
+-----------------+-----------------+
                  | Mongoose TLS
                  v
+-----------------------------------+
|             DATABASE              |
|   MongoDB Atlas Cloud Cluster     |
| Users | Shipments | Customs Decls |
+-----------------------------------+
```

---

## 4. How to Run Locally

### Step 1: Start the Back-End API (`backend/`)
1. Open a terminal in `backend/` and install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and set your `MONGODB_URI` and `JWT_SECRET`.
3. Seed the database with 4 role accounts, 50 shipments, and 50 customs declarations:
   ```bash
   node seed.js
   ```
4. Start the Express server (`http://localhost:5000`):
   ```bash
   npm run dev
   ```

### Step 2: Start the Front-End SPA (`frontend/`)
1. Open a second terminal in `frontend/` and install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` (`VITE_API_URL=http://localhost:5000/api/v1`).
3. Start the Vite dev server and open `http://localhost:5173`:
   ```bash
   npm run dev
   ```

---

## 5. Live Cloud Deployment Steps (Render + Vercel)

### A. Deploy Back End on Render
1. Push this repository to **GitHub** and ensure MongoDB Atlas **Network Access** allows `0.0.0.0/0`.
2. In [Render](https://dashboard.render.com/), click **New + → Web Service** and connect your GitHub repo.
3. Configure **Root Directory:** `backend`, **Build Command:** `npm install`, **Start Command:** `npm start`.
4. Add environment variables (`NODE_ENV=production`, `MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN=8h`, `CLIENT_ORIGIN=*`, `OPENWEATHER_API_KEY`) and click **Deploy Web Service**.

### B. Deploy Front End on Vercel
1. In [Vercel](https://vercel.com/), click **Add New → Project** and import the same GitHub repo.
2. Set **Root Directory:** `frontend`, **Framework Preset:** `Vite`, **Build Command:** `npm run build`, **Output Directory:** `dist`.
3. Add environment variable `VITE_API_URL=https://<your-render-service>.onrender.com/api/v1` and click **Deploy**.
4. Copy your live `https://<your-project>.vercel.app` URL and update `CLIENT_ORIGIN` on Render to lock down CORS.
