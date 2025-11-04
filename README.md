---
title: cases
emoji: 🐳
colorFrom: gray
colorTo: green
sdk: static
pinned: false
tags:
  - deepsite
---

Check out the configuration reference at https://huggingface.co/docs/hub/spaces-config-reference

## Content Security Policy

To allow the reCAPTCHA iframe to load, ensure your hosting platform sends the following header:

```
Content-Security-Policy: frame-ancestors 'self' https://www.google.com https://www.gstatic.com;
```

This policy mirrors the meta tag included in `auth.html`.

## Phone auth domains

If you see `Firebase: Hostname match not found (auth/captcha-check-failed)` when sending the SMS code, add your site's domain to **Authentication → Settings → Authorized domains** in the Firebase console. For local development, the app automatically disables reCAPTCHA verification on `localhost`.

## Firebase Hosting setup

The repository now includes Firebase configuration for serving the static site and the accompanying HTTPS Cloud Functions used by the UI (`/api/spin` and `/api/run-battle`). To deploy:

1. Install the Firebase CLI if you have not already: `npm install -g firebase-tools`.
2. Authenticate with your Google account: `firebase login`.
3. From the repository root, install the Cloud Functions dependencies:
   ```bash
   cd functions
   npm install
   cd ..
   ```
4. Deploy both hosting and functions targets:
   ```bash
   firebase deploy
   ```

The project alias in `.firebaserc` is set to `cases-e5b4e`. Update it if you need to deploy to a different Firebase project.

## Container hosting / Cloud Run

For platforms that expect the application to start an HTTP server (such as Cloud Run), install the root dependencies and run the Express server included in `server.js`:

```bash
npm install
npm start
```

The server listens on the port specified by the `PORT` environment variable (default `8080`), serves the static site, and exposes the same `/api/spin` and `/api/run-battle` endpoints backed by Firebase Admin SDK as the HTTPS Cloud Functions used on Firebase Hosting. This ensures the container reports a healthy status during deployment.

## Link an existing account to a phone number

If you need to attach a phone number to an existing Firebase Auth user (for example, an admin account that can no longer sign in), use the helper script in `tools/link-phone-number.js`.

1. Create a service account key with the **Firebase Admin** role from the [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts). Download the JSON file.
2. Run the script from the repository root, pointing it at the service account file and your Realtime Database URL:
   ```bash
   node tools/link-phone-number.js \
     --service-account path/to/serviceAccount.json \
     --database-url https://your-project-default-rtdb.firebaseio.com \
     --email admin@example.com \
     --phone +15551234567
   ```
   You can also target a user with `--uid` instead of `--email` if you already know the Firebase UID.
3. On success the script updates both Firebase Auth and `users/<uid>` in the Realtime Database, marks the number as verified, and the user can log in immediately with the SMS flow.

> **Security tip:** delete the service account JSON file after running the script to avoid leaving credentials on disk.
