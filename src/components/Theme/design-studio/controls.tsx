"use client";

import {
    useId,
    useState,
    type ButtonHTMLAttributes,
    type InputHTMLAttributes,
    type ReactNode,
} from "react";
import { CustomDropdown } from "@/components/ui/custom-dropdown";
import { StudioIcon, type StudioIconName } from "./icons";

export function cx(...classes: Array<string | false | null | undefined>) {
    return classes.filter(Boolean).join(" ");
}

type ButtonVariant = "primary" | "secondary" | "ghost" | "ghost-danger" | "danger" | "quiet";
type ButtonSize = "sm" | "md";

export function StudioButton({
    variant = "secondary",
    size = "md",
    icon,
    iconAfter,
    className,
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant;
    size?: ButtonSize;
    icon?: StudioIconName;
    iconAfter?: StudioIconName;
}) {
    return (
        <button
            className={cx(
                "studio-button",
                `studio-button--${variant}`,
                size === "sm" && "studio-button--sm",
                className,
            )}
            type={props.type ?? "button"}
            {...props}
        >
            {icon && <StudioIcon name={icon} size={size === "sm" ? 14 : 16} />}
            {children}
            {iconAfter && <StudioIcon name={iconAfter} size={size === "sm" ? 14 : 16} />}
        </button>
    );
}

export function IconButton({
    label,
    icon,
    pressed,
    className,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
    label: string;
    icon: StudioIconName;
    pressed?: boolean;
}) {
    return (
        <button
            aria-label={label}
            aria-pressed={pressed}
            className={cx("studio-icon-button", pressed && "is-pressed", className)}
            title={label}
            type={props.type ?? "button"}
            {...props}
        >
            <StudioIcon name={icon} size={17} />
        </button>
    );
}

export function Badge({
    children,
    tone = "neutral",
    dot = false,
}: {
    children: ReactNode;
    tone?: "neutral" | "accent" | "success" | "warning" | "danger";
    dot?: boolean;
}) {
    return (
        <span className={cx("studio-badge", `studio-badge--${tone}`)}>
            {dot && <span aria-hidden="true" className="studio-badge__dot" />}
            {children}
        </span>
    );
}

export function FieldLabel({
    htmlFor,
    children,
    aside,
}: {
    htmlFor?: string;
    children: ReactNode;
    aside?: ReactNode;
}) {
    return (
        <span className="studio-field__label">
            <label htmlFor={htmlFor}>{children}</label>
            {aside && <span className="studio-field__aside">{aside}</span>}
        </span>
    );
}

export function SelectField<T extends string>({
    label,
    value,
    options,
    onChange,
    hint,
    disabled = false,
}: {
    label: string;
    value: T;
    options: Array<{ value: T; label: string; disabled?: boolean }>;
    onChange: (value: T) => void;
    hint?: string;
    disabled?: boolean;
}) {
    const id = useId();
    const hintId = hint ? `${id}-hint` : undefined;
    const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

    return (
        <div className="studio-field">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <CustomDropdown
                ariaLabel={`${label}: ${selectedLabel}`}
                buttonClassName="studio-select__control studio-dropdown__trigger"
                describedBy={hintId}
                disabled={disabled}
                id={id}
                menuClassName="studio-dropdown__menu"
                menuLabel={label}
                onChange={onChange}
                optionClassName="studio-dropdown__option"
                options={options}
                portal
                selectedOptionClassName="is-selected"
                value={value}
            />
            {hint && (
                <p className="studio-field__hint" id={hintId}>
                    {hint}
                </p>
            )}
        </div>
    );
}

function normalizeHex(value: string) {
    const trimmed = value.trim();
    const prefixed = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
    return /^#[0-9a-fA-F]{6}$/.test(prefixed) ? prefixed.toLowerCase() : null;
}

export function ColorField({
    label,
    value,
    onChange,
    hint,
    compact = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    hint?: string;
    compact?: boolean;
}) {
    const id = useId();
    const [draft, setDraft] = useState(value);
    const [invalid, setInvalid] = useState(false);
    const [lastValue, setLastValue] = useState(value);

    if (lastValue !== value) {
        setLastValue(value);
        setDraft(value);
        setInvalid(false);
    }

    function commit(raw: string) {
        const normalized = normalizeHex(raw);
        if (!normalized) {
            setDraft(value);
            setInvalid(false);
            return;
        }
        setDraft(normalized);
        setInvalid(false);
        if (normalized !== value) onChange(normalized);
    }

    return (
        <div className={cx("studio-field studio-color", compact && "studio-color--compact")}>
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <div className="studio-color__controls">
                <span className="studio-swatch" style={{ backgroundColor: value }}>
                    <input
                        aria-label={`${label} color picker`}
                        className="studio-swatch__input"
                        onChange={(event) => {
                            setDraft(event.target.value);
                            setInvalid(false);
                            onChange(event.target.value);
                        }}
                        type="color"
                        value={value}
                    />
                </span>
                <input
                    aria-invalid={invalid || undefined}
                    className={cx("studio-input studio-color__hex", invalid && "is-invalid")}
                    id={id}
                    onBlur={(event) => commit(event.currentTarget.value)}
                    onChange={(event) => {
                        setDraft(event.currentTarget.value);
                        setInvalid(normalizeHex(event.currentTarget.value) === null);
                    }}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            commit(event.currentTarget.value);
                            event.currentTarget.blur();
                        }
                    }}
                    spellCheck={false}
                    value={draft}
                />
            </div>
            {hint && <p className="studio-field__hint">{hint}</p>}
        </div>
    );
}

