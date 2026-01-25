/**
 * CTA Section
 * Call-to-action banner with urgency messaging
 */

interface CTASectionProps {
  cta: {
    headline: string;
    description: string;
    buttonText: string;
  };
  isRTL: boolean;
}

export function CTASection({ cta, isRTL }: CTASectionProps) {
  return (
    <div className="mx-4 my-6 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-center text-white shadow-lg">
      <h3 className="text-xl font-bold mb-2">{cta.headline}</h3>
      <p className="text-orange-100 mb-4">{cta.description}</p>
      <button className="bg-white text-orange-600 px-8 py-3 rounded-full font-bold shadow-md hover:shadow-lg transition-shadow">
        {cta.buttonText}
      </button>
    </div>
  );
}
