import 'dotenv/config';
import { promises as fs } from 'node:fs';
import * as path from 'node:path';

type AudioManifest = {
  generatedAt: string;
  provider: 'supertone';
  baseUrl: string;
  voiceId: string;
  modelId: string;
  language: LanguageCode;
  style?: string;
  outputFormat: string;
  voiceSettings: VoiceSettings;
  total: number;
  items: Array<{
    id: string;
    character: string;
    order: number;
    fileName: string;
    path: string;
    audioLengthSeconds?: number;
  }>;
};

type OutputFormat = 'wav' | 'mp3';
type LanguageCode = 'ko' | 'en' | 'ja';
type VoiceSettings = {
  pitch_shift: number;
  pitch_variance: number;
  speed: number;
};

const L_INDEXES = [0, 2, 3, 5, 6, 7, 9, 11, 12, 14, 15, 16, 17, 18] as const;
const V_INDEXES = [0, 2, 4, 6, 8, 12, 13, 17, 18, 20] as const;
const HANGUL_BASE = 0xac00;

type ScriptLetter = {
  id: string;
  character: string;
  order: number;
};

function padOrder(order: number): string {
  return String(order).padStart(3, '0');
}

function buildPracticeLetters(): ScriptLetter[] {
  const letters: ScriptLetter[] = [];
  let order = 1;

  for (const lIndex of L_INDEXES) {
    for (const vIndex of V_INDEXES) {
      const codePoint = HANGUL_BASE + (lIndex * 21 + vIndex) * 28;
      const character = String.fromCharCode(codePoint);
      letters.push({
        id: `letter-${padOrder(order)}`,
        character,
        order,
      });

      order += 1;
    }
  }

  return letters;
}

const PRACTICE_LETTERS = buildPracticeLetters();

const baseUrl = process.env.SUPERTONE_BASE_URL ?? 'https://supertoneapi.com';
const modelId = process.env.SUPERTONE_MODEL ?? 'sona_speech_1';
const language = (process.env.SUPERTONE_LANGUAGE ?? 'ko') as LanguageCode;
const style = process.env.SUPERTONE_STYLE ?? 'neutral';
const outputDir = path.resolve(
  process.cwd(),
  process.env.TTS_OUTPUT_DIR ?? 'public/audio'
);
const requestIntervalMs = Number(
  process.env.TTS_REQUEST_INTERVAL_MS ?? process.env.TTS_REQUEST_DELAY_MS ?? '4000'
);
const overwrite = process.argv.includes('--overwrite');

