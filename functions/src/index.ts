import { setGlobalOptions } from "firebase-functions/v2";

// Apply shared defaults to all v2 functions in this codebase.
// Keep this BEFORE importing any function modules.
setGlobalOptions({
  region: "us-central1",
  memory: "1GiB",
  timeoutSeconds: 120,
});

export { deleteMyData } from "./deleteMyData";
export { deleteMyAccount } from "./deleteMyAccount";
