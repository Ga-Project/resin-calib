// resin-calib — インライン SVG アイコン（ランタイム依存を持たない・currentColor 連動・1em 基準）。
// 装飾アイコンは aria-hidden、意味を持つ箇所ではテキストラベルを必ず併記する（色/形だけに頼らない）。
import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

/** 未硬化（しずく）。RERF の under 状態。 */
export function IconDroplet(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.5c3 3.8 5.5 6.7 5.5 9.8a5.5 5.5 0 0 1-11 0c0-3.1 2.5-6 5.5-9.8Z" />
    </Base>
  );
}

/** 良好（チェック付き丸）。RERF の good 状態。 */
export function IconCircleCheck(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </Base>
  );
}

/** 過硬化（警告三角）。RERF の over 状態。 */
export function IconAlertTriangle(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 4 2.8 19.5h18.4L12 4Z" />
      <path d="M12 10v4" />
      <path d="M12 17.2v.1" />
    </Base>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.2-3.2" />
    </Base>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5" />
      <path d="M4 19.5h16" />
    </Base>
  );
}

export function IconUpload(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
      <path d="M4 19.5h16" />
    </Base>
  );
}

export function IconX(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 6l12 12M18 6 6 18" />
    </Base>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 7h16" />
      <path d="M9 7V4.8c0-.4.3-.8.8-.8h4.4c.5 0 .8.4.8.8V7" />
      <path d="M6 7l1 12.2c0 .5.4.8.9.8h8.2c.5 0 .9-.3.9-.8L18 7" />
      <path d="M10 11v5M14 11v5" />
    </Base>
  );
}

/** ブランド/空状態のシンボル（露光メーター風）。 */
export function IconGauge(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="M12 18 15.5 9.5" />
      <circle cx="12" cy="18" r="1.3" fill="currentColor" stroke="none" />
    </Base>
  );
}

export function IconLayers(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m12 4 8 4-8 4-8-4 8-4Z" />
      <path d="m4 12 8 4 8-4" />
    </Base>
  );
}

export function IconScale(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 4v16" />
      <path d="M7 8h10" />
      <path d="M7 8l-3 6h6l-3-6Z" />
      <path d="M17 8l-3 6h6l-3-6Z" />
      <path d="M8 20h8" />
    </Base>
  );
}
