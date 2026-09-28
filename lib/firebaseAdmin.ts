import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
} from "firebase-admin/app"
import { getFirestore, type Firestore } from "firebase-admin/firestore"

// Credential order:
// 1. FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY, when both are set.
// 2. Application Default Credentials otherwise.
function getAdminApp(): App {
  const projectId = process.env.FIREBASE_PROJECT_ID

  if (!projectId) {
    throw new Error("FIREBASE_PROJECT_ID is not configured.")
  }

  const existing = getApps().find((app) => app.name === "[DEFAULT]")
  if (existing) {
    if (
      existing.options.projectId &&
      existing.options.projectId !== projectId
    ) {
      throw new Error(
        "The existing Firebase Admin app uses a different project."
      )
    }

    return existing
  }

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n")

  if (Boolean(clientEmail) !== Boolean(privateKey)) {
    throw new Error(
      "FIREBASE_CLIENT_EMAIL and FIREBASE_PRIVATE_KEY must both be configured."
    )
  }

  if (clientEmail && privateKey) {
    return initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
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