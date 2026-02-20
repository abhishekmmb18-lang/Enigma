# 🔄 Fresh Start: Push to GitHub

If you are having trouble with remotes or accounts, the easiest way is to **start fresh**.

## 1. Delete Old Git History
Run this command in PowerShell to remove the old `.git` folder (conflicts, old accounts, etc.):

    Remove-Item .git -Recurse -Force

*(If this fails, just manually delete the hidden `.git` folder in your project folder).*

## 2. Initialize New Git
Run these commands one by one to start a clean repository:

    git init

    git add .

    git commit -m "Fresh code upload"

## 3. Create NEW Repository on GitHub
1.  Go to [github.com/new](https://github.com/new).
2.  **Repo Name**: `iSARTHI` (or `RoadMonitor`).
3.  **Do NOT check "Add README"** (Keep it empty).
4.  Click **Create repository**.

## 4. Retrieve Your URL
Copy the HTTPS URL from the new page. It looks like:
`https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git`

## 5. Connect & Push
Run these commands (Replace the URL with YOUR copied URL):

    git branch -M main

    git remote add origin https://github.com/abhishekmmb18-lang/i-SARTHI.git
    git push -u origin main

---
### 💡 Credentials Note
If asked for a password:
*   Use your **GitHub Password** (if it works), OR
*   Use a **Personal Access Token** (Settings -> Developer Settings -> Personal access tokens).
