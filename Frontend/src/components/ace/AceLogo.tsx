import Image from "next/image";

interface AceLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  onlyRocket?: boolean;
  className?: string;
}

export function AceLogo({
  size = "sm",
  showText = true,
  onlyRocket = false,
  className = "",
}: AceLogoProps) {
  // Dimensões do Foguete
  const rocketDimensions = {
    xs: { w: 22, h: 22, img: "h-5 w-5", text: "text-base", badge: "text-[9px]" },
    sm: { w: 32, h: 32, img: "h-7 w-7", text: "text-xl", badge: "text-[10px]" },
    md: { w: 42, h: 42, img: "h-9 w-9", text: "text-2xl", badge: "text-[11px]" },
    lg: { w: 56, h: 56, img: "h-12 w-12", text: "text-4xl", badge: "text-xs" },
    xl: { w: 84, h: 84, img: "h-20 w-20", text: "text-6xl", badge: "text-sm" },
  }[size];

  if (onlyRocket) {
    return (
      <div className={`relative flex items-center justify-center ${className}`}>
        <img
          src="/logo_rocket.png"
          alt="ACE Logo"
          className={`${rocketDimensions.img} object-contain transition-transform duration-300 hover:scale-105`}
        />
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div className="relative flex items-center justify-center shrink-0">
        <img
          src="/logo_rocket.png"
          alt="ACE Rocket"
          className={`${rocketDimensions.img} object-contain drop-shadow-[0_2px_8px_rgba(249,115,22,0.35)] transition-transform duration-300 hover:rotate-6 hover:scale-110`}
        />
      </div>

      {showText && (
        <div className="flex items-baseline gap-1">
          <span
            className={`font-black tracking-tight leading-none text-gradient-brand ${rocketDimensions.text}`}
          >
            ACE
          </span>
        </div>
      )}
    </div>
  );
}
