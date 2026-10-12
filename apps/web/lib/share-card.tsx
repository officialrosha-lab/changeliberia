import { ImageResponse } from 'next/og';
import fs from 'node:fs/promises';
import path from 'node:path';

export const SHARE_CARD_WIDTH = 1080;
export const SHARE_CARD_HEIGHT = 1350;

const COLOR = {
  civicGreen: '#059669',
  deepGreen: '#065F46',
  mint: '#D1FAE5',
  ink: '#141414',
  body: '#4A463F',
  muted: '#6B665C',
  paper: '#FAF7F0',
};

export type ShareCardFields = {
  title: string;
  summary: string;
  category: string;
  count: number | null;
  coverImageDataUri: string | null;
};

function titleFontSize(title: string): number {
  const len = title.length;
  if (len <= 32) return 96;
  if (len <= 60) return 80;
  if (len <= 95) return 66;
  return 56;
}

const assetsDir = path.join(process.cwd(), 'public', 'share-card');

async function readLocalAsset(fileName: string): Promise<Buffer> {
  return fs.readFile(path.join(assetsDir, fileName));
}

export async function fetchAsDataUri(url: string, timeoutMs = 6000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const contentType = res.headers.get('content-type') ?? 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch {
    // Slow or unreachable image host — fall back to the no-cover layout
    // rather than risk a blank frame in the rendered card.
    return null;
  }
}

