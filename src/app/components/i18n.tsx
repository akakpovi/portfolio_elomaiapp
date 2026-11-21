import React, { createContext, useContext, useState } from 'react';
import type { Lang } from '../data/site';

export type { Lang };

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextType>({ lang: 'en', setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');

  const handleSetLang = (next: Lang) => {
    setLang(next);
    document.documentElement.lang = next;
  };

  return <LangContext.Provider value={{ lang, setLang: handleSetLang }}>{children}</LangContext.Provider>;
}

export function useLang() {
  return useContext(LangContext);
}

type T = { fr: string; en: string; de: string };
export const tx = (obj: T, lang: Lang): string => obj[lang];

export const i18n = {
  nav: {
    home: { fr: 'Accueil', en: 'Home', de: 'Startseite' },
    solutions: { fr: 'Solutions IA', en: 'AI Solutions', de: 'KI-Lösungen' },
    services: { fr: 'Services', en: 'Services', de: 'Leistungen' },
    projects: { fr: 'Projets', en: 'Projects', de: 'Projekte' },
    technologies: { fr: 'Technologies', en: 'Technologies', de: 'Technologien' },
    about: { fr: 'À propos', en: 'About', de: 'Über mich' },
    blog: { fr: 'Blog', en: 'Blog', de: 'Blog' },
    contact: { fr: 'Contact', en: 'Contact', de: 'Kontakt' },
    freelancer: { fr: 'Freelancer', en: 'Freelancer', de: 'Freelancer' },
  },
  hero: {
    brand: { fr: 'EL0M AI ENGINEER', en: 'EL0M AI ENGINEER', de: 'EL0M AI ENGINEER' },
    role: { fr: 'Ingénieur IA & Développeur Full-Stack', en: 'AI Engineer & Full-Stack Developer', de: 'KI-Ingenieur & Full-Stack-Entwickler' },
    badge: { fr: 'Ingénieur IA · Infrastructure privée', en: 'AI Engineer · Private Infrastructure', de: 'KI-Ingenieur · Private Infrastruktur' },
    title: {
      fr: 'Je construis des logiciels intelligents, des systèmes IA privés et des applications évolutives.',
      en: 'Building Intelligent Software, Private AI Systems and Scalable Applications.',
      de: 'Ich entwickle intelligente Software, private KI-Systeme und skalierbare Anwendungen.',
    },
    subtitle: {
      fr: 'Je conçois et développe des applications logicielles modernes, des agents IA autonomes, des infrastructures IA privées et des solutions d’automatisation intelligentes.',
      en: 'I design and develop modern software applications, autonomous AI agents, private AI infrastructure and intelligent automation solutions.',
      de: 'Ich konzipiere und entwickle moderne Softwareanwendungen, autonome KI-Agenten, private KI-Infrastruktur und intelligente Automatisierungslösungen.',
    },
    subtitle2: {
      fr: 'Des applications web full-stack aux systèmes IA déployés localement, j’aide particuliers et entreprises à transformer leurs idées en produits numériques fiables.',
      en: 'From full-stack web applications to locally deployed AI systems, I help individuals and businesses transform their ideas into reliable digital products.',
      de: 'Von Full-Stack-Webanwendungen bis zu lokal betriebenen KI-Systemen helfe ich Einzelpersonen und Unternehmen, ihre Ideen in zuverlässige digitale Produkte zu verwandeln.',
    },
    highlights: [
      { fr: 'Développement Full-Stack', en: 'Full-Stack Development', de: 'Full-Stack-Entwicklung' },
      { fr: 'Intelligence Artificielle', en: 'Artificial Intelligence', de: 'Künstliche Intelligenz' },
      { fr: 'IA locale & privée', en: 'Local & Private AI', de: 'Lokale & private KI' },
      { fr: 'Agents IA autonomes', en: 'Autonomous AI Agents', de: 'Autonome KI-Agenten' },
      { fr: 'Développement SaaS', en: 'SaaS Development', de: 'SaaS-Entwicklung' },
      { fr: 'Cloud & DevOps', en: 'Cloud & DevOps', de: 'Cloud & DevOps' },
    ],
    cta1: { fr: 'Découvrir mes projets', en: 'Explore My Projects', de: 'Meine Projekte entdecken' },
    cta2: { fr: 'Me recruter sur Freelancer', en: 'Hire Me on Freelancer', de: 'Auf Freelancer beauftragen' },
    cta3: { fr: 'Discuter de votre projet', en: 'Discuss Your Project', de: 'Projekt besprechen' },
    availability: { fr: 'Disponible pour missions freelance', en: 'Available for freelance projects', de: 'Verfügbar für Freelance-Projekte' },
    scrollHint: { fr: 'Défiler pour découvrir', en: 'Scroll to discover', de: 'Scrollen zum Entdecken' },
  },
  services: {
    title: { fr: 'Prestations professionnelles', en: 'Professional Services', de: 'Professionelle Leistungen' },
    subtitle: {
      fr: 'Du développement full-stack à l’infrastructure IA privée : cinq domaines dans lesquels je livre des solutions concrètes.',
      en: 'From full-stack development to private AI infrastructure: five areas where I deliver working solutions.',
      de: 'Von Full-Stack-Entwicklung bis privater KI-Infrastruktur: fünf Bereiche, in denen ich konkrete Lösungen liefere.',
    },
    includes: { fr: 'Prestations incluses', en: 'What is included', de: 'Leistungsumfang' },
    stackLabel: { fr: 'Technologies', en: 'Technologies', de: 'Technologien' },
    cta: { fr: 'Discuter de cette prestation', en: 'Discuss this service', de: 'Diese Leistung besprechen' },
    items: [
      {
        title: { fr: 'Développement Web Full-Stack', en: 'Full-Stack Web Development', de: 'Full-Stack-Webentwicklung' },
        desc: {
          fr: 'Développement d’applications web modernes, responsives et évolutives avec React, TypeScript, Python et Django.',
          en: 'Development of modern, responsive and scalable web applications using React, TypeScript, Python and Django.',
          de: 'Entwicklung moderner, responsiver und skalierbarer Webanwendungen mit React, TypeScript, Python und Django.',
        },
        items: [
          { fr: 'Développement frontend', en: 'Frontend development', de: 'Frontend-Entwicklung' },
          { fr: 'Développement backend', en: 'Backend development', de: 'Backend-Entwicklung' },
          { fr: 'Développement d’API REST', en: 'REST API development', de: 'REST-API-Entwicklung' },
          { fr: 'Architecture de base de données', en: 'Database architecture', de: 'Datenbankarchitektur' },
          { fr: 'Authentification et autorisation', en: 'Authentication and authorization', de: 'Authentifizierung und Autorisierung' },
          { fr: 'Développement d’applications SaaS', en: 'SaaS application development', de: 'SaaS-Anwendungsentwicklung' },
          { fr: 'Intégration d’applications', en: 'Application integration', de: 'Anwendungsintegration' },
        ],
        tech: ['React', 'TypeScript', 'Python', 'Django', 'FastAPI', 'PostgreSQL'],
      },
      {
        title: { fr: 'Ingénierie IA & Intégration LLM', en: 'AI Engineering & LLM Integration', de: 'KI-Engineering & LLM-Integration' },
        desc: {
          fr: 'Intégration de l’intelligence artificielle dans les applications et les processus métier avec les technologies LLM actuelles.',
          en: 'Integration of artificial intelligence into applications and business workflows using modern LLM technologies.',
          de: 'Integration von künstlicher Intelligenz in Anwendungen und Geschäftsprozesse mit modernen LLM-Technologien.',
        },
        items: [
          { fr: 'Développement de chatbots IA', en: 'AI chatbot development', de: 'KI-Chatbot-Entwicklung' },
          { fr: 'Intégration d’API LLM', en: 'LLM API integration', de: 'LLM-API-Integration' },
          { fr: 'Architecture RAG', en: 'RAG architecture', de: 'RAG-Architektur' },
          { fr: 'Applications IA multimodales', en: 'Multimodal AI applications', de: 'Multimodale KI-Anwendungen' },
          { fr: 'Agents IA', en: 'AI agents', de: 'KI-Agenten' },
          { fr: 'Intégration de passerelle de modèles', en: 'Model gateway integration', de: 'Modell-Gateway-Integration' },
          { fr: 'Automatisation des flux IA', en: 'AI workflow automation', de: 'KI-Workflow-Automatisierung' },
        ],
        tech: ['Python', 'LLMs', 'RAG', 'LangChain', 'LangGraph', 'Ollama', 'Docker'],
      },
      {
        title: { fr: 'Infrastructure IA privée & locale', en: 'Private & Local AI Infrastructure', de: 'Private & lokale KI-Infrastruktur' },
        desc: {
          fr: 'Conception et déploiement de systèmes IA privés sur ordinateurs personnels, stations de travail et serveurs privés.',
          en: 'Design and deployment of private AI systems running on personal computers, workstations and private servers.',
          de: 'Design und Betrieb privater KI-Systeme auf PCs, Workstations und eigenen Servern.',
        },
        items: [
          { fr: 'Déploiement de LLM locaux', en: 'Local LLM deployment', de: 'Deployment lokaler LLMs' },
          { fr: 'Configuration Ollama', en: 'Ollama configuration', de: 'Ollama-Konfiguration' },
          { fr: 'Assistants IA privés', en: 'Private AI assistants', de: 'Private KI-Assistenten' },
          { fr: 'Systèmes RAG locaux', en: 'Local RAG systems', de: 'Lokale RAG-Systeme' },
          { fr: 'Infrastructure IA avec Docker', en: 'Docker-based AI infrastructure', de: 'Docker-basierte KI-Infrastruktur' },
          { fr: 'Optimisation de modèles', en: 'Model optimization', de: 'Modelloptimierung' },
          { fr: 'Architecture IA privée', en: 'Private AI architecture', de: 'Private KI-Architektur' },
        ],
        tech: ['Ollama', 'Qwen', 'Llama', 'Mistral', 'ChromaDB', 'Qdrant', 'Docker'],
        note: {
          fr: 'Les modèles locaux fonctionnent sans connexion. Les modèles cloud restent des services externes : je le précise toujours avant un projet.',
          en: 'Local models run without a connection. Cloud models remain external services — I always state this clearly before a project.',
          de: 'Lokale Modelle laufen ohne Verbindung. Cloud-Modelle bleiben externe Dienste — ich sage das vor jedem Projekt klar.',
        },
      },
      {
        title: { fr: 'DevOps & Infrastructure Cloud', en: 'DevOps & Cloud Infrastructure', de: 'DevOps & Cloud-Infrastruktur' },
        desc: {
          fr: 'Automatisation d’infrastructure, conteneurisation et déploiement d’applications modernes.',
          en: 'Infrastructure automation, containerization and deployment of modern applications.',
          de: 'Infrastrukturautomatisierung, Containerisierung und Deployment moderner Anwendungen.',
        },
        items: [
          { fr: 'Docker et Docker Compose', en: 'Docker and Docker Compose', de: 'Docker und Docker Compose' },
          { fr: 'Administration serveur Linux', en: 'Linux server administration', de: 'Linux-Server-Administration' },
          { fr: 'Terraform et OpenTofu', en: 'Terraform and OpenTofu', de: 'Terraform und OpenTofu' },
          { fr: 'Infrastructure cloud', en: 'Cloud infrastructure', de: 'Cloud-Infrastruktur' },
          { fr: 'Configuration de reverse proxy', en: 'Reverse proxy configuration', de: 'Reverse-Proxy-Konfiguration' },
          { fr: 'Automatisation CI/CD', en: 'CI/CD automation', de: 'CI/CD-Automatisierung' },
          { fr: 'Déploiement d’applications', en: 'Application deployment', de: 'Anwendungs-Deployment' },
        ],
        tech: ['Docker', 'Linux', 'Terraform', 'OpenTofu', 'AWS', 'OpenStack', 'Nginx'],
      },
      {
        title: { fr: 'Cybersécurité & Monitoring', en: 'Cybersecurity & Monitoring', de: 'Cybersicherheit & Monitoring' },
        desc: {
          fr: 'Surveillance technique de sécurité et analyse automatisée de sites web et d’infrastructures.',
          en: 'Technical security monitoring and automated analysis of websites and infrastructure.',
          de: 'Technische Sicherheitsüberwachung und automatisierte Analyse von Websites und Infrastruktur.',
        },
        items: [
          { fr: 'Analyse de sécurité de sites web', en: 'Website security analysis', de: 'Website-Sicherheitsanalyse' },
          { fr: 'Surveillance SSL et DNS', en: 'SSL and DNS monitoring', de: 'SSL- und DNS-Überwachung' },
          { fr: 'Vérification SPF, DKIM et DMARC', en: 'SPF, DKIM and DMARC verification', de: 'Prüfung von SPF, DKIM und DMARC' },
          { fr: 'Analyse des en-têtes de sécurité', en: 'Security headers analysis', de: 'Analyse der Security Header' },
          { fr: 'Scan de vulnérabilités', en: 'Vulnerability scanning', de: 'Schwachstellen-Scanning' },
          { fr: 'Rapports de sécurité', en: 'Security reporting', de: 'Sicherheitsberichte' },
        ],
        tech: ['OWASP ZAP', 'Nuclei', 'Python', 'Docker', 'Linux'],
      },
    ],
  },
  solutions: {
    title: {
      fr: 'Solutions IA privées adaptées à vos besoins',
      en: 'Private AI solutions adapted to your needs',
      de: 'Private KI-Lösungen für Ihre Anforderungen',
    },
    card1: {
      title: { fr: 'Assistant IA Local Personnel', en: 'Personal Local AI Assistant', de: 'Persönlicher lokaler KI-Assistent' },
      desc: {
        fr: 'Installez votre propre assistant IA directement sur votre ordinateur. Vos données restent sur votre matériel et sous votre contrôle.',
        en: 'Install your own AI assistant directly on your computer. Your data stays on your hardware and under your control.',
        de: 'Installieren Sie Ihren eigenen KI-Assistenten direkt auf Ihrem Computer. Ihre Daten bleiben auf Ihrer Hardware und unter Ihrer Kontrolle.',
      },
      features: [
        { fr: 'Modèles IA locaux', en: 'Local AI models', de: 'Lokale KI-Modelle' },
        { fr: 'Fonctionnement hors-ligne', en: 'Offline operation', de: 'Offline-Betrieb' },
        { fr: 'Analyse de documents', en: 'Document analysis', de: 'Dokumentenanalyse' },
        { fr: 'Base de connaissances', en: 'Personal knowledge base', de: 'Persönliche Wissensbasis' },
        { fr: 'Interaction vocale', en: 'Voice interaction', de: 'Sprachinteraktion' },
      ],
      hardware: { fr: 'Laptop · PC de bureau · Mini PC', en: 'Laptop · Desktop PC · Mini PC', de: 'Laptop · Desktop-PC · Mini-PC' },
    },
    card2: {
      title: { fr: 'IA Privée pour Entreprise', en: 'Business Private AI', de: 'Private Unternehmens-KI' },
      desc: {
        fr: 'Une IA interne pour votre entreprise, installée sur votre propre infrastructure. Vos documents ne quittent pas votre réseau.',
        en: 'An internal AI assistant deployed inside your company infrastructure. Your documents do not leave your network.',
        de: 'Ein interner KI-Assistent in Ihrer eigenen Unternehmensinfrastruktur. Ihre Dokumente verlassen das Netzwerk nicht.',
      },
      features: [
        { fr: 'Base de connaissances entreprise', en: 'Company knowledge base', de: 'Unternehmens-Wissensbasis' },
        { fr: 'Recherche documentaire interne', en: 'Internal document search', de: 'Interne Dokumentensuche' },
        { fr: 'Agents IA intégrés', en: 'Integrated AI agents', de: 'Integrierte KI-Agenten' },
        { fr: 'Automatisation des flux', en: 'Workflow automation', de: 'Workflow-Automatisierung' },
        { fr: 'Déploiement auto-hébergé', en: 'Self-hosted deployment', de: 'Selbst gehostetes Deployment' },
      ],
      hardware: { fr: 'Serveur local · Station enterprise · Cloud privé', en: 'Local server · Enterprise workstation · Private cloud', de: 'Lokaler Server · Enterprise-Workstation · Private Cloud' },
    },
    card3: {
      title: { fr: 'Infrastructure IA sur Mesure', en: 'Custom AI Infrastructure', de: 'Maßgeschneiderte KI-Infrastruktur' },
      desc: {
        fr: 'Conception d’une architecture IA sur mesure selon vos besoins techniques et organisationnels spécifiques.',
        en: 'Designing custom AI architectures adapted to your specific technical and organizational requirements.',
        de: 'Entwicklung maßgeschneiderter KI-Architekturen für Ihre spezifischen technischen und organisatorischen Anforderungen.',
      },
      features: [
        { fr: 'Sélection des modèles', en: 'Model selection & tuning', de: 'Modellauswahl & Feinabstimmung' },
        { fr: 'Optimisation matérielle', en: 'Hardware optimization', de: 'Hardware-Optimierung' },
        { fr: 'Développement d’agents', en: 'Agent development', de: 'Agenten-Entwicklung' },
        { fr: 'Intégration systèmes', en: 'Systems integration', de: 'Systemintegration' },
        { fr: 'Maintenance & support', en: 'Maintenance & support', de: 'Wartung & Support' },
      ],
      hardware: { fr: 'Architecture · Déploiement · Optimisation · Support', en: 'Architecture · Deployment · Optimization · Support', de: 'Architektur · Deployment · Optimierung · Support' },
    },
  },
  agents: {
    title: { fr: 'Agents IA autonomes locaux', en: 'Autonomous Local AI Agents', de: 'Autonome lokale KI-Agenten' },
    desc: {
      fr: 'Au-delà des chatbots, je crée des agents intelligents capables de comprendre des tâches complexes, d’utiliser des outils et d’automatiser des flux de travail, tout en gardant vos informations privées et sur votre matériel.',
      en: 'Beyond chatbots, I create intelligent agents capable of understanding complex tasks, using tools and automating workflows — all while keeping your information private and on your hardware.',
      de: 'Weit mehr als Chatbots: Ich entwickle intelligente Agenten, die komplexe Aufgaben verstehen, Werkzeuge nutzen und Arbeitsabläufe automatisieren – bei vollständiger Datenprivatsphäre auf Ihrer Hardware.',
    },
    agents: [
      { key: 'system', label: { fr: 'Agent Système', en: 'System Agent', de: 'System-Agent' }, icon: '⚙️' },
      { key: 'document', label: { fr: 'Agent Documents', en: 'Document Agent', de: 'Dokumenten-Agent' }, icon: '📄' },
      { key: 'security', label: { fr: 'Agent Sécurité', en: 'Security Agent', de: 'Sicherheits-Agent' }, icon: '🔒' },
      { key: 'automation', label: { fr: 'Agent Automation', en: 'Automation Agent', de: 'Automatisierungs-Agent' }, icon: '🤖' },
    ],
    tools: [
      { fr: 'Fichiers locaux', en: 'Local files', de: 'Lokale Dateien' },
      { fr: 'Bases de données', en: 'Databases', de: 'Datenbanken' },
      { fr: 'Applications', en: 'Applications', de: 'Anwendungen' },
      { fr: 'APIs réseau', en: 'Network APIs', de: 'Netzwerk-APIs' },
    ],
  },
  operator: {
    title: { fr: 'Votre opérateur IA personnel', en: 'Your Personal AI Computer Operator', de: 'Ihr persönlicher KI-Computer-Operator' },
    subtitle: { fr: 'Spécialiste IA Locale', en: 'Local AI Specialist', de: 'Lokaler KI-Spezialist' },
    desc: {
      fr: 'Un assistant IA capable de comprendre et d’interagir avec votre environnement numérique complet — système, fichiers, containers, et applications.',
      en: 'An AI assistant capable of understanding and interacting with your complete digital environment — system, files, containers, and applications.',
      de: 'Ein KI-Assistent, der Ihre gesamte digitale Umgebung versteht und mit ihr interagiert — System, Dateien, Container und Anwendungen.',
    },
    features: [
      { fr: 'Analyse système complète', en: 'Full system analysis', de: 'Vollständige Systemanalyse', icon: '🔍' },
      { fr: 'Surveillance des performances', en: 'Performance monitoring', de: 'Leistungsüberwachung', icon: '📊' },
      { fr: 'Organisation de fichiers', en: 'File organization', de: 'Dateiorganisation', icon: '📁' },
      { fr: 'Gestion d’applications', en: 'Application management', de: 'Anwendungsverwaltung', icon: '🖥️' },
      { fr: 'Gestion Docker', en: 'Docker management', de: 'Docker-Verwaltung', icon: '🐳' },
      { fr: 'Assistance développement', en: 'Development assistance', de: 'Entwicklungsunterstützung', icon: '💻' },
    ],
    userPrompt: {
      fr: 'Analyse les performances de mon ordinateur.',
      en: 'Analyze my computer performance.',
      de: 'Analysiere meine Computerleistung.',
    },
  },
  deployment: {
    title: { fr: 'Déployez votre IA où vous voulez', en: 'Deploy your AI anywhere', de: 'Installieren Sie Ihre KI überall' },
    laptop: {
      title: { fr: 'IA sur Laptop', en: 'Laptop AI', de: 'Laptop-KI' },
      desc: {
        fr: 'Assistant personnel. Petits modèles locaux. Confidentialité maximale.',
        en: 'Personal assistant. Small local models. Privacy focused.',
        de: 'Persönlicher Assistent. Kleine lokale Modelle. Datenschutzorientiert.',
      },
      specs: ['8-16 GB RAM', 'CPU inference', '< 7B params', 'Qwen2.5 / Phi-3'],
    },
    workstation: {
      title: { fr: 'IA sur Workstation', en: 'Workstation AI', de: 'Workstation-KI' },
      desc: {
        fr: 'Accélération GPU. Modèles IA avancés pour des tâches complexes.',
        en: 'GPU acceleration. Advanced AI models for complex tasks.',
        de: 'GPU-Beschleunigung. Erweiterte KI-Modelle für komplexe Aufgaben.',
      },
      specs: ['24-64 GB VRAM', 'RTX / A-series GPU', '13-34B params', 'Llama / Mistral'],
    },
    server: {
      title: { fr: 'Serveur IA Entreprise', en: 'Enterprise AI Server', de: 'Enterprise-KI-Server' },
      desc: {
        fr: 'Grands modèles. Environnement multi-utilisateurs. Déploiement business complet.',
        en: 'Large models. Multi-user environment. Full business deployment.',
        de: 'Große Modelle. Mehrbenutzerumgebung. Vollständiger Business-Einsatz.',
      },
      specs: ['128+ GB VRAM', 'Multi-GPU cluster', '70B+ params', 'DeepSeek / Qwen-72B'],
    },
  },
  rag: {
    title: {
      fr: 'Transformez vos documents en connaissance IA',
      en: 'Transform your documents into AI knowledge',
      de: 'Verwandeln Sie Ihre Dokumente in KI-Wissen',
    },
    desc: {
      fr: 'Un système RAG privé qui indexe votre documentation interne et répond à vos questions en citant des sources précises — exécuté sur votre infrastructure.',
      en: 'A private RAG system that indexes your internal documentation and answers questions with precise source citations — running on your own infrastructure.',
      de: 'Ein privates RAG-System, das Ihre interne Dokumentation indexiert und Fragen mit präzisen Quellenangaben beantwortet — auf Ihrer eigenen Infrastruktur.',
    },
    features: [
      { fr: 'Recherche sémantique', en: 'Semantic search', de: 'Semantische Suche' },
      { fr: 'Compréhension documentaire', en: 'Document understanding', de: 'Dokumentenverständnis' },
      { fr: 'Assistant knowledge interne', en: 'Internal knowledge assistant', de: 'Interner Wissensassistent' },
      { fr: 'Citations de sources', en: 'Source references', de: 'Quellenangaben' },
    ],
    sources: ['PDF', 'Word', 'Markdown', 'Emails', 'Database', 'Web'],
  },
  techStack: {
    title: { fr: 'Stack Technologique', en: 'Technology Stack', de: 'Technologie-Stack' },
    subtitle: {
      fr: 'Des technologies utilisées dans mes projets réels, classées par domaine.',
      en: 'Technologies used in my actual projects, grouped by domain.',
      de: 'Technologien aus meinen tatsächlichen Projekten, nach Bereichen gruppiert.',
    },
    categories: {
      ai: { fr: 'IA & Machine Learning', en: 'AI & Machine Learning', de: 'KI & Machine Learning' },
      frontend: { fr: 'Frontend', en: 'Frontend', de: 'Frontend' },
      backend: { fr: 'Backend', en: 'Backend', de: 'Backend' },
      databases: { fr: 'Bases de données', en: 'Databases', de: 'Datenbanken' },
      infra: { fr: 'DevOps & Infrastructure', en: 'DevOps & Infrastructure', de: 'DevOps & Infrastruktur' },
      security: { fr: 'Cybersécurité', en: 'Cybersecurity', de: 'Cybersicherheit' },
    },
  },
  projects: {
    title: { fr: 'Projets', en: 'Projects', de: 'Projekte' },
    subtitle: {
      fr: 'Applications livrées, produits en développement et travaux de recherche. Chaque fiche indique le statut réel et les liens vérifiés.',
      en: 'Shipped applications, products in development and research work. Each entry states its real status and only verified links.',
      de: 'Ausgelieferte Anwendungen, Produkte in Entwicklung und Forschungsarbeiten. Jeder Eintrag nennt den tatsächlichen Status und nur geprüfte Links.',
    },
    counter: { fr: 'projets', en: 'projects', de: 'Projekte' },
    filterAll: { fr: 'Tous', en: 'All', de: 'Alle' },
    viewProject: { fr: 'Détails du projet', en: 'Project details', de: 'Projektdetails' },
    viewCode: { fr: 'Code source', en: 'Source code', de: 'Quellcode' },
    liveApp: { fr: 'Application en ligne', en: 'Live application', de: 'Live-Anwendung' },
    close: { fr: 'Fermer', en: 'Close', de: 'Schließen' },
    labels: {
      overview: { fr: 'Aperçu du projet', en: 'Project overview', de: 'Projektüberblick' },
      problem: { fr: 'Problème traité', en: 'Problem addressed', de: 'Behandeltes Problem' },
      features: { fr: 'Fonctionnalités principales', en: 'Main features', de: 'Hauptfunktionen' },
      architecture: { fr: 'Architecture technique', en: 'Technical architecture', de: 'Technische Architektur' },
      stack: { fr: 'Technologies utilisées', en: 'Technologies used', de: 'Verwendete Technologien' },
      contribution: { fr: 'Ma contribution', en: 'My contribution', de: 'Mein Beitrag' },
      status: { fr: 'Statut du projet', en: 'Project status', de: 'Projektstatus' },
      links: { fr: 'Liens', en: 'Links', de: 'Links' },
      note: { fr: 'À noter', en: 'Please note', de: 'Hinweis' },
    },
    statusLabels: {
      live: { fr: 'En production', en: 'Production', de: 'Produktiv' },
      development: { fr: 'En développement', en: 'In Development', de: 'In Entwicklung' },
      prototype: { fr: 'Prototype', en: 'Prototype', de: 'Prototyp' },
      research: { fr: 'Recherche', en: 'Research', de: 'Forschung' },
      academic: { fr: 'Projet académique', en: 'Academic Project', de: 'Akademisches Projekt' },
      'open-source': { fr: 'Open Source', en: 'Open Source', de: 'Open Source' },
    },
  },
  freelancer: {
    badge: { fr: 'Disponible', en: 'Available', de: 'Verfügbar' },
    title: { fr: 'Disponible pour des missions freelance', en: 'Available for Freelance Projects', de: 'Verfügbar für Freelance-Projekte' },
    desc: {
      fr: 'Je suis disponible pour des missions de développement full-stack, d’intelligence artificielle, d’infrastructure IA locale, d’automatisation et de DevOps.',
      en: 'I am available for freelance missions involving Full-Stack Development, Artificial Intelligence, Local AI Infrastructure, Automation and DevOps.',
      de: 'Ich bin verfügbar für Freelance-Projekte in den Bereichen Full-Stack-Entwicklung, Künstliche Intelligenz, lokale KI-Infrastruktur, Automatisierung und DevOps.',
    },
    desc2: {
      fr: 'Mon objectif : livrer des solutions numériques fiables, sécurisées et évolutives, adaptées aux besoins de chaque client.',
      en: 'My goal is to deliver reliable, secure and scalable digital solutions adapted to each client’s needs.',
      de: 'Mein Ziel: zuverlässige, sichere und skalierbare digitale Lösungen, passend zu den Anforderungen jedes Kunden.',
    },
    cta: { fr: 'Me recruter sur Freelancer.com', en: 'Hire Me on Freelancer.com', de: 'Auf Freelancer.com beauftragen' },
    profile: { fr: 'Profil Freelancer', en: 'Freelancer profile', de: 'Freelancer-Profil' },
    bullets: [
      { fr: 'Développement full-stack (React, Python, Django, FastAPI)', en: 'Full-stack development (React, Python, Django, FastAPI)', de: 'Full-Stack-Entwicklung (React, Python, Django, FastAPI)' },
      { fr: 'Intégration IA et LLM dans des applications existantes', en: 'AI and LLM integration into existing applications', de: 'KI- und LLM-Integration in bestehende Anwendungen' },
      { fr: 'Infrastructure IA locale et privée', en: 'Local and private AI infrastructure', de: 'Lokale und private KI-Infrastruktur' },
      { fr: 'Docker, déploiement et automatisation', en: 'Docker, deployment and automation', de: 'Docker, Deployment und Automatisierung' },
    ],
  },
  about: {
    title: { fr: 'À propos — Ingénieur IA & Développeur Full-Stack', en: 'About Me — AI Engineer & Full-Stack Developer', de: 'Über mich — KI-Ingenieur & Full-Stack-Entwickler' },
    paragraphs: [
      {
        fr: 'Je suis étudiant en Master d’informatique appliquée à la Hochschule Worms, en Allemagne, avec une expérience pratique en développement logiciel, intelligence artificielle, applications web et infrastructure IT.',
        en: 'I am an Applied Computer Science Master’s student at Hochschule Worms, Germany, with practical experience in software development, artificial intelligence, web applications and IT infrastructure.',
        de: 'Ich studiere Angewandte Informatik (Master) an der Hochschule Worms und bringe praktische Erfahrung in Softwareentwicklung, künstlicher Intelligenz, Webanwendungen und IT-Infrastruktur mit.',
      },
      {
        fr: 'Mon travail porte sur la conception de solutions logicielles intelligentes, l’intégration de modèles IA dans les applications et la construction d’infrastructures techniques fiables.',
        en: 'My work focuses on designing and developing intelligent software solutions, integrating AI models into applications and building reliable technical infrastructures.',
        de: 'Meine Arbeit konzentriert sich auf die Entwicklung intelligenter Softwarelösungen, die Integration von KI-Modellen in Anwendungen und den Aufbau zuverlässiger technischer Infrastrukturen.',
      },
      {
        fr: 'J’aime résoudre des problèmes techniques complexes et transformer des idées en produits numériques concrets.',
        en: 'I enjoy solving complex technical problems and transforming ideas into practical digital products.',
        de: 'Ich löse gern komplexe technische Probleme und verwandle Ideen in praktische digitale Produkte.',
      },
    ],
    focusTitle: { fr: 'Domaines d’intérêt', en: 'Areas of interest', de: 'Interessensgebiete' },
    focus: [
      { fr: 'Intelligence Artificielle', en: 'Artificial Intelligence', de: 'Künstliche Intelligenz' },
      { fr: 'Développement logiciel full-stack', en: 'Full-Stack Software Development', de: 'Full-Stack-Softwareentwicklung' },
      { fr: 'IA privée et locale', en: 'Private and Local AI', de: 'Private und lokale KI' },
      { fr: 'Agents autonomes', en: 'Autonomous Agents', de: 'Autonome Agenten' },
      { fr: 'Infrastructure cloud', en: 'Cloud Infrastructure', de: 'Cloud-Infrastruktur' },
      { fr: 'Cybersécurité', en: 'Cybersecurity', de: 'Cybersicherheit' },
      { fr: 'Automatisation logicielle', en: 'Software Automation', de: 'Software-Automatisierung' },
    ],
    languagesTitle: { fr: 'Langues', en: 'Languages', de: 'Sprachen' },
    languages: [
      { name: { fr: 'Français', en: 'French', de: 'Französisch' }, level: { fr: 'Langue maternelle', en: 'Native', de: 'Muttersprache' } },
      { name: { fr: 'Allemand', en: 'German', de: 'Deutsch' }, level: { fr: 'C1', en: 'C1', de: 'C1' } },
      { name: { fr: 'Anglais', en: 'English', de: 'Englisch' }, level: { fr: 'Notions de base', en: 'Basic', de: 'Grundkenntnisse' } },
    ],
    educationTitle: { fr: 'Formation', en: 'Education', de: 'Ausbildung' },
    education: [
      { period: '2025 —', title: { fr: 'Master Informatique appliquée', en: 'M.Sc. Applied Computer Science', de: 'M.Sc. Angewandte Informatik' }, place: 'Hochschule Worms, Germany' },
      { period: '2017 — 2020', title: { fr: 'Licence en informatique', en: 'B.Sc. Computer Science', de: 'B.Sc. Informatik' }, place: 'Université Aube Nouvelle, Burkina Faso' },
    ],
    experienceTitle: { fr: 'Expérience', en: 'Experience', de: 'Berufserfahrung' },
    experience: [
      { period: '2022 — 2023', title: { fr: 'Ingénieur IT', en: 'IT Engineer', de: 'IT-Ingenieur' }, place: 'DBS — Digital Business Services, Ouagadougou' },
      { period: '2020 — 2021', title: { fr: 'Développeur logiciel', en: 'Software Developer', de: 'Softwareentwickler' }, place: 'Timini SARL, Ouagadougou' },
    ],
    location: { fr: 'Basé à Worms, en Allemagne', en: 'Based in Worms, Germany', de: 'Ansässig in Worms, Deutschland' },
    cta: { fr: 'Télécharger mon CV', en: 'Get my CV', de: 'Lebenslauf anfordern' },
  },
  whyLocal: {
    title: { fr: 'Pourquoi l’IA Locale ?', en: 'Why Local AI?', de: 'Warum lokale KI?' },
    subtitle: {
      fr: 'Comprenez les avantages fondamentaux de l’IA locale par rapport aux solutions cloud.',
      en: 'Understand the fundamental advantages of local AI over cloud solutions.',
      de: 'Verstehen Sie die grundlegenden Vorteile lokaler KI gegenüber Cloud-Lösungen.',
    },
    cloudTitle: { fr: 'IA Cloud', en: 'Cloud AI', de: 'Cloud-KI' },
    localTitle: { fr: 'IA Locale', en: 'Local AI', de: 'Lokale KI' },
    comparison: [
      {
        aspect: { fr: 'Données', en: 'Data', de: 'Daten' },
        cloud: { fr: 'Envoyées vers des serveurs externes', en: 'Sent to external servers', de: 'An externe Server gesendet' },
        local: { fr: 'Restent sur votre matériel', en: 'Stay on your hardware', de: 'Bleiben auf Ihrer Hardware' },
      },
      {
        aspect: { fr: 'Confidentialité', en: 'Privacy', de: 'Datenschutz' },
        cloud: { fr: 'Dépend des CGU du fournisseur', en: 'Depends on provider ToS', de: 'Abhängig von AGB des Anbieters' },
        local: { fr: 'Contrôle total garanti', en: 'Total control guaranteed', de: 'Volle Kontrolle garantiert' },
      },
      {
        aspect: { fr: 'Conformité', en: 'Compliance', de: 'Compliance' },
        cloud: { fr: 'Nécessite un accord de traitement', en: 'Requires a processing agreement', de: 'Erfordert einen Auftragsverarbeitungsvertrag' },
        local: { fr: 'Contrôlable de bout en bout', en: 'Verifiable end to end', de: 'Ende-zu-Ende nachvollziehbar' },
      },
      {
        aspect: { fr: 'Personnalisation', en: 'Customization', de: 'Anpassung' },
        cloud: { fr: 'Limitée aux options du fournisseur', en: 'Limited to provider options', de: 'Begrenzt auf Anbieteroptionen' },
        local: { fr: 'Entièrement personnalisable', en: 'Fully customizable', de: 'Vollständig anpassbar' },
      },
      {
        aspect: { fr: 'Connexion internet', en: 'Internet', de: 'Internet' },
        cloud: { fr: 'Requise en permanence', en: 'Always required', de: 'Ständig erforderlich' },
        local: { fr: 'Fonctionne hors-ligne', en: 'Works offline', de: 'Funktioniert offline' },
      },
      {
        aspect: { fr: 'Coût à long terme', en: 'Long-term cost', de: 'Langfristige Kosten' },
        cloud: { fr: 'Abonnements croissants', en: 'Growing subscriptions', de: 'Wachsende Abonnements' },
        local: { fr: 'Investissement unique', en: 'One-time investment', de: 'Einmalige Investition' },
      },
    ],
  },
  blog: {
    title: { fr: 'Notes techniques', en: 'Technical Notes', de: 'Technische Notizen' },
    subtitle: {
      fr: 'Sujets sur lesquels je documente ma pratique de l’IA locale, des agents autonomes et de l’infrastructure privée.',
      en: 'Topics I am documenting from my work on local AI, autonomous agents and private infrastructure.',
      de: 'Themen, zu denen ich meine Arbeit an lokaler KI, autonomen Agenten und privater Infrastruktur dokumentiere.',
    },
    inPreparation: { fr: 'En préparation', en: 'In preparation', de: 'In Vorbereitung' },
    disclaimer: {
      fr: 'Ces notes sont en cours de rédaction. Aucune n’est encore publiée : pas de date de publication inventée, pas de lien factice.',
      en: 'These notes are being written. None is published yet: no invented publication dates, no placeholder links.',
      de: 'Diese Notizen entstehen gerade. Keine ist bisher veröffentlicht: keine erfundenen Erscheinungsdaten, keine Platzhalter-Links.',
    },
    topics: [
      {
        title: { fr: 'Construire des agents IA locaux avec LangGraph', en: 'Building Local AI Agents with LangGraph', de: 'Lokale KI-Agenten mit LangGraph aufbauen' },
        desc: {
          fr: 'Comment structurer un agent qui appelle des outils, garde le contexte et reste exécutable sur une machine locale avec Ollama.',
          en: 'How to structure an agent that calls tools, keeps context and still runs on a local machine with Ollama.',
          de: 'Wie ein Agent aufgebaut wird, der Werkzeuge aufruft, Kontext hält und mit Ollama lokal lauffähig bleibt.',
        },
        tag: 'LangGraph · Ollama',
      },
      {
        title: { fr: 'Faire tourner des LLMs sur son PC personnel', en: 'Running LLMs on Your Personal Computer', de: 'LLMs auf dem eigenen PC betreiben' },
        desc: {
          fr: 'Choix du modèle selon la mémoire disponible, quantification et compromis réels entre taille, vitesse et qualité.',
          en: 'Choosing a model for the available memory, quantization and the real trade-off between size, speed and quality.',
          de: 'Modellwahl nach verfügbarem Speicher, Quantisierung und der reale Kompromiss zwischen Größe, Geschwindigkeit und Qualität.',
        },
        tag: 'Ollama · Hardware',
      },
      {
        title: { fr: 'Architecture RAG privée pour entreprises', en: 'Private RAG Architecture for Enterprises', de: 'Private RAG-Architektur für Unternehmen' },
        desc: {
          fr: 'Indexation de documentation interne, découpage des documents et citations de sources vérifiables.',
          en: 'Indexing internal documentation, chunking strategy and verifiable source citations.',
          de: 'Indexierung interner Dokumentation, Chunking-Strategie und nachprüfbare Quellenangaben.',
        },
        tag: 'RAG · ChromaDB',
      },
      {
        title: { fr: 'Infrastructure IA privée avec Docker', en: 'Private AI Infrastructure with Docker', de: 'Private KI-Infrastruktur mit Docker' },
        desc: {
          fr: 'Isolation réseau, reverse proxy, volumes et supervision pour un serveur IA auto-hébergé.',
          en: 'Network isolation, reverse proxy, volumes and monitoring for a self-hosted AI server.',
          de: 'Netzwerkisolation, Reverse Proxy, Volumes und Monitoring für einen selbst gehosteten KI-Server.',
        },
        tag: 'Docker · Infrastructure',
      },
      {
        title: { fr: 'Automatisation cybersécurité avec l’IA', en: 'Cybersecurity Automation with AI', de: 'Cybersicherheits-Automatisierung mit KI' },
        desc: {
          fr: 'Regrouper des logs, produire des synthèses d’incidents et garder la décision humaine dans la boucle.',
          en: 'Grouping logs, producing incident summaries and keeping the human decision in the loop.',
          de: 'Logs gruppieren, Incident-Zusammenfassungen erstellen und die menschliche Entscheidung im Prozess behalten.',
        },
        tag: 'Security · Agents',
      },
    ],
  },
  contact: {
    title: {
      fr: 'Parlons de votre projet',
      en: 'Let’s discuss your project',
      de: 'Sprechen wir über Ihr Projekt',
    },
    subtitle: {
      fr: 'Ingénieur IA & développeur full-stack — Worms, Allemagne',
      en: 'AI Engineer & Full-Stack Developer — Worms, Germany',
      de: 'KI-Ingenieur & Full-Stack-Entwickler — Worms, Deutschland',
    },
    desc: {
      fr: 'Une application à construire, une IA à intégrer ou une infrastructure à mettre en place ? Décrivez votre besoin et je vous réponds avec une proposition concrète.',
      en: 'An application to build, AI to integrate or infrastructure to set up? Describe your need and I will reply with a concrete proposal.',
      de: 'Eine Anwendung zu bauen, KI zu integrieren oder Infrastruktur aufzusetzen? Beschreiben Sie Ihr Vorhaben und ich antworte mit einem konkreten Vorschlag.',
    },
    cta: { fr: 'Envoyer le message', en: 'Send Message', de: 'Nachricht senden' },
    sending: { fr: 'Ouverture de votre client e-mail…', en: 'Opening your email client…', de: 'E-Mail-Programm wird geöffnet…' },
    successTitle: { fr: 'Votre message est prêt', en: 'Your message is ready', de: 'Ihre Nachricht ist vorbereitet' },
    success: {
      fr: 'Votre client e-mail devrait s’ouvrir avec le message prérempli. S’il ne s’ouvre pas, copiez l’adresse ci-dessous.',
      en: 'Your email client should open with the message pre-filled. If it does not open, copy the address below.',
      de: 'Ihr E-Mail-Programm sollte sich mit der vorausgefüllten Nachricht öffnen. Falls nicht, kopieren Sie die Adresse unten.',
    },
    copy: { fr: 'Copier l’adresse', en: 'Copy address', de: 'Adresse kopieren' },
    copied: { fr: 'Copié', en: 'Copied', de: 'Kopiert' },
    again: { fr: 'Écrire un autre message', en: 'Write another message', de: 'Weitere Nachricht schreiben' },
    mailSubjectPrefix: { fr: 'Projet', en: 'Project', de: 'Projekt' },
    namePlaceholder: { fr: 'Votre nom', en: 'Your name', de: 'Ihr Name' },
    emailPlaceholder: { fr: 'Votre email', en: 'Your email', de: 'Ihre E-Mail' },
    subjectPlaceholder: { fr: 'Sujet de votre projet', en: 'Project subject', de: 'Betreff Ihres Projekts' },
    messagePlaceholder: {
      fr: 'Décrivez votre projet, vos besoins spécifiques, votre matériel disponible…',
      en: 'Describe your project, specific needs, available hardware…',
      de: 'Beschreiben Sie Ihr Projekt, spezifische Anforderungen, verfügbare Hardware…',
    },
    errors: {
      name: { fr: 'Indiquez votre nom (2 caractères minimum).', en: 'Please enter your name (at least 2 characters).', de: 'Bitte geben Sie Ihren Namen an (mindestens 2 Zeichen).' },
      email: { fr: 'Indiquez une adresse email valide.', en: 'Please enter a valid email address.', de: 'Bitte geben Sie eine gültige E-Mail-Adresse ein.' },
      subject: { fr: 'Indiquez un sujet (3 caractères minimum).', en: 'Please enter a subject (at least 3 characters).', de: 'Bitte geben Sie einen Betreff an (mindestens 3 Zeichen).' },
      message: { fr: 'Décrivez votre projet (20 caractères minimum).', en: 'Please describe your project (at least 20 characters).', de: 'Bitte beschreiben Sie Ihr Projekt (mindestens 20 Zeichen).' },
    },
    availability: {
      fr: 'Disponible pour missions freelance et consulting',
      en: 'Available for freelance missions and consulting',
      de: 'Verfügbar für Freelance-Aufträge und Beratung',
    },
    response: {
      fr: 'Réponse sous 24 heures',
      en: 'Response within 24 hours',
      de: 'Antwort innerhalb von 24 Stunden',
    },
    privacy: {
      fr: 'Vos données ne sont utilisées que pour répondre à votre demande',
      en: 'Your data is only used to answer your request',
      de: 'Ihre Daten werden nur zur Beantwortung Ihrer Anfrage verwendet',
    },
    freelancerHint: { fr: 'Vous préférez Freelancer.com ?', en: 'Prefer Freelancer.com?', de: 'Lieber über Freelancer.com?' },
    freelancerCta: { fr: 'Voir mon profil', en: 'View my profile', de: 'Profil ansehen' },
    direct: { fr: 'Écrire directement', en: 'Write directly', de: 'Direkt schreiben' },
  },
  footer: {
    tagline: { fr: 'Ingénieur IA & Développeur Full-Stack', en: 'AI Engineer & Full-Stack Developer', de: 'KI-Ingenieur & Full-Stack-Entwickler' },
    specialties: [
      { fr: 'IA Locale', en: 'Local AI', de: 'Lokale KI' },
      { fr: 'LLM Privé', en: 'Private LLM', de: 'Privates LLM' },
      { fr: 'Agents Autonomes', en: 'Autonomous Agents', de: 'Autonome Agenten' },
      { fr: 'Cybersécurité', en: 'Cybersecurity', de: 'Cybersicherheit' },
      { fr: 'Infrastructure Cloud', en: 'Cloud Infrastructure', de: 'Cloud-Infrastruktur' },
    ],
    groups: {
      navigation: { fr: 'Navigation', en: 'Navigation', de: 'Navigation' },
      services: { fr: 'Prestations', en: 'Services', de: 'Leistungen' },
      contact: { fr: 'Contact', en: 'Contact', de: 'Kontakt' },
    },
    rights: {
      fr: 'Tous droits réservés.',
      en: 'All rights reserved.',
      de: 'Alle Rechte vorbehalten.',
    },
    madeWith: {
      fr: 'Ingénierie logicielle, IA et infrastructure',
      en: 'Software engineering, AI and infrastructure',
      de: 'Softwareentwicklung, KI und Infrastruktur',
    },
    legal: { fr: 'Mentions légales', en: 'Legal notice', de: 'Impressum' },
  },
};
