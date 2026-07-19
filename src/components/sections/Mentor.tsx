import Eyebrow from "@/components/ui/Eyebrow";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Reveal from "@/components/ui/Reveal";
import { mentor } from "@/data/mentor";

export default function Mentor() {
  return (
    <section className="py-28 px-[6vw]">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow>Guidance</Eyebrow>
        <h2 className="font-display font-bold text-navy text-[clamp(2rem,4vw,3rem)] mt-2 mb-10">
          Faculty Mentor &amp; ISRO Space Tutor
        </h2>

        <Reveal>
          <Card className="grid md:grid-cols-[260px_1fr] gap-10 items-center p-8 md:p-12 text-center md:text-left">
            <img
              src={mentor.photo}
              alt={mentor.name}
              className="w-[220px] h-[220px] rounded-full object-cover border-4 border-white shadow-soft mx-auto md:mx-0"
            />
            <div>
              <h3 className="font-display font-semibold text-navy text-2xl mb-1">{mentor.name}</h3>
              <div className="text-primary font-label font-semibold text-sm mb-4">{mentor.designation}</div>
              <div className="flex gap-2.5 flex-wrap justify-center md:justify-start mb-5">
                <Badge>{mentor.tag}</Badge>
                <Badge>{mentor.yearsAssociated}</Badge>
              </div>
              <p className="text-ink-soft text-[0.95rem] mb-4">{mentor.bio}</p>
              <p className="italic text-ink text-[0.95rem]">&ldquo;{mentor.message}&rdquo;</p>
            </div>
          </Card>
        </Reveal>
      </div>
    </section>
  );
}
