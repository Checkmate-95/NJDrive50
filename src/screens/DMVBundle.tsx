// src/screens/DMVBundle.tsx
// Cross-platform PDF download:
// Android/iOS -> Capacitor Filesystem + Share (native share sheet)
// Desktop/browser -> jsPDF doc.save() blob download

import { useDriveHistory, type DriveEntry } from "../state/driveStore"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"
import { loadOnboardingData } from "../../core/ReminderEngine"
import { useNav } from "../state/navStore"
import { Capacitor } from "@capacitor/core"
import { Filesystem, Directory } from "@capacitor/filesystem"
import { Share } from "@capacitor/share"

type BundleCardProps = {
  title: string
  description: string
  actionLabel: string
  onClick: () => void
}

const REQUIRED_TOTAL_HOURS = 50
const REQUIRED_NIGHT_HOURS = 10

const OFFICIAL_BACSD_URL = "https://www.nj.gov/mvc/pdf/license/BA-CSD.pdf"
const OFFICIAL_6_POINT_URL = "https://www.nj.gov/mvc/license/6pointid.htm"
const OFFICIAL_REAL_ID_URL = "https://www.nj.gov/mvc/realid/selector.html"
const OFFICIAL_FIRST_LICENSE_URL =
  "https://www.nj.gov/mvc/license/youngadult.htm"

function safeNumber(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

function clean(text: string) {
  return text
    .replace(/[\u2010\u2011\u2012\u2013\u2014]/g, "-")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/\u2026/g, "...")
    .replace(/\u00A0/g, " ")
}

function safe(value: unknown): string {
  if (value === undefined || value === null) return ""
  return String(value)
}

function getLightingLabel(dayHours: number, nightHours: number) {
  if (nightHours > 0 && dayHours > 0) return "Mixed"
  if (nightHours > 0) return "Night"
  return "Day"
}

function toBase64Utf8(text: string) {
  const bytes = new TextEncoder().encode(text)
  let binary = ""
  const chunkSize = 0x8000

  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize)
    binary += String.fromCharCode(...chunk)
  }

  return btoa(binary)
}

function getNightData(d: DriveEntry) {
  const verifiedNight = safeNumber(d.verifiedNightDurationHours)
  const estimatedNight = safeNumber(d.nightDurationHours)
  const effectiveNight = verifiedNight > 0 ? verifiedNight : estimatedNight
  const nightSource = verifiedNight > 0 ? "Verified" : "Estimated"

  return {
    effectiveNight,
    verifiedNight,
    estimatedNight,
    nightSource,
  }
}

async function savePDF(doc: jsPDF, filename: string): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = doc.output("datauristring").split(",")[1]

      await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Cache,
      })

      const { uri } = await Filesystem.getUri({
        path: filename,
        directory: Directory.Cache,
      })

      await Share.share({
        title: filename,
        text: "Your NJDrive50 PDF is ready.",
        files: [uri],
        dialogTitle: "Save or share your PDF",
      })
      return
    } catch (err) {
      console.error("Native PDF save failed, falling back to browser preview:", err)
    }
  }

  try {
    const blob = doc.output("blob")
    const url = URL.createObjectURL(blob)
    const newWindow = window.open(url, "_blank", "noopener,noreferrer")

    if (!newWindow) {
      doc.save(filename)
      URL.revokeObjectURL(url)
      return
    }

    window.setTimeout(() => {
      URL.revokeObjectURL(url)
    }, 60_000)
  } catch (err) {
    console.error("Blob preview failed, falling back to direct save:", err)
    doc.save(filename)
  }
}

function openExternal(url: string) {
  window.open(url, "_blank", "noopener,noreferrer")
}

function BundleCard({
  title,
  description,
  actionLabel,
  onClick,
}: BundleCardProps) {
  const blueButtonClasses =
    "mt-4 w-full rounded-xl bg-[#08194A] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_rgba(8,25,74,0.18)] transition hover:-translate-y-[1px] hover:bg-[#0A1E5E]"

  return (
    <div className="flex h-full flex-col rounded-2xl border border-[#08194A]/10 bg-white p-5 shadow-[0_10px_28px_rgba(0,0,0,0.06)]">
      <div className="flex-1">
        <h3 className="text-lg font-extrabold leading-tight text-[#08194A]">
          {title}
        </h3>
        <p className="mt-2 text-sm leading-6 text-[#08194A]/70">{description}</p>
      </div>

      <button type="button" onClick={onClick} className={blueButtonClasses}>
        {actionLabel}
      </button>
    </div>
  )
}

