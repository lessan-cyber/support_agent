
import React from "react";
import { Footer } from "@/components/layout/footer";
import Features from "@/components/sections/features";
import Hero from "@/components/sections/hero";
import { HeroBackground } from "@/components/sections/hero-bg";
import { AhaDemo } from "@/components/aha-demo";

export default function Home() {


  return (
    <>
      <HeroBackground content={<Hero />} />
      <Features />
      <div id="aha-demo">
        <AhaDemo />
      </div>
      <Footer />
    </>

  );
}
