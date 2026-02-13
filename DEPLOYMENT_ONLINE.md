# 🌍 How to Deploy I-SARTHI Online

Use **Render** for the Backend (Server) and **Vercel** for the Frontend (Client).

## ⚠️ Prerequisite: Push Your Changes!
We made some critical updates (like adding `PORT` support). You **MUST** push these changes to GitHub before deploying.

    git add .
    git commit -m "Prepare for deployment"
    git push

---

## Part 1: Deploy Backend (Render)
1.  Go to [dashboard.render.com](https://dashboard.render.com/) and Sign Up.
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repo (`i-SARTHI`).
4.  **Settings**:
    *   **Root Directory**: `server` (Important!)
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
    *   **Instance Type**: Free
5.  Click **Create Web Service**.
6.  Wait for it to deploy. You will get a URL like `https://i-sarthi-backend.onrender.com`.
    *   **COPY THIS URL.** You need it for Part 2.

---

## Part 2: Deploy Frontend (Vercel)
1.  Go to [vercel.com](https://vercel.com/) and Sign Up.
2.  Click **Add New...** -> **Project**.
3.  Import your GitHub repo (`i-SARTHI`).
4.  **Framework Preset**: Vite (Automatic).
5.  **Root Directory**: Click "Edit" and select `client`.
6.  **Environment Variables**:
    *   Click to expand.
    *   Add Key: `VITE_SERVER_URL`
    *   Add Value: *(Paste your Render Backend URL here, e.g., `https://i-sarthi-backend.onrender.com`)*
        *   *Note: Do not add a trailing slash `/` at the end.*
    *   Add your other keys if needed (`VITE_OPENAI_API_KEY`, etc.).
7.  Click **Deploy**.

---

## 🎉 Success!
Once Vercel finishes, you will get a Frontend URL. Open it, and your app is live!

**Note on Pothole/Drowsiness Detection:**
The Python scripts (`pothole_detector.py`, etc.) run on your **local machine**. The online dashboard on Vercel **cannot access** your local camera unless you use advanced tools like `ngrok`.
*   **Recommendation:** Use the online dashboard for *monitoring*/logging. Use the local version (`localhost:5173`) when you are actually in the car running the sensors.
