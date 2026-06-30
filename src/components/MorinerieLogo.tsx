import { motion } from "motion/react";

interface MorinerieLogoProps {
  className?: string;
  isScrolled?: boolean;
}

export default function MorinerieLogo({ className = "", isScrolled = false }: MorinerieLogoProps) {
  return (
    <div className={`relative flex items-center justify-center select-none -translate-y-[4px] ${className}`}>
      <svg
        viewBox="22 42 56 22"
        className="h-full w-auto"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Le 'M' double shed, parfaitement centré et plus horizontal */}
        <motion.path
          d="M 24 62 L 50 44 L 50 62 L 76 44 L 76 62"
          stroke="#D16436"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}
