import { Mail, Instagram, Linkedin, Youtube, Music2, MapPin } from "lucide-react";
import Eyebrow from "@/components/ui/Eyebrow";
import Card from "@/components/ui/Card";
import { contactDetails } from "@/data/contact";

const iconMap = {
  mail: Mail,
  instagram: Instagram,
  linkedin: Linkedin,
  youtube: Youtube,
  music: Music2,
  "map-pin": MapPin,
};

export default function Contact() {
  return (
    <section id="contact" className="py-28 px-[6vw] bg-bg-alt">
      <div className="max-w-[1280px] mx-auto">
        <Eyebrow>Get In Touch</Eyebrow>
        <h2 className="font-display font-bold text-navy text-[clamp(2rem,4vw,3rem)] mt-2 mb-10">Contact ACTCET</h2>

        <div className="grid md:grid-cols-2 gap-12">
          <div>
            {contactDetails.map((c) => {
              const Icon = iconMap[c.icon];
              return (
                <Card key={c.label} className="flex gap-4 items-center p-5 mb-3.5">
                  <div className="w-11 h-11 rounded-xl bg-bg-alt flex items-center justify-center shrink-0">
                    <Icon size={20} className="text-primary" strokeWidth={1.8} />
                  </div>
                  <div>
                    <div className="font-label font-semibold text-sm text-navy">{c.label}</div>
                    <div className="text-sm text-ink-soft">{c.value}</div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="rounded-xl2 min-h-[320px] h-full flex items-center justify-center text-ink-soft font-label text-sm border border-navy/[0.09] bg-[repeating-linear-gradient(45deg,#E4EFF4,#E4EFF4_10px,#dceaf0_10px,#dceaf0_20px)]">
            Google Maps Placeholder
          </div>
        </div>
      </div>
    </section>
  );
}
