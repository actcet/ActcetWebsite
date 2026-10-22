export default function PortalDataStatus({ error }: { error: string | null }) {
  return <div className="min-h-[70vh] pt-32 px-6 text-center text-white" role={error ? "alert" : "status"}>
    <h1 className="font-display text-2xl mb-3">{error ? "Portal data unavailable" : "Loading club records…"}</h1>
    {error && <><p className="text-ink-soft max-w-xl mx-auto">{error}</p><button onClick={() => window.location.reload()} className="mt-5 rounded-xl bg-primary px-5 py-3">Retry</button></>}
  </div>;
}
