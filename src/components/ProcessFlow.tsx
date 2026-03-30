import React, { useRef, useEffect, useState } from "react";
import {
  FileText,
  ClipboardCheck,
  CreditCard,
  Package,
  FlaskConical,
  MessageCircle,
  Snowflake,
  Ship,
  FileCheck,
  DollarSign,
  Globe
} from "lucide-react";

const steps = [
  { title: "PI Shared", desc: "Proforma Invoice sent", icon: FileText },
  { title: "Order Confirmation", desc: "Buyer confirms order", icon: ClipboardCheck },
  { title: "Advance Payment", desc: "Initial payment received", icon: CreditCard },
  { title: "Product Grading", desc: "Quality selection", icon: Package },
  { title: "Packing", desc: "Packed as required", icon: Package },
  { title: "Lab Testing", desc: "Quality verified", icon: FlaskConical },
  { title: "Updates", desc: "Live updates", icon: MessageCircle },
  { title: "Pre-Cooling", desc: "Temperature control", icon: Snowflake },
  { title: "Shipment", desc: "Container arranged", icon: Ship },
  { title: "Customs", desc: "Docs cleared", icon: FileCheck },
  { title: "BL Shared", desc: "Bill of Lading sent", icon: FileText },
  { title: "Balance Payment", desc: "Final payment", icon: DollarSign },
  { title: "Delivery", desc: "Shipment delivered", icon: Globe }
];

const ProcessRoadmap: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLDivElement>(null);
  const pathRef = useRef<SVGPathElement>(null);

  const [position, setPosition] = useState({ x: 100, y: 0 });
  const [progressLength, setProgressLength] = useState(0);
  const [pathLength, setPathLength] = useState(0);
  const [activeStep, setActiveStep] = useState(0);
  const [svgHeight, setSvgHeight] = useState(1200);

  // 🔥 Get dynamic height
  useEffect(() => {
    if (stepsRef.current) {
      setSvgHeight(stepsRef.current.offsetHeight);
    }
  }, []);

  // 🔥 Get path length
  useEffect(() => {
    if (pathRef.current) {
      setPathLength(pathRef.current.getTotalLength());
    }
  }, [svgHeight]);

  // 🔥 Scroll logic (SECTION BASED)
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || !pathRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;

      let progress = 0;

      if (rect.top <= windowHeight && rect.bottom >= 0) {
        progress = (windowHeight - rect.top) / (rect.height + windowHeight);
        progress = Math.max(0, Math.min(progress, 1));
      }

      // 🔥 SNAP TO STEPS
      const totalSteps = steps.length - 1;
      const snappedProgress = Math.min(
        Math.round(progress * totalSteps) / totalSteps,
        1
      );

      const totalLength = pathRef.current.getTotalLength();
      const currentLength = snappedProgress * totalLength;

      const point = pathRef.current.getPointAtLength(currentLength);

      setPosition({ x: point.x, y: point.y });
      setProgressLength(currentLength);

      const stepIndex = Math.round(snappedProgress * totalSteps);
      setActiveStep(stepIndex);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      ref={containerRef}
      className="py-32 bg-white relative overflow-hidden"
    >
      <div className="container mx-auto px-4">

        {/* HEADER */}
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold">
            Export <span className="text-blue-700">Journey Roadmap</span>
          </h2>
        </div>

        {/* WRAPPER */}
        <div className="relative">

          {/* SVG */}
          <svg
            viewBox={`0 0 200 ${svgHeight}`}
            className="absolute left-1/2 -translate-x-1/2 top-0 h-full pointer-events-none"
          >
            {/* PATH */}
            <path
              ref={pathRef}
              d={`
                M100 0
                C180 ${svgHeight * 0.2}, 20 ${svgHeight * 0.3}, 100 ${svgHeight * 0.45}
                C180 ${svgHeight * 0.6}, 20 ${svgHeight * 0.75}, 100 ${svgHeight}
              `}
              stroke="#cbd5f5"
              strokeWidth="3"
              strokeDasharray="6 10"
              fill="none"
            />

            {/* PROGRESS */}
            <path
              d={`
                M100 0
                C180 ${svgHeight * 0.2}, 20 ${svgHeight * 0.3}, 100 ${svgHeight * 0.45}
                C180 ${svgHeight * 0.6}, 20 ${svgHeight * 0.75}, 100 ${svgHeight}
              `}
              stroke="#2563eb"
              strokeWidth="4"
              fill="none"
              strokeDasharray={pathLength}
              strokeDashoffset={pathLength - progressLength}
            />

            {/* 🚢 SHIP */}
            <g transform={`translate(${position.x}, ${position.y})`}>
              <g transform="translate(-12, -12)">
                <path
                  d="M2 14 L22 14 L18 20 L6 20 Z M6 14 L10 8 L14 8 L18 14"
                  fill="#3b82f6"
                  stroke="#1d4ed8"
                  strokeWidth="1.5"
                />
              </g>
            </g>
          </svg>

          {/* STEPS */}
          <div ref={stepsRef} className="relative space-y-40">

            {steps.map((step, index) => {
              const Icon = step.icon;
              const isLeft = index % 2 === 0;
              const isCompleted = index <= activeStep;

              return (
                <div
                  key={index}
                  className={`relative flex ${
                    isLeft ? "justify-start" : "justify-end"
                  }`}
                >
                  {/* CARD */}
                  <div className="w-1/2 px-6">
                    <div
                      className={`p-6 rounded-xl border ${
                        isCompleted
                          ? "bg-green-50 border-green-300"
                          : "bg-gray-50"
                      }`}
                    >
                      <Icon className="mb-2 text-blue-700" size={20} />
                      <h3 className="font-semibold">{step.title}</h3>
                      <p className="text-sm text-gray-600">{step.desc}</p>
                    </div>
                  </div>

                  {/* DOT */}
                  <div className="absolute left-1/2 -translate-x-1/2">
                    <div
                      className={`w-6 h-6 rounded-full border-4 border-white ${
                        isCompleted ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  </div>
                </div>
              );
            })}

          </div>

        </div>

      </div>
    </section>
  );
};

export default ProcessRoadmap;