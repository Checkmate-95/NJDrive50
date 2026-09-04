// src/native/drive.ts
import { registerPlugin } from '@capacitor/core'

export type DriveVerificationStatus = 'VERIFIED' | 'ESTIMATED' | 'INCOMPLETE'
export type DriveTypeClassification = 'DAY_ONLY' | 'NIGHT_ONLY' | 'MIXED' | 'UNKNOWN'

export interface FinalizedDrive {
  driveId: string
  startedAtMs: number
  endedAtMs: number
  durationMs: number
  dayDurationMs: number
  nightDurationMs: number
  distanceMeters: number | null
  verificationStatus: DriveVerificationStatus
  driveType: DriveTypeClassification
  pointCount: number
  finalizedAtMs: number
  schemaVersion: number
}

export interface StartDriveResult {
  driveId: string
  status: 'ACTIVE'
}

export interface PauseDriveResult {
  driveId: string
  status: 'PAUSED'
}

export interface ResumeDriveResult {
  driveId: string
  status: 'ACTIVE'
}

export interface NativeDrivePlugin {
  startDrive(options: { driveId: string }): Promise<StartDriveResult>
  pauseDrive(options: { driveId: string }): Promise<PauseDriveResult>
  resumeDrive(options: { driveId: string }): Promise<ResumeDriveResult>
  stopDrive(options: { driveId: string }): Promise<FinalizedDrive>
  getDriveById(options: { driveId: string }): Promise<FinalizedDrive>
}

const Drive = registerPlugin<NativeDrivePlugin>('Drive')

export default Drive