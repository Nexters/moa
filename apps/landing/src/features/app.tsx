import { DownloadSection } from './components/download-section';
import { Footer } from './components/footer';
import { Header } from './components/header';
import { Hero } from './components/hero';
import { OnboardingSection } from './components/onboarding-section';
import { SalarySection } from './components/salary-section';
import { VisualizationSection } from './components/visualization-section';

export function App() {
  return (
    <div className="min-h-dvh">
      <Header />
      <Hero />
      <SalarySection />
      <OnboardingSection />
      <VisualizationSection />
      <DownloadSection />
      <Footer />
    </div>
  );
}
