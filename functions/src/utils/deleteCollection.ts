import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Recursively deletes a Firestore collection and everything under it.
 */
export async function deleteCollectionRecursive(
  collectionRef: FirebaseFirestore.CollectionReference
): Promise<void> {
  logger.info("Starting recursive delete for collection.", {
    path: collectionRef.path,
  });

  await admin.firestore().recursiveDelete(collectionRef);

  logger.info("Finished recursive delete for collection.", {
    path: collectionRef.path,
  });
}

/**
 * Recursively deletes a Firestore document and all nested subcollections.
 */
export async function deleteDocumentRecursive(
  docRef: FirebaseFirestore.DocumentReference
): Promise<void> {
  logger.info("Starting recursive delete for document.", {
    path: docRef.path,
  });

  await admin.firestore().recursiveDelete(docRef);

  logger.info("Finished recursive delete for document.", {
    path: docRef.path,
  });
}

/**
 * Deletes a document inside a top-level collection,
 * including all nested subcollections.
 */
export async function deleteDocumentAndSubcollections(
  collectionName: string,
  docId: string
): Promise<void> {
  if (!collectionName || !docId) {
    throw new Error("collectionName and docId are required.");
  }

  const docRef = admin.firestore().collection(collectionName).doc(docId);
  await deleteDocumentRecursive(docRef);
}
