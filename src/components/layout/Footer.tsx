import { Instagram, Linkedin, Youtube, Mail } from "lucide-react";
import { navLinks } from "@/data/navigation";

const socials = [
  { icon: Instagram, label: "Instagram", href: "https://www.instagram.com/tcet_astronomy.club" },
  { icon: Linkedin, label: "LinkedIn" ,href: "https://www.linkedin.com/company/astronomy-club-tcet/" },
  { icon: Youtube, label: "YouTube", href: "https://www.youtube.com/@actcet" },
  { icon: Mail, label: "Email", href: "mailto:actcet@tcetmumbai.in" },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-[#B8CDE0] px-[6vw] pt-[70px] pb-8">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[52px] h-[38px]">
              <img src="/images/Actcet%20Images/IMP%20LOGO/ACTCET%20LOGO%20(1).png" alt="ACTCET Astronomy Club" className="w-full h-full object-contain" />
            </div>
            <div className="font-display font-bold text-sm text-white">
              ACTCET
              <span className="block font-label font-medium text-[0.62rem] tracking-wider uppercase text-[#7C93A8]">
                Astronomy Club · TCET
              </span>
            </div>
          </div>
          <p className="text-sm max-w-[280px] mb-5">
            Exploring the Universe, Inspiring the Future — under the ISRO Outreach Programme.
          </p>
          <div className="flex gap-2.5">
            {socials.map(({ icon: Icon, label, href }) => (
              <a
                key={label}
                href={href ?? "#"}
                target={href?.startsWith("http") ? "_blank" : undefined}
                rel={href?.startsWith("http") ? "noreferrer" : undefined}
                aria-label={label}
                className="w-[38px] h-[38px] rounded-full bg-white/[0.06] flex items-center justify-center hover:bg-white/15 transition-colors"
              >
                <Icon size={16} className="text-[#EAFBFF]" />
              </a>
            ))}
          </div>
        </div>

        <div>
          <h5 className="font-label text-sm text-white mb-4 tracking-wide">Quick Links</h5>
          {navLinks.slice(0, 4).map((link) => (
            <a key={link.href} href={link.href} className="block text-sm mb-2.5 hover:text-mint-bright">
              {link.label}
            </a>
          ))}
        </div>

        <div>
          <h5 className="font-label text-sm text-white mb-4 tracking-wide">More</h5>
          {navLinks.slice(4).map((link) => (
            <a key={link.href} href={link.href} className="block text-sm mb-2.5 hover:text-mint-bright">
              {link.label}
            </a>
          ))}
          <a href="#" className="block text-sm mb-2.5 hover:text-mint-bright">
            Brochure
          </a>
        </div>

        <div>
          <h5 className="font-label text-sm text-white mb-4 tracking-wide">Newsletter</h5>
          <p className="text-sm mb-3.5">Get mission updates in your inbox.</p>
          <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
            <input
              type="email"
              placeholder="you@example.com"
              className="flex-1 px-3.5 py-2.5 rounded-lg border border-white/15 bg-white/5 text-white text-sm placeholder:text-[#7C93A8] focus:outline-none focus:border-mint-bright"
            />
            <button className="px-4 py-2.5 rounded-lg bg-primary text-white text-sm font-semibold hover:bg-primary-dark transition-colors">
              Join
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-[1280px] mx-auto mt-12 pt-6 border-t border-white/10 flex flex-wrap justify-between gap-2.5 text-xs text-[#7C93A8]">
        <span>© 2026 Astronomy Club of TCET. All rights reserved.</span>
        <span>Designed by Astronomy Club of TCET</span>
      </div>
    </footer>
  );
}
