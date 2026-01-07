import { Footer } from "@/components/layout/footer";
import Hero from "@/components/sections/hero";
import { HeroBackground } from "@/components/sections/hero-bg";

export default function Home() {
  return (
    <>
      <HeroBackground content={<Hero />} />
      <Footer />
    </>

  );
}

