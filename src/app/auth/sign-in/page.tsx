import { SignInForm } from "./sign-in-form";

export default function SignInPage() {
    return (
        <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col justify-center px-6 py-12">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-800">Photo Maker</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900">Sign in to your photo book</h1>
            <p className="mt-3 text-stone-600">Use a secure email link or continue with Google.</p>
            <SignInForm />
        </main>
    );
}
