import { LanguageProvider } from './components/i18n';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { Solutions } from './components/Solutions';
import { LocalAgents } from './components/LocalAgents';
import { ComputerOperator } from './components/ComputerOperator';
import { DeploymentOptions } from './components/DeploymentOptions';
import { RAGSystem } from './components/RAGSystem';
import { TechStack } from './components/TechStack';
import { Projects } from './components/Projects';
import { WhyLocal } from './components/WhyLocal';
import { Blog } from './components/Blog';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

export default function App() {
  return (
    <LanguageProvider>
      <div
        className="min-h-screen"
        style={{
          background: '#020817',
          fontFamily: "'DM Sans', system-ui, sans-serif",
        }}
      >
        <Header />
        <main>
          <Hero />

          {/* Divider */}
          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.15), transparent)' }}
          />

          <Solutions />

          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.15), transparent)' }}
          />

          <LocalAgents />

          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.12), transparent)' }}
          />

          <ComputerOperator />

          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.12), transparent)' }}
          />

          <DeploymentOptions />

          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.12), transparent)' }}
          />

          <RAGSystem />

          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.12), transparent)' }}
          />

          <TechStack />

          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.12), transparent)' }}
          />

          <Projects />

          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(16,185,129,0.12), transparent)' }}
          />

          <WhyLocal />

          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(139,92,246,0.12), transparent)' }}
          />

          <Blog />

          <div
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
            style={{ height: '1px', background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.15), transparent)' }}
          />

          <Contact />
        </main>
        <Footer />
      </div>
    </LanguageProvider>
  );
}
