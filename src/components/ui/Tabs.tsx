import { useState } from "react";
import { cn } from "@/lib/utils";

interface Tab {
  key: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  defaultKey?: string;
  onChange?: (key: string) => void;
  children: (activeKey: string) => React.ReactNode;
}

export default function Tabs({ tabs, defaultKey, onChange, children }: TabsProps) {
  const [active, setActive] = useState(defaultKey ?? tabs[0]?.key);

  const handleClick = (key: string) => {
    setActive(key);
    onChange?.(key);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2.5 mb-10">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleClick(tab.key)}
            className={cn(
              "px-6 py-3 rounded-full font-label font-semibold text-sm border transition-colors",
              active === tab.key
                ? "bg-primary text-white border-primary"
                : "bg-surface text-ink-soft border-navy/[0.09] hover:border-primary/40"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children(active)}
    </div>
  );
}
