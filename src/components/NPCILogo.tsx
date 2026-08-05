import React from "react";

interface NPCILogoProps {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function NPCILogo({ className = "h-9", showText = true, size = "md" }: NPCILogoProps) {
  // Sizes mapping
  const heightClass = size === "sm" ? "h-7" : size === "lg" ? "h-11" : "h-9";

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Official NPCI Dual Triangles Emblem + Text SVG */}
      <svg
        viewBox="0 0 320 80"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={`${heightClass} w-auto object-contain transition-transform duration-200`}
        aria-label="NPCI Logo"
      >
        {/* 'N' Letter */}
        <path
          d="M 15 65 L 15 15 L 28 15 L 48 50 L 48 15 L 60 15 L 60 65 L 47 65 L 27 30 L 27 65 Z"
          className="fill-[#113872] dark:fill-blue-400"
        />
        {/* 'P' Letter */}
        <path
          d="M 68 65 L 68 15 L 95 15 C 108 15 116 22 116 33 C 116 44 108 51 95 51 L 82 51 L 82 65 Z M 82 39 L 93 39 C 100 39 103 36 103 33 C 103 30 100 27 93 27 L 82 27 Z"
          className="fill-[#113872] dark:fill-blue-400"
        />
        {/* 'C' Letter */}
        <path
          d="M 148 24 C 143 18 135 15 127 15 C 112 15 102 26 102 40 C 102 54 112 65 127 65 C 135 65 143 62 148 56 L 157 63 C 149 71 139 76 126 76 C 105 76 89 61 89 40 C 89 19 105 4 126 4 C 139 4 149 9 157 17 Z"
          className="fill-[#113872] dark:fill-blue-400"
        />
        {/* 'I' Letter */}
        <path
          d="M 165 65 L 165 15 L 178 15 L 178 65 Z"
          className="fill-[#113872] dark:fill-blue-400"
        />

        {/* NPCI Dual Triangles Icon (Official Orange & Green) */}
        {/* Orange Triangle */}
        <polygon
          points="205,65 245,10 275,48"
          fill="#E76F24"
        />
        {/* Green Triangle */}
        <polygon
          points="230,68 280,12 305,52"
          fill="#008752"
        />

        {/* Subtext Tagline for larger display */}
        {showText && (
          <text
            x="15"
            y="76"
            fontSize="8"
            fontWeight="700"
            letterSpacing="0.4"
            className="fill-slate-600 dark:fill-slate-300 font-sans"
          >
            NATIONAL PAYMENTS CORPORATION OF INDIA
          </text>
        )}
      </svg>
    </div>
  );
}
