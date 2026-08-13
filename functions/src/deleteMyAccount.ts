import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { deleteCollectionRecursive } from "./utils/deleteCollection";
import { USER_STORAGE_ROOT } from "./config/storage";

if (!admin.apps.length) {
  admin.initializeApp();
}

type DeleteMyAccountRequest = {
  confirmDelete?: boolean;
};

type DeleteMyAccountResponse = {
  success: boolean;
  message: string;
};

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

export const deleteMyAccount = onCall<
  DeleteMyAccountRequest,
  Promise<DeleteMyAccountResponse>
>(
  {
    region: "us-central1",
    timeoutSeconds: 300,
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

    const data = request.data ?? {};

    if (data.confirmDelete !== true) {
      throw new HttpsError(
        "invalid-argument",
        "Account deletion must be explicitly confirmed."
      );
    }

    logger.info("Starting deleteMyAccount.", { uid });

    try {
      await Promise.all(
        FIRESTORE_COLLECTIONS.map(async (collectionName) => {
          const fullCollectionPath = `users/${uid}/${collectionName}`;

          logger.info("Deleting Firestore subcollection.", {
            uid,
            fullCollectionPath,
          });

          const collectionRef = admin.firestore().collection(fullCollectionPath);
          await deleteCollectionRecursive(collectionRef);
        })
      );

      logger.info("Deleting parent user document.", { uid });
      await admin
        .firestore()
        .doc(`users/${uid}`)
        .delete()
        .catch((error: unknown) => {
          logger.warn("Parent user document delete skipped or failed.", {
            uid,
            errorMessage: error instanceof Error ? error.message : String(error),
          });
        });

      const bucket = admin.storage().bucket();
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
        message: "Account and associated app data deleted successfully.",
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
        "Failed to delete account and associated user data."
      );
    }
  }
);