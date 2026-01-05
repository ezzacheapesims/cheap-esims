"use client";

import { Check } from "lucide-react";

interface CheckoutProgressProps {
  currentStep: number;
}

const steps = [
  { number: 1, label: "Order Review" },
  { number: 2, label: "Payment" },
  { number: 3, label: "Confirmation" },
];

export function CheckoutProgress({ currentStep }: CheckoutProgressProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = step.number < currentStep;
        const isCurrent = step.number === currentStep;
        const isUpcoming = step.number > currentStep;

        return (
          <div key={step.number} className="flex items-center flex-1">
            {/* Step Circle */}
            <div className="flex flex-col items-center flex-1">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted
                    ? "bg-primary border-primary text-white"
                    : isCurrent
                    ? "bg-primary border-primary text-white ring-4 ring-primary/20"
                    : "bg-white border-gray-300 text-gray-400"
                }`}
              >
                {isCompleted ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <span className="text-sm font-semibold">{step.number}</span>
                )}
              </div>
              <span
                className={`mt-2 text-xs font-medium ${
                  isCurrent || isCompleted
                    ? "text-gray-900"
                    : "text-gray-500"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector Line */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  isCompleted ? "bg-primary" : "bg-gray-300"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