export default function DMVBundle() {
  const { goBack, setScreen } = useNav()

  const drives: DriveEntry[] = useDriveHistory() || []
  const data = loadOnboardingData() || {}

  const SHOW_PRACTICE_TEST = false

  const totalHours = drives.reduce(
    (sum, d) => sum + safeNumber(d.totalDurationHours),
    0
  )

  const nightHours = drives.reduce((sum, d) => {
    const { effectiveNight } = getNightData(d)
    return sum + effectiveNight
  }, 0)

  const remainingHours = Math.max(REQUIRED_TOTAL_HOURS - totalHours, 0)
  const remainingNightHours = Math.max(REQUIRED_NIGHT_HOURS - nightHours, 0)

  const isCompliant =
    totalHours >= REQUIRED_TOTAL_HOURS && nightHours >= REQUIRED_NIGHT_HOURS

  const {
    teenName,
    teenBirthday,
    teenPhone,
    permitIssueDate,
    permitNumber,
    address,
    state,
    parentName,
    parentPhone,
    parentEmail,
  } = data

  const sharedFields = {
    teenName: teenName || "Teen Driver",
    teenDOB: teenBirthday || "",
    teenPhone: teenPhone || "",
    teenAddress: address || "",
    teenState: state || "",
    permitIssueDate: permitIssueDate || "",
    permitNumber: permitNumber || "",
    parentName: parentName || "",
    parentPhone: parentPhone || "",
    parentEmail: parentEmail || "",
  }

  const addDocHeader = (doc: jsPDF, title: string, subtitle?: string) => {
    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.text(clean(title), 14, 20)

    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)

    if (subtitle) {
      const lines = doc.splitTextToSize(clean(subtitle), 180)
      doc.text(lines, 14, 30)
      return 30 + lines.length * 6
    }

    return 26
  }

  const createDrivingLogPDF = () => {
    const doc = new jsPDF()

    let y = addDocHeader(
      doc,
      "NJDrive50 - Supervised Driving Log",
      "Reference log generated from saved NJDrive50 sessions. Bring the official signed NJ MVC BA-CSD form for supervised-driving certification."
    )

    y += 10
    doc.setFontSize(12)
    doc.text(`Teen Driver: ${safe(sharedFields.teenName)}`, 14, y)
    doc.text(`Total Hours: ${totalHours.toFixed(2)}`, 14, y + 8)
    doc.text(`Night Hours: ${nightHours.toFixed(2)}`, 14, y + 16)

    const tableData = drives.map((d) => {
      const safeStart = d?.startTime ? new Date(d.startTime).toLocaleString() : ""
      const safeEnd = d?.endTime ? new Date(d.endTime).toLocaleString() : ""
      const safeTotalHours = safeNumber(d?.totalDurationHours)
      const safeDayHours = safeNumber(d?.dayDurationHours)
      const { effectiveNight, nightSource } = getNightData(d)

      return [
        `${safeStart}${d.id ? ` (${d.id.slice(0, 4)})` : ""}`,
        safeEnd,
        safeTotalHours.toFixed(2),
        effectiveNight.toFixed(2),
        nightSource,
        getLightingLabel(safeDayHours, effectiveNight),
        safeNumber(d?.miles).toFixed(1),
      ]
    })

    autoTable(doc, {
      startY: y + 26,
      head: [[
        "Start Time",
        "End Time",
        "Hours",
        "Night Hours",
        "Night Source",
        "Lighting",
        "Miles",
      ]],
      body: tableData,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [8, 25, 74] },
    })

    const lastY = (doc as jsPDF & { lastAutoTable?: { finalY?: number } })
      .lastAutoTable?.finalY ?? 220

    doc.setFontSize(9)
    doc.text(
      clean(
        "Reminder: NJ MVC states that the signed BA-CSD form is the certification document. This driving log is a supporting record."
      ),
      14,
      Math.min(lastY + 12, 280)
    )

    return doc
  }

  const generateDrivingLogPDF = async () => {
    const doc = createDrivingLogPDF()
    await savePDF(doc, "NJDrive50_Driving_Log.pdf")
  }

  const createParentSummarySheet = () => {
    const doc = new jsPDF()

    let y = addDocHeader(
      doc,
      "Parent/Guardian Summary Sheet",
      "This is a support document for review and recordkeeping. Use the official NJ MVC BA-CSD form for required supervised-driving certification."
    )

    y += 10
    doc.setFontSize(12)
    doc.text(`Teen Driver: ${safe(sharedFields.teenName)}`, 14, y)
    doc.text(`Parent/Guardian: ${safe(sharedFields.parentName)}`, 14, y + 8)
    doc.text(`Total Hours Logged: ${totalHours.toFixed(2)}`, 14, y + 16)
    doc.text(`Night Hours Logged: ${nightHours.toFixed(2)}`, 14, y + 24)

    doc.setFontSize(11)
    const body = doc.splitTextToSize(
      clean(
        "Use this summary to review progress before completing the official BA-CSD. It is not a substitute for the NJ MVC certification form."
      ),
      180
    )
    doc.text(body, 14, y + 40)

    doc.text("Parent/Guardian Name: ____________________________", 14, y + 78)
    doc.text("Signature: ____________________________", 14, y + 88)
    doc.text("Date: ____________________", 14, y + 98)

    return doc
  }

  const generateParentSummarySheet = async () => {
    const doc = createParentSummarySheet()
    await savePDF(doc, "Parent_Guardian_Summary_NJDrive50.pdf")
  }

  const createRoadTestChecklist = () => {
    const doc = new jsPDF()
    const left = 14
    const indent = 20
    const maxWidth = 170
    let y = 20

    const ensureSpace = (needed = 20) => {
      if (y + needed > 270) {
        doc.addPage()
        y = 20
      }
    }

    const addWrappedLine = (text: string, x = indent) => {
      const lines = doc.splitTextToSize(clean(text), maxWidth)
      doc.text(lines, x, y)
      y += lines.length * 6 + 2
    }

    const addSection = (title: string, items: string[]) => {
      ensureSpace(24)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text(clean(title), left, y)
      y += 8
      doc.setFont("helvetica", "normal")
      doc.setFontSize(11)
      items.forEach((item) => {
        ensureSpace(12)
        addWrappedLine(`- ${item}`)
      })
      y += 4
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.text("Road Test Readiness Checklist", left, y)
    y += 10

    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    doc.text("Prepared by NJDrive50", left, y)
    y += 8
    doc.text(`Teen Driver: ${clean(sharedFields.teenName)}`, left, y)
    y += 12

    addSection("Documents to Bring", [
      "Permit.",
      "Vehicle registration.",
      "Insurance card.",
      "Completed and signed official BA-CSD form when required for licensure.",
    ])

    addSection("Vehicle Readiness", [
      "Valid inspection sticker.",
      "Working brake lights, turn signals, horn, and basic safety equipment.",
      "Confirm your test vehicle satisfies current NJ MVC road-test rules before the appointment.",
    ])

    addSection("Skills to Practice", [
      "Parallel parking.",
      "K-turn or 3-point turn.",
      "Smooth stops.",
      "Lane changes with signaling.",
      "Reverse driving control.",
    ])

    ensureSpace(24)
    doc.setFontSize(9)
    doc.setTextColor(90)
    const footer = doc.splitTextToSize(
      clean(
        `Official references: BA-CSD ${OFFICIAL_BACSD_URL} | First Driver License ${OFFICIAL_FIRST_LICENSE_URL}`
      ),
      maxWidth
    )
    doc.text(footer, left, y)

    return doc
  }

  const generateRoadTestChecklist = async () => {
    const doc = createRoadTestChecklist()
    await savePDF(doc, "Road_Test_Checklist_NJDrive50.pdf")
  }

  const createMVCWhatToBring = () => {
    const doc = new jsPDF()
    const left = 14
    let y = 20

    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.text("What to Bring to MVC", left, y)
    y += 10

    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    doc.text("Generated by NJDrive50", left, y)
    y += 8
    doc.text(`Teen Driver: ${safe(sharedFields.teenName)}`, left, y)
    y += 12

    const lines = doc.splitTextToSize(
      clean(
        "Document combinations can differ depending on whether you are completing a standard license transaction or a REAL ID transaction. Always confirm your exact documents with official NJ MVC tools before your appointment."
      ),
      180
    )
    doc.text(lines, left, y)
    y += lines.length * 6 + 8

    doc.setFont("helvetica", "bold")
    doc.text("Bring and verify:", left, y)
    y += 8

    doc.setFont("helvetica", "normal")
    ;[
      "Permit",
      "Vehicle registration",
      "Insurance card",
      "Completed BA-CSD form when required",
      "ID and address documents confirmed on NJ MVC official pages",
    ].forEach((item) => {
      doc.text(`- ${item}`, 20, y)
      y += 8
    })
    y += 6

    doc.setFont("helvetica", "bold")
    doc.text("Official links to verify:", left, y)
    y += 8

    doc.setFont("helvetica", "normal")
    doc.text(`- 6 Points of ID: ${OFFICIAL_6_POINT_URL}`, 20, y)
    y += 8
    doc.text(`- REAL ID selector: ${OFFICIAL_REAL_ID_URL}`, 20, y)
    y += 8
    doc.text(`- First driver license: ${OFFICIAL_FIRST_LICENSE_URL}`, 20, y)

    return doc
  }

  const generateMVCWhatToBring = async () => {
    const doc = createMVCWhatToBring()
    await savePDF(doc, "MVC_What_To_Bring_NJDrive50.pdf")
  }

  const createSixPointID = () => {
    const doc = new jsPDF()
    const left = 14
    const indent = 20
    const maxWidth = 170
    let y = 20

    const ensureSpace = (needed = 20) => {
      if (y + needed > 270) {
        doc.addPage()
        y = 20
      }
    }

    const addWrappedLine = (text: string, x = indent) => {
      const lines = doc.splitTextToSize(clean(text), maxWidth)
      doc.text(lines, x, y)
      y += lines.length * 6 + 2
    }

    const addSection = (title: string, items: string[]) => {
      ensureSpace(24)
      doc.setFont("helvetica", "bold")
      doc.setFontSize(12)
      doc.text(clean(title), left, y)
      y += 8
      doc.setFont("helvetica", "normal")
      doc.setFontSize(11)
      items.forEach((item) => {
        ensureSpace(12)
        addWrappedLine(`- ${item}`)
      })
      y += 4
    }

    doc.setFont("helvetica", "bold")
    doc.setFontSize(18)
    doc.text("6-Point ID Checklist", left, y)
    y += 10

    doc.setFont("helvetica", "normal")
    doc.setFontSize(11)
    doc.text("Prepared by NJDrive50", left, y)
    y += 8

    addWrappedLine(
      "Use this checklist as a planning guide. Always confirm your exact document combination with the official NJ MVC 6 Points page or REAL ID selector before your appointment.",
      left
    )
    y += 4

    addSection("Standard license / permit transactions", [
      "Bring 6 Points of ID as required by NJ MVC.",
      "Bring proof of New Jersey residential address.",
      "Bring SSN, ITIN, or affidavit as allowed by MVC rules.",
      "Bring the required MVC application form for your transaction.",
    ])

    addSection("REAL ID transactions", [
      "REAL ID follows a 2 + 1 + 6 structure.",
      "Bring 2 proofs of residential address.",
      "Bring 1 proof of full Social Security number.",
      "Bring identity documents that total 6 REAL ID points.",
    ])

    addSection("Examples of documents", [
      "Examples vary by transaction and current MVC rules.",
      "Common categories include passport or birth certificate, school records, Social Security card, financial statements, and proof of address documents.",
      "Do not rely on a sample combination alone; verify on the official NJ MVC pages.",
    ])

    ensureSpace(26)
    doc.setFontSize(9)
    doc.setTextColor(90)
    const footer = doc.splitTextToSize(
      clean(
        `Official references: ${OFFICIAL_6_POINT_URL} | ${OFFICIAL_REAL_ID_URL}`
      ),
      maxWidth
    )
    doc.text(footer, left, y)

    return doc
  }

  const generateSixPointID = async () => {
    const doc = createSixPointID()
    await savePDF(doc, "6_Point_ID_Checklist_NJDrive50.pdf")
  }

  const downloadOfficialBACSD = () => openExternal(OFFICIAL_BACSD_URL)
  const openSixPointGuide = () => openExternal(OFFICIAL_6_POINT_URL)
  const openRealIdSelector = () => openExternal(OFFICIAL_REAL_ID_URL)
  const openFirstLicenseGuide = () => openExternal(OFFICIAL_FIRST_LICENSE_URL)

  const generatePermitPacket = async () => {
    await generateMVCWhatToBring()
    await generateSixPointID()
    await generateRoadTestChecklist()
  }

  const openOfficialMVCBundle = () => {
    downloadOfficialBACSD()
    openSixPointGuide()
    openRealIdSelector()
    openFirstLicenseGuide()
  }

  const openBundleActions = async () => {
    if (Capacitor.isNativePlatform()) {
      alert(
        "For the smoothest mobile experience, use the individual download buttons below. The official NJ MVC links will open now."
      )
      openOfficialMVCBundle()
      return
    }

    await generateDrivingLogPDF()
    await generateParentSummarySheet()
    await generateMVCWhatToBring()
    await generateSixPointID()
    await generateRoadTestChecklist()
    openOfficialMVCBundle()
  }

  const generateShareLink = async () => {
    const payload = {
      teenName: sharedFields.teenName,
      totalHours,
      nightHours,
      drives,
    }

    try {
      const encoded = toBase64Utf8(JSON.stringify(payload))
      const url = `${window.location.origin}/share#${encoded}`

      if (Capacitor.isNativePlatform()) {
        await Share.share({
          title: "NJDrive50 Records",
          text: "Here are my supervised driving records from NJDrive50.",
          url,
          dialogTitle: "Share your records",
        })
      } else {
        try {
          await navigator.clipboard.writeText(url)
          alert("Share link copied to clipboard!")
        } catch {
          window.prompt("Copy this share link:", url)
        }
      }
    } catch (err) {
      console.error("Failed to generate share link", err)
      alert("Unable to generate share link.")
    }
  }

  const solidBlueButton =
    "inline-flex items-center rounded-xl bg-[#08194A] px-4 py-2 text-sm font-bold text-white shadow-[0_14px_28px_rgba(8,25,74,0.18)] transition hover:-translate-y-[1px] hover:bg-[#0A1E5E]"

  const complianceLabel = isCompliant
    ? "Ready for BA-CSD review"
    : totalHours >= REQUIRED_TOTAL_HOURS && nightHours < REQUIRED_NIGHT_HOURS
      ? `${remainingNightHours.toFixed(1)} night hours still needed`
      : `${remainingHours.toFixed(1)} total hrs / ${remainingNightHours.toFixed(
          1
        )} night hrs remaining`

  return (
  <main className="min-h-dvh bg-[#F7F9FC] px-4 py-6 text-[#08194A] sm:px-6">
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header className="rounded-3xl border border-[#08194A]/10 bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <button
              type="button"
              onClick={() => goBack()}
              className={`mb-4 ${solidBlueButton}`}
            >
              ← Back to Home
            </button>

            <div className="inline-flex rounded-full border border-[#D4AF37]/30 bg-[#FFF8DB] px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#6B5600]">
              DMV Bundle
            </div>

            <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#08194A] sm:text-4xl">
              DMV paperwork and compliance packet
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#08194A]/70 sm:text-base">
              Download your driving log, support summaries, MVC prep
              checklists, and the official BA-CSD form from one place.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void openBundleActions()
            }}
            className="inline-flex shrink-0 items-center rounded-2xl bg-[#08194A] px-5 py-3 text-sm font-extrabold text-white shadow-[0_16px_30px_rgba(8,25,74,0.18)] transition hover:-translate-y-[1px] hover:bg-[#0A1E5E]"
          >
            Open Full Bundle
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-[#08194A]/10 bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#08194A]/50">
            Teen Driver
          </p>
          <p className="mt-2 text-xl font-extrabold text-[#08194A]">
            {safe(sharedFields.teenName)}
          </p>
          <p className="mt-1 text-sm text-[#08194A]/65">
            Permit #{safe(sharedFields.permitNumber) || "Not provided"}
          </p>
        </div>

        <div className="rounded-2xl border border-[#08194A]/10 bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#08194A]/50">
            Total Hours
          </p>
          <p className="mt-2 text-3xl font-black leading-none text-[#08194A]">
            {totalHours.toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-[#08194A]/65">
            Logged supervised hours
          </p>
        </div>

        <div className="rounded-2xl border border-[#08194A]/10 bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#08194A]/50">
            Night Hours
          </p>
          <p className="mt-2 text-3xl font-black leading-none text-[#08194A]">
            {nightHours.toFixed(2)}
          </p>
          <p className="mt-2 text-sm text-[#08194A]/65">
            Counted toward the 10-hour night target
          </p>
        </div>

        <div className="rounded-2xl border border-[#08194A]/10 bg-white p-5 shadow-[0_10px_24px_rgba(0,0,0,0.05)]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#08194A]/50">
            Status
          </p>
          <p className="mt-2 text-lg font-extrabold leading-tight text-[#08194A]">
            {complianceLabel}
          </p>
          <p className="mt-2 text-sm text-[#08194A]/65">
            Based on saved NJDrive50 totals
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-[#08194A]/10 bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#08194A]/50">
              Official first
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#08194A]">
              Start with the required NJ MVC forms and references
            </h2>
          </div>
          <div className="text-sm text-[#08194A]/65">
            Use app PDFs as support documents, then verify against NJ MVC
            pages.
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <BundleCard
            title="Official BA-CSD Form"
            description="Open the official New Jersey MVC supervised-driving certification form. This is the form used to certify supervised practice hours."
            actionLabel="Open Official BA-CSD"
            onClick={downloadOfficialBACSD}
          />
          <BundleCard
            title="NJ MVC 6-Point ID Page"
            description="Open the official NJ MVC 6 Points of ID page to confirm the document combination for your transaction."
            actionLabel="Open 6-Point ID Page"
            onClick={openSixPointGuide}
          />
          <BundleCard
            title="NJ MVC REAL ID Selector"
            description="Use the official selector if you are completing a REAL ID transaction and need the 2 + 1 + 6 document flow."
            actionLabel="Open REAL ID Selector"
            onClick={openRealIdSelector}
          />
          <BundleCard
            title="First Driver License Guide"
            description="Review NJ MVC first-license guidance for supervised driving, permit rules, and next-step requirements."
            actionLabel="Open License Guide"
            onClick={openFirstLicenseGuide}
          />
        </div>
      </section>

      <section className="rounded-3xl border border-[#08194A]/10 bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#08194A]/50">
              Paperwork Center
            </p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#08194A]">
              Download support forms and the complete packet
            </h2>
          </div>
          <div className="max-w-md text-sm leading-6 text-[#08194A]/65">
            Generated from your saved NJDrive50 records where applicable.
          </div>
        </div>

        <div className="mt-6 space-y-6">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#08194A]" />
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#08194A]/70">
                Complete packets
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <BundleCard
                title="Permit Packet"
                description="Download the road test checklist, 6-point ID checklist, and MVC document-prep packet together."
                actionLabel="Download Permit Packet"
                onClick={() => {
                  void generatePermitPacket()
                }}
              />
              <BundleCard
                title="Driving Log PDF"
                description="A saved-session reference log with totals, night-source labeling, and drive details. Helpful for records, but not a replacement for the official BA-CSD."
                actionLabel="Download Driving Log"
                onClick={() => {
                  void generateDrivingLogPDF()
                }}
              />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#F9C80E]" />
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#08194A]/70">
                Support forms
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <BundleCard
                title="Parent/Guardian Summary Sheet"
                description="Create a printable support sheet summarizing hours before completing the official MVC certification form."
                actionLabel="Generate Summary Sheet"
                onClick={() => {
                  void generateParentSummarySheet()
                }}
              />
              <BundleCard
                title="What to Bring to MVC"
                description="A parent-friendly overview of documents and links to verify requirements before the MVC visit."
                actionLabel="Generate Packet"
                onClick={() => {
                  void generateMVCWhatToBring()
                }}
              />
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#38BDF8]" />
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#08194A]/70">
                Checklists
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <BundleCard
                title="Road Test Readiness Checklist"
                description="Review vehicle readiness, required documents, and key skills before the road test appointment."
                actionLabel="Generate Checklist"
                onClick={() => {
                  void generateRoadTestChecklist()
                }}
              />
              <BundleCard
                title="6-Point ID Checklist"
                description="Generate a planning checklist for ID and address prep before your MVC appointment."
                actionLabel="Generate Checklist"
                onClick={() => {
                  void generateSixPointID()
                }}
              />
            </div>
          </div>

          <div className="rounded-2xl border border-dashed border-[#08194A]/12 bg-[#F7F9FC] p-4 sm:p-5">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#16A34A]" />
              <h3 className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#08194A]/70">
                Sharing
              </h3>
            </div>

            <BundleCard
              title="Share Records with Instructor or Reviewer"
              description="Generate a read-only share link you can send to an instructor or approved reviewer. On mobile, opens the native share sheet."
              actionLabel="Copy Share Link"
              onClick={() => {
                void generateShareLink()
              }}
            />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-[#08194A]/10 bg-white p-5 shadow-[0_12px_30px_rgba(0,0,0,0.06)] sm:p-6">
        <h2 className="text-2xl font-extrabold tracking-tight text-[#08194A]">
          Next steps
        </h2>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex h-full flex-col rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-5">
            <div className="flex-1">
              <h3 className="text-lg font-extrabold text-[#08194A]">
                DMV Driving Test Appointment Prep
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#08194A]/70">
                Review required documents, vehicle checks, and test-day steps
                before the MVC appointment.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setScreen("dmvPrep")}
              className="mt-4 w-full rounded-xl bg-[#08194A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0A1E5E]"
            >
              Open Prep Guide
            </button>
          </div>

          {SHOW_PRACTICE_TEST ? (
            <div className="flex h-full flex-col rounded-2xl border border-[#08194A]/10 bg-[#F7F9FC] p-5">
              <div className="flex-1">
                <h3 className="text-lg font-extrabold text-[#08194A]">
                  Practice Test
                </h3>
                <p className="mt-2 text-sm leading-6 text-[#08194A]/70">
                  Future feature placeholder for NJ permit practice testing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScreen("practiceTest")}
                className="mt-4 w-full rounded-xl bg-[#08194A] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0A1E5E]"
              >
                Open Practice Test
              </button>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-[#08194A]/15 bg-[#FBFCFE] p-5">
              <h3 className="text-lg font-extrabold text-[#08194A]">
                More tools coming soon
              </h3>
              <p className="mt-2 text-sm leading-6 text-[#08194A]/65">
                This area is reserved for future DMV prep tools, including
                guided practice resources.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-3xl border border-[#08194A]/10 bg-[#08194A] p-5 text-white shadow-[0_12px_30px_rgba(0,0,0,0.08)] sm:p-6">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#f9c80e]/80">
          Legal
        </p>
        <h2 className="mt-2 text-xl font-extrabold tracking-tight text-white">
          Privacy and terms
        </h2>
        <p className="mt-2 text-sm leading-6 text-white/70">
          Review the privacy policy and terms of use for NJDrive50.
        </p>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4">
          <button
            type="button"
            onClick={() => setScreen("privacy")}
            className="flex w-full items-center justify-between py-3 text-sm text-white/70 transition hover:text-white"
          >
            <span>Privacy Policy</span>
            <span className="text-white/30">›</span>
          </button>

          <div className="h-px w-full bg-white/10" />

          <button
            type="button"
            onClick={() => setScreen("terms")}
            className="flex w-full items-center justify-between py-3 text-sm text-white/70 transition hover:text-white"
          >
            <span>Terms of Use</span>
            <span className="text-white/30">›</span>
          </button>
        </div>
      </section>
    </div>
  </main>
)
}