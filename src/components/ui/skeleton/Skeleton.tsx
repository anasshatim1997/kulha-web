import type { HTMLAttributes } from "react";
import styles from "./Skeleton.module.css";

type Props = HTMLAttributes<HTMLDivElement> & { width?: string; height?: string; radius?: string };

export function Skeleton({ width = "100%", height = "1rem", radius = "0.75rem", className = "", ...props }: Props) {
  return <div aria-hidden="true" className={`${styles.skeleton} ${className}`} style={{ width, height, borderRadius: radius }} {...props} />;
}
