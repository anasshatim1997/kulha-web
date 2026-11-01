import { KulhaLoader } from "@/components/KulhaLoader";

/** Full-screen logo-based feedback for sign-in, sign-up and OAuth redirects. */
export function SubmitProgress({ title, detail }: { title: string; detail: string }) {
  return (
    <KulhaLoader
      fullscreen
      theme="dark"
      size={236}
      message={`${title} ${detail}`}
      label={title}
    />
  );
}
