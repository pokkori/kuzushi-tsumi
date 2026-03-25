import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const score = searchParams.get('score') || '0';
  const combo = searchParams.get('combo') || '0';

  // SVGベースのOGP画像を生成
  const svg = `
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect width="1200" height="630" fill="#0F172A"/>
      <text x="600" y="220" text-anchor="middle" font-size="72" font-weight="900" fill="#FBBF24">崩し積み</text>
      <text x="600" y="280" text-anchor="middle" font-size="32" fill="#94A3B8">Stack Collapse</text>
      ${score !== '0' ? `<text x="600" y="380" text-anchor="middle" font-size="48" font-weight="700" fill="#FBBF24">Score: ${parseInt(score).toLocaleString()}</text>` : ''}
      ${combo !== '0' ? `<text x="600" y="440" text-anchor="middle" font-size="36" fill="#EF4444">Max Combo: ${combo}</text>` : ''}
    </svg>
  `;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