function requireEnv(name: 'SUPERTONE_API_KEY' | 'SUPERTONE_VOICE_ID'): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name} in environment variables.`);
    process.exit(1);
  }

  return value;
}

function getNumberEnv(key: string, fallback: number): number {
  const value = process.env[key];
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    console.error(`${key} must be a number.`);
    process.exit(1);
  }

  return parsed;
}

function validateRange(name: string, value: number, min: number, max: number): number {
  if (value < min || value > max) {
    console.error(`${name} must be between ${min} and ${max}. Received: ${value}`);
    process.exit(1);
  }

  return value;
}

function resolveOutputFormat(value: string | undefined): OutputFormat {
  if (!value) {
    return 'mp3';
  }

  if (value === 'wav' || value === 'mp3') {
    return value;
  }

  console.error(`SUPERTONE_OUTPUT_FORMAT must be "wav" or "mp3". Received: ${value}`);
  process.exit(1);
}

function resolveLanguage(value: string): LanguageCode {
  if (value === 'ko' || value === 'en' || value === 'ja') {
    return value;
  }

  console.error(`SUPERTONE_LANGUAGE must be one of: ko, en, ja. Received: ${value}`);
  process.exit(1);
}

const outputFormat = resolveOutputFormat(process.env.SUPERTONE_OUTPUT_FORMAT);
const apiKey = requireEnv('SUPERTONE_API_KEY');
const voiceId = requireEnv('SUPERTONE_VOICE_ID');
const selectedLanguage = resolveLanguage(language);

const voiceSettings: VoiceSettings = {
  pitch_shift: validateRange(
    'SUPERTONE_PITCH_SHIFT',
    getNumberEnv('SUPERTONE_PITCH_SHIFT', 0),
    -12,
    12
  ),
  pitch_variance: validateRange(
    'SUPERTONE_PITCH_VARIANCE',
    getNumberEnv('SUPERTONE_PITCH_VARIANCE', 1),
    0.1,
    2
  ),
  speed: validateRange(
    'SUPERTONE_SPEED',
    getNumberEnv('SUPERTONE_SPEED', 1),
    0.5,
    2
  ),
};

if (!Number.isFinite(requestIntervalMs) || requestIntervalMs < 4000) {
  console.error(
    'TTS_REQUEST_INTERVAL_MS must be a number greater than or equal to 4000 (4 seconds).'
  );
  process.exit(1);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getAudioFileName(order: number): string {
  const extension = outputFormat === 'wav' ? 'wav' : 'mp3';
  return `${padOrder(order)}.${extension}`;
}

function getAudioPath(fileName: string): string {
  return `/audio/${fileName}`;
}

function buildTtsUrl(voiceIdValue: string, format: OutputFormat): URL {
  const url = new URL(`/v1/text-to-speech/${voiceIdValue}`, baseUrl);
  url.searchParams.set('output_format', format);
  return url;
}

function getErrorMessage(status: number, statusText: string, body: string): string {
  if (!body) {
    return `Supertone API request failed: ${status} ${statusText}`;
  }

  return `Supertone API request failed: ${status} ${statusText} - ${body}`;
}

async function synthesizeText(letter: string): Promise<{
  buffer: Buffer;
  audioLengthSeconds?: number;
}> {
  if (letter.length > 300) {
    console.error(`Text exceeds Supertone 300-char limit: "${letter}"`);
    process.exit(1);
  }

  const response = await fetch(buildTtsUrl(voiceId, outputFormat), {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-sup-api-key': apiKey,
    },
    body: JSON.stringify({
      text: letter,
      language: selectedLanguage,
      style,
      model: modelId,
      voice_settings: voiceSettings,
    }),
  });

  if (!response.ok) {
    const responseBody = await response.text();
    throw new Error(getErrorMessage(response.status, response.statusText, responseBody));
  }

  const raw = await response.arrayBuffer();
  const audioLengthRaw = response.headers.get('x-audio-length');
  const audioLengthSeconds = audioLengthRaw ? Number(audioLengthRaw) : undefined;

  return {
    buffer: Buffer.from(raw),
    audioLengthSeconds: Number.isFinite(audioLengthSeconds) ? audioLengthSeconds : undefined,
  };
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  await fs.mkdir(outputDir, { recursive: true });
  let lastRequestStartedAt: number | null = null;

  const manifest: AudioManifest = {
    generatedAt: new Date().toISOString(),
    provider: 'supertone',
    baseUrl,
    voiceId,
    modelId,
    language: selectedLanguage,
    style,
    outputFormat,
    voiceSettings,
    total: PRACTICE_LETTERS.length,
    items: [],
  };

  let generatedCount = 0;
  let skippedCount = 0;

  for (const letter of PRACTICE_LETTERS) {
    const audioFileName = getAudioFileName(letter.order);
    const audioPath = getAudioPath(audioFileName);
    const filePath = path.join(outputDir, audioFileName);
    const exists = await fileExists(filePath);

    if (exists && !overwrite) {
      skippedCount += 1;
      manifest.items.push({
        id: letter.id,
        character: letter.character,
        order: letter.order,
        fileName: audioFileName,
        path: audioPath,
      });
      console.log(`[SKIP] ${audioFileName} (${letter.character})`);
      continue;
    }

    if (lastRequestStartedAt !== null) {
      const elapsed = Date.now() - lastRequestStartedAt;
      const waitMs = requestIntervalMs - elapsed;

      if (waitMs > 0) {
        await wait(waitMs);
      }
    }

    lastRequestStartedAt = Date.now();
    const { buffer, audioLengthSeconds } = await synthesizeText(letter.character);
    await fs.writeFile(filePath, buffer);
    generatedCount += 1;

    manifest.items.push({
      id: letter.id,
      character: letter.character,
      order: letter.order,
      fileName: audioFileName,
      path: audioPath,
      audioLengthSeconds,
    });

    const durationText =
      typeof audioLengthSeconds === 'number'
        ? ` - ${audioLengthSeconds.toFixed(2)}s`
        : '';
    console.log(`[OK] ${audioFileName} (${letter.character})${durationText}`);
  }

  const manifestPath = path.join(outputDir, 'manifest.json');
  await fs.writeFile(
    manifestPath,
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );

  console.log('');
  console.log(`Generated: ${generatedCount}`);
  console.log(`Skipped: ${skippedCount}`);
  console.log(`Total: ${PRACTICE_LETTERS.length}`);
  console.log(`Manifest: ${manifestPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
