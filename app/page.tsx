'use client';

import { useRouter } from 'next/navigation';

export default function TitlePage() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-5xl font-black mb-2 bg-gradient-to-r from-yellow-400 via-red-500 to-purple-500 bg-clip-text text-transparent">
          崩し積み
        </h1>
        <p className="text-lg text-gray-400 mb-8">Stack Collapse</p>

        <div className="space-y-4 mb-12">
          <p className="text-sm text-gray-300">
            同色ブロックを横1列に揃えて消そう！
          </p>
          <p className="text-xs text-gray-500">
            タップで選択 / スワイプで移動 / ダブルタップで抜き取り
          </p>
        </div>

        <button
          onClick={() => router.push('/play')}
          aria-label="崩し積みゲームをプレイ開始する"
          className="px-12 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-xl rounded-2xl transition-colors shadow-lg shadow-yellow-500/30 min-h-[56px]"
        >
          プレイ開始
        </button>
      </div>

      <footer className="mt-12 text-center text-xs text-gray-700 space-y-2">
        <div className="flex justify-center gap-4">
          <a href="/legal" className="hover:text-gray-500">特定商取引法</a>
          <a href="/privacy" className="hover:text-gray-500">プライバシー</a>
          <a href="/terms" className="hover:text-gray-500">利用規約</a>
        </div>
        <p>© 2026 ポッコリラボ</p>
      </footer>
    </div>
  );
}
