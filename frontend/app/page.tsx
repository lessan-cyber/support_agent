import { Footer } from "@/components/layout/footer";
import Features from "@/components/sections/features";
import Hero from "@/components/sections/hero";
import { HeroBackground } from "@/components/sections/hero-bg";

export default function Home() {
  return (
    <>
      <HeroBackground content={<Hero />} />
      <Features />
      <Footer />
    </>

  );
}

