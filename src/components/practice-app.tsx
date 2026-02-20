'use client';

import { Button } from '@/components/ui/button';
import { usePracticeLetters } from '@/hooks/use-practice-letters';
import type { PracticeLetter } from '@/lib/practice-letters';
import { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'hangul_tts_progress_v1';
const UI_LANGUAGE_STORAGE_KEY = 'hangul_ui_language_v1';

type Mode = 'grid' | 'single';
type UiLanguage = 'kr' | 'jp';
type StoredProgress = {
  deckIds: string[];
  index: number;
  mode: Mode;
};

const UI_TEXT: Record<
  UiLanguage,
  {
    languageLabel: string;
    settingsLabel: string;
    title: string;
    loading: string;
    loadError: string;
    modeLabel: string;
    gridMode: string;
    singleMode: string;
    orderDeck: string;
    shuffleGrid: string;
    shuffleDeck: string;
    prevCard: string;
    nextCard: string;
    playCurrent: string;
    audioPlayError: string;
    audioGenericError: string;
  }
> = {
  kr: {
    languageLabel: '언어',
    settingsLabel: '설정',
    title: '한글 발음 연습',
    loading: '학습 카드를 준비하는 중입니다.',
    loadError: '학습 글자 데이터를 불러오지 못했습니다.',
    modeLabel: '보기 모드',
    gridMode: '격자 모드',
    singleMode: '한 장 모드',
    orderDeck: '순서대로 표시',
    shuffleGrid: '랜덤으로 다시 섞기',
    shuffleDeck: '덱 다시 섞기',
    prevCard: '이전 글자',
    nextCard: '다음 글자',
    playCurrent: '현재 글자 재생',
    audioPlayError: '오디오 재생에 실패했습니다. 파일 생성 상태를 확인해 주세요.',
    audioGenericError: '오디오 재생 중 오류가 발생했습니다.',
  },
  jp: {
    languageLabel: '言語',
    settingsLabel: '設定',
    title: 'ハングル発音練習',
    loading: '学習カードを準備しています。',
    loadError: '学習文字データを読み込めませんでした。',
    modeLabel: '表示モード',
    gridMode: 'グリッドモード',
    singleMode: '1枚モード',
    orderDeck: '順番に表示',
    shuffleGrid: 'ランダムに再シャッフル',
    shuffleDeck: 'デッキを再シャッフル',
    prevCard: '前の文字',
    nextCard: '次の文字',
    playCurrent: '現在の文字を再生',
    audioPlayError:
      '音声の再生に失敗しました。ファイル生成状態を確認してください。',
    audioGenericError: '音声再生中にエラーが発生しました。',
  },
};

function shuffle<T>(items: T[]): T[] {
  const copied = [...items];

  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }

  return copied;
}

function clampIndex(index: number, maxLength: number): number {
  if (!Number.isInteger(index)) {
    return 0;
  }

  if (index < 0 || index >= maxLength) {
    return 0;
  }

  return index;
}

function loadProgress(baseLetters: PracticeLetter[]): StoredProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as Partial<StoredProgress>;
    if (!parsed || !Array.isArray(parsed.deckIds)) {
      return null;
    }

    const validIdSet = new Set(baseLetters.map((letter) => letter.id));
    if (parsed.deckIds.length !== baseLetters.length) {
      return null;
    }

    const uniqueDeckIds = new Set(parsed.deckIds);
    if (uniqueDeckIds.size !== baseLetters.length) {
      return null;
    }

    for (const id of uniqueDeckIds) {
      if (!validIdSet.has(id)) {
        return null;
      }
    }

    const mode: Mode = parsed.mode === 'single' ? 'single' : 'grid';
    const index = clampIndex(parsed.index ?? 0, baseLetters.length);

    return {
      deckIds: parsed.deckIds,
      index,
      mode,
    };
  } catch {
    return null;
  }
}

function RefreshIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v6h-6" />
    </svg>
  );
}

function OrderIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 6h10" />
      <path d="M4 12h10" />
      <path d="M4 18h10" />
      <path d="m17 5 3-3 3 3" />
      <path d="M20 2v18" />
      <path d="m17 20 3 3 3-3" />
    </svg>
  );
}

function GearIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.2.49.3 1.03.29 1.56.01.53-.09 1.07-.29 1.56Z" />
    </svg>
  );
}

