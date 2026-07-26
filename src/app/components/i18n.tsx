import React, { createContext, useContext, useState } from 'react';

export type Lang = 'fr' | 'en' | 'de';

interface LangContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

const LangContext = createContext<LangContextType>({ lang: 'en', setLang: () => {} });

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  return <LangContext.Provider value={{ lang, setLang }}>{children}</LangContext.Provider>;
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
    projects: { fr: 'Projets', en: 'Projects', de: 'Projekte' },
    technologies: { fr: 'Technologies', en: 'Technologies', de: 'Technologien' },
    about: { fr: 'À propos', en: 'About', de: 'Über mich' },
    contact: { fr: 'Contact', en: 'Contact', de: 'Kontakt' },
  },
  hero: {
    badge: { fr: 'Ingénieur IA · Infrastructure Privée', en: 'AI Engineer · Private Infrastructure', de: 'KI-Ingenieur · Private Infrastruktur' },
    title: {
      fr: 'Je construis des systèmes d\'intelligence artificielle privés et locaux.',
      en: 'I build private and local artificial intelligence systems.',
      de: 'Ich entwickle private und lokale KI-Systeme.',
    },
    subtitle: {
      fr: 'Déploiement d\'assistants IA, agents autonomes et solutions d\'automatisation fonctionnant directement sur votre matériel.',
      en: 'Deploying AI assistants, autonomous agents and automation solutions running directly on your hardware.',
      de: 'Entwicklung und Bereitstellung von KI-Assistenten, autonomen Agenten und Automatisierungslösungen, die direkt auf Ihrer Hardware laufen.',
    },
    tagline: {
      fr: 'Votre propre IA. Sur votre ordinateur. Dans votre entreprise.',
      en: 'Your own AI. Running on your computer. Inside your business.',
      de: 'Ihre eigene KI. Auf Ihrem Computer. In Ihrem Unternehmen.',
    },
    cta1: { fr: 'Découvrir mes solutions IA', en: 'Explore AI Solutions', de: 'KI-Lösungen entdecken' },
    cta2: { fr: 'Créer votre IA privée', en: 'Build Your Private AI', de: 'Ihre private KI erstellen' },
    scrollHint: { fr: 'Défiler pour découvrir', en: 'Scroll to discover', de: 'Scrollen zum Entdecken' },
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
        fr: 'Installez votre propre assistant IA directement sur votre ordinateur. Vos données restent privées, offline et entièrement sous votre contrôle.',
        en: 'Install your own AI assistant directly on your computer. Your data stays private, offline and fully under your control.',
        de: 'Installieren Sie Ihren eigenen KI-Assistenten direkt auf Ihrem Computer. Ihre Daten bleiben privat, offline und vollständig unter Ihrer Kontrolle.',
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
        fr: 'Une IA interne pour votre entreprise, installée sur votre propre infrastructure. Conformité RGPD garantie.',
        en: 'An internal AI assistant deployed inside your company infrastructure. Full GDPR compliance guaranteed.',
        de: 'Ein interner KI-Assistent, betrieben in Ihrer eigenen Unternehmensinfrastruktur. Volle DSGVO-Konformität garantiert.',
      },
      features: [
        { fr: 'Base de connaissances entreprise', en: 'Company knowledge base', de: 'Unternehmens-Wissensbasis' },
        { fr: 'Recherche documentaire interne', en: 'Internal document search', de: 'Interne Dokumentensuche' },
        { fr: 'Agents IA intégrés', en: 'Integrated AI agents', de: 'Integrierte KI-Agenten' },
        { fr: 'Automatisation des flux', en: 'Workflow automation', de: 'Workflow-Automatisierung' },
        { fr: 'Conformité RGPD', en: 'GDPR compliance', de: 'DSGVO-Konformität' },
      ],
      hardware: { fr: 'Serveur local · Station enterprise · Cloud privé', en: 'Local server · Enterprise workstation · Private cloud', de: 'Lokaler Server · Enterprise-Workstation · Private Cloud' },
    },
    card3: {
      title: { fr: 'Infrastructure IA sur Mesure', en: 'Custom AI Infrastructure', de: 'Maßgeschneiderte KI-Infrastruktur' },
      desc: {
        fr: 'Conception d\'une architecture IA sur mesure selon vos besoins techniques et organisationnels spécifiques.',
        en: 'Designing custom AI architectures adapted to your specific technical and organizational requirements.',
        de: 'Entwicklung maßgeschneiderter KI-Architekturen für Ihre spezifischen technischen und organisatorischen Anforderungen.',
      },
      features: [
        { fr: 'Sélection des modèles', en: 'Model selection & tuning', de: 'Modellauswahl & Feinabstimmung' },
        { fr: 'Optimisation matérielle', en: 'Hardware optimization', de: 'Hardware-Optimierung' },
        { fr: 'Développement d\'agents', en: 'Agent development', de: 'Agenten-Entwicklung' },
        { fr: 'Intégration systèmes', en: 'Systems integration', de: 'Systemintegration' },
        { fr: 'Maintenance & support', en: 'Maintenance & support', de: 'Wartung & Support' },
      ],
      hardware: { fr: 'Architecture · Déploiement · Optimisation · Support', en: 'Architecture · Deployment · Optimization · Support', de: 'Architektur · Deployment · Optimierung · Support' },
    },
  },
  agents: {
    title: { fr: 'Agents IA autonomes locaux', en: 'Autonomous Local AI Agents', de: 'Autonome lokale KI-Agenten' },
    desc: {
      fr: 'Au-delà des chatbots, je crée des agents intelligents capables de comprendre des tâches complexes, d\'utiliser des outils et d\'automatiser des flux de travail, tout en gardant toutes vos informations privées et sur votre matériel.',
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
      fr: 'Un assistant IA capable de comprendre et d\'interagir avec votre environnement numérique complet — système, fichiers, containers, et applications.',
      en: 'An AI assistant capable of understanding and interacting with your complete digital environment — system, files, containers, and applications.',
      de: 'Ein KI-Assistent, der Ihre gesamte digitale Umgebung versteht und mit ihr interagiert — System, Dateien, Container und Anwendungen.',
    },
    features: [
      { fr: 'Analyse système complète', en: 'Full system analysis', de: 'Vollständige Systemanalyse', icon: '🔍' },
      { fr: 'Surveillance des performances', en: 'Performance monitoring', de: 'Leistungsüberwachung', icon: '📊' },
      { fr: 'Organisation de fichiers', en: 'File organization', de: 'Dateiorganisation', icon: '📁' },
      { fr: 'Gestion d\'applications', en: 'Application management', de: 'Anwendungsverwaltung', icon: '🖥️' },
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
        fr: 'Assistant personnel. Petits modèles locaux. Confidentialité totale.',
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
      fr: 'Un système RAG privé qui indexe votre documentation interne et répond à vos questions en citant des sources précises — 100% local, 0% cloud.',
      en: 'A private RAG system that indexes your internal documentation and answers questions with precise source citations — 100% local, 0% cloud.',
      de: 'Ein privates RAG-System, das Ihre interne Dokumentation indexiert und Fragen mit präzisen Quellenangaben beantwortet — 100% lokal, 0% Cloud.',
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
      fr: 'Les technologies que j\'utilise pour construire des systèmes IA privés et performants.',
      en: 'The technologies I use to build private and high-performance AI systems.',
      de: 'Die Technologien, die ich verwende, um private und leistungsstarke KI-Systeme zu entwickeln.',
    },
    categories: {
      models: { fr: 'Modèles IA', en: 'AI Models', de: 'KI-Modelle' },
      frameworks: { fr: 'Frameworks IA', en: 'AI Frameworks', de: 'KI-Frameworks' },
      backend: { fr: 'Backend', en: 'Backend', de: 'Backend' },
      frontend: { fr: 'Frontend', en: 'Frontend', de: 'Frontend' },
      infra: { fr: 'Infrastructure', en: 'Infrastructure', de: 'Infrastruktur' },
    },
  },
  projects: {
    title: { fr: 'Projets', en: 'Projects', de: 'Projekte' },
    subtitle: {
      fr: 'Systèmes IA privés construits et déployés pour des individus et des entreprises.',
      en: 'Private AI systems built and deployed for individuals and companies.',
      de: 'Private KI-Systeme, die für Einzelpersonen und Unternehmen entwickelt und implementiert wurden.',
    },
    viewProject: { fr: 'Voir le projet', en: 'View Project', de: 'Projekt ansehen' },
    viewCode: { fr: 'Code source', en: 'Source Code', de: 'Quellcode' },
    p1: {
      title: { fr: 'Local AI Operator', en: 'Local AI Operator', de: 'Lokaler KI-Operator' },
      desc: {
        fr: 'Agent IA autonome contrôlant et analysant des environnements informatiques locaux. Surveillance système, gestion Docker, assistance développement.',
        en: 'An autonomous AI agent controlling and analyzing local computer environments. System monitoring, Docker management, development assistance.',
        de: 'Ein autonomer KI-Agent zur Steuerung und Analyse lokaler Computerumgebungen. Systemüberwachung, Docker-Verwaltung, Entwicklungsunterstützung.',
      },
      tags: ['Ollama', 'Qwen2.5', 'LangGraph', 'Python', 'Docker'],
      status: { fr: 'En production', en: 'Production', de: 'Produktiv' },
    },
    p2: {
      title: { fr: 'Plateforme IA Privée Enterprise', en: 'Private AI Enterprise Platform', de: 'Private Enterprise-KI-Plattform' },
      desc: {
        fr: 'Solution IA auto-hébergée permettant aux organisations d\'utiliser l\'IA en toute sécurité avec leurs propres données. Interface multi-utilisateurs, RGPD.',
        en: 'A self-hosted AI solution allowing organizations to use AI securely with their own data. Multi-user interface, GDPR compliant.',
        de: 'Eine selbst-gehostete KI-Lösung für sichere KI-Nutzung mit eigenen Daten. Mehrbenutzer-Interface, DSGVO-konform.',
      },
      tags: ['LangChain', 'RAG', 'FastAPI', 'Docker', 'Ollama'],
      status: { fr: 'En développement', en: 'In Development', de: 'In Entwicklung' },
    },
    p3: {
      title: { fr: 'Assistant IA Cybersécurité', en: 'AI Cybersecurity Assistant', de: 'KI-Cybersicherheits-Assistent' },
      desc: {
        fr: 'Assistant IA pour la surveillance de sécurité, l\'analyse automatique des logs et la génération de rapports d\'incidents.',
        en: 'AI assistant for security monitoring, automated log analysis and incident report generation.',
        de: 'KI-Assistent für Sicherheitsüberwachung, automatische Log-Analyse und Vorfallsberichterstattung.',
      },
      tags: ['Python', 'LangGraph', 'Mistral', 'Linux', 'SIEM'],
      status: { fr: 'Beta', en: 'Beta', de: 'Beta' },
    },
    p4: {
      title: { fr: 'MetaClean', en: 'MetaClean', de: 'MetaClean' },
      desc: {
        fr: 'Application de confidentialité pour supprimer les métadonnées sensibles des fichiers avant partage. Traitement 100% local.',
        en: 'Privacy application for removing sensitive metadata from files before sharing. 100% local processing.',
        de: 'Datenschutz-Anwendung zum Entfernen sensibler Metadaten aus Dateien vor dem Teilen. 100% lokale Verarbeitung.',
      },
      tags: ['Python', 'React', 'Privacy', 'EXIF', 'PDF'],
      status: { fr: 'Stable', en: 'Stable', de: 'Stabil' },
    },
    p5: {
      title: { fr: 'Afro Hair Connect Germany', en: 'Afro Hair Connect Germany', de: 'Afro Hair Connect Germany' },
      desc: {
        fr: 'Plateforme marketplace full-stack connectant salons de coiffure afro et clients en Allemagne. Réservations, avis, géolocalisation.',
        en: 'Full-stack marketplace platform connecting Afro hair salons and clients in Germany. Bookings, reviews, geolocation.',
        de: 'Full-Stack-Marktplatz, der Afro-Friseursalons und Kunden in Deutschland verbindet. Buchungen, Bewertungen, Geolokalisierung.',
      },
      tags: ['React', 'Django', 'PostgreSQL', 'Docker', 'AWS'],
      status: { fr: 'En production', en: 'Production', de: 'Produktiv' },
    },
  },
  whyLocal: {
    title: { fr: 'Pourquoi l\'IA Locale ?', en: 'Why Local AI?', de: 'Warum lokale KI?' },
    subtitle: {
      fr: 'Comprenez les avantages fondamentaux de l\'IA locale par rapport aux solutions cloud.',
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
        aspect: { fr: 'RGPD', en: 'GDPR', de: 'DSGVO' },
        cloud: { fr: 'Risque de non-conformité', en: 'Non-compliance risk', de: 'Nicht-Konformitätsrisiko' },
        local: { fr: 'Conforme par conception', en: 'Compliant by design', de: 'Konform durch Design' },
      },
      {
        aspect: { fr: 'Personnalisation', en: 'Customization', de: 'Anpassung' },
        cloud: { fr: 'Limitée aux options du fournisseur', en: 'Limited to provider options', de: 'Begrenzt auf Anbieteroptionen' },
        local: { fr: 'Entièrement personnalisable', en: 'Fully customizable', de: 'Vollständig anpassbar' },
      },
      {
        aspect: { fr: 'Connexion internet', en: 'Internet', de: 'Internet' },
        cloud: { fr: 'Requise en permanence', en: 'Always required', de: 'Ständig erforderlich' },
        local: { fr: 'Fonctionnement hors-ligne', en: 'Works offline', de: 'Funktioniert offline' },
      },
      {
        aspect: { fr: 'Coût à long terme', en: 'Long-term cost', de: 'Langfristige Kosten' },
        cloud: { fr: 'Abonnements croissants', en: 'Growing subscriptions', de: 'Wachsende Abonnements' },
        local: { fr: 'Investissement unique', en: 'One-time investment', de: 'Einmalige Investition' },
      },
    ],
  },
  blog: {
    title: { fr: 'Articles Techniques', en: 'Technical Articles', de: 'Technische Artikel' },
    subtitle: {
      fr: 'Partage de connaissances sur l\'IA locale, les agents autonomes et l\'infrastructure privée.',
      en: 'Sharing knowledge on local AI, autonomous agents and private infrastructure.',
      de: 'Wissensteilung über lokale KI, autonome Agenten und private Infrastruktur.',
    },
    readMore: { fr: 'Lire l\'article', en: 'Read article', de: 'Artikel lesen' },
    articles: [
      {
        title: { fr: 'Construire des agents IA locaux avec LangGraph', en: 'Building Local AI Agents with LangGraph', de: 'Lokale KI-Agenten mit LangGraph aufbauen' },
        desc: {
          fr: 'Guide complet pour créer des agents IA autonomes fonctionnant entièrement sur votre machine locale avec LangGraph et Ollama.',
          en: 'Complete guide to creating autonomous AI agents running entirely on your local machine with LangGraph and Ollama.',
          de: 'Vollständiger Leitfaden zur Erstellung autonomer KI-Agenten, die vollständig auf Ihrem lokalen Rechner mit LangGraph und Ollama laufen.',
        },
        date: '2026-07-15',
        tag: 'LangGraph · Ollama',
        readTime: '12 min',
      },
      {
        title: { fr: 'Faire tourner des LLMs sur son PC personnel', en: 'Running LLMs on Your Personal Computer', de: 'LLMs auf dem eigenen PC betreiben' },
        desc: {
          fr: 'Comment installer et optimiser des modèles de langage locaux (Qwen, Llama, Mistral) sur votre ordinateur personnel.',
          en: 'How to install and optimize local language models (Qwen, Llama, Mistral) on your personal computer.',
          de: 'Wie man lokale Sprachmodelle (Qwen, Llama, Mistral) auf dem eigenen Computer installiert und optimiert.',
        },
        date: '2026-06-28',
        tag: 'Ollama · Hardware',
        readTime: '9 min',
      },
      {
        title: { fr: 'Architecture RAG privée pour entreprises', en: 'Private RAG Architecture for Enterprises', de: 'Private RAG-Architektur für Unternehmen' },
        desc: {
          fr: 'Conception et déploiement d\'un système RAG auto-hébergé pour indexer la documentation interne de votre entreprise.',
          en: 'Design and deployment of a self-hosted RAG system to index your company\'s internal documentation.',
          de: 'Entwurf und Bereitstellung eines selbst-gehosteten RAG-Systems zur Indexierung der internen Unternehmensdokumentation.',
        },
        date: '2026-06-10',
        tag: 'RAG · ChromaDB',
        readTime: '15 min',
      },
      {
        title: { fr: 'Infrastructure IA privée avec Docker', en: 'Private AI Infrastructure with Docker', de: 'Private KI-Infrastruktur mit Docker' },
        desc: {
          fr: 'Mise en place d\'une infrastructure IA complète avec Docker, Ollama et les outils de monitoring pour votre serveur local.',
          en: 'Setting up a complete AI infrastructure with Docker, Ollama and monitoring tools for your local server.',
          de: 'Aufbau einer vollständigen KI-Infrastruktur mit Docker, Ollama und Monitoring-Tools für Ihren lokalen Server.',
        },
        date: '2026-05-22',
        tag: 'Docker · Infrastructure',
        readTime: '11 min',
      },
      {
        title: { fr: 'Automatisation cybersécurité avec l\'IA', en: 'Cybersecurity Automation with AI', de: 'Cybersicherheits-Automatisierung mit KI' },
        desc: {
          fr: 'Utilisation des agents IA locaux pour automatiser la surveillance sécurité, l\'analyse de logs et la génération d\'alertes.',
          en: 'Using local AI agents to automate security monitoring, log analysis and alert generation.',
          de: 'Einsatz lokaler KI-Agenten zur Automatisierung der Sicherheitsüberwachung, Log-Analyse und Alarmgenerierung.',
        },
        date: '2026-05-05',
        tag: 'Security · Agents',
        readTime: '8 min',
      },
    ],
  },
  contact: {
    title: {
      fr: 'Construisons votre solution IA privée',
      en: 'Let\'s build your private AI solution',
      de: 'Lassen Sie uns Ihre private KI-Lösung entwickeln',
    },
    subtitle: {
      fr: 'Ingénieur IA spécialisé dans les systèmes privés et locaux',
      en: 'AI Engineer specialized in private and local systems',
      de: 'KI-Ingenieur spezialisiert auf private und lokale Systeme',
    },
    desc: {
      fr: 'Vous souhaitez déployer une IA privée pour vous ou votre entreprise ? Discutons de votre projet et trouvons la solution adaptée à vos besoins.',
      en: 'Want to deploy a private AI for yourself or your business? Let\'s discuss your project and find the solution adapted to your needs.',
      de: 'Möchten Sie eine private KI für sich oder Ihr Unternehmen einsetzen? Lassen Sie uns über Ihr Projekt sprechen und die passende Lösung finden.',
    },
    cta: { fr: 'Demander une consultation IA', en: 'Request AI Consultation', de: 'KI-Beratung anfragen' },
    namePlaceholder: { fr: 'Votre nom', en: 'Your name', de: 'Ihr Name' },
    emailPlaceholder: { fr: 'Votre email', en: 'Your email', de: 'Ihre E-Mail' },
    subjectPlaceholder: { fr: 'Sujet de votre projet IA', en: 'Your AI project subject', de: 'Betreff Ihres KI-Projekts' },
    messagePlaceholder: {
      fr: 'Décrivez votre projet IA, vos besoins spécifiques, votre matériel disponible...',
      en: 'Describe your AI project, specific needs, available hardware...',
      de: 'Beschreiben Sie Ihr KI-Projekt, spezifische Anforderungen, verfügbare Hardware...',
    },
    send: { fr: 'Envoyer le message', en: 'Send Message', de: 'Nachricht senden' },
    sending: { fr: 'Envoi en cours...', en: 'Sending...', de: 'Wird gesendet...' },
    success: {
      fr: 'Message envoyé ! Je vous répondrai sous 24h.',
      en: 'Message sent! I\'ll reply within 24h.',
      de: 'Nachricht gesendet! Ich antworte innerhalb von 24h.',
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
    gdpr: {
      fr: 'RGPD: Vos données ne sont pas partagées avec des tiers',
      en: 'GDPR: Your data is not shared with third parties',
      de: 'DSGVO: Ihre Daten werden nicht an Dritte weitergegeben',
    },
  },
  footer: {
    tagline: { fr: 'Ingénieur IA · Systèmes Privés & Locaux', en: 'AI Engineer · Private & Local Systems', de: 'KI-Ingenieur · Private & Lokale Systeme' },
    specialties: [
      { fr: 'IA Locale', en: 'Local AI', de: 'Lokale KI' },
      { fr: 'LLM Privé', en: 'Private LLM', de: 'Privates LLM' },
      { fr: 'Agents Autonomes', en: 'Autonomous Agents', de: 'Autonome Agenten' },
      { fr: 'Cybersécurité', en: 'Cybersecurity', de: 'Cybersicherheit' },
      { fr: 'Infrastructure Cloud', en: 'Cloud Infrastructure', de: 'Cloud-Infrastruktur' },
    ],
    rights: {
      fr: 'Tous droits réservés.',
      en: 'All rights reserved.',
      de: 'Alle Rechte vorbehalten.',
    },
    madeWith: {
      fr: 'Construit avec des technologies open-source',
      en: 'Built with open-source technologies',
      de: 'Entwickelt mit Open-Source-Technologien',
    },
  },
};
