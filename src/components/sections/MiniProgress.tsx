export default function MiniProgress({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-y-2 gap-x-1.5 font-label text-sm text-ink-soft my-8">
      {steps.map((step, i) => (
        <span key={`${step}-${i}`} className="flex items-center gap-1.5">
          <span className="px-3 py-1.5 rounded-full bg-surface border border-navy/[0.09]">{step}</span>
          {i < steps.length - 1 && <span className="text-primary">&rarr;</span>}
        </span>
      ))}
    </div>
  );
}
