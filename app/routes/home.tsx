import type { Route } from "./+types/home";
import { Link } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "سلة دقيقة - أنشئ متجرك بالذكاء الاصطناعي" },
    { name: "description", content: "حول رابط منتج إلى متجر سلة كامل في دقائق" },
  ];
}

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            سلة دقيقة
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
            حول رابط منتج من AliExpress أو Amazon إلى متجر سلة كامل في دقائق
          </p>
          <Link
            to="/auth/salla"
            className="inline-flex items-center justify-center px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ابدأ الآن - تثبيت من سلة
          </Link>
        </div>
      </div>
    </main>
  );
}
