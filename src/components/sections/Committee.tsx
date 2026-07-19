import { Linkedin, Mail } from "lucide-react";
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
    <Card className="text-center p-6">
      <img
        src={member.photo}
        alt={member.name}
        className="w-[84px] h-[84px] rounded-full object-cover mx-auto mb-4 border-2 border-white shadow-sm"
      />
      <h5 className="font-display font-semibold text-navy">{member.name}</h5>
      <div className="text-primary font-label font-semibold text-xs mt-0.5">{member.position}</div>
      <div className="text-xs text-ink-soft my-2.5">{member.year}</div>
      <div className="flex gap-2.5 justify-center">
        <a href="#" aria-label="LinkedIn" className="w-8 h-8 rounded-full bg-bg-alt flex items-center justify-center">
          <Linkedin size={14} className="text-navy" />
        </a>
        <a href="#" aria-label="Email" className="w-8 h-8 rounded-full bg-bg-alt flex items-center justify-center">
          <Mail size={14} className="text-navy" />
        </a>
      </div>
    </Card>
  );
}

export default function Committee() {
  return (
    <section id="committee" className="py-28 px-[6vw] bg-bg-alt">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow>People</Eyebrow>
        <h2 className="font-display font-bold text-navy text-[clamp(2rem,4vw,3rem)] mt-2 mb-4">Committee</h2>

        <Tabs
          tabs={[
            { key: "core", label: "Current Core Committee" },
            { key: "working", label: "Current Working Committee" },
            { key: "former", label: "Former Core Committees" },
          ]}
        >
          {(active) => (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
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
