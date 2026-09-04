# ReflectAI: Gemini 3.6 Flash Journal & Reflection Studio

A production-grade, user-authenticated journaling web application powered by **Gemini 3.6 Flash** and isolated **Cloud Firestore** storage.

---

## 1. Architecture Overview

- **Frontend**: React 19, TypeScript, Tailwind CSS, Motion.
- **Backend API**: Express server running on Node.js / TypeScript.
- **AI Processing Engine**: Google Gen AI SDK (`@google/genai`) with Gemini 3.6 Flash and resilient 4-tier model fallback (`gemini-3.6-flash` &rarr; `gemini-3.1-flash-lite` &rarr; `gemini-flash-latest` &rarr; `gemini-3.7-flash`).
- **User Identity**: Firebase Authentication with Federated Google Sign-In (no stored passwords).
- **Backend Database**: Cloud Firestore with strict, owner-bound security rules (`/users/{userId}/interactions/{interactionId}`).
- **Secret Management**: Google Cloud Secret Manager & Environment Variables.

---

## 2. Prerequisites & Environment Setup

### Install the Google Cloud SDK & Firebase CLI
Ensure you have the latest `gcloud` CLI and `firebase-tools` installed and authenticated:
```bash
gcloud auth login
gcloud auth application-default login
npm install -g firebase-tools
```

### Enable Necessary Google Cloud Services
Enable Cloud Run, Secret Manager, and Cloud Firestore in your GCP project:
```bash
export PROJECT_ID="YOUR_PROJECT_ID"
gcloud config set project $PROJECT_ID

gcloud services enable \
  run.googleapis.com \
  secretmanager.googleapis.com \
  firestore.googleapis.com \
  aiplatform.googleapis.com
```

---

## 3. Secret Management Setup

Create and bind the `GEMINI_API_KEY` secret securely in Google Cloud Secret Manager without hardcoding values in code or repository files:

```bash
# 1. Create the secret in Secret Manager
gcloud secrets create GEMINI_API_KEY --replication-policy="automatic"

# 2. Add your Gemini API key as a secret version
echo -n "YOUR_ACTUAL_GEMINI_API_KEY" | gcloud secrets versions add GEMINI_API_KEY --data-file=-

# 3. Obtain your Project Number
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")

# 4. Grant the default Cloud Run Compute service account access to read the secret
gcloud secrets add-iam-policy-binding GEMINI_API_KEY \
  --member="serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

---

## 4. Cloud Firestore Security Configuration

ReflectAI strictly enforces zero-insecure defaults with user data isolation. Ensure your `firestore.rules` file is deployed to Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/interactions/{interactionId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Deploy the rules via Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 5. Local Development

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables in `.env`:
```bash
cp .env.example .env
# Edit .env and supply GEMINI_API_KEY
```

3. Start the unified full-stack development server:
```bash
npm run dev
```
The application will be accessible at `http://localhost:3000`.

---

## 6. Cloud Run Deployment Flow

Build and deploy the application container directly to Google Cloud Run with the Secret Manager binding:

```bash
# Build and deploy service
gcloud run deploy reflect-ai \
  --source . \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest
```

---

## 7. Required Campaign Verification Binding

To register the service for automated challenge verification, attach the required campaign label:

```bash
gcloud run services update reflect-ai \
  --update-labels=dev-tutorial=cloud-run-ai-challenge \
  --region=us-central1
```

---

## 8. Verification & Security Review

- **Zero-Insecure Defaults**: Reads and writes are blocked for unauthenticated callers or cross-user identifiers.
- **Resilient Fallback Ladder**: Automatically retries 429/503 responses across `gemini-3.6-flash`, `gemini-3.1-flash-lite`, `gemini-flash-latest`, and `gemini-3.7-flash`.
- **Zero Client Key Exposure**: All calls to the Gemini API occur through the backend `/api/gemini/*` proxy routes.
