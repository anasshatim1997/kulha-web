import Image from "next/image";

export function Logo({ size = 46, light = false }: { size?: number; light?: boolean }) {
  return (
    <span className="brand-lockup">
      <Image src="/brand/kulha-app-icon.png" alt="" width={size} height={size} priority className="brand-mark" />
      <span className={light ? "brand-word brand-word-light" : "brand-word"}>Kulha<span>!</span></span>
    </span>
  );
}
