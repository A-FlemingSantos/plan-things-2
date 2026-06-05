import Navbar from '../components/Navbar/Navbar.jsx'
import Hero from '../components/Hero/Hero.jsx'
import PixelLogoGrid from '../components/PixelLogoGrid/PixelLogoGrid.jsx'
import HowItWorks from '../components/HowItWorks/HowItWorks.jsx'
import HighlightedInnovation from '../components/HighlightedInnovation/HighlightedInnovation.jsx'
import Pricing from '../components/Pricing/Pricing.jsx'
import MobileDownload from '../components/MobileDownload/MobileDownload.jsx'
import Ecosystem from '../components/Ecosystem/Ecosystem.jsx'
import FAQ from '../components/FAQ/FAQ.jsx'
import Footer from '../components/Footer/Footer.jsx'

export default function LandingPage() {
  return (
    <>
      <Navbar />
      <main>
        <section id="hero">
          <Hero />
        </section>
        <section id="trusted-brands" aria-label="Marcas e clientes">
          <PixelLogoGrid />
        </section>
        <section id="how-it-works" aria-label="Como funciona">
          <HowItWorks />
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
