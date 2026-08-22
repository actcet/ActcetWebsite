import { Instagram, Linkedin, Users, Sparkles } from "lucide-react";
import Eyebrow from "@/components/ui/Eyebrow";
import Card from "@/components/ui/Card";
import Tabs from "@/components/ui/Tabs";
import { coreCommittee, workingCommittee, formerCommittee } from "@/data/committee";
import type { CommitteeMember } from "@/types";

const tabData: Record<string, CommitteeMember[]> = {
  core: coreCommittee,
  working: workingCommittee,
  former: formerCommittee,
};

function MemberCard({ member }: { member: CommitteeMember }) {
  return (
    <Card className="group text-center p-6 border border-navy/[0.08] hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-[0_18px_36px_rgba(10,25,47,0.12)] transition-all duration-300">
      <div className="group relative mb-4 rounded-2xl bg-gradient-to-br from-primary/35 via-mint/30 to-navy/15 p-1 shadow-[0_8px_20px_rgba(37,150,190,0.12)] transition-transform duration-300 hover:-translate-y-1">
        <div className="overflow-hidden rounded-xl bg-[#edf3f6]">
          <img
            src={member.photo}
            alt={member.name}
            style={{ objectPosition: member.photoPosition ?? "center top" }}
            className={`w-full ${member.assignedWorkingMembers ? "h-[180px]" : "h-[150px]"} object-cover transition-transform duration-300 group-hover:scale-[1.02]`}
          />
        </div>
      </div>
      <h5 className="font-display font-semibold text-navy text-base">{member.name}</h5>
      <div className="text-primary font-label font-semibold text-xs mt-0.5">{member.position}</div>
      <div className="text-xs text-ink-soft my-2.5">{member.year}</div>
      <div className="flex gap-2.5 justify-center">
        <a href={member.linkedin || "#"} aria-label={`${member.name} on LinkedIn`} className="w-8 h-8 rounded-full bg-bg-alt flex items-center justify-center">
          <Linkedin size={14} className="text-navy" />
        </a>
        <a href={member.instagram || "#"} aria-label={`${member.name} on Instagram`} className="w-8 h-8 rounded-full bg-bg-alt flex items-center justify-center">
          <Instagram size={14} className="text-navy" />
        </a>
      </div>
    </Card>
  );
}

export default function Committee() {
  return (
    <section
      id="committee"
      className="relative overflow-hidden py-28 px-[6vw] bg-bg-alt bg-[radial-gradient(circle_at_8%_18%,rgba(37,150,190,0.12),transparent_28%),radial-gradient(circle_at_92%_82%,rgba(100,255,218,0.1),transparent_24%)]"
    >
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow>People</Eyebrow>
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mt-2 mb-8">
          <div>
            <h2 className="font-display font-bold text-navy text-[clamp(2rem,4vw,3rem)] leading-tight">Meet the minds behind ACTCET</h2>
            <p className="text-ink-soft max-w-xl mt-3 text-[1.05rem]">
              The students shaping our next orbit through curiosity, collaboration, and action.
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-auto rounded-full border border-primary/15 bg-white/70 px-4 py-2.5 shadow-sm">
            <Users size={18} className="text-primary" />
            <span className="font-label text-sm font-semibold text-navy">2026–27 · 17 members</span>
          </div>
        </div>

        <Tabs
          tabs={[
            { key: "core", label: "Current Core Committee" },
            { key: "working", label: "Current Working Committee" },
            { key: "former", label: "Former Core Committees" },
          ]}
        >
          {(active) => (
            <div className={`grid grid-cols-2 gap-6 ${active === "core" ? "md:grid-cols-3 max-w-4xl mx-auto" : "md:grid-cols-4"}`}>
              <div className="col-span-full flex items-center gap-2 text-primary font-label text-xs font-semibold uppercase tracking-[0.14em]">
                <Sparkles size={15} />
                {active === "core" ? "Leadership circle" : active === "working" ? "Mission crew" : "Past leadership"}
              </div>
              {tabData[active].map((member) => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          )}
        </Tabs>
      </div>
    </section>
  );
}
