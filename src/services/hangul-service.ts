import { PRACTICE_LETTERS, type PracticeLetter } from "@/lib/practice-letters";

export async function fetchPracticeLetters(): Promise<PracticeLetter[]> {
  return Promise.resolve(PRACTICE_LETTERS);
}

