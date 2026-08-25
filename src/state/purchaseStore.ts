// src/state/purchaseStore.ts
import { doc, getDoc } from "firebase/firestore"
import { db } from "../firebase"

export type PurchaseStatus = {
  hasPurchased: boolean
  purchaseToken?: string
}

// ⭐ Read-only — safe for client use, gated by Firestore rules (owner-only read)
export async function getPurchaseStatus(uid: string): Promise<PurchaseStatus> {
  try {
    const ref = doc(db, "purchases", uid)
    const snap = await getDoc(ref)

    if (!snap.exists()) {
      return { hasPurchased: false }
    }

    const data = snap.data()
    return {
      hasPurchased: typeof data?.hasPurchased === "boolean" ? data.hasPurchased : false,
      purchaseToken: typeof data?.purchaseToken === "string" ? data.purchaseToken : undefined,
    }
  } catch (err) {
    console.error("Error reading purchase status:", err)
    return { hasPurchased: false }
  }
}

// 🔒 setPurchased removed — writing purchase status must happen server-side
// via a Cloud Function that verifies the purchase token against the
// Google Play Developer API before granting entitlement. Do not write
// `hasPurchased: true` directly from the client.