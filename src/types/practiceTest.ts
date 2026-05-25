export type AnswerSet = readonly [string, string, string, string]
export type AnswerIndex = 0 | 1 | 2 | 3

export type Question = {
  id: string
  question: string
  answers: AnswerSet
  correctIndex: AnswerIndex
  explanation: string
}

export type TestResult = {
  score: number
  total: number
  percent: number
  passed: boolean
}