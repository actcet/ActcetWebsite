import { Instagram, Linkedin, Youtube, Music2, Mail } from "lucide-react";
import { navLinks } from "@/data/navigation";

const socials = [
  { icon: Instagram, label: "Instagram" },
  { icon: Linkedin, label: "LinkedIn" },
  { icon: Youtube, label: "YouTube" },
  { icon: Music2, label: "Spotify" },
  { icon: Mail, label: "Email" },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-[#B8CDE0] px-[6vw] pt-[70px] pb-8">
      <div className="max-w-[1280px] mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-[42px] h-[42px] rounded-full flex items-center justify-center bg-[conic-gradient(from_200deg,#2596be,#64FFDA,#0A192F,#2596be)]">
              <span className="text-white font-display font-extrabold text-xs">AC</span>
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
            {socials.map(({ icon: Icon, label }) => (
              <a
                key={label}
                href="#"
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