function roundToStep(value: number, step: number) {
    const stepped = Math.round(value / step) * step;
    return Number(stepped.toFixed(4));
}

export function RangeField({
    label,
    value,
    min,
    max,
    step = 1,
    unit,
    onChange,
    hint,
    disabled = false,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit: string;
    onChange: (value: number) => void;
    hint?: string;
    disabled?: boolean;
}) {
    const id = useId();
    const [draft, setDraft] = useState(String(value));
    const [lastValue, setLastValue] = useState(value);

    if (lastValue !== value) {
        setLastValue(value);
        setDraft(String(value));
    }

    function commit(raw: string) {
        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) {
            setDraft(String(value));
            return;
        }
        const next = Math.max(min, Math.min(max, roundToStep(parsed, step)));
        setDraft(String(next));
        if (next !== value) onChange(next);
    }

    return (
        <div className="studio-field studio-range">
            <div className="studio-range__head">
                <FieldLabel htmlFor={`${id}-number`}>{label}</FieldLabel>
                <span className="studio-range__value">
                    <input
                        aria-label={`${label} exact value`}
                        className="studio-number"
                        disabled={disabled}
                        id={`${id}-number`}
                        onBlur={(event) => commit(event.currentTarget.value)}
                        onChange={(event) => setDraft(event.currentTarget.value)}
                        onKeyDown={(event) => {
                            if (event.key === "Enter") {
                                event.preventDefault();
                                commit(event.currentTarget.value);
                                event.currentTarget.blur();
                            }
                        }}
                        step={step}
                        type="number"
                        value={draft}
                    />
                    {unit && <span aria-hidden="true">{unit}</span>}
                </span>
            </div>
            <input
                aria-label={label}
                className="studio-range__slider"
                disabled={disabled}
                max={max}
                min={min}
                onChange={(event) => onChange(Number(event.target.value))}
                step={step}
                type="range"
                value={value}
            />
            {hint && <p className="studio-field__hint">{hint}</p>}
        </div>
    );
}

export function NumberField({
    label,
    value,
    min,
    max,
    step = 1,
    unit,
    onChange,
    disabled = false,
}: {
    label: string;
    value: number;
    min: number;
    max: number;
    step?: number;
    unit: string;
    onChange: (value: number) => void;
    disabled?: boolean;
}) {
    const id = useId();
    const [draft, setDraft] = useState(String(value));
    const [lastValue, setLastValue] = useState(value);

    if (lastValue !== value) {
        setLastValue(value);
        setDraft(String(value));
    }

    function commit(raw: string) {
        const parsed = Number(raw);
        if (!Number.isFinite(parsed)) {
            setDraft(String(value));
            return;
        }
        const next = Math.max(min, Math.min(max, roundToStep(parsed, step)));
        setDraft(String(next));
        if (next !== value) onChange(next);
    }

    return (
        <div className="studio-field studio-number-field">
            <FieldLabel htmlFor={id}>{label}</FieldLabel>
            <span className="studio-number-field__control">
                <input
                    className="studio-input studio-number"
                    disabled={disabled}
                    id={id}
                    onBlur={(event) => commit(event.currentTarget.value)}
                    onChange={(event) => setDraft(event.currentTarget.value)}
                    onKeyDown={(event) => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            commit(event.currentTarget.value);
                            event.currentTarget.blur();
                        }
                    }}
                    step={step}
                    type="number"
                    value={draft}
                />
                {unit && <span aria-hidden="true">{unit}</span>}
            </span>
        </div>
    );
}

