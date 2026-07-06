import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { deleteDocumentAndSubcollections } from "./utils/deleteCollection";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Deletes ALL user Firestore data, but does NOT delete the Auth account.
 *
 * This supports Google Play "Delete Data" compliance for apps that
 * allow users to remove their stored data without necessarily deleting
 * the whole account.
 */
export const deleteMyData = onCall(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    logger.error("deleteMyData called without authentication.");
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  logger.info("Starting deleteMyData.", { uid });

  try {
    const collections = [
      "drives",
      "exports",
      "milestones",
      "onboarding",
      "paperwork",
      "teenInfo",
      "parentInfo",
      "activeDrive",
      "settings",
    ];

    for (const collectionName of collections) {
      logger.info("Deleting Firestore user document.", {
        uid,
        path: `${collectionName}/${uid}`,
      });

      await deleteDocumentAndSubcollections(collectionName, uid);
    }

    logger.info("deleteMyData completed successfully.", { uid });

    return {
      success: true,
      message: "User data deleted successfully.",
    };
  } catch (error: unknown) {
    logger.error("deleteMyData failed.", {
      uid,
      error: error instanceof Error ? error.message : String(error),
    });

    throw new HttpsError(
      "internal",
      "Failed to delete user data."
    );
  }
});