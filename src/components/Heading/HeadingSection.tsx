import { headingStyleSchema, headingStyleToCss } from "@/theme/heading-style";

export function HeadingSection({ style }: { style: unknown }) {
    const parsed = headingStyleSchema.safeParse(style ?? {});
    const heading = parsed.success ? parsed.data : headingStyleSchema.parse({});

    return <h2 style={headingStyleToCss(heading)}>{heading.text}</h2>;
}