export function TextField({
    label,
    value,
    onChange,
    hint,
    maxLength,
    placeholder,
    multiline = false,
    rows = 3,
    mono = false,
    showCount = false,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    hint?: string;
    maxLength?: number;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
    mono?: boolean;
    showCount?: boolean;
}) {
    const id = useId();
    const hintId = hint ? `${id}-hint` : undefined;
    const inputProps: InputHTMLAttributes<HTMLInputElement> = {
        "aria-describedby": hintId,
        className: cx("studio-input", mono && "studio-input--mono"),
        id,
        maxLength,
        onChange: (event) => onChange(event.target.value),
        placeholder,
        value,
    };

    return (
        <div className={cx("studio-field", multiline && "studio-field--wide")}>
            <FieldLabel
                aside={showCount && maxLength ? `${value.length}/${maxLength}` : undefined}
                htmlFor={id}
            >
                {label}
            </FieldLabel>
            {multiline ? (
                <textarea
                    aria-describedby={hintId}
                    className="studio-input studio-textarea"
                    id={id}
                    maxLength={maxLength}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    rows={rows}
                    value={value}
                />
            ) : (
                <input {...inputProps} spellCheck={false} type="text" />
            )}
            {hint && (
                <p className="studio-field__hint" id={hintId}>
                    {hint}
                </p>
            )}
        </div>
    );
}

export function ToggleField({
    label,
    description,
    checked,
    onChange,
    disabled = false,
}: {
    label: string;
    description?: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}) {
    return (
        <label className={cx("studio-switch", disabled && "is-disabled")}>
            <input
                checked={checked}
                className="studio-switch__input"
                disabled={disabled}
                onChange={(event) => onChange(event.target.checked)}
                type="checkbox"
            />
            <span aria-hidden="true" className="studio-switch__track">
                <span className="studio-switch__thumb" />
            </span>
            <span className="studio-switch__copy">
                <span className="studio-switch__label">{label}</span>
                {description && <span className="studio-switch__description">{description}</span>}
            </span>
        </label>
    );
}

export function SegmentedControl<T extends string>({
    label,
    value,
    options,
    onChange,
    compact = false,
}: {
    label: string;
    value: T;
    options: Array<{ value: T; label: string; icon?: StudioIconName; disabled?: boolean }>;
    onChange: (value: T) => void;
    compact?: boolean;
}) {
    return (
        <div
            aria-label={label}
            className={cx("studio-segmented", compact && "studio-segmented--compact")}
            role="group"
        >
            {options.map((option) => {
                const active = option.value === value;
                return (
                    <button
                        aria-pressed={active}
                        className={cx("studio-segmented__option", active && "is-active")}
                        disabled={option.disabled}
                        key={option.value}
                        onClick={() => onChange(option.value)}
                        title={option.label}
                        type="button"
                    >
                        {option.icon && <StudioIcon name={option.icon} size={15} />}
                        <span className={compact ? "studio-sr-only" : undefined}>{option.label}</span>
                    </button>
                );
            })}
        </div>
    );
}

export function AccordionSection({
    title,
    description,
    defaultOpen = false,
    aside,
    children,
}: {
    title: string;
    description?: string;
    defaultOpen?: boolean;
    aside?: ReactNode;
    children: ReactNode;
}) {
    return (
        <details className="studio-accordion" open={defaultOpen}>
            <summary className="studio-accordion__summary">
                <span className="studio-accordion__heading">
                    <span className="studio-accordion__title">{title}</span>
                    {description && (
                        <span className="studio-accordion__description">{description}</span>
                    )}
                </span>
                {aside && <span className="studio-accordion__aside">{aside}</span>}
                <StudioIcon className="studio-accordion__chevron" name="chevron-down" size={15} />
            </summary>
            <div className="studio-accordion__body">{children}</div>
        </details>
    );
}

export function FieldGrid({
    children,
    columns = 2,
}: {
    children: ReactNode;
    columns?: 1 | 2 | 3;
}) {
    return <div className={cx("studio-field-grid", `studio-field-grid--${columns}`)}>{children}</div>;
}

export function Callout({
    tone = "info",
    title,
    children,
    role,
}: {
    tone?: "info" | "warning" | "danger" | "success";
    title?: string;
    children: ReactNode;
    role?: "status" | "alert";
}) {
    return (
        <div className={cx("studio-callout", `studio-callout--${tone}`)} role={role}>
            <StudioIcon
                className="studio-callout__icon"
                name={tone === "warning" || tone === "danger" ? "warning" : "info"}
                size={16}
            />
            <div className="studio-callout__copy">
                {title && <p className="studio-callout__title">{title}</p>}
                <div className="studio-callout__text">{children}</div>
            </div>
        </div>
    );
}

export function PanelActions({ children }: { children: ReactNode }) {
    return <div className="studio-panel__actions">{children}</div>;
}

export function ActionRow({ children }: { children: ReactNode }) {
    return <div className="studio-action-row">{children}</div>;
}

export function Divider() {
    return <hr className="studio-divider" />;
}

export function Shortcut({ children }: { children: ReactNode }) {
    return <kbd className="studio-kbd">{children}</kbd>;
}
