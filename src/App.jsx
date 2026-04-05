import Navbar from './components/Navbar/Navbar.jsx'
import Hero from './components/Hero/Hero.jsx'
import SectionNav from './components/SectionNav/SectionNav.jsx'
import HowItWorks from './components/HowItWorks/HowItWorks.jsx'
import Features from './components/Features/Features.jsx'
import HighlightedInnovation from './components/HighlightedInnovation/HighlightedInnovation.jsx'
import Pricing from './components/Pricing/Pricing.jsx'
import MobileDownload from './components/MobileDownload/MobileDownload.jsx'
import Ecosystem from './components/Ecosystem/Ecosystem.jsx'
import FAQ from './components/FAQ/FAQ.jsx'
import Footer from './components/Footer/Footer.jsx'

export default function App() {
  return (
    <>
      <Navbar />
      <main>
        <section id="hero">
          <Hero />
        </section>
        <SectionNav />
        <section id="how-it-works">
          <HowItWorks />
        </section>
        <section id="features">
          <Features />
        </section>
        <section id="innovation">
          <HighlightedInnovation />
        </section>
        <section id="pricing">
          <Pricing />
        </section>
        <section id="mobile">
          <MobileDownload />
        </section>
        <section id="ecosystem">
          <Ecosystem />
        </section>
        <section id="faq">
          <FAQ />
        </section>
      </main>
      <Footer />
    </>
  )
}
