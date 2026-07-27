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
      for (const collectionName of FIRESTORE_COLLECTIONS) {
        const fullCollectionPath = `users/${uid}/${collectionName}`;

        logger.info("Deleting Firestore subcollection.", {
          uid,
          fullCollectionPath,
        });

        const collectionRef = admin.firestore().collection(fullCollectionPath);
        await deleteCollectionRecursive(collectionRef);
      }

      const bucket = admin.storage().bucket("njdrive50-app.firebasestorage.app");

      // Trailing slash is required: without it, "users/abc123" would also
      // match "users/abc1234/..." since GCS prefix matching is a literal
      // string match, not a path-segment match.
      const prefix = `${USER_STORAGE_ROOT}/${uid}/`;

      logger.info("Deleting Storage files.", { uid, prefix });

      await bucket.deleteFiles({
        prefix,
        force: true,
      });

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