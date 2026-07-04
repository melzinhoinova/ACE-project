interface AceLogoProps {
  size?: "sm" | "lg";
}

export function AceLogo({ size = "sm" }: AceLogoProps) {
  return (
    <span
      className={`font-extrabold text-gradient-brand ${
        size === "lg" ? "text-4xl" : "text-xl"
      }`}
    >
      ACE
    </span>
  );
}
