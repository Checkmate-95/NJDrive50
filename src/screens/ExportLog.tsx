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
import { useDriveHistory } from "../state/driveStore"
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
      type: "success" | "error"
      title: string
      message: string
    }
  | null

const safeNumber = (value: unknown) => {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

const formatHours = (hours: number) => safeNumber(hours).toFixed(2)

const formatDateTime = (value: unknown) => {
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString()
}

const getLightingLabel = (dayHours: number, nightHours: number) => {
  if (nightHours > 0 && dayHours > 0) return "Mixed"
  if (nightHours > 0) return "Night"
  if (dayHours > 0) return "Day"
  return "—"
}

const csvEscape = (value: unknown) => {
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

const toBase64Utf8 = (text: string) => {
  const bytes = new Uint8Array(new TextEncoder().encode(text))
  return btoa(String.fromCharCode(...bytes))
}

const toBase64FromArrayBuffer = (buffer: ArrayBuffer) => {
  return btoa(
    Array.from(new Uint8Array(buffer), (byte) => String.fromCharCode(byte)).join("")
  )
}

function StatusBanner({
  status,
  onDismiss,
}: {
  status: NonNullable<StatusState>
  onDismiss: () => void
}) {
  const isSuccess = status.type === "success"

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      aria-live={isSuccess ? "polite" : "assertive"}
      className={[
        "rounded-[24px] border px-4 py-3 shadow-sm sm:px-5",
        isSuccess
          ? "border-[#08194A]/12 bg-[#F7F9FC] text-[#08194A]"
          : "border-[#f9c80e]/45 bg-[#FFF8DB] text-[#08194A]",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            aria-hidden="true"
            className={[
              "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-black",
              isSuccess
                ? "bg-[#08194A] text-white"
                : "bg-[#f9c80e] text-[#08194A]",
            ].join(" ")}
          >
            {isSuccess ? "✓" : "!"}
          </div>

          <div className="min-w-0">
            <p className="text-sm font-extrabold tracking-tight">{status.title}</p>
            <p className="mt-1 text-sm text-[#08194A]/78">{status.message}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss status message"
          className="shrink-0 rounded-lg border border-[#08194A]/10 bg-white px-2.5 py-1.5 text-xs font-semibold text-[#08194A] transition hover:bg-[#F3F6FB]"
        >
          Dismiss
        </button>
      </div>
    </div>
  )
}

export default function ExportLog({ setScreen }: ExportLogProps) {
  const drives = useDriveHistory() || []
  const [status, setStatus] = useState<StatusState>(null)

  useEffect(() => {
    if (!status) return

    const timeout = window.setTimeout(() => {
      setStatus(null)
    }, status.type === "error" ? 6500 : 4200)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [status])

  const rows = useMemo(() => {
    return drives.map((d) => {
      const totalHours = safeNumber(d.totalDurationHours)
      const dayHours = safeNumber(d.dayDurationHours)

      const verifiedNightHours = safeNumber(d.verifiedNightDurationHours)
      const estimatedNightHours = safeNumber(d.nightDurationHours)
      const nightHours =
        verifiedNightHours > 0 ? verifiedNightHours : estimatedNightHours

      const miles = safeNumber(d.miles)

      return {
        id: d.id,
        start: formatDateTime(d.startTime),
        end: formatDateTime(d.endTime),
        totalHours,
        dayHours,
        nightHours,
        miles,
        lighting: getLightingLabel(dayHours, nightHours),
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

  const shareNativeFile = useCallback(
    async ({
      uri,
      title,
      text,
      dialogTitle,
      successTitle,
      successMessage,
    }: {
      uri: string
      title: string
      text: string
      dialogTitle: string
      successTitle: string
      successMessage: string
    }) => {
      const canShareResult = await Share.canShare()

      if (!canShareResult.value) {
        throw new Error("Native share is not available on this device.")
      }

      await Share.share({
        title,
        text,
        files: [uri],
        dialogTitle,
      })

      setStatus({
        type: "success",
        title: successTitle,
        message: successMessage,
      })
    },
    []
  )

  const exportPDF = useCallback(async () => {
    try {
      const doc = new jsPDF({ orientation: "landscape" })

      doc.setFontSize(18)
      doc.text("NJDrive50 Drive Log", 14, 18)

      doc.setFontSize(11)
      doc.text("Supervised driving export", 14, 26)
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 32)

      doc.setFontSize(10)
      doc.text(`Saved drives: ${rows.length}`, 14, 40)
      doc.text(`Total hours: ${formatHours(totals.totalHours)}`, 70, 40)
      doc.text(`Day hours: ${formatHours(totals.dayHours)}`, 128, 40)
      doc.text(`Night hours: ${formatHours(totals.nightHours)}`, 182, 40)
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
            "Miles",
            "Lighting",
          ],
        ],
        body: rows.map((row) => [
          row.start,
          row.end,
          formatHours(row.totalHours),
          formatHours(row.dayHours),
          formatHours(row.nightHours),
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

      const isNative = Capacitor.isNativePlatform()

      if (!isNative) {
        doc.save("NJDrive50_Log.pdf")
        setStatus({
          type: "success",
          title: "PDF export started",
          message: "Your PDF file has been prepared for download.",
        })
        return
      }

      const fileName = `NJDrive50_Log_${Date.now()}.pdf`
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
        text: "Your supervised driving log is ready.",
        dialogTitle: "Share PDF",
        successTitle: "PDF ready",
        successMessage: "Your drive log PDF is ready to share.",
      })
    } catch (error) {
      console.error("PDF export failed:", error)
      setStatus({
        type: "error",
        title: "PDF export did not finish",
        message: "We couldn’t generate your PDF right now. Please try again.",
      })
    }
  }, [rows, totals, shareNativeFile])

  const exportCSV = useCallback(async () => {
    try {
      const header = [
        "Start Time",
        "End Time",
        "Total Hours",
        "Day Hours",
        "Night Hours",
        "Miles",
        "Lighting",
      ]

      const csvRows = rows.map((row) =>
        [
          csvEscape(row.start),
          csvEscape(row.end),
          csvEscape(formatHours(row.totalHours)),
          csvEscape(formatHours(row.dayHours)),
          csvEscape(formatHours(row.nightHours)),
          csvEscape(row.miles.toFixed(1)),
          csvEscape(row.lighting),
        ].join(",")
      )

      const csv = [header.join(","), ...csvRows].join("\r\n")
      const fileName = `NJDrive50_Log_${Date.now()}.csv`
      const isNative = Capacitor.isNativePlatform()

      if (!isNative) {
        downloadTextFile(csv, "NJDrive50_Log.csv", "text/csv;charset=utf-8;")
        setStatus({
          type: "success",
          title: "CSV export started",
          message: "Your CSV file has been prepared for download.",
        })
        return
      }

      const csvBase64 = toBase64Utf8(csv)

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
        text: "Your supervised driving CSV export is ready.",
        dialogTitle: "Share CSV",
        successTitle: "CSV ready",
        successMessage: "Your drive log CSV is ready to share.",
      })
    } catch (error) {
      console.error("CSV export failed:", error)
      setStatus({
        type: "error",
        title: "CSV export did not finish",
        message: "We couldn’t generate your CSV right now. Please try again.",
      })
    }
  }, [rows, shareNativeFile])

  const hasDrives = rows.length > 0

  return (
    <main className="min-h-screen bg-white px-4 py-6 text-[#08194A] sm:px-6">
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
              {formatHours(totals.totalHours)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#08194A]/10 bg-white p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#08194A]/55">
              Day Hours
            </p>
            <p className="mt-2 text-2xl font-black text-[#08194A]">
              {formatHours(totals.dayHours)}
            </p>
          </div>

          <div className="rounded-2xl border border-[#08194A]/10 bg-white p-4 shadow-sm">
            <p className="text-[11px] uppercase tracking-[0.16em] text-[#08194A]/55">
              Night Hours
            </p>
            <p className="mt-2 text-2xl font-black text-[#08194A]">
              {formatHours(totals.nightHours)}
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
                Export includes timestamps, hour totals, miles, and lighting
                classification.
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
                        {formatHours(row.totalHours)} hrs
                      </p>
                      <p className="mt-1 text-xs text-[#08194A]/65">
                        {row.start} → {row.end}
                      </p>
                    </div>

                    <span className="rounded-full border border-[#08194A]/10 bg-white px-3 py-1 text-xs font-semibold text-[#08194A]/75">
                      {row.lighting}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-[#08194A]/70 sm:grid-cols-3">
                    <div className="rounded-xl bg-white px-3 py-2">
                      Day: {formatHours(row.dayHours)}
                    </div>
                    <div className="rounded-xl bg-white px-3 py-2">
                      Night: {formatHours(row.nightHours)}
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
            disabled={!hasDrives}
            className="rounded-xl bg-[#08194A] px-6 py-3.5 font-semibold text-white shadow-md transition hover:bg-[#0A1E5E] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export as PDF
          </button>

          <button
            type="button"
            onClick={exportCSV}
            disabled={!hasDrives}
            className="rounded-xl bg-[#f9c80e] px-6 py-3.5 font-semibold text-[#08194A] shadow-md transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Export as CSV
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("export", "history", setScreen)}
          className="w-full rounded-xl bg-[#E9EDF5] px-6 py-3.5 font-semibold text-[#08194A] transition hover:bg-[#DCE4F2]"
        >
          Back to History
        </button>
      </section>
    </main>
  )
}