import "../../styles/landing.css";
import Header from "../../components/home/Header";
import Hero from "../../components/home/Hero";
import { Types, Features, Preview, How, Pricing, Trust, Faq } from "../../components/home/Sections";
import DemoForm from "../../components/home/DemoForm";
import Footer from "../../components/home/Footer";

export default function Landing() {
  return (
    <div className="lp">
      <Header />
      <main id="top">
        <Hero />
        <Types />
        <Features />
        <Preview />
        <How />
        <Pricing />
        <Trust />
        <Faq />
        <DemoForm />
      </main>
      <Footer />
    </div>
  );
}

