import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

export default function Hero() {
  return (
    <header
      id="home"
      className="relative min-h-screen flex items-center justify-center overflow-hidden text-center px-[6vw]"
      style={{
        background: "radial-gradient(ellipse at 30% 20%, #14314f 0%, #0A192F 55%, #060e1c 100%)",
      }}
    >
      <div className="absolute inset-0 bg-stars opacity-60 animate-twinkle" />
      <div className="absolute inset-0 bg-stars-alt opacity-50 animate-twinkle [animation-direction:reverse]" />

      <div className="absolute top-1/2 left-1/2 w-[600px] h-[600px] -mt-[300px] -ml-[300px] rounded-full border border-mint-bright/10 animate-[spin_60s_linear_infinite]" />
      <div className="absolute top-1/2 left-1/2 w-[900px] h-[900px] -mt-[450px] -ml-[450px] rounded-full border border-mint-bright/10 animate-[spin_90s_linear_infinite] [animation-direction:reverse]" />

      <div
        className="absolute w-[110px] h-[110px] rounded-full top-[14%] right-[10%] animate-float"
        style={{
          background: "radial-gradient(circle at 32% 30%, #6fd4ea, #2596be 60%, #0d3a4d)",
          boxShadow: "0 0 50px rgba(37,150,190,0.4)",
        }}
      />
      <div
        className="absolute w-[46px] h-[46px] rounded-full bottom-[16%] left-[9%] animate-float [animation-direction:reverse]"
        style={{
          background: "radial-gradient(circle at 35% 30%, #64FFDA, #14806b 70%)",
          boxShadow: "0 0 30px rgba(100,255,218,0.35)",
        }}
      />

      <motion.div
        className="relative z-10 max-w-[920px]"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.2, 0.7, 0.3, 1] }}
      >
        <div
          className="w-24 h-24 mx-auto mb-7 rounded-full flex items-center justify-center"
          style={{
            background: "conic-gradient(from 200deg, #2596be, #64FFDA, #0A192F, #2596be)",
            boxShadow: "0 0 0 6px rgba(255,255,255,0.08), 0 0 60px rgba(37,150,190,0.5)",
          }}
        >
          <span className="font-display text-white font-extrabold text-2xl">AC</span>
        </div>

        <div className="text-mint-bright font-label text-sm tracking-[0.2em] uppercase font-semibold mb-4">
          Under the ISRO Outreach Programme
        </div>

        <h1 className="text-white font-display font-bold leading-[1.12] text-[clamp(2.1rem,5.2vw,4.1rem)] mb-5">
          Astronomy Club of
          <br />
          <span className="bg-gradient-to-r from-mint-bright to-primary bg-clip-text text-transparent">
            Thakur College
          </span>{" "}
          of Engineering &amp; Technology
        </h1>

        <p className="text-[#B8CDE0] text-lg max-w-[640px] mx-auto mb-10">
          Connecting curious minds with the wonders of the cosmos through astronomy, outreach, innovation, research,
          and technology.
        </p>

        <div className="flex gap-4 justify-center flex-wrap">
          <Button variant="primary" href="#events">
            Explore Events
          </Button>
          <Button variant="ghost" href="#contact">
            Join ACTCET
          </Button>
        </div>
      </motion.div>

      <div className="absolute bottom-9 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-2 text-[#8FB3CC] text-xs tracking-[0.15em] font-label">
        SCROLL
        <div className="w-px h-11 bg-gradient-to-b from-[#8FB3CC] to-transparent relative overflow-hidden">
          <span className="absolute top-0 left-0 w-full h-3.5 bg-mint-bright animate-[scrolldown_1.8s_ease-in-out_infinite]" />
        </div>
      </div>

      <style>{`
        @keyframes scrolldown {
          0% { transform: translateY(-14px); }
          100% { transform: translateY(58px); }
        }
      `}</style>
    </header>
  );
}
