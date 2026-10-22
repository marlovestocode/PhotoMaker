import type { ReactNode, SVGProps } from "react";

export type StudioIconName =
    | "aperture"
    | "palette"
    | "type"
    | "layout"
    | "image"
    | "upload"
    | "layers"
    | "route"
    | "sliders"
    | "search"
    | "command"
    | "undo"
    | "redo"
    | "monitor"
    | "tablet"
    | "smartphone"
    | "refresh"
    | "cursor"
    | "panel-right"
    | "panel-left"
    | "close"
    | "arrow-left"
    | "external-link"
    | "check"
    | "chevron-down"
    | "chevron-right"
    | "plus"
    | "trash"
    | "rotate"
    | "copy"
    | "clipboard-paste"
    | "warning"
    | "info"
    | "save"
    | "restore"
    | "lock";

const paths: Record<StudioIconName, ReactNode> = {
    aperture: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="m14.7 4.6-3.4 5.9" />
            <path d="m19.4 8.5-6.8.1" />
            <path d="m19.4 15.5-3.4-5.9" />
            <path d="m14.7 19.4-3.4-5.9" />
            <path d="m4.6 15.5 6.8-.1" />
            <path d="m4.6 8.5 3.4 5.9" />
        </>
    ),
    palette: (
        <>
            <circle cx="13.5" cy="6.5" r=".8" fill="currentColor" stroke="none" />
            <circle cx="17.5" cy="10.5" r=".8" fill="currentColor" stroke="none" />
            <circle cx="8.5" cy="7.5" r=".8" fill="currentColor" stroke="none" />
            <circle cx="6.5" cy="12.5" r=".8" fill="currentColor" stroke="none" />
            <path d="M12 3a9 9 0 1 0 0 18h1.5a2.5 2.5 0 0 0 0-5H12a2 2 0 0 1 0-4h4a4 4 0 0 0 4-4 5 5 0 0 0-5-5Z" />
        </>
    ),
    type: (
        <>
            <path d="M4 7V4h16v3" />
            <path d="M9 20h6" />
            <path d="M12 4v16" />
        </>
    ),
    layout: (
        <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M3 10h18" />
            <path d="M9 10v10" />
        </>
    ),
    image: (
        <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <circle cx="8.5" cy="9.5" r="1.5" />
            <path d="m21 15-5-5L5 20" />
        </>
    ),
    upload: (
        <>
            <path d="M12 16V4" />
            <path d="m6 10 6-6 6 6" />
            <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </>
    ),
    layers: (
        <>
            <path d="m12 3 9 5-9 5-9-5 9-5Z" />
            <path d="m3 13 9 5 9-5" />
        </>
    ),
    route: (
        <>
            <circle cx="6" cy="19" r="2" />
            <circle cx="18" cy="5" r="2" />
            <path d="M8 19h5a3 3 0 0 0 3-3V9a1 1 0 0 1 1-1h-1" />
        </>
    ),
    sliders: (
        <>
            <path d="M4 6h9" />
            <path d="M17 6h3" />
            <path d="M4 12h3" />
            <path d="M11 12h9" />
            <path d="M4 18h7" />
            <path d="M15 18h5" />
            <circle cx="15" cy="6" r="2" />
            <circle cx="9" cy="12" r="2" />
            <circle cx="13" cy="18" r="2" />
        </>
    ),
    search: (
        <>
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
        </>
    ),
    command: (
        <>
            <path d="M9 6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6Z" />
        </>
    ),
    undo: (
        <>
            <path d="M9 7 4 12l5 5" />
            <path d="M4 12h10a6 6 0 0 1 0 12h-1" />
        </>
    ),
    redo: (
        <>
            <path d="m15 7 5 5-5 5" />
            <path d="M20 12H10a6 6 0 0 0 0 12h1" />
        </>
    ),
    monitor: (
        <>
            <rect x="3" y="4" width="18" height="12" rx="2" />
            <path d="M8 20h8" />
            <path d="M12 16v4" />
        </>
    ),
    tablet: (
        <>
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <path d="M11 18h2" />
        </>
    ),
    smartphone: (
        <>
            <rect x="7" y="2" width="10" height="20" rx="2" />
            <path d="M11 18h2" />
        </>
    ),
    refresh: (
        <>
            <path d="M20 7v5h-5" />
            <path d="M4 17v-5h5" />
            <path d="M5.1 9a8 8 0 0 1 13.5-2.4L20 12" />
            <path d="M18.9 15a8 8 0 0 1-13.5 2.4L4 12" />
        </>
    ),
    cursor: (
        <>
            <path d="m4 3 7.4 18 2.1-7.5L21 11.4 4 3Z" />
        </>
    ),
    "panel-right": (
        <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M15 4v16" />
        </>
    ),
    "panel-left": (
        <>
            <rect x="3" y="4" width="18" height="16" rx="2" />
            <path d="M9 4v16" />
        </>
    ),
    close: (
        <>
            <path d="m6 6 12 12" />
            <path d="m18 6-12 12" />
        </>
    ),
    "arrow-left": (
        <>
            <path d="M19 12H5" />
            <path d="m11 18-6-6 6-6" />
        </>
    ),
    "external-link": (
        <>
            <path d="M15 4h5v5" />
            <path d="m10 14 10-10" />
            <path d="M20 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
        </>
    ),
    check: (
        <>
            <path d="m5 12 4 4L19 6" />
        </>
    ),
    "chevron-down": <path d="m6 9 6 6 6-6" />,
    "chevron-right": <path d="m9 6 6 6-6 6" />,
    plus: (
        <>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
        </>
    ),
    trash: (
        <>
            <path d="M4 7h16" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M6 7l1 13h10l1-13" />
            <path d="M9 7V4h6v3" />
        </>
    ),
    rotate: (
        <>
            <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
            <path d="M3 3v5h5" />
        </>
    ),
    copy: (
        <>
            <rect x="8" y="8" width="12" height="12" rx="2" />
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </>
    ),
    "clipboard-paste": (
        <>
            <rect x="8" y="3" width="8" height="4" rx="1" />
            <path d="M16 5h2a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2" />
        </>
    ),
    warning: (
        <>
            <path d="M12 3 2.7 19a1.5 1.5 0 0 0 1.3 2h16a1.5 1.5 0 0 0 1.3-2L12 3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
        </>
    ),
    info: (
        <>
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5" />
            <path d="M12 8h.01" />
        </>
    ),
    save: (
        <>
            <path d="M5 3h12l4 4v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
            <path d="M7 3v6h9V3" />
            <path d="M7 21v-8h10v8" />
        </>
    ),
    restore: (
        <>
            <path d="M3 3v6h6" />
            <path d="M3.5 9a9 9 0 1 1 .8 7" />
        </>
    ),
    lock: (
        <>
            <rect x="4" y="10" width="16" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3" />
        </>
    ),
};

export function StudioIcon({
    name,
    size = 16,
    className,
    ...props
}: Omit<SVGProps<SVGSVGElement>, "name"> & { name: StudioIconName; size?: number }) {
    return (
        <svg
            aria-hidden="true"
            className={className}
            fill="none"
            height={size}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.7"
            viewBox="0 0 24 24"
            width={size}
            {...props}
        >
            {paths[name]}
        </svg>
    );
}
