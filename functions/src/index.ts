import { setGlobalOptions } from "firebase-functions/v2";

setGlobalOptions({
  region: "us-central1",
  memory: "1GiB",
  timeoutSeconds: 120,
});

import { deleteMyData } from "./deleteMyData";
import { deleteMyAccount } from "./deleteMyAccount";

export { deleteMyData, deleteMyAccount };

