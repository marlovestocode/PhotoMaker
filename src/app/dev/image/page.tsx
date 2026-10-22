"use client";

import { useState } from "react";
import { ImageSection } from "@/components/Image/image-section";

export default function ImageTest() {
    const [imageUrl, setImageUrl] = useState("https://placehold.co/400x300");

    return (
        <main style={{ padding: 24 }}>
            <p>Default</p>
            <ImageSection style={{}} />

            <p>Custom caption + rounded</p>
            <label>
                Image URL: <input type="url" value={imageUrl} onChange={(event) => setImageUrl(event.target.value)} />
            </label>
            <ImageSection style={{ src: imageUrl, caption: "A test photo", borderRadius: 20 }} />

            <p>Invalid data (should fall back to defaults, not crash)</p>
            <ImageSection style={{ src: "not-a-url", maxWidth: 999 }} />
        </main>
    );
}