import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Hero from "@/components/sections/Hero";
import IsroAssociation from "@/components/sections/IsroAssociation";
import About from "@/components/sections/About";
import Journey from "@/components/sections/Journey";
import Events from "@/components/sections/Events";
import FutureEvents from "@/components/sections/FutureEvents";
import Mentor from "@/components/sections/Mentor";
import Committee from "@/components/sections/Committee";
import Gallery from "@/components/sections/Gallery";
import Podcast from "@/components/sections/Podcast";
import Stats from "@/components/sections/Stats";
import Achievements from "@/components/sections/Achievements";
import Contact from "@/components/sections/Contact";

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <Hero />
      <IsroAssociation />
      <About />
      <Journey />
      <Events />
      <FutureEvents />
      <Mentor />
      <Committee />
      <Gallery />
      <Podcast />
      <Stats />
      <Achievements />
      <Contact />
      <Footer />
    </div>
  );
}
