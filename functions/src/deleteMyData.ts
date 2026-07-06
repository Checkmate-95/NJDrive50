import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import { deleteCollectionRecursive } from "./utils/deleteCollection";

if (!admin.apps.length) {
  admin.initializeApp();
}

type DeleteMyDataRequest = {
  deleteDriveLogs?: boolean;
  deletePracticeSessions?: boolean;
  deleteSavedVehicles?: boolean;
  deleteUploadedDocuments?: boolean;
};

export const deleteMyData = onCall<DeleteMyDataRequest>(async (request) => {
  const uid = request.auth?.uid;

  if (!uid) {
    logger.error("deleteMyData called without authentication.");
    throw new HttpsError(
      "unauthenticated",
      "The function must be called while authenticated."
    );
  }

  const data = request.data ?? {};

  const deleteDriveLogs = data.deleteDriveLogs === true;
  const deletePracticeSessions = data.deletePracticeSessions === true;
  const deleteSavedVehicles = data.deleteSavedVehicles === true;
  const deleteUploadedDocuments = data.deleteUploadedDocuments === true;

  if (
    !deleteDriveLogs &&
    !deletePracticeSessions &&
    !deleteSavedVehicles &&
    !deleteUploadedDocuments
  ) {
    throw new HttpsError(
      "invalid-argument",
      "At least one data type must be selected for deletion."
    );
  }

  logger.info("Starting deleteMyData.", {
    uid,
    deleteDriveLogs,
    deletePracticeSessions,
    deleteSavedVehicles,
    deleteUploadedDocuments,
  });

  try {
    const firestoreTargets: string[] = [];

    if (deleteDriveLogs) {
      firestoreTargets.push("drives");
    }

    if (deletePracticeSessions) {
      firestoreTargets.push("activeDrive", "milestones");
    }

    if (deleteSavedVehicles) {
      firestoreTargets.push("settings");
    }

    if (deleteUploadedDocuments) {
      firestoreTargets.push("paperwork", "exports");
    }

    for (const collectionName of firestoreTargets) {
      const fullCollectionPath = `users/${uid}/${collectionName}`;

      logger.info("Deleting Firestore subcollection.", {
        uid,
        fullCollectionPath,
      });

      const collectionRef = admin.firestore().collection(fullCollectionPath);
      await deleteCollectionRecursive(collectionRef);
    }

    if (deleteUploadedDocuments) {
      const bucket = admin.storage().bucket();
      const prefixes = [
        `users/${uid}/documents/`,
        `users/${uid}/exports/`,
      ];

      for (const prefix of prefixes) {
        logger.info("Deleting Storage files.", { uid, prefix });

        await bucket.deleteFiles({
          prefix,
          force: true,
        });
      }
    }

    logger.info("deleteMyData completed successfully.", { uid });

    return {
      success: true,
      message: "Selected user data deleted successfully.",
    };
  } catch (error: unknown) {
  logger.error("deleteMyData failed.", {
    uid,
    errorMessage: error instanceof Error ? error.message : String(error),
    errorStack: error instanceof Error ? error.stack : undefined,
    errorObject: error,
  });

  throw new HttpsError("internal", "Failed to delete selected user data.");
}
});