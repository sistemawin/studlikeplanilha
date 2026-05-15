export const dynamic = "force-dynamic";

export function GET() {
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_APP_VERSION ??
    "local";

  return Response.json(
    { version },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
