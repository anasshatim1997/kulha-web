/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from 'react';
import styles from './KulhaLoader.module.css';

export type KulhaLoaderProps = {
  /** Width of the loader in px. Height follows the logo's aspect ratio. Default 160. */
  size?: number;
  /** Background used when `fullscreen` is true. Default 'dark' (brand green). */
  theme?: 'dark' | 'light' | 'transparent';
  /** Cover the whole viewport (use for route / page loading). */
  fullscreen?: boolean;
  /** Optional text under the logo (pass an already-translated string for i18n). */
  message?: string;
  /** Screen-reader label. Pass a translated string. Default 'Loading…'. */
  label?: string;
  /** Folder in /public that holds the sprites. Default '/kulha-loader'. */
  basePath?: string;
  className?: string;
  panelClassName?: string;
};

/* [css class, file, extra animation class]. Order = z-order (bottom → top). */
const LAYERS: ReadonlyArray<readonly [string, string, string?]> = [
  ['greensBack', 'greens-back', 'hop hopGreens'],
  ['handle', 'handle'],
  ['baguette', 'baguette', 'hop hopBaguette'],
  ['pepper', 'pepper', 'hop hopPepper'],
  ['tomato', 'tomato', 'hop hopTomato'],
  ['bag', 'bag'],
  ['greensFront', 'greens-front', 'hop hopGreens'],
  ['wordmark', 'wordmark'],
  ['underline', 'underline'],
  ['leaf', 'leaf'],
  ['spark1', 'spark-1', 'spark'],
  ['spark2', 'spark-2', 'spark'],
  ['spark3', 'spark-3', 'spark'],
  ['spark4', 'spark-4', 'spark'],
];

const cx = (...c: Array<string | false | undefined>) => c.filter(Boolean).join(' ');
const mod = (names?: string) => (names ? names.split(' ').map((n) => styles[n]).join(' ') : '');

function Logo({ size, basePath, className }: { size: number; basePath: string; className?: string }) {
  const vars = { '--kl-size': `${size}px` } as CSSProperties;
  return (
    <span className={cx(styles.root, className)} style={vars} data-small={size < 56 ? '' : undefined} aria-hidden="true">
      <span className={styles.float}>
        <span className={styles.squash}>
          {LAYERS.map(([pos, file, anim]) => (
            <img
              key={file}
              src={`${basePath}/${file}.webp`}
              alt=""
              draggable={false}
              decoding="async"
              className={cx(styles[pos], mod(anim))}
            />
          ))}
        </span>
      </span>
      <span className={styles.shadow} />
    </span>
  );
}

/**
 * Kulha! animated loader. Pure CSS, works in Server and Client Components.
 *
 *   <KulhaLoader />                              inline, 160px
 *   <KulhaLoader size={28} />                    inside a button
 *   <KulhaLoader fullscreen theme="dark" message={t('loading')} />
 */
export function KulhaLoader({
  size = 160,
  theme = 'dark',
  fullscreen = false,
  message,
  label = 'Loading…',
  basePath = '/kulha-loader',
  className,
  panelClassName,
}: KulhaLoaderProps) {
  if (fullscreen) {
    return (
      <div className={cx(styles.screen, styles[theme], panelClassName)} role="status" aria-live="polite" aria-busy="true">
        <Logo size={size} basePath={basePath} className={className} />
        {message ? <p className={styles.message}>{message}</p> : null}
        <span className={styles.sr}>{message ?? label}</span>
      </div>
    );
  }
  return (
    <span className={styles.inline} role="status" aria-live="polite" aria-busy="true">
      <Logo size={size} basePath={basePath} className={className} />
      <span className={styles.sr}>{label}</span>
    </span>
  );
}

export default KulhaLoader;
