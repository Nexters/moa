import { CardsSection } from './components/cards-section';
import { DownloadSection } from './components/download-section';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { Hero } from './components/hero';
import { SalarySection } from './components/salary-section';

export function App() {
  return (
    <div className="min-h-dvh">
      <Header />
      <Hero />
      <SalarySection />
      <CardsSection />
      <DownloadSection />
      <Footer />
    </div>
  );
}