export async function renderShareCardPng(fields: ShareCardFields): Promise<ImageResponse> {
  const { title, summary, category, count, coverImageDataUri } = fields;

  const [logoBuffer, characterBuffer, playfair800, dmSans400, dmSans700, jbMono500] =
    await Promise.all([
      readLocalAsset('logo-full.png'),
      readLocalAsset('char-voice.png'),
      readLocalAsset('fonts/PlayfairDisplay-800.ttf'),
      readLocalAsset('fonts/DMSans-400.ttf'),
      readLocalAsset('fonts/DMSans-700.ttf'),
      readLocalAsset('fonts/JetBrainsMono-500.ttf'),
    ]);

  const logo = `data:image/png;base64,${logoBuffer.toString('base64')}`;
  const character = `data:image/png;base64,${characterBuffer.toString('base64')}`;

  const showSummary = !!summary;
  const showCover = !!coverImageDataUri;
  const showCategory = !!category;
  const showCount = typeof count === 'number' && count > 0;
  const shareLine = showSummary ? 'Sign. Share. Stand with us.' : 'Add your name today.';

  return new ImageResponse(
    (
      <div
        style={{
          width: SHARE_CARD_WIDTH,
          height: SHARE_CARD_HEIGHT,
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          background: '#fff',
          color: COLOR.ink,
          fontFamily: 'DM Sans',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '72px 80px 0' }}>
          <div
            style={{
              display: 'flex',
              width: 14,
              height: 14,
              borderRadius: '50%',
              background: COLOR.civicGreen,
            }}
          />
          <div
            style={{
              display: 'flex',
              fontFamily: 'JetBrains Mono',
              fontWeight: 500,
              fontSize: 22,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: COLOR.deepGreen,
            }}
          >
            Petition
          </div>
          {showCategory && (
            <div
              style={{
                display: 'flex',
                fontFamily: 'JetBrains Mono',
                fontWeight: 500,
                fontSize: 20,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: COLOR.deepGreen,
                background: COLOR.mint,
                padding: '8px 16px',
                borderRadius: 999,
              }}
            >
              {category}
            </div>
          )}
        </div>

        <div
          style={{
            display: '-webkit-box',
            WebkitBoxOrient: 'vertical',
            WebkitLineClamp: 4,
            overflow: 'hidden',
            margin: '28px 80px 0',
            fontFamily: 'Playfair Display',
            fontWeight: 800,
            fontSize: titleFontSize(title),
            lineHeight: 1.1,
            letterSpacing: -1,
          }}
        >
          {title}
        </div>

        <div
          style={{
            display: 'flex',
            margin: '40px 80px 0',
            flex: 1,
            minHeight: 0,
            borderRadius: 24,
            overflow: 'hidden',
            background: COLOR.paper,
            position: 'relative',
          }}
        >
          {showCover ? (
            <img
              src={coverImageDataUri!}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                background: COLOR.civicGreen,
              }}
            >
              <img
                src={character}
                alt=""
                style={{ position: 'absolute', right: 40, bottom: -30, height: '110%' }}
              />
              <div
                style={{
                  display: 'flex',
                  position: 'absolute',
                  left: 48,
                  bottom: 44,
                  fontFamily: 'Playfair Display',
                  fontWeight: 800,
                  fontSize: 64,
                  lineHeight: 1,
                  color: '#fff',
                }}
              >
                Your voice counts here.
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            margin: '32px 80px 0',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 40,
            minHeight: 64,
          }}
        >
          {showSummary ? (
            <div
              style={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                overflow: 'hidden',
                flex: 1,
                fontSize: 28,
                lineHeight: 1.4,
                color: COLOR.body,
              }}
            >
              {summary}
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flex: 1,
                fontFamily: 'Playfair Display',
                fontWeight: 700,
                fontSize: 34,
                lineHeight: 1.2,
                color: COLOR.ink,
              }}
            >
              Sign. Share.{' '}
              <span style={{ color: COLOR.civicGreen, marginLeft: 10 }}>Stand with us.</span>
            </div>
          )}
          {showCount && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'Playfair Display',
                  fontWeight: 800,
                  fontSize: 56,
                  lineHeight: 1,
                  color: COLOR.civicGreen,
                }}
              >
                {count!.toLocaleString()}
              </div>
              <div
                style={{
                  display: 'flex',
                  fontFamily: 'JetBrains Mono',
                  fontWeight: 500,
                  fontSize: 18,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  color: COLOR.muted,
                  marginTop: 8,
                }}
              >
                Signatures
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 56,
            height: 300,
            flex: 'none',
            background: COLOR.civicGreen,
            color: '#fff',
            position: 'relative',
          }}
        >
          <div
            style={{
              display: 'flex',
              position: 'absolute',
              left: 56,
              top: -56,
              background: '#fff',
              borderRadius: 20,
              padding: '18px 26px',
            }}
          >
            <img src={logo} alt="Change Liberia" style={{ display: 'block', height: 96 }} />
          </div>
          {showCover && (
            <img
              src={character}
              alt=""
              style={{
                position: 'absolute',
                right: 56,
                bottom: 0,
                height: 340,
                maxWidth: 260,
                objectFit: 'contain',
              }}
            />
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              position: 'absolute',
              left: 80,
              bottom: 56,
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', fontFamily: 'Playfair Display', fontWeight: 700, fontSize: 44, lineHeight: 1.1 }}>
              {shareLine}
            </div>
            <div style={{ display: 'flex', fontFamily: 'DM Sans', fontWeight: 700, fontSize: 34, lineHeight: 1 }}>
              www.changeliberia.org
            </div>
            <div
              style={{
                display: 'flex',
                fontFamily: 'JetBrains Mono',
                fontWeight: 500,
                fontSize: 20,
                letterSpacing: 2,
                textTransform: 'uppercase',
                color: COLOR.mint,
              }}
            >
              Your Voice. Your Action. Liberia’s Future.
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: SHARE_CARD_WIDTH,
      height: SHARE_CARD_HEIGHT,
      fonts: [
        { name: 'Playfair Display', data: playfair800, weight: 800, style: 'normal' },
        { name: 'DM Sans', data: dmSans400, weight: 400, style: 'normal' },
        { name: 'DM Sans', data: dmSans700, weight: 700, style: 'normal' },
        { name: 'JetBrains Mono', data: jbMono500, weight: 500, style: 'normal' },
      ],
    },
  );
}
