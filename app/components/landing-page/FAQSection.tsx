/**
 * FAQ Section
 * Accordion with common questions and answers
 */

import { useState } from "react";
import type { ColorPalette } from "~/lib/color-palettes";

interface FAQSectionProps {
  faq: Array<{
    question: string;
    answer: string;
  }>;
  isRTL: boolean;
  palette: ColorPalette;
}

export function FAQSection({ faq, isRTL, palette }: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="px-4 py-6 bg-white">
      <h2 className="text-xl font-bold text-gray-900 mb-4">
        {isRTL ? "الأسئلة الشائعة" : "Frequently Asked Questions"}
      </h2>

      <div className="space-y-2">
        {faq.map((item, i) => (
          <div
            key={i}
            className="bg-gray-50 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <span className="font-medium text-gray-900 text-sm">
                {item.question}
              </span>
              <span
                className={`text-gray-400 transition-transform ${
                  openIndex === i ? "rotate-180" : ""
                }`}
              >
                ▼
              </span>
            </button>
            {openIndex === i && (
              <div className="px-4 pb-4 text-sm text-gray-600">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
