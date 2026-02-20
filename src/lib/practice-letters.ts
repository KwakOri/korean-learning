const L_INDEXES = [0, 2, 3, 5, 6, 7, 9, 11, 12, 14, 15, 16, 17, 18] as const;
const V_INDEXES = [0, 2, 4, 6, 8, 12, 13, 17, 18, 20] as const;
const HANGUL_BASE = 0xac00;

export type PracticeLetter = {
  id: string;
  character: string;
  order: number;
  audioFileName: string;
  audioPath: string;
};

export function buildPracticeCharacters(): string[] {
  const letters: string[] = [];

  for (const lIndex of L_INDEXES) {
    for (const vIndex of V_INDEXES) {
      const codePoint = HANGUL_BASE + (lIndex * 21 + vIndex) * 28;
      letters.push(String.fromCharCode(codePoint));
    }
  }

  return letters;
}

function padOrder(order: number): string {
  return String(order).padStart(3, "0");
}

export function getAudioFileName(order: number): string {
  return `${padOrder(order)}.mp3`;
}

export function getAudioPath(order: number): string {
  return `/audio/${getAudioFileName(order)}`;
}

export const PRACTICE_LETTERS: PracticeLetter[] = buildPracticeCharacters().map((character, index) => {
  const order = index + 1;

  return {
    id: `letter-${padOrder(order)}`,
    character,
    order,
    audioFileName: getAudioFileName(order),
    audioPath: getAudioPath(order)
  };
});

export const PRACTICE_LETTER_COUNT = PRACTICE_LETTERS.length;

