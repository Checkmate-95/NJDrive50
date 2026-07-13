import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "../firebase"

// ⭐ This is the structure we store in Firebase
export type PurchaseStatus = {
  hasPurchased: boolean
  purchaseToken?: string // future Google Play Billing token
}

// ⭐ 1. Read purchase status from Firebase
export async function getPurchaseStatus(uid: string): Promise<PurchaseStatus> {
  try {
    const ref = doc(db, "purchases", uid)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      return { hasPurchased: false }
    }

    return snap.data() as PurchaseStatus
  } catch (err) {
    console.error("Error reading purchase status:", err)
    return { hasPurchased: false }
  }
}

// ⭐ 2. Write purchase status to Firebase (used later after billing)
export async function setPurchased(
  uid: string,
  purchaseToken?: string
): Promise<void> {
  try {
    const ref = doc(db, "purchases", uid)
    await setDoc(ref, {
      hasPurchased: true,
      purchaseToken: purchaseToken ?? null,
    })
  } catch (err) {
    console.error("Error setting purchase status:", err)
  }
}
