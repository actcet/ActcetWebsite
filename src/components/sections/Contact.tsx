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
                    {c.href ? (
                      <a
                        href={c.href}
                        target={c.href.startsWith("http") ? "_blank" : undefined}
                        rel={c.href.startsWith("http") ? "noreferrer" : undefined}
                        className="text-sm text-ink-soft hover:text-primary transition-colors"
                      >
                        {c.value}
                      </a>
                    ) : (
                      <div className="text-sm text-ink-soft">{c.value}</div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="rounded-xl2 min-h-[320px] h-full overflow-hidden border border-navy/[0.09] bg-white shadow-soft">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m17!1m12!1m3!1d4017.9457178717944!2d72.8719990754001!3d19.206377047866255!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m2!1m1!2zMTnCsDEyJzIyLjkiTiA3MsKwNTInMjguNSJF!5e1!3m2!1sen!2sin!4v1787401617484!5m2!1sen!2sin"
              title="ACTCET location at Thakur College of Engineering and Technology"
              className="w-full h-full min-h-[320px] border-0"
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </section>
  );
}
