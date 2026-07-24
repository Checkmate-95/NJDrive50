// src/screens/ExportLog.tsx
import {
  useMemo,
  useCallback,
  useEffect,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react"
import type { Screen } from "../App"
import { useDriveHistory, isDriveVerified } from "../state/driveStore"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { navigate } from "../navigation/navMap"

import { Filesystem, Directory } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"
import { Capacitor } from "@capacitor/core"

type ExportLogProps = {
  setScreen: Dispatch<SetStateAction<Screen>>
}

type StatusState =
  | {
      type: "success" | "error" | "loading"
      title: string
      message: string
    }
  | null

const safeNumber = (value: unknown): number => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const formatHoursValue = (hours: number) => safeNumber(hours).toFixed(2)
const formatHoursLabel = (hours: number) => `${formatHoursValue(hours)} hrs`

const formatDateTime = (value: unknown): string => {
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString()
}

const getLightingLabel = (dayHours: number, nightHours: number): string => {
  if (nightHours > 0 && dayHours > 0) return "Mixed"
  if (nightHours > 0) return "Night"
  if (dayHours > 0) return "Day"
  return "—"
}

const csvEscape = (value: unknown): string => {
  const text = String(value ?? "")
  return `"${text.replace(/"/g, '""')}"`
}

const downloadTextFile = (
  text: string,
  filename: string,
  mimeType: string
) => {
  const blob = new Blob([text], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()

  window.setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = ""
  const chunkSize = 0x8000

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

const toBase64Utf8 = (text: string) => {
  return bytesToBase64(new TextEncoder().encode(text))
}

const toBase64FromArrayBuffer = (buffer: ArrayBuffer) => {
  return bytesToBase64(new Uint8Array(buffer))
}

function StatusBanner({
  status,
  onDismiss,
}: {
  status: NonNullable<StatusState>
  onDismiss: () => void
}) {
  const isSuccess = status.type === "success"
  const isError = status.type === "error"
  const isLoading = status.type === "loading"

  return (
    <div
      role={isError ? "alert" : "status"}
      aria-live={isError ? "assertive" : "polite"}
      className={`rounded-[24px] border px-5 py-4 shadow-sm ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
          : isError
            ? "border-red-200 bg-red-50 text-red-800"
            : "border-blue-200 bg-blue-50 text-blue-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold">{status.title}</p>
          <p className="mt-1 text-sm">{status.message}</p>
        </div>

        {!isLoading ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss status message"
            className="min-h-[44px] shrink-0 rounded-lg border border-current/15 bg-white/70 px-3 py-2 text-xs font-semibold transition hover:bg-white"
          >
            Dismiss
          </button>
        ) : null}
      </div>
    </div>
  )
}

export default function ExportLog({ setScreen }: ExportLogProps) {
  const drives = useDriveHistory() ?? []
  const [status, setStatus] = useState<StatusState>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [exportingKind, setExportingKind] = useState<"pdf" | "csv" | null>(null)

  useEffect(() => {
    if (!status || status.type === "loading") return

    const timeout = window.setTimeout(() => {
      setStatus(null)
    }, status.type === "error" ? 7000 : 4500)

    return () => window.clearTimeout(timeout)
  }, [status])

  const rows = useMemo(() => {
    return drives.map((d) => {
      const totalHours = safeNumber(d.totalDurationHours)
      const dayHours = safeNumber(d.dayDurationHours)
      const verifiedNight = safeNumber(d.verifiedNightDurationHours)
      const estimatedNight = safeNumber(d.nightDurationHours)
      const nightHours = verifiedNight > 0 ? verifiedNight : estimatedNight

      /*
       * FIX: Use the same isDriveVerified() logic that drives the
       * Verified/Estimated badge everywhere else in the app (TodaysDrive,
       * DriveHistoryContent). Previously this checked only
       * verifiedNightDurationHours > 0, which incorrectly labeled fully
       * verified all-daylight drives (isVerifiedDay === true, zero night
       * hours) as "Estimated" in the exported PDF/CSV.
       */
      const verified = isDriveVerified(d)

      return {
        id: d.id,
        start: formatDateTime(d.startTime),
        end: formatDateTime(d.endTime),
        totalHours,
        dayHours,
        nightHours,
        miles: safeNumber(d.miles),
        lighting: getLightingLabel(dayHours, nightHours),
        nightSource: verified ? "Verified" : "Estimated",
      }
    })
  }, [drives])

  const totals = useMemo(() => {
    return rows.reduce(
      (acc, row) => {
        acc.totalHours += row.totalHours
        acc.dayHours += row.dayHours
        acc.nightHours += row.nightHours
        acc.totalMiles += row.miles
        return acc
      },
      { totalHours: 0, dayHours: 0, nightHours: 0, totalMiles: 0 }
    )
  }, [rows])

  const hasDrives = rows.length > 0

  const shareNativeFile = useCallback(
    async ({
      uri,
      title,
      text,
      dialogTitle,
    }: {
      uri: string
      title: string
      text: string
      dialogTitle: string
    }) => {
      const canShareResult = await Share.canShare()

      if (!canShareResult.value) {
        throw new Error("Native sharing is not available on this device.")
      }

      await Share.share({
        title,
        text,
        files: [uri],
        dialogTitle,
      })
    },
    []
  )

  const exportPDF = useCallback(async () => {
    if (!hasDrives || isExporting) return

    setIsExporting(true)
    setExportingKind("pdf")
    setStatus({
      type: "loading",
      title: "Generating PDF...",
      message: "Please wait while your drive log is prepared.",
    })

    try {
      const doc = new jsPDF({ orientation: "landscape" })

      doc.setFontSize(18)
      doc.text("NJDrive50 Drive Log", 14, 18)

      doc.setFontSize(11)
      doc.text("Supervised driving export", 14, 26)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32)

      doc.setFontSize(10)
      doc.text(`Saved drives: ${rows.length}`, 14, 40)
      doc.text(`Total hours: ${formatHoursValue(totals.totalHours)}`, 70, 40)
      doc.text(`Day hours: ${formatHoursValue(totals.dayHours)}`, 128, 40)
      doc.text(`Night hours: ${formatHoursValue(totals.nightHours)}`, 182, 40)
      doc.text(`Total miles: ${totals.totalMiles.toFixed(1)}`, 242, 40)

      autoTable(doc, {
        startY: 48,
        head: [
          [
            "Start Time",
            "End Time",
            "Total Hours",
            "Day Hours",
            "Night Hours",
            "Night Source",
            "Miles",
            "Lighting",
          ],
        ],
        body: rows.map((row) => [
          row.start,
          row.end,
          formatHoursValue(row.totalHours),
          formatHoursValue(row.dayHours),
          formatHoursValue(row.nightHours),
          row.nightSource,
          row.miles.toFixed(1),
          row.lighting,
        ]),
        styles: {
          fontSize: 9,
          cellPadding: 2.5,
          overflow: "linebreak",
        },
        headStyles: {
          fillColor: [8, 25, 74],
          textColor: [255, 255, 255],
        },
        alternateRowStyles: {
          fillColor: [247, 249, 252],
        },
        margin: { left: 14, right: 14 },
      })

      const fileName = `NJDrive50_Log_${new Date().toISOString().slice(0, 10)}.pdf`
      const isNative = Capacitor.isNativePlatform()

      if (!isNative) {
        doc.save(fileName)
        setStatus({
          type: "success",
          title: "PDF downloaded",
          message: "Your drive log PDF has been saved.",
        })
        return
      }

      const pdfArrayBuffer = doc.output("arraybuffer") as ArrayBuffer
      const pdfBase64 = toBase64FromArrayBuffer(pdfArrayBuffer)

      const result = await Filesystem.writeFile({
        path: fileName,
        data: pdfBase64,
        directory: Directory.Documents,
        recursive: true,
      })

      const fileUri = result.uri?.replace(/\/$/, "")

      if (!fileUri) {
        throw new Error("No file URI was returned after writing the PDF.")
      }

      await shareNativeFile({
        uri: fileUri,
        title: "NJDrive50 Drive Log",
        text: "Your supervised driving log PDF is ready.",
        dialogTitle: "Share PDF",
      })

      setStatus({
        type: "success",
        title: "PDF ready",
        message: "Your drive log PDF is ready to share.",
      })
    } catch (error) {
      console.error("PDF export failed:", error)
      setStatus({
        type: "error",
        title: "PDF export failed",
        message: "Could not generate the PDF. Please try again.",
      })
    } finally {
      setIsExporting(false)
      setExportingKind(null)
    }
  }, [hasDrives, isExporting, rows, totals, shareNativeFile])

  const exportCSV = useCallback(async () => {
    if (!hasDrives || isExporting) return

    setIsExporting(true)
    setExportingKind("csv")
    setStatus({
      type: "loading",
      title: "Generating CSV...",
      message: "Please wait while your drive log is prepared.",
    })

    try {
      const header = [
        "Start Time",
        "End Time",
        "Total Hours",
        "Day Hours",
        "Night Hours",
        "Night Source",
        "Miles",
        "Lighting",
      ]

      const csvRows = rows.map((row) =>
        [
          csvEscape(row.start),
          csvEscape(row.end),
          csvEscape(formatHoursValue(row.totalHours)),
          csvEscape(formatHoursValue(row.dayHours)),
          csvEscape(formatHoursValue(row.nightHours)),
          csvEscape(row.nightSource),
          csvEscape(row.miles.toFixed(1)),
          csvEscape(row.lighting),
        ].join(",")
      )

      const csvContent = [header.join(","), ...csvRows].join("\r\n")
      const fileName = `NJDrive50_Log_${new Date().toISOString().slice(0, 10)}.csv`
      const isNative = Capacitor.isNativePlatform()

      if (!isNative) {
        downloadTextFile(csvContent, fileName, "text/csv;charset=utf-8;")
        setStatus({
          type: "success",
          title: "CSV downloaded",
          message: "Your drive log CSV has been saved.",
        })
        return
      }

      const csvBase64 = toBase64Utf8(csvContent)

      const result = await Filesystem.writeFile({
        path: fileName,
        data: csvBase64,
        directory: Directory.Documents,
        recursive: true,
      })

      const fileUri = result.uri?.replace(/\/$/, "")

      if (!fileUri) {
        throw new Error("No file URI was returned after writing the CSV.")
      }

      await shareNativeFile({
        uri: fileUri,
        title: "NJDrive50 Drive Log CSV",
        text: "Your supervised driving log CSV is ready.",
        dialogTitle: "Share CSV",
      })

      setStatus({
        type: "success",
        title: "CSV ready",
        message: "Your drive log CSV is ready to share.",
      })
    } catch (error) {
      console.error("CSV export failed:", error)
      setStatus({
        type: "error",
        title: "CSV export failed",
        message: "Could not generate the CSV. Please try again.",
      })
    } finally {
      setIsExporting(false)
      setExportingKind(null)
    }
  }, [hasDrives, isExporting, rows, shareNativeFile])

  return (
    <main className="min-h-dvh bg-white px-4 py-6 text-[#08194A] sm:px-6">
      <section className="mx-auto w-full max-w-3xl space-y-6">
        {status ? (
          <StatusBanner status={status} onDismiss={() => setStatus(null)} />
        ) : null}

        <div className="rounded-[28px] border border-[#08194A]/10 bg-[#08194A] px-5 py-6 text-white shadow-[0_14px_34px_rgba(10,30,94,0.18)] sm:px-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <img
              src="/NJDrive50_white.png"
              alt="NJDrive50 Badge"
              className="h-[96px] w-auto sm:h-[116px]"
            />

            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#f9c80e]/85">
                Drive Export
              </p>
              <h1 className="mt-2 text-3xl font-extrabold leading-tight">
                Export Logs
              </h1>
              <p className="mt-2 text-sm text-white/75 sm:text-base">
                Download a CSV or PDF version of your saved supervised-drive
                history.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-[28px] border border-[#08194A]/10 bg-[#F7F9FC] p-4 shadow-sm sm:grid-cols-2 sm:p-5 lg:grid-cols-4">
          <div className="rounded-2xl border border-[#08194A]/10 bg-white p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#08194A]/55">
              Saved Drives
            </p>
            <p className="mt-2 text-2xl font-black text-[#08194A]">
              {rows.length}
            </p>
          </div>

          <div className="rounded-2xl border border-[#08194A]/10 bg-white p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#08194A]/55">
              Total Hours
            </p>
            <p className="mt-2 text-2xl font-black text-[#08194A]">
              {formatHoursLabel(totals.totalHours)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#08194A]/10 bg-white p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#08194A]/55">
              Day Hours
            </p>
            <p className="mt-2 text-2xl font-black text-[#08194A]">
              {formatHoursLabel(totals.dayHours)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#08194A]/10 bg-white p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#08194A]/55">
              Night Hours
            </p>
            <p className="mt-2 text-2xl font-black text-[#08194A]">
              {formatHoursLabel(totals.nightHours)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#08194A]/10 bg-white p-4 shadow-sm sm:col-span-2 lg:col-span-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-[#08194A]/55">
                  Total Miles
                </p>
                <p className="mt-2 text-2xl font-black leading-none tracking-tight text-[#08194A] sm:text-3xl">
                  {totals.totalMiles.toFixed(1)}
                  <span className="ml-1 text-base font-bold text-[#08194A]/65">
                    mi
                  </span>
                </p>
              </div>

              <div className="text-sm text-[#08194A]/60 sm:max-w-[22rem] sm:text-right">
                Export includes timestamps, hour totals, miles, lighting
                classification, and night-hour source.
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-[#08194A]/10 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[#08194A]">Preview</h2>
            <span className="rounded-full bg-[#08194A]/6 px-3 py-1 text-xs font-semibold text-[#08194A]/70">
              {hasDrives ? `${rows.length} entries` : "No entries"}
            </span>
          </div>

          {!hasDrives ? (
            <p className="rounded-2xl border border-dashed border-[#08194A]/15 bg-[#F7F9FC] px-4 py-5 text-sm text-[#08194A]/65">
              No drives to export yet.
            </p>
          ) : (
            <div className="max-h-[24rem] space-y-3 overflow-y-auto pr-1">
              {rows.map((row) => (
                <div
                  key={row.id}
                  className="rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-[#08194A]">
                        {formatHoursLabel(row.totalHours)}
                      </p>
                      <p className="mt-1 text-xs text-[#08194A]/65">
                        {row.start} → {row.end}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[#08194A]/10 bg-white px-3 py-1 text-xs font-semibold text-[#08194A]/75">
                        {row.lighting}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          row.nightSource === "Verified"
                            ? "border border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border border-amber-200 bg-amber-50 text-amber-700"
                        }`}
                      >
                        {row.nightSource}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-[#08194A]/70 sm:grid-cols-4">
                    <div className="rounded-xl bg-white px-3 py-2">
                      Day: {formatHoursLabel(row.dayHours)}
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2">
                      Night: {formatHoursLabel(row.nightHours)}
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2">
                      Source: {row.nightSource}
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2">
                      Miles: {row.miles.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={exportPDF}
            disabled={!hasDrives || isExporting}
            className="min-h-[52px] rounded-xl bg-[#08194A] px-6 py-3.5 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting && exportingKind === "pdf"
              ? "Generating PDF..."
              : "Export as PDF"}
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={!hasDrives || isExporting}
            className="min-h-[52px] rounded-xl bg-[#f9c80e] px-6 py-3.5 font-semibold text-[#08194A] transition disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting && exportingKind === "csv"
              ? "Generating CSV..."
              : "Export as CSV"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("export", "history", setScreen)}
          className="min-h-[52px] w-full rounded-xl border border-[#08194A]/20 bg-white py-3.5 font-semibold text-[#08194A] transition hover:bg-[#F7F9FC]"
        >
          Back to History
        </button>
      </section>
    </main>
  )
}