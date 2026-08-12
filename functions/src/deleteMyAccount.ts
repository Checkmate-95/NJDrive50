import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { deleteCollectionRecursive } from "./utils/deleteCollection";
import { USER_STORAGE_ROOT } from "./config/storage";

if (!admin.apps.length) {
  admin.initializeApp();
}

const FIRESTORE_COLLECTIONS = [
  "drives",
  "exports",
  "milestones",
  "onboarding",
  "paperwork",
  "teenInfo",
  "parentInfo",
  "activeDrive",
  "settings",
] as const;

export const deleteMyAccount = onCall(
  {
    region: "us-central1",
    timeoutSeconds: 120,
    memory: "1GiB",
  },
  async (request) => {
    const uid = request.auth?.uid;

    if (!uid) {
      logger.error("deleteMyAccount called without authentication.");
      throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
      );
    }

    logger.info("Starting deleteMyAccount.", { uid });

    try {
      // Delete all subcollections in parallel
      await Promise.all(
        FIRESTORE_COLLECTIONS.map(async (collectionName) => {
          const fullCollectionPath = `users/${uid}/${collectionName}`;
          logger.info("Deleting Firestore subcollection.", { uid, fullCollectionPath });
          const collectionRef = admin.firestore().collection(fullCollectionPath);
          await deleteCollectionRecursive(collectionRef);
        })
      );

      // Delete the parent users/{uid} document itself — this was missing
      logger.info("Deleting parent user document.", { uid });
      await admin.firestore().doc(`users/${uid}`).delete();

      const bucket = admin.storage().bucket(); // uses default bucket, more portable
      const prefix = `${USER_STORAGE_ROOT}/${uid}/`;

      logger.info("Deleting Storage files.", { uid, prefix });
      const [deletedFiles] = await bucket.getFiles({ prefix });
      await bucket.deleteFiles({ prefix, force: true });
      logger.info("Storage files deleted.", { uid, count: deletedFiles.length });

      logger.info("Deleting Firebase Auth user.", { uid });
      await admin.auth().deleteUser(uid);

      logger.info("deleteMyAccount completed successfully.", { uid });

      return {
        success: true,
        message: "Account and all associated data deleted successfully.",
      };
    } catch (error: unknown) {
      logger.error("deleteMyAccount failed.", {
        uid,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
        errorObject: error,
      });

      throw new HttpsError(
        "internal",
        "Failed to delete account and user data."
      );
    }
  }
);