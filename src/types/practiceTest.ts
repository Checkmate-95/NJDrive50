export type Question = {
  id: string
  question: string
  answers: [string, string, string, string]
  correctIndex: 0 | 1 | 2 | 3
  explanation: string
}

export type TestResult = {
  score: number
  total: number
  percent: number
  passed: boolean
}