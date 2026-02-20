# 한글 발음 카드 (Next.js)

`sample` 폴더의 기존 컨셉(140글자 셔플 카드)을 Next.js로 이식하고, Supertone TTS 음성을 로컬 에셋으로 저장해 재생하는 프로젝트입니다.

## 포함된 기능

- 140개 한글 글자 카드 (초성 14 × 중성 10)
- 격자 모드 / 한 장 모드
- 셔플, 이전/다음 카드
- 진행 상태(localStorage) 저장
- `public/audio/*.mp3` 로컬 음성 파일 재생
- Supertone 일괄 생성 스크립트 (`140개 mp3 + manifest.json`)

## 설치 및 실행

```bash
npm install
npm run dev
```

개발 서버 실행 후 `http://localhost:3000`에서 확인할 수 있습니다.

## TTS 파일 생성

1. 환경 변수 설정:

```bash
cp .env.example .env
```

`.env`에서 최소 아래 2개 값을 채웁니다.

- `SUPERTONE_API_KEY`
- `SUPERTONE_VOICE_ID`

2. 140개 음성 생성:

```bash
npm run generate:tts
```

기본 출력 경로:

- `public/audio/001.mp3` ~ `public/audio/140.mp3`
- `public/audio/manifest.json`

앱에서 바로 재생하려면 `SUPERTONE_OUTPUT_FORMAT=mp3`를 유지하세요.
기본 요청 간격은 `TTS_REQUEST_INTERVAL_MS=4000`(4초, 분당 15회)입니다.

이미 파일이 있으면 기본 동작은 건너뜁니다. 강제 재생성:

```bash
npm run generate:tts -- --overwrite
```

## 구조

- `src/lib/practice-letters.ts`: 140글자 생성 및 오디오 파일명 규칙
- `src/services/hangul-service.ts`: 서비스 레이어
- `src/hooks/use-practice-letters.ts`: React Query 훅
- `scripts/generate-tts.mts`: Supertone TTS 일괄 생성 스크립트
- `app/page.tsx`, `src/components/practice-app.tsx`: 화면/동작
# korean-learning