export function PracticeApp() {
  const { data: baseLetters, isLoading, isError } = usePracticeLetters();
  const [deck, setDeck] = useState<PracticeLetter[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mode, setMode] = useState<Mode>('grid');
  const [uiLanguage, setUiLanguage] = useState<UiLanguage>('kr');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const deckMap = useMemo(() => {
    const map = new Map<string, PracticeLetter>();

    for (const letter of baseLetters ?? []) {
      map.set(letter.id, letter);
    }

    return map;
  }, [baseLetters]);

  useEffect(() => {
    if (!baseLetters || baseLetters.length === 0) {
      return;
    }

    const saved = loadProgress(baseLetters);
    if (saved) {
      const restoredDeck = saved.deckIds
        .map((id) => deckMap.get(id))
        .filter((letter): letter is PracticeLetter => Boolean(letter));

      if (restoredDeck.length === baseLetters.length) {
        setDeck(restoredDeck);
        setCurrentIndex(saved.index);
        setMode(saved.mode);
        setReady(true);
        return;
      }
    }

    setDeck(shuffle(baseLetters));
    setCurrentIndex(0);
    setMode('grid');
    setReady(true);
  }, [baseLetters, deckMap]);

  useEffect(() => {
    if (!ready || deck.length === 0) {
      return;
    }

    const payload: StoredProgress = {
      deckIds: deck.map((letter) => letter.id),
      index: currentIndex,
      mode,
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // localStorage unavailable: ignore persistence.
    }
  }, [deck, currentIndex, mode, ready]);

  useEffect(() => {
    try {
      const savedLanguage = localStorage.getItem(UI_LANGUAGE_STORAGE_KEY);
      if (savedLanguage === 'kr' || savedLanguage === 'jp') {
        setUiLanguage(savedLanguage);
      }
    } catch {
      // localStorage unavailable: keep default language.
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(UI_LANGUAGE_STORAGE_KEY, uiLanguage);
    } catch {
      // localStorage unavailable: skip persistence.
    }
  }, [uiLanguage]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const t = UI_TEXT[uiLanguage];
  const currentLetter = deck[currentIndex];

  function playLetter(letter: PracticeLetter) {
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const audio = new Audio(letter.audioPath);
      audioRef.current = audio;
      setAudioError(null);

      void audio.play().catch(() => {
        setAudioError(t.audioPlayError);
      });
    } catch {
      setAudioError(t.audioGenericError);
    }
  }

  function shuffleDeck() {
    if (!baseLetters) {
      return;
    }

    setDeck(shuffle(baseLetters));
    setCurrentIndex(0);
    setAudioError(null);
  }

  function orderDeck() {
    if (!baseLetters) {
      return;
    }

    setDeck([...baseLetters]);
    setCurrentIndex(0);
    setAudioError(null);
  }

  function moveCard(step: number) {
    if (deck.length === 0) {
      return;
    }

    setCurrentIndex((prev) => (prev + step + deck.length) % deck.length);
    setAudioError(null);
  }

  if (isLoading) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[1080px] flex-col px-4 py-4 sm:w-[min(1080px,92vw)] sm:px-0 sm:py-10">
        <p className="text-slate-600">{t.loading}</p>
      </main>
    );
  }

  if (isError || !baseLetters || baseLetters.length === 0) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[1080px] flex-col px-4 py-4 sm:w-[min(1080px,92vw)] sm:px-0 sm:py-10">
        <p className="text-rose-700">{t.loadError}</p>
      </main>
    );
  }

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-[1080px] flex-col px-4 py-4 sm:w-[min(1080px,92vw)] sm:px-0 sm:py-10">
        <p className="text-slate-600">{t.loading}</p>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-[1080px] flex-col px-4 py-4 sm:w-[min(1080px,92vw)] sm:px-0 sm:py-10">
      <header className="mb-4 flex items-start justify-between gap-3">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-4xl">
          {t.title}
        </h1>
        <button
          type="button"
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-line bg-white/90 text-slate-700 shadow-[0_8px_14px_rgba(0,0,0,0.1)] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
          aria-label={t.settingsLabel}
          title={t.settingsLabel}
          onClick={() => setSettingsOpen((prev) => !prev)}
        >
          <GearIcon />
          <span className="sr-only">{t.settingsLabel}</span>
        </button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col">
        {settingsOpen ? (
          <section className="mb-4 w-full rounded-2xl border border-line bg-white/90 p-3 shadow-[0_12px_22px_rgba(0,0,0,0.12)] sm:ml-auto sm:w-[420px]">
            <div className="grid gap-3">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {t.modeLabel}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="subtle"
                    active={mode === 'grid'}
                    className="h-11 w-full"
                    onClick={() => setMode('grid')}
                  >
                    {t.gridMode}
                  </Button>
                  <Button
                    variant="subtle"
                    active={mode === 'single'}
                    className="h-11 w-full"
                    onClick={() => setMode('single')}
                  >
                    {t.singleMode}
                  </Button>
                </div>
              </div>

              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {t.languageLabel}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="subtle"
                    active={uiLanguage === 'kr'}
                    className="h-11 w-full"
                    onClick={() => setUiLanguage('kr')}
                  >
                    KR
                  </Button>
                  <Button
                    variant="subtle"
                    active={uiLanguage === 'jp'}
                    className="h-11 w-full"
                    onClick={() => setUiLanguage('jp')}
                  >
                    JP
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <Button
                  variant="refresh"
                  className="h-11 w-full gap-2 px-4"
                  onClick={orderDeck}
                >
                  <OrderIcon />
                  {t.orderDeck}
                </Button>
                <Button
                  variant="refresh"
                  className="h-11 w-full gap-2 px-4"
                  onClick={shuffleDeck}
                >
                  <RefreshIcon />
                  {mode === 'grid' ? t.shuffleGrid : t.shuffleDeck}
                </Button>
              </div>
            </div>
          </section>
        ) : null}

        {mode === 'grid' ? (
          <section aria-live="polite" className="flex min-h-0 flex-1 flex-col">
            <div className="grid flex-1 content-start grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-2 overflow-auto pb-2 sm:grid-cols-[repeat(auto-fill,minmax(72px,1fr))] sm:gap-2.5 sm:overflow-visible sm:pb-0">
              {deck.map((letter, index) => (
                <button
                  key={letter.id}
                  type="button"
                  onClick={() => playLetter(letter)}
                  className="group aspect-square rounded-2xl border border-line bg-white/90 p-1 text-center shadow-[0_8px_18px_rgba(0,0,0,0.08)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  style={{ animationDelay: `${Math.min(index * 8, 350)}ms` }}
                >
                  <span className="block animate-rise text-[1.6rem] font-bold sm:text-[1.7rem]">
                    {letter.character}
                  </span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <section aria-live="polite" className="flex min-h-0 flex-1 flex-col">
            <div className="grid flex-1 content-center justify-items-center gap-3 pt-1">
              <div className="relative grid aspect-square w-[min(360px,84vw)] animate-pop place-items-center rounded-[1.7rem] border border-line bg-gradient-to-br from-white to-[#ecf4ff] text-[clamp(4.4rem,16vw,8rem)] font-extrabold shadow-[0_20px_40px_rgba(0,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] sm:w-[min(360px,78vw)]">
                {currentLetter?.character}
                {currentLetter ? (
                  <button
                    type="button"
                    onClick={() => playLetter(currentLetter)}
                    aria-label={t.playCurrent}
                    title={t.playCurrent}
                    className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/85 text-slate-700 shadow-[0_8px_18px_rgba(0,0,0,0.16)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                  >
                    <span className="translate-x-[1px] text-sm">▶</span>
                    <span className="sr-only">{t.playCurrent}</span>
                  </button>
                ) : null}
              </div>
              <div className="grid w-full max-w-[420px] grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => moveCard(-1)}
                  aria-label={t.prevCard}
                  title={t.prevCard}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-line bg-white/90 px-4 text-sm font-semibold text-slate-700 shadow-[0_8px_14px_rgba(0,0,0,0.1)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  {t.prevCard}
                </button>
                <button
                  type="button"
                  onClick={() => moveCard(1)}
                  aria-label={t.nextCard}
                  title={t.nextCard}
                  className="inline-flex h-12 items-center justify-center rounded-xl border border-line bg-white/90 px-4 text-sm font-semibold text-slate-700 shadow-[0_8px_14px_rgba(0,0,0,0.1)] transition hover:-translate-y-0.5 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
                >
                  {t.nextCard}
                </button>
              </div>
              <p className="m-0 text-sm text-slate-600">
                {currentIndex + 1} / {deck.length}
              </p>
            </div>
          </section>
        )}

        {audioError ? (
          <p className="mt-2 text-sm text-rose-700">{audioError}</p>
        ) : null}
      </div>
    </main>
  );
}
