// src/screens/DeleteData.tsx
import { useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "../firebase";
import { useNav } from "../state/navStore";

type DeleteDataPayload = {
  deleteDriveLogs: boolean;
  deletePracticeSessions: boolean;
  deleteUploadedDocuments: boolean;
};

type DeleteDataResult = {
  success: boolean;
  message?: string;
};

type Step = "idle" | "working" | "success";

function getErrorCode(error: unknown): string {
  return typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
    ? (error as { code: string }).code
    : "";
}

function getErrorMessage(error: unknown): string {
  switch (getErrorCode(error)) {
    case "functions/invalid-argument":
      return "Please choose at least one type of data to delete.";
    case "functions/unauthenticated":
      return "Please sign in again to manage your data.";
    case "functions/failed-precondition":
      return "That data cannot be deleted right now. Please try again.";
    case "functions/internal":
      return "We could not process your data deletion request right now. Please try again.";
    default:
      return "We could not process your data deletion request right now. Please try again.";
  }
}

export default function DeleteData() {
  const { goBack, setScreen } = useNav();

  const [deleteDriveLogs, setDeleteDriveLogs] = useState(false);
  const [deletePracticeSessions, setDeletePracticeSessions] = useState(false);
  const [deleteUploadedDocuments, setDeleteUploadedDocuments] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [step, setStep] = useState<Step>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const requestDeleteData = useMemo(
    () =>
      httpsCallable<DeleteDataPayload, DeleteDataResult>(
        functions,
        "deleteMyData"
      ),
    []
  );

  const hasSelection =
    deleteDriveLogs ||
    deletePracticeSessions ||
    deleteUploadedDocuments;

  const canSubmit =
    hasSelection &&
    acknowledged &&
    confirmText.trim().toUpperCase() === "DELETE";

  const handleOpenWebDeletion = () => {
    window.open(
      "https://njdrive50.com/delete-data",
      "_blank",
      "noopener,noreferrer"
    );
  };

  const handleDeleteSelectedData = async () => {
    const user = auth.currentUser;

    if (!user) {
      setErrorMessage("You must be signed in to manage your app data.");
      return;
    }

    if (!canSubmit || step === "working") return;

    setErrorMessage("");
    setSuccessMessage("");
    setStep("working");

    try {
      const result = await requestDeleteData({
        deleteDriveLogs,
        deletePracticeSessions,
        deleteUploadedDocuments,
      });

      setSuccessMessage(
      result.data?.message || "Your selected data has been deleted."
    );

      setSuccessMessage(
        result.data?.message || "Your selected data has been deleted."
      );
      setStep("success");
      setScreen("dataClearedPartial");

    } catch (error) {
      setStep("idle");
      setErrorMessage(getErrorMessage(error));
    }
  };

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-3 pb-20 pt-3 text-[#08194A]">
      <div className="mx-auto w-full max-w-2xl">
        <header className="rounded-2xl border border-[#08194A]/10 bg-white px-4 py-4 shadow-sm">
          <button
            type="button"
            onClick={() => goBack("settings")}
            className="mb-3 inline-flex h-10 w-full items-center justify-center rounded-xl border border-[#08194A]/10 bg-[#F7F9FC] px-3 text-xs font-bold uppercase tracking-[0.14em] text-[#08194A]/70 transition hover:bg-[#EEF3FA]"
          >
            ← Back to Settings
          </button>

          <div className="mb-1 flex items-center justify-between gap-2">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#08194A]/70">
              Privacy
            </p>
            <span className="rounded-full border border-[#08194A]/10 bg-[#F7F9FC] px-2 py-0.5 text-[10px] font-semibold text-[#08194A]/70">
              Manage App Data
            </span>
          </div>

          <h1 className="text-lg font-extrabold leading-tight tracking-tight text-[#08194A]">
            Delete App Data
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#08194A]/72">
            You can delete selected NJDrive50 data without deleting your account.
            This option helps you remove certain stored information while keeping
            access to the app and your subscription settings.
          </p>
        </header>

        <section className="mt-3 space-y-3">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 shadow-sm">
            <p className="text-sm font-semibold text-amber-800">
              Before you continue
            </p>
            <ul className="mt-2 space-y-1 text-xs leading-5 text-amber-700">
              <li>• Deleting selected data does not delete your NJDrive50 account.</li>
              <li>• Deleting selected data does not cancel your Google Play subscription.</li>
              <li>• Deleted data may not be recoverable.</li>
              <li>
                • Some limited records may be retained where required for legal,
                security, fraud-prevention, billing, or compliance reasons.
              </li>
              <li>
                • For full account deletion, use the separate Delete Account option.
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-[#08194A]/10 bg-white px-4 py-4 shadow-sm">
            <p className="text-sm font-semibold text-[#08194A]">
              Choose data to delete
            </p>

            <div className="mt-3 space-y-3">
              <label className="flex items-start gap-3 rounded-xl border border-[#08194A]/8 bg-[#F7F9FC] px-3 py-3">
                <input
                  type="checkbox"
                  checked={deleteDriveLogs}
                  onChange={(e) => setDeleteDriveLogs(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border border-[#08194A]/20"
                />
                <span>
                  <span className="block text-sm font-semibold text-[#08194A]">
                    Drive logs
                  </span>
                  <span className="block text-xs leading-5 text-[#08194A]/70">
                    Deletes saved driving log entries associated with your account.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-[#08194A]/8 bg-[#F7F9FC] px-3 py-3">
                <input
                  type="checkbox"
                  checked={deletePracticeSessions}
                  onChange={(e) => setDeletePracticeSessions(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border border-[#08194A]/20"
                />
                <span>
                  <span className="block text-sm font-semibold text-[#08194A]">
                    Practice-session and milestone data
                  </span>
                  <span className="block text-xs leading-5 text-[#08194A]/70">
                    Deletes in-progress drive data, practice-session records, and related milestone tracking data.
                  </span>
                </span>
              </label>

              <label className="flex items-start gap-3 rounded-xl border border-[#08194A]/8 bg-[#F7F9FC] px-3 py-3">
                <input
                  type="checkbox"
                  checked={deleteUploadedDocuments}
                  onChange={(e) => setDeleteUploadedDocuments(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border border-[#08194A]/20"
                />
                <span>
                  <span className="block text-sm font-semibold text-[#08194A]">
                    Uploaded documents and exports
                  </span>
                  <span className="block text-xs leading-5 text-[#08194A]/70">
                    Deletes uploaded paperwork, exported files, and related stored metadata associated with your account.
                  </span>
                </span>
              </label>
            </div>

            <div className="mt-4 rounded-xl border border-[#08194A]/8 bg-[#F7F9FC] px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/70">
                What is not deleted here
              </p>
              <ul className="mt-2 space-y-1 text-xs leading-5 text-[#08194A]/72">
                <li>• Your NJDrive50 account</li>
                <li>• Your authentication sign-in credentials</li>
                <li>• Your Google Play billing or subscription records</li>
                <li>• Any data not included in the selected categories above</li>
              </ul>
            </div>

            <label className="mt-4 flex items-start gap-3">
              <input
                type="checkbox"
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border border-[#08194A]/20"
              />
              <span className="text-xs leading-5 text-[#08194A]/80">
                I understand that selected data will be permanently deleted and may
                not be recoverable, except where limited retention is required as
                described in the Privacy Policy.
              </span>
            </label>

            <div className="mt-3">
              <label
                htmlFor="confirm-delete-data"
                className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-[#08194A]/70"
              >
                Type DELETE to continue
              </label>
              <input
                id="confirm-delete-data"
                type="text"
                autoCapitalize="characters"
                autoCorrect="off"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="h-11 w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-3 text-sm text-[#08194A] outline-none transition focus:border-amber-300 focus:bg-white focus:ring-2 focus:ring-amber-100"
              />
            </div>

            {errorMessage && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {errorMessage}
              </div>
            )}

            {successMessage && (
              <div className="mt-3 rounded-xl border border-green-200 bg-green-50 px-3 py-2 text-xs text-green-700">
                {successMessage}
              </div>
            )}

            <button
              type="button"
              onClick={() => void handleDeleteSelectedData()}
              disabled={!canSubmit || step === "working"}
              className="mt-4 h-11 w-full rounded-xl border border-amber-200 bg-amber-500 px-4 text-sm font-extrabold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {step === "working"
                ? "Deleting Selected Data..."
                : "Delete Selected Data"}
            </button>
          </div>

          <div className="rounded-2xl border border-[#08194A]/10 bg-white px-4 py-3 shadow-sm">
            <p className="text-xs font-semibold text-[#08194A]">
              Need to manage your data outside the app?
            </p>
            <p className="mt-1 text-xs leading-5 text-[#08194A]/70">
              You can also use our web data-deletion page without reinstalling the app.
            </p>
            <button
              type="button"
              onClick={handleOpenWebDeletion}
              className="mt-2 h-10 w-full rounded-xl border border-[#08194A]/12 bg-[#F7F9FC] px-4 text-xs font-bold text-[#08194A] transition hover:bg-[#EEF3FA]"
            >
              Open Data Deletion Page
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}