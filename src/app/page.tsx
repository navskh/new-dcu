import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col items-center gap-8 p-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            DCU
          </h1>
          <p className="text-xl text-gray-600">
            Daily Check-Up
          </p>
        </div>

        <p className="text-gray-500 text-center max-w-md">
          매일 목표를 기록하고, 달성을 확인하세요.
        </p>

        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Link
            href="/admin"
            className="flex h-12 items-center justify-center rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-800 transition-colors"
          >
            관리자 로그인
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-8">
          폼 링크를 받으셨나요? 해당 링크로 접속하세요.
        </p>
      </main>
    </div>
  );
}
