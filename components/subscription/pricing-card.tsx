import { Check } from "lucide-react";

interface PricingFeature {
    text: string;
    included: boolean;
}

interface PricingCardProps {
    name: string;
    price: string;
    description: string;
    features: PricingFeature[];
    popular?: boolean;
    buttonText?: string;
    onSubscribe?: () => void;
}

export function PricingCard({
    name,
    price,
    description,
    features,
    popular = false,
    buttonText = "Subscribe",
    onSubscribe,
}: PricingCardProps) {
    return (
        <div className={`relative border-2 border-black bg-white p-8 shadow-brutalist transition-transform hover:-translate-y-1 ${popular ? 'scale-105 z-10' : ''}`}>
            {popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-1 text-xs font-black uppercase tracking-widest border-2 border-white shadow-sm">
                    Most Popular
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-xl font-black uppercase tracking-tighter mb-2">{name}</h3>
                <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">{price}</span>
                    <span className="text-sm font-bold text-black/40">/month</span>
                </div>
                <p className="text-xs font-bold text-black/60 mt-2 uppercase tracking-wide">{description}</p>
            </div>

            <div className="space-y-4 mb-8">
                {features.map((feature, idx) => (
                    <div key={idx} className={`flex items-start gap-3 ${feature.included ? '' : 'opacity-40'}`}>
                        <div className={`mt-0.5 p-0.5 ${feature.included ? 'bg-black text-white' : 'bg-neutral-200 text-black'}`}>
                            <Check className="h-3 w-3" />
                        </div>
                        <span className="text-sm font-bold">{feature.text}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={onSubscribe}
                className={`w-full py-4 text-xs font-black uppercase tracking-widest border-2 border-black transition-all
                    ${popular
                        ? 'bg-black text-white hover:bg-neutral-800'
                        : 'bg-white text-black hover:bg-black hover:text-white'
                    }`}
            >
                {buttonText}
            </button>
        </div>
    );
}
