export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-6 text-center">
      <h1 className="text-5xl font-bold">📸 欢迎来到慕城周刊</h1>
      <p className="text-lg text-gray-600 dark:text-gray-300">
        分享你的镜头，记录属于我们的城市生活。
      </p>
  
      <a
        href="/submit"
        className="mt-4 px-6 py-3 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        去投稿 →
      </a>
    </main>
  );
}
