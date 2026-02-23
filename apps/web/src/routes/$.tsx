import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/$")({
  component: NotFoundPage,
});

function NotFoundPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-[#f6f8f7] dark:bg-[#1a1c1e]">
      <div className="flex flex-col items-center text-center">
        <div className="mb-8 brightness-[1.02] mix-blend-multiply dark:invert dark:mix-blend-screen dark:opacity-85">
          <img src="/images/bee.svg" alt="" className="h-8 w-auto" />
        </div>
        <h1 className="font-heading mb-4 text-4xl font-medium md:text-5xl">
          Page Not Found
        </h1>
        <p className="mb-6 max-w-md text-base text-[#70757c]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/"
          className="text-sm font-medium text-[#4879f8] hover:underline"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
