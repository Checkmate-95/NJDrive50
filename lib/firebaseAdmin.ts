import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app"
import { getFirestore, type Firestore } from "firebase-admin/firestore"

// Credential order:
// 1. FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY (service account key), if both are set.
// 2. Application Default Credentials (gcloud login locally, or keyless
//    workload identity / GOOGLE_APPLICATION_CREDENTIALS in production).
function getAdminApp(): App {
  const existing = getApps()[0]
  if (existing) return existing

  const projectId = process.env.FIREBASE_PROJECT_ID
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID is not configured.")
  }

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    })
  }

  return initializeApp({
    credential: applicationDefault(),
    projectId,
  })
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp())
}
