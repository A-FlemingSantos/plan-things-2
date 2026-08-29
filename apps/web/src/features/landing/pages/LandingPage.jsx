import { useEffect } from 'react'
import CustomScrollArea from '../../../shared/components/CustomScrollArea/CustomScrollArea.jsx'
import Navbar from '../components/Navbar/Navbar.jsx'
import Hero from '../components/Hero/Hero.jsx'
import PixelLogoGrid from '../components/PixelLogoGrid/PixelLogoGrid.jsx'
import OurPlatform from '../components/OurPlatform/OurPlatform.jsx'
import HowItWorks from '../components/HowItWorks/HowItWorks.jsx'
import Pricing from '../components/Pricing/Pricing.jsx'
import MobileDownload from '../components/MobileDownload/MobileDownload.jsx'
import FAQ from '../components/FAQ/FAQ.jsx'
import Footer from '../components/Footer/Footer.jsx'
import { handleLandingHashClick, scrollLandingToSection } from '../utils/landingScroll.js'
import styles from './LandingPage.module.css'

export default function LandingPage() {
  useEffect(() => {
    const html = document.documentElement
    const { body } = document
    const previousHtmlOverflow = html.style.overflow
    const previousBodyOverflow = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    const syncHash = (behavior = 'auto') => {
      const id = window.location.hash.replace(/^#/, '')
      if (id) scrollLandingToSection(id, { behavior })
    }

    syncHash('auto')
    const onPopState = () => syncHash('smooth')
    window.addEventListener('popstate', onPopState)
    window.addEventListener('hashchange', onPopState)

    return () => {
      html.style.overflow = previousHtmlOverflow
      body.style.overflow = previousBodyOverflow
      window.removeEventListener('popstate', onPopState)
      window.removeEventListener('hashchange', onPopState)
    }
  }, [])

  return (
    <div className={styles.page} data-landing-page="" onClick={handleLandingHashClick}>
      <Navbar />
      <CustomScrollArea
        className={styles.scroll}
        viewportClassName={styles.viewport}
        refreshKey="landing"
      >
        <main>
          <section id="hero">
            <Hero />
          </section>
          <section id="trusted-brands" aria-label="Marcas e clientes">
            <PixelLogoGrid />
          </section>
          <section id="our-platform" aria-label="Nossa plataforma">
            <OurPlatform />
          </section>
          <section id="how-it-works" aria-label="Como funciona">
            <HowItWorks />
          </section>
          <section id="pricing">
            <Pricing />
          </section>
          <section id="mobile">
            <MobileDownload />
          </section>
          <section id="faq">
            <FAQ />
          </section>
        </main>
        <Footer />
      </CustomScrollArea>
    </div>
  )
}
