# Project Pulse — self-hosted setup

This dashboard is public to view. Only `rsivarajan1234@gmail.com` can create,
edit, or delete projects (unless you later assign a project owner email).

## Quick local start (no Firebase account required)

You need Node.js 18+ (already used by this repo). Then:

```
npm install
npm start
```

Open http://localhost:3000 — anyone with that link can view the board.
Sign in as **rsivarajan1234@gmail.com** to create and edit data.

To host it on your own domain later, follow the Firebase steps below and
paste a real `firebaseConfig` into `index.html`. Until that config is
pasted, the app uses the local server and `data/projects.json`.

---

## Firebase hosting (optional, for a public internet URL)

This gives you the same dashboard on infrastructure you own — your own
database, your own domain. It uses Firebase (Google's backend-as-a-service):
a permanent free tier, no server for you to manage.

Total time: about 15–20 minutes, no coding required beyond copy/paste.

## 1. Create a Firebase project

1. Go to https://console.firebase.google.com and sign in with any Google account.
2. Click **Add project**, name it (e.g. "project-pulse"), and finish the wizard.
   (You can disable Google Analytics for this — it isn't needed.)

## 2. Turn on Firestore (the database)

1. In the left sidebar: **Build → Firestore Database → Create database**.
2. Choose **Production mode** (not test mode) and pick a region close to your team.
3. Once it's created, go to the **Rules** tab and replace the default rules
   with the contents of `firestore.rules` from this folder.
4. Before publishing the rules, edit the `ADMIN_EMAILS`-equivalent line in
   that file — replace `"you@yourcompany.com"` with the real email
   address(es) that should have admin control. Click **Publish**.

## 3. Turn on Google sign-in

1. **Build → Authentication → Get started**.
2. Under **Sign-in method**, enable **Google**, and save.

## 4. Get your web app config

1. Click the gear icon (top left) → **Project settings**.
2. Scroll to **Your apps**, click the **</>** (web) icon to register a new web app.
3. Give it any nickname, skip Firebase Hosting for now, click **Register app**.
4. Firebase shows you a `firebaseConfig` object with your `apiKey`,
   `authDomain`, `projectId`, etc. Copy it.

## 5. Paste your config into the app

1. Open `index.html` from this folder in a text editor.
2. Near the top of the `<script type="module">` block, replace the
   placeholder `firebaseConfig` object with the one you just copied.
3. Just below it, replace `ADMIN_EMAILS` with the same admin email(s) you
   put in `firestore.rules` — these two lists must match.

## 6. Host the file

Any static host works, since it's a single self-contained HTML file. Two easy options:

**Option A — Firebase Hosting (stays in the same ecosystem)**
```
npm install -g firebase-tools
firebase login
firebase init hosting     # choose your project, public dir = this folder, single-page app = No
firebase deploy
```
You'll get a URL like `project-pulse.web.app` immediately, and can attach
your own domain for free under **Hosting → Add custom domain**.

**Option B — Vercel or Netlify**
Drag the folder into the Netlify dashboard, or run `vercel` from inside it.
Either gives you a free URL and a custom-domain option in a couple of clicks.
Firebase doesn't care where the HTML is hosted — it only cares that the
config inside it points at your project.

## 7. Try it

1. Open your new URL. You should see "No projects yet" and a **Sign in with
   Google** button, with no login required just to view.
2. Sign in with one of your `ADMIN_EMAILS` addresses — you should see the
   **Admin** tag and a **New project** button appear.
3. Create a project, and in "Owner's email" put a teammate's real Google
   email address. When they open the link and sign in with that exact
   address, they'll be able to edit only that project.

## Notes and limits

- **No org directory search.** Unlike the Claude-hosted version, there's no
  built-in company directory — admins assign owners by typing their email
  directly. This is intentional; adding a real directory would mean wiring
  up Google Workspace or Microsoft Entra, which is a bigger project.
- **Free tier is generous for this use case**: Firestore's free tier covers
  roughly 50,000 reads and 20,000 writes a day, far more than a portfolio
  dashboard for a company will use.
- **Anyone can view without signing in** by design (so stakeholders don't
  need Google accounts just to look). If you'd rather require sign-in for
  viewing too, change `allow read: if true;` to `allow read: if isSignedIn();`
  in `firestore.rules`.
- Your existing six seeded projects from the Claude-hosted version aren't
  automatically here — you'll re-add them through the **New project** form,
  or tell me and I'll generate a small import script instead.
