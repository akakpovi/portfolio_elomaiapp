import { useEffect } from 'react';
import { LanguageProvider } from './components/i18n';
import { initAnalytics } from './lib/analytics';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Solutions } from './components/Solutions';
import { Services } from './components/Services';
import { Projects } from './components/Projects';
import { TechStack } from './components/TechStack';
import { LocalAgents } from './components/LocalAgents';
import { ComputerOperator } from './components/ComputerOperator';
import { DeploymentOptions } from './components/DeploymentOptions';
import { RAGSystem } from './components/RAGSystem';
import { WhyLocal } from './components/WhyLocal';
import { About } from './components/About';
import { Freelancer } from './components/Freelancer';
import { Blog } from './components/Blog';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

function Divider({ color }: { color: string }) {
  return (
    <div
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
      style={{ height: '1px', background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
      role="presentation"
    />
  );
}

export default function App() {
  // Matomo is configured once, and only on the production host.
  useEffect(() => {
    initAnalytics();
  }, []);

  return (
    <LanguageProvider>
      <div
        className="min-h-screen"
        style={{
          background: '#020817',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[200] focus:px-3 focus:py-2 focus:rounded-lg"
          style={{ background: '#8b5cf6', color: '#fff' }}
        >
          Skip to content
        </a>

        <Header />

        <main id="main">
          <Hero />
          <Divider color="rgba(6, 182, 212, 0.15)" />

          <Solutions />
          <Divider color="rgba(139, 92, 246, 0.15)" />

          <Services />
          <Divider color="rgba(99, 102, 241, 0.15)" />

          <Projects />
          <Divider color="rgba(6, 182, 212, 0.12)" />

          <TechStack />
          <Divider color="rgba(139, 92, 246, 0.12)" />

          <LocalAgents />
          <Divider color="rgba(16, 185, 129, 0.12)" />

          <ComputerOperator />
          <Divider color="rgba(6, 182, 212, 0.12)" />

          <DeploymentOptions />
          <Divider color="rgba(139, 92, 246, 0.12)" />

          <RAGSystem />
          <Divider color="rgba(6, 182, 212, 0.12)" />

          <WhyLocal />
          <Divider color="rgba(16, 185, 129, 0.12)" />

          <About />
          <Divider color="rgba(139, 92, 246, 0.12)" />

          <Freelancer />
          <Divider color="rgba(6, 182, 212, 0.12)" />

          <Blog />
          <Divider color="rgba(139, 92, 246, 0.15)" />

          <Contact />
        </main>

        <Footer />
      </div>
    </LanguageProvider>
  );
}
