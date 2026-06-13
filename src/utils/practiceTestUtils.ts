// src/utils/practiceTestUtils.ts
import type { PracticeQuestion } from "../data/practiceQuestions"

export type Question = PracticeQuestion

export const shuffleArray = <T,>(items: readonly T[]): T[] => {
  const copy = [...items]

  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }

  return copy
}

export const shuffleAnswersForQuestion = (question: Question): Question => {
  const indexedAnswers = question.answers.map((answer, index) => ({
    answer,
    originalIndex: index,
  }))

  const shuffledAnswers = shuffleArray(indexedAnswers)

  const newCorrectIndex = shuffledAnswers.findIndex(
    (item) => item.originalIndex === question.correctIndex
  )

  if (newCorrectIndex < 0 || newCorrectIndex > 3) {
    throw new Error("Failed to locate correct answer after shuffling.")
  }

  return {
    ...question,
    answers: shuffledAnswers.map((item) => item.answer) as [
      string,
      string,
      string,
      string,
    ],
    correctIndex: newCorrectIndex as 0 | 1 | 2 | 3,
  }
}

export const buildTestQuestions = (
  questions: readonly Question[],
  count: number
): Question[] => {
  const safeCount = Math.max(0, Math.min(count, questions.length))

  return shuffleArray(questions)
    .slice(0, safeCount)
    .map(shuffleAnswersForQuestion)
}


export const calcScorePercent = (score: number, total: number): number =>
  total === 0 ? 0 : Math.round((score / total) * 100)

export const isPassing = (scorePercent: number, passing = 80): boolean =>
  scorePercent >= passing