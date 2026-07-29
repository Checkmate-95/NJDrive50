import { useEffect, useRef, useState } from 'react'
import Drive from '../native/drive'
import type { FinalizedDrive } from '../native/drive'


export default function DriveDebug() {
  const [driveId, setDriveId] = useState<string | null>(null)
  const [result, setResult] = useState<FinalizedDrive | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isWorking, setIsWorking] = useState(false)
  const [elapsedSec, setElapsedSec] = useState(0)

  const startedAtRef = useRef<number | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const start = async () => {
    const id = crypto.randomUUID()
    setError(null)
    setResult(null)
    setIsWorking(true)

    try {
      const started = await Drive.startDrive({ driveId: id })
      setDriveId(started.driveId)
      startedAtRef.current = Date.now()
      setElapsedSec(0)

      intervalRef.current = setInterval(() => {
        if (startedAtRef.current) {
          setElapsedSec(Math.floor((Date.now() - startedAtRef.current) / 1000))
        }
      }, 1000)

      console.log('Drive started:', started)
    } catch (err: any) {
      setError(err.message ?? 'Unknown error starting drive')
      console.error(err)
    } finally {
      setIsWorking(false)
    }
  }

  const stop = async () => {
    if (!driveId) return
    setIsWorking(true)
    setError(null)

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    try {
      const finalized = await Drive.stopDrive({ driveId })
      setResult(finalized)
      console.log('Finalized drive:', finalized)
    } catch (err: any) {
      setError(err.message ?? 'Unknown error stopping drive')
      console.error(err)
    } finally {
      setIsWorking(false)
    }
  }

  const reset = () => {
    setDriveId(null)
    setResult(null)
    setError(null)
    setElapsedSec(0)
    startedAtRef.current = null
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Drive Debug</h1>

      <button onClick={start} disabled={isWorking || !!driveId}>
        Start Drive
      </button>
      <button onClick={stop} disabled={isWorking || !driveId}>
        Stop Drive
      </button>
      <button onClick={reset} disabled={isWorking || !result}>
        Reset
      </button>

      {isWorking && <p>Working...</p>}
      {driveId && !result && <p>Drive ID: {driveId} — elapsed: {elapsedSec}s</p>}
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {result && (
        <pre style={{ background: '#eee', padding: 10 }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </div>
  )
}