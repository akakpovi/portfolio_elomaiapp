import type { L } from './site';

export type ProjectStatus =
  | 'live'
  | 'development'
  | 'prototype'
  | 'research'
  | 'academic'
  | 'open-source';

export interface Project {
  slug: string;
  name: string;
  monogram: string;
  accent: string;
  status: ProjectStatus;
  stack: string[];
  summary: L;
  overview: L;
  problem: L;
  features: L[];
  architecture: L[];
  contribution: L;
  liveUrl?: string;
  repoUrl?: string;
  note?: L;
}

/**
 * Every entry below reflects a repository, a deployed instance or academic work
 * that was inspected during the audit. Links are only set when they resolve.
 */
export const PROJECTS: Project[] = [
  {
    slug: 'aka-ia',
    name: 'AKA IA — Multi-Model AI Chat Platform',
    monogram: 'AKA',
    accent: '#06b6d4',
    status: 'live',
    stack: ['React', 'TypeScript', 'OmniRoute', 'PostgreSQL', 'Docker', 'AI API'],
    liveUrl: 'https://appchat.elomaiapp.com/',
    summary: {
      en: 'A multi-model AI chat platform that gives users unified access to several AI models through one centralized gateway.',
      fr: "Une plateforme de chat IA multi-modèles qui donne accès à plusieurs modèles d'IA via une passerelle centralisée.",
      de: 'Eine Multi-Modell-KI-Chat-Plattform, die mehrere KI-Modelle über ein zentrales Gateway einheitlich zugänglich macht.',
    },
    overview: {
      en: 'AKA IA (Open Chat) is a web chat application connected to a centralized AI gateway that exposes multiple models behind a single OpenAI-compatible interface. The public instance runs in Docker behind a reverse proxy and is reachable at appchat.elomaiapp.com.',
      fr: "AKA IA (Open Chat) est une application de chat web reliée à une passerelle IA centralisée qui expose plusieurs modèles derrière une interface unique compatible OpenAI. L'instance publique tourne dans Docker derrière un reverse proxy et est accessible sur appchat.elomaiapp.com.",
      de: 'AKA IA (Open Chat) ist eine Web-Chat-Anwendung, die an ein zentrales KI-Gateway angebunden ist, das mehrere Modelle hinter einer einzigen OpenAI-kompatiblen Schnittstelle bereitstellt. Die öffentliche Instanz läuft in Docker hinter einem Reverse Proxy und ist unter appchat.elomaiapp.com erreichbar.',
    },
    problem: {
      en: 'Each AI provider brings its own SDK, billing and quota model. Teams end up juggling keys and tabs instead of working. AKA IA places one clean chat interface in front of a gateway that routes every request to the model the user selects.',
      fr: "Chaque fournisseur d'IA impose son SDK, sa facturation et ses quotas. On finit par jongler entre clés et onglets au lieu de travailler. AKA IA place une interface de chat unique devant une passerelle qui route chaque requête vers le modèle choisi.",
      de: 'Jeder KI-Anbieter bringt eigenes SDK, eigene Abrechnung und eigene Kontingente mit. Teams verwalten am Ende Schlüssel und Tabs statt Inhalte. AKA IA setzt eine einzige Chat-Oberfläche vor ein Gateway, das jede Anfrage an das gewählte Modell weiterleitet.',
    },
    features: [
      { en: 'Unified access to several AI models', fr: "Accès unifié à plusieurs modèles d'IA", de: 'Einheitlicher Zugriff auf mehrere KI-Modelle' },
      { en: 'Modern responsive chat interface', fr: 'Interface de chat moderne et responsive', de: 'Moderne, responsive Chat-Oberfläche' },
      { en: 'User accounts and sessions', fr: 'Comptes utilisateurs et sessions', de: 'Benutzerkonten und Sitzungen' },
      { en: 'Guest access with a limited number of free messages', fr: 'Accès invité avec un nombre limité de messages gratuits', de: 'Gastzugang mit begrenzter Zahl kostenloser Nachrichten' },
      { en: 'Usage quotas per account', fr: "Quotas d'utilisation par compte", de: 'Nutzungskontingente pro Konto' },
      { en: 'Model selection inside the conversation', fr: 'Sélection du modèle dans la conversation', de: 'Modellauswahl direkt im Chat' },
      { en: 'Containerized deployment behind a reverse proxy', fr: 'Déploiement conteneurisé derrière un reverse proxy', de: 'Container-Betrieb hinter einem Reverse Proxy' },
    ],
    architecture: [
      { en: 'React + TypeScript single-page frontend', fr: 'Frontend single-page React + TypeScript', de: 'React + TypeScript Single-Page-Frontend' },
      { en: 'Central AI gateway (OmniRoute) exposing an OpenAI-compatible API', fr: 'Passerelle IA centrale (OmniRoute) exposant une API compatible OpenAI', de: 'Zentrales KI-Gateway (OmniRoute) mit OpenAI-kompatibler API' },
      { en: 'PostgreSQL for accounts and usage tracking', fr: 'PostgreSQL pour les comptes et le suivi de consommation', de: 'PostgreSQL für Konten und Nutzungsverfolgung' },
      { en: 'Docker container behind Nginx Proxy Manager, TLS via Cloudflare', fr: 'Conteneur Docker derrière Nginx Proxy Manager, TLS via Cloudflare', de: 'Docker-Container hinter Nginx Proxy Manager, TLS über Cloudflare' },
    ],
    contribution: {
      en: 'Full-stack development, AI integration, infrastructure and deployment.',
      fr: "Développement full-stack, intégration de l'IA, infrastructure et déploiement.",
      de: 'Full-Stack-Entwicklung, KI-Integration, Infrastruktur und Deployment.',
    },
    note: {
      en: 'The source repository is private; the live application is public.',
      fr: 'Le dépôt source est privé ; l’application en ligne est publique.',
      de: 'Das Quell-Repository ist privat; die laufende Anwendung ist öffentlich.',
    },
  },
  {
    slug: 'afro-haar',
    name: 'Afro-Haar-App — Salon Booking & Marketplace',
    monogram: 'AHA',
    accent: '#8b5cf6',
    status: 'live',
    stack: ['React', 'FastAPI', 'PostgreSQL', 'SQLAlchemy', 'JWT', 'Docker'],
    liveUrl: 'https://app.elomaiapp.com/',
    summary: {
      en: 'A web platform that connects customers with Afro hair salons: discovery, online booking and a marketplace for wigs and hair extensions.',
      fr: 'Une plateforme web qui connecte les clients aux salons de coiffure afro : découverte, réservation en ligne et marketplace de perruques et extensions.',
      de: 'Eine Webplattform, die Kundinnen und Kunden mit Afro-Friseursalons verbindet: Suche, Online-Terminbuchung und ein Marktplatz für Perücken und Extensions.',
    },
    overview: {
      en: 'Afro-Haar-App is a full-stack platform for finding Afro hair salons, booking appointments online and buying hair products. The deployed instance is branded “Maison Ebène” and is reachable at app.elomaiapp.com.',
      fr: "Afro-Haar-App est une plateforme full-stack pour trouver des salons de coiffure afro, réserver des rendez-vous en ligne et acheter des produits capillaires. L'instance déployée porte la marque « Maison Ebène » et est accessible sur app.elomaiapp.com.",
      de: 'Afro-Haar-App ist eine Full-Stack-Plattform zum Finden von Afro-Friseursalons, zur Online-Terminbuchung und für den Produktverkauf. Die bereitgestellte Instanz trägt die Marke „Maison Ebène“ und ist unter app.elomaiapp.com erreichbar.',
    },
    problem: {
      en: 'Afro hair salons in Germany are hard to find online and appointments are usually arranged by phone. Customers need search by location, price and rating; salons need a place to publish their services and manage requests, appointments and stock.',
      fr: "Les salons afro en Allemagne sont difficiles à trouver en ligne et les rendez-vous se prennent souvent par téléphone. Les clients ont besoin de filtrer par lieu, prix et note ; les salons ont besoin d'un espace pour publier leurs services et gérer rendez-vous, demandes et stock.",
      de: 'Afro-Friseursalons in Deutschland sind online schwer zu finden, Termine werden meist telefonisch vergeben. Kundinnen brauchen Suche nach Ort, Preis und Bewertung; Salons brauchen einen Ort für ihre Leistungen und zur Verwaltung von Terminen, Anfragen und Lagerbestand.',
    },
    features: [
      { en: 'Salon discovery with location, price and rating filters', fr: 'Découverte de salons avec filtres par lieu, prix et note', de: 'Salonsuche mit Filtern nach Ort, Preis und Bewertung' },
      { en: 'Interactive map view', fr: 'Vue cartographique interactive', de: 'Interaktive Kartenansicht' },
      { en: 'Online appointment booking', fr: 'Réservation de rendez-vous en ligne', de: 'Online-Terminbuchung' },
      { en: 'Marketplace for wigs, extensions and hair care products', fr: 'Marketplace de perruques, extensions et soins capillaires', de: 'Marktplatz für Perücken, Extensions und Haarpflege' },
      { en: 'Salon profiles', fr: 'Profils de salons', de: 'Salonprofile' },
      { en: 'Business dashboard for appointments, customer requests, products and stock', fr: 'Tableau de bord pour rendez-vous, demandes clients, produits et stock', de: 'Dashboard für Termine, Kundenanfragen, Produkte und Lagerbestand' },
    ],
    architecture: [
      { en: 'React + Vite frontend served as its own container', fr: 'Frontend React + Vite servi dans son propre conteneur', de: 'React + Vite Frontend in einem eigenen Container' },
      { en: 'Python FastAPI backend with SQLAlchemy models', fr: 'Backend Python FastAPI avec modèles SQLAlchemy', de: 'Python FastAPI Backend mit SQLAlchemy-Modellen' },
      { en: 'PostgreSQL database and JWT authentication with bcrypt hashing', fr: 'Base PostgreSQL et authentification JWT avec hachage bcrypt', de: 'PostgreSQL-Datenbank und JWT-Authentifizierung mit bcrypt' },
      { en: 'Docker Compose stack behind Nginx Proxy Manager', fr: 'Stack Docker Compose derrière Nginx Proxy Manager', de: 'Docker-Compose-Stack hinter Nginx Proxy Manager' },
    ],
    contribution: {
      en: 'Full-stack development: data model, API, booking flow, marketplace, dashboards and containerized deployment.',
      fr: "Développement full-stack : modèle de données, API, parcours de réservation, marketplace, tableaux de bord et déploiement conteneurisé.",
      de: 'Full-Stack-Entwicklung: Datenmodell, API, Buchungsablauf, Marktplatz, Dashboards und containerisiertes Deployment.',
    },
    note: {
      en: 'The GitHub repository linked in earlier notes is not publicly available (404); the deployed application is public.',
      fr: "Le dépôt GitHub mentionné précédemment n'est pas public (404) ; l'application déployée est publique.",
      de: 'Das früher verlinkte GitHub-Repository ist nicht öffentlich (404); die bereitgestellte Anwendung ist öffentlich.',
    },
  },
  {
    slug: 'presence',
    name: 'Presence — Digital Presence Monitoring SaaS',
    monogram: 'PRS',
    accent: '#10b981',
    status: 'development',
    stack: ['Django', 'DRF', 'React', 'TypeScript', 'PostgreSQL', 'Redis', 'Celery', 'Docker'],
    repoUrl: 'https://github.com/akakpovi/SaaS_Web_Application_digitale_presenz',
    summary: {
      en: 'A SaaS platform in development that monitors website availability, domain configuration, email security and digital infrastructure.',
      fr: "Une plateforme SaaS en développement qui surveille la disponibilité des sites, la configuration des domaines, la sécurité e-mail et l'infrastructure.",
      de: 'Eine SaaS-Plattform in Entwicklung zur Überwachung von Website-Verfügbarkeit, Domain-Konfiguration, E-Mail-Sicherheit und digitaler Infrastruktur.',
    },
    overview: {
      en: 'Presence analyses the technical health of a website and turns the findings into readable reports: uptime, TLS certificates, DNS records, SPF/DKIM/DMARC, security headers and performance. The backend and frontend are under active development; the platform is not publicly launched.',
      fr: "Presence analyse la santé technique d'un site et transforme les résultats en rapports lisibles : disponibilité, certificats TLS, enregistrements DNS, SPF/DKIM/DMARC, en-têtes de sécurité et performance. Le backend et le frontend sont en développement actif ; la plateforme n'est pas encore ouverte au public.",
      de: 'Presence analysiert den technischen Zustand einer Website und erstellt daraus lesbare Berichte: Uptime, TLS-Zertifikate, DNS-Einträge, SPF/DKIM/DMARC, Security Header und Performance. Backend und Frontend befinden sich in aktiver Entwicklung; die Plattform ist nicht öffentlich gestartet.',
    },
    problem: {
      en: 'Small businesses rarely know whether their certificates expire, whether mail authentication is configured or whether their headers expose them. Technical audits are expensive and their results are hard to read. Presence automates the checks and explains the findings in plain language.',
      fr: "Les petites entreprises savent rarement si un certificat expire, si l'authentification e-mail est configurée ou si leurs en-têtes les exposent. Les audits techniques coûtent cher et leurs résultats sont difficiles à lire. Presence automatise les contrôles et explique les conclusions clairement.",
      de: 'Kleine Unternehmen wissen selten, ob Zertifikate ablaufen, ob die Mail-Authentifizierung korrekt ist oder ob ihre Header sie angreifbar machen. Technische Audits sind teuer und schwer lesbar. Presence automatisiert die Prüfungen und erklärt die Ergebnisse verständlich.',
    },
    features: [
      { en: 'Website uptime monitoring', fr: 'Surveillance de la disponibilité', de: 'Überwachung der Website-Verfügbarkeit' },
      { en: 'SSL certificate monitoring', fr: 'Surveillance des certificats SSL', de: 'Überwachung von SSL-Zertifikaten' },
      { en: 'DNS and domain analysis', fr: 'Analyse DNS et domaine', de: 'DNS- und Domain-Analyse' },
      { en: 'SPF, DKIM and DMARC checks', fr: 'Vérifications SPF, DKIM et DMARC', de: 'Prüfung von SPF, DKIM und DMARC' },
      { en: 'Security headers analysis', fr: "Analyse des en-têtes de sécurité", de: 'Analyse der Security Header' },
      { en: 'Performance analysis', fr: 'Analyse de performance', de: 'Performance-Analyse' },
      { en: 'Automated scanning with OWASP ZAP and Nuclei', fr: 'Scans automatisés avec OWASP ZAP et Nuclei', de: 'Automatisierte Scans mit OWASP ZAP und Nuclei' },
      { en: 'AI-assisted security recommendations', fr: "Recommandations de sécurité assistées par l'IA", de: 'KI-gestützte Sicherheitsempfehlungen' },
    ],
    architecture: [
      { en: 'Django + Django REST Framework API', fr: 'API Django + Django REST Framework', de: 'Django + Django REST Framework API' },
      { en: 'React + TypeScript frontend', fr: 'Frontend React + TypeScript', de: 'React + TypeScript Frontend' },
      { en: 'PostgreSQL for data, Redis and Celery for asynchronous scan jobs', fr: 'PostgreSQL pour les données, Redis et Celery pour les tâches de scan asynchrones', de: 'PostgreSQL für Daten, Redis und Celery für asynchrone Scan-Jobs' },
      { en: 'Docker Compose environment with the scanner tooling', fr: "Environnement Docker Compose avec les outils de scan", de: 'Docker-Compose-Umgebung mit den Scan-Werkzeugen' },
    ],
    contribution: {
      en: 'Backend architecture, scan engine, API design, frontend and infrastructure.',
      fr: "Architecture backend, moteur de scan, conception de l'API, frontend et infrastructure.",
      de: 'Backend-Architektur, Scan-Engine, API-Design, Frontend und Infrastruktur.',
    },
    note: {
      en: 'Not publicly available yet — presented as work in development, not as a launched product.',
      fr: "Pas encore disponible publiquement — présenté comme un travail en développement, pas comme un produit lancé.",
      de: 'Noch nicht öffentlich verfügbar — als Arbeit in Entwicklung dargestellt, nicht als gestartetes Produkt.',
    },
  },
  {
    slug: 'ecovision',
    name: 'EcoVision — Multimodal AI & RAG System',
    monogram: 'ECO',
    accent: '#22d3ee',
    status: 'research',
    stack: ['Python', 'Computer Vision', 'RAG', 'LLMs'],
    summary: {
      en: 'A multimodal AI project combining environmental image analysis with retrieval of scientific knowledge.',
      fr: "Un projet d'IA multimodale combinant l'analyse d'images environnementales et la recherche de connaissances scientifiques.",
      de: 'Ein multimodales KI-Projekt, das die Analyse von Umweltbildern mit der Recherche wissenschaftlichen Wissens verbindet.',
    },
    overview: {
      en: 'EcoVision was built as a Master’s study project. It processes environmental images, extracts visual information and links it to scientific context through a Retrieval-Augmented Generation pipeline, so answers come with references instead of guesses.',
      fr: "EcoVision a été réalisé comme projet d'études de Master. Il traite des images environnementales, en extrait l'information visuelle et la relie à un contexte scientifique via un pipeline de Retrieval-Augmented Generation, afin que les réponses s'appuient sur des références.",
      de: 'EcoVision entstand als Master-Studienprojekt. Es verarbeitet Umweltbilder, extrahiert visuelle Informationen und verknüpft sie über eine Retrieval-Augmented-Generation-Pipeline mit wissenschaftlichem Kontext, sodass Antworten auf Quellen statt auf Vermutungen beruhen.',
    },
    problem: {
      en: 'Visual observations of environmental change are only useful when they can be connected to scientific documentation. Plain image classifiers return a label; the actual question is what that label means in context. EcoVision retrieves the supporting knowledge instead of inventing it.',
      fr: "Les observations visuelles du changement environnemental ne sont utiles que si elles peuvent être reliées à une documentation scientifique. Un classifieur d'images renvoie une étiquette ; la vraie question est ce que cette étiquette signifie en contexte. EcoVision recherche la connaissance correspondante au lieu de l'inventer.",
      de: 'Visuelle Beobachtungen von Umweltveränderungen sind nur nützlich, wenn sie mit wissenschaftlicher Dokumentation verknüpft werden können. Ein Bildklassifikator liefert ein Label; entscheidend ist, was dieses Label im Kontext bedeutet. EcoVision ruft das passende Wissen ab, statt es zu erfinden.',
    },
    features: [
      { en: 'Image processing pipeline', fr: "Pipeline de traitement d'images", de: 'Bildverarbeitungs-Pipeline' },
      { en: 'Visual information analysis', fr: 'Analyse des informations visuelles', de: 'Analyse visueller Informationen' },
      { en: 'Multimodal data processing', fr: 'Traitement de données multimodales', de: 'Multimodale Datenverarbeitung' },
      { en: 'Retrieval-Augmented Generation over a scientific corpus', fr: 'Retrieval-Augmented Generation sur un corpus scientifique', de: 'Retrieval-Augmented Generation über einen wissenschaftlichen Korpus' },
      { en: 'Context-aware information retrieval', fr: "Récupération d'information contextuelle", de: 'Kontextbezogener Informationsabruf' },
    ],
    architecture: [
      { en: 'Python pipeline for image ingestion and analysis', fr: "Pipeline Python pour l'ingestion et l'analyse d'images", de: 'Python-Pipeline für Bildaufnahme und -analyse' },
      { en: 'Vector index over scientific documents', fr: 'Index vectoriel sur des documents scientifiques', de: 'Vektorindex über wissenschaftliche Dokumente' },
      { en: 'LLM layer that answers with retrieved context', fr: 'Couche LLM qui répond avec le contexte récupéré', de: 'LLM-Schicht, die mit abgerufenem Kontext antwortet' },
    ],
    contribution: {
      en: 'Project design, image pipeline, retrieval layer and evaluation of the study project.',
      fr: "Conception du projet, pipeline d'images, couche de retrieval et évaluation du projet d'études.",
      de: 'Projektkonzeption, Bild-Pipeline, Retrieval-Schicht und Auswertung des Studienprojekts.',
    },
    note: {
      en: 'Academic project (Master, Hochschule Worms). No public repository: the previously cited GitHub link returns 404.',
      fr: "Projet académique (Master, Hochschule Worms). Pas de dépôt public : le lien GitHub cité précédemment renvoie une 404.",
      de: 'Akademisches Projekt (Master, Hochschule Worms). Kein öffentliches Repository: der früher genannte GitHub-Link liefert 404.',
    },
  },
  {
    slug: 'thermal-yolo',
    name: 'Thermal Image Object Detection with YOLO',
    monogram: 'THM',
    accent: '#f59e0b',
    status: 'research',
    stack: ['Python', 'OpenCV', 'YOLO', 'Faster R-CNN', 'COCO', 'JSON'],
    summary: {
      en: 'A computer vision research project on object detection in thermal images using the FLIR dataset.',
      fr: "Un projet de recherche en vision par ordinateur sur la détection d'objets dans des images thermiques avec le jeu de données FLIR.",
      de: 'Ein Computer-Vision-Forschungsprojekt zur Objekterkennung in Wärmebildern mit dem FLIR-Datensatz.',
    },
    overview: {
      en: 'The project prepares the FLIR thermal dataset for modern detectors: JSON annotation parsing, a disjoint train/validation/test split and a COCO to YOLO conversion that produces a training-ready dataset structure. Model training and comparison are the next phase.',
      fr: "Le projet prépare le jeu de données thermique FLIR pour des détecteurs modernes : lecture des annotations JSON, découpage disjoint train/validation/test et conversion COCO vers YOLO produisant une structure prête à l'entraînement. L'entraînement et la comparaison des modèles constituent la phase suivante.",
      de: 'Das Projekt bereitet den FLIR-Wärmebilddatensatz für moderne Detektoren auf: Parsen der JSON-Annotationen, disjunkte Train-/Validation-/Test-Aufteilung und COCO-zu-YOLO-Konvertierung mit trainingsfertiger Datensatzstruktur. Training und Modellvergleich folgen als nächste Phase.',
    },
    problem: {
      en: 'Thermal imagery behaves differently from RGB: low contrast, different textures, annotated in COCO format while the detectors expect YOLO labels. Getting a clean, leak-free dataset is the precondition for any meaningful comparison.',
      fr: "L'imagerie thermique diffère du RGB : faible contraste, textures différentes, annotations au format COCO alors que les détecteurs attendent des labels YOLO. Un jeu de données propre et sans fuite est la condition de toute comparaison pertinente.",
      de: 'Wärmebilder verhalten sich anders als RGB: geringer Kontrast, andere Texturen, COCO-Annotationen, während die Detektoren YOLO-Labels erwarten. Ein sauberer, leckfreier Datensatz ist die Voraussetzung für jeden sinnvollen Vergleich.',
    },
    features: [
      { en: 'Dataset preparation from the FLIR thermal set', fr: 'Préparation du jeu de données FLIR', de: 'Datensatzaufbereitung aus dem FLIR-Set' },
      { en: 'JSON annotation processing', fr: 'Traitement des annotations JSON', de: 'Verarbeitung der JSON-Annotationen' },
      { en: 'Disjoint train / validation / test separation', fr: 'Séparation disjointe train / validation / test', de: 'Disjunkte Train-/Validation-/Test-Aufteilung' },
      { en: 'COCO to YOLO label conversion', fr: 'Conversion des labels COCO vers YOLO', de: 'COCO-zu-YOLO-Label-Konvertierung' },
      { en: 'Planned: training and comparison of YOLOv3, YOLOv5, YOLOv8 and Faster R-CNN', fr: 'Prévu : entraînement et comparaison de YOLOv3, YOLOv5, YOLOv8 et Faster R-CNN', de: 'Geplant: Training und Vergleich von YOLOv3, YOLOv5, YOLOv8 und Faster R-CNN' },
    ],
    architecture: [
      { en: 'Python preprocessing scripts for annotation parsing and conversion', fr: "Scripts Python de prétraitement pour le parsing et la conversion des annotations", de: 'Python-Preprocessing für Annotation-Parsing und Konvertierung' },
      { en: 'YOLO-compatible dataset directory layout', fr: 'Arborescence de dataset compatible YOLO', de: 'YOLO-kompatible Datensatzstruktur' },
      { en: 'Planned evaluation: precision, recall, mAP@0.5, mAP@0.5:0.95 and inference time', fr: "Évaluation prévue : précision, rappel, mAP@0.5, mAP@0.5:0.95 et temps d'inférence", de: 'Geplante Auswertung: Precision, Recall, mAP@0.5, mAP@0.5:0.95 und Inferenzzeit' },
    ],
    contribution: {
      en: 'Dataset engineering, annotation processing, conversion pipeline and experiment design.',
      fr: "Ingénierie du jeu de données, traitement des annotations, pipeline de conversion et conception des expériences.",
      de: 'Datensatz-Engineering, Annotationsverarbeitung, Konvertierungs-Pipeline und Versuchsdesign.',
    },
    note: {
      en: 'Research in progress. No benchmark results are published because the experiments are not finished — no numbers are claimed on this page.',
      fr: "Recherche en cours. Aucun résultat de benchmark n'est publié car les expériences ne sont pas terminées — aucun chiffre n'est avancé sur cette page.",
      de: 'Forschung läuft. Es werden keine Benchmark-Ergebnisse veröffentlicht, weil die Experimente nicht abgeschlossen sind — auf dieser Seite werden keine Zahlen behauptet.',
    },
  },
  {
    slug: 'infrastructure-as-code',
    name: 'Infrastructure as Code — Cloud Automation',
    monogram: 'IAC',
    accent: '#6366f1',
    status: 'academic',
    stack: ['Terraform', 'OpenTofu', 'AWS', 'OpenStack', 'CI/CD'],
    repoUrl: 'https://gitlab.rlp.net/iac-schulung-projekt/infrastructure-as-code-schulung',
    summary: {
      en: 'A modular infrastructure automation code base built with Terraform and OpenTofu for AWS and OpenStack.',
      fr: 'Une base de code modulaire d’automatisation d’infrastructure avec Terraform et OpenTofu pour AWS et OpenStack.',
      de: 'Eine modulare Infrastructure-as-Code-Basis mit Terraform und OpenTofu für AWS und OpenStack.',
    },
    overview: {
      en: 'Created as a Master’s study project, this code base provisions infrastructure automatically for AWS and OpenStack. It separates a standard stack from a hardened variant, integrates a CI/CD pipeline and documents the architecture so it can be used as training material.',
      fr: "Réalisé comme projet d'études de Master, cette base de code provisionne automatiquement l'infrastructure pour AWS et OpenStack. Elle sépare une stack standard d'une variante durcie, intègre un pipeline CI/CD et documente l'architecture pour servir de support de formation.",
      de: 'Als Master-Studienprojekt entwickelt, provisioniert diese Codebasis Infrastruktur automatisch für AWS und OpenStack. Sie trennt einen Standard-Stack von einer gehärteten Variante, integriert eine CI/CD-Pipeline und dokumentiert die Architektur als Schulungsgrundlage.',
    },
    problem: {
      en: 'Manually created cloud environments drift, are hard to reproduce and impossible to review. The project turns the setup into versioned, modular code so an environment can be rebuilt identically and audited like any other source file.',
      fr: "Les environnements cloud créés manuellement dérivent, sont difficiles à reproduire et impossibles à relire. Le projet transforme l'installation en code versionné et modulaire, afin qu'un environnement puisse être reconstruit à l'identique et audité comme n'importe quel fichier source.",
      de: 'Manuell erstellte Cloud-Umgebungen driften, sind schwer reproduzierbar und nicht reviewbar. Das Projekt überführt das Setup in versionierten, modularen Code, sodass eine Umgebung identisch neu aufgebaut und wie jede andere Quelldatei geprüft werden kann.',
    },
    features: [
      { en: 'Automated infrastructure provisioning', fr: "Provisionnement automatisé de l'infrastructure", de: 'Automatisierte Infrastrukturbereitstellung' },
      { en: 'AWS and OpenStack targets from one modular structure', fr: 'Cibles AWS et OpenStack depuis une structure modulaire', de: 'AWS- und OpenStack-Ziele aus einer modularen Struktur' },
      { en: 'Standard and hardened infrastructure variants', fr: "Variantes d'infrastructure standard et durcie", de: 'Standard- und gehärtete Infrastrukturvariante' },
      { en: 'CI/CD pipeline integration', fr: 'Intégration au pipeline CI/CD', de: 'Integration in die CI/CD-Pipeline' },
      { en: 'Architecture documentation', fr: "Documentation de l'architecture", de: 'Architekturdokumentation' },
    ],
    architecture: [
      { en: 'Reusable OpenTofu/Terraform modules with separate environments', fr: 'Modules OpenTofu/Terraform réutilisables avec environnements séparés', de: 'Wiederverwendbare OpenTofu/Terraform-Module mit getrennten Umgebungen' },
      { en: 'Remote state and provider configuration per target', fr: 'State distant et configuration des providers par cible', de: 'Remote State und Provider-Konfiguration je Ziel' },
      { en: 'GitLab CI pipeline for validation and deployment', fr: 'Pipeline GitLab CI pour la validation et le déploiement', de: 'GitLab-CI-Pipeline für Validierung und Deployment' },
    ],
    contribution: {
      en: 'Module design, provider configuration for AWS/OpenStack, CI pipeline and documentation.',
      fr: 'Conception des modules, configuration des providers AWS/OpenStack, pipeline CI et documentation.',
      de: 'Moduldesign, Provider-Konfiguration für AWS/OpenStack, CI-Pipeline und Dokumentation.',
    },
    note: {
      en: 'Academic project carried out for a Fraunhofer IESE training module (Master, Hochschule Worms).',
      fr: "Projet académique réalisé pour un module de formation du Fraunhofer IESE (Master, Hochschule Worms).",
      de: 'Akademisches Projekt für ein Schulungsmodul des Fraunhofer IESE (Master, Hochschule Worms).',
    },
  },
  {
    slug: 'local-ai-operator',
    name: 'Local AI Operator',
    monogram: 'OPS',
    accent: '#0ea5e9',
    status: 'prototype',
    stack: ['Ollama', 'Qwen2.5', 'LangGraph', 'Python', 'Docker'],
    summary: {
      en: 'A prototype of an autonomous local agent that inspects a machine, reports on it and can act on system tasks.',
      fr: "Un prototype d'agent local autonome qui inspecte une machine, en rend compte et peut agir sur des tâches système.",
      de: 'Ein Prototyp eines autonomen lokalen Agenten, der einen Rechner untersucht, berichtet und Systemaufgaben ausführen kann.',
    },
    overview: {
      en: 'Local AI Operator explores how far a locally hosted model can go when it is given tools instead of just a chat window: inspecting system state, summarising findings and proposing actions. It runs on Ollama with a LangGraph orchestration layer. It is an experimental build, not a distributed product.',
      fr: "Local AI Operator explore jusqu'où un modèle hébergé localement peut aller lorsqu'on lui donne des outils plutôt qu'une simple fenêtre de chat : inspection de l'état du système, synthèse des résultats et proposition d'actions. Il fonctionne avec Ollama et une couche d'orchestration LangGraph. C'est une construction expérimentale, pas un produit distribué.",
      de: 'Local AI Operator untersucht, wie weit ein lokal gehostetes Modell kommt, wenn es Werkzeuge statt nur ein Chatfenster erhält: Systemzustand prüfen, Ergebnisse zusammenfassen, Aktionen vorschlagen. Es läuft mit Ollama und einer LangGraph-Orchestrierungsschicht. Ein experimenteller Aufbau, kein verteiltes Produkt.',
    },
    problem: {
      en: 'Cloud assistants cannot see the local machine, and system tools are not conversational. The experiment connects a local model to system inspection tools so an operator can ask questions about a machine in plain language without sending data off-device.',
      fr: "Les assistants cloud ne voient pas la machine locale, et les outils système ne sont pas conversationnels. L'expérience relie un modèle local à des outils d'inspection pour interroger une machine en langage naturel sans envoyer de données à l'extérieur.",
      de: 'Cloud-Assistenten sehen den lokalen Rechner nicht, Systemwerkzeuge sind nicht dialogfähig. Das Experiment verbindet ein lokales Modell mit Inspektionswerkzeugen, damit sich ein Rechner in natürlicher Sprache befragen lässt, ohne Daten nach außen zu geben.',
    },
    features: [
      { en: 'System state inspection through tools', fr: "Inspection de l'état du système via des outils", de: 'Systemzustandsprüfung über Werkzeuge' },
      { en: 'Performance and resource summarisation', fr: 'Synthèse des performances et des ressources', de: 'Zusammenfassung von Leistung und Ressourcen' },
      { en: 'File and Docker inspection helpers', fr: 'Assistants d’inspection de fichiers et Docker', de: 'Helfer zur Datei- und Docker-Inspektion' },
      { en: 'Agent tool-calling with LangGraph', fr: 'Appel d’outils par agent avec LangGraph', de: 'Tool-Calling des Agenten mit LangGraph' },
      { en: 'Runs fully on local hardware with Ollama', fr: 'Fonctionne entièrement en local avec Ollama', de: 'Läuft vollständig lokal mit Ollama' },
    ],
    architecture: [
      { en: 'LangGraph agent graph with read-only system tools', fr: 'Graphe agent LangGraph avec outils système en lecture', de: 'LangGraph-Agentengraph mit lesenden Systemwerkzeugen' },
      { en: 'Ollama serving Qwen2.5 locally', fr: 'Ollama servant Qwen2.5 en local', de: 'Ollama mit lokalem Qwen2.5' },
      { en: 'Python process, no cloud dependency for inference', fr: "Processus Python, sans dépendance cloud pour l'inférence", de: 'Python-Prozess, keine Cloud-Abhängigkeit bei der Inferenz' },
    ],
    contribution: {
      en: 'Concept, agent design, tool implementation and local testing.',
      fr: "Concept, conception de l'agent, implémentation des outils et tests locaux.",
      de: 'Konzept, Agentendesign, Werkzeugimplementierung und lokale Tests.',
    },
    note: {
      en: 'Prototype. There is no public repository or hosted demo — the card reflects the experimental state only.',
      fr: "Prototype. Aucun dépôt public ni démo hébergée — la fiche reflète uniquement l'état expérimental.",
      de: 'Prototyp. Kein öffentliches Repository und keine gehostete Demo — die Karte gibt nur den experimentellen Stand wieder.',
    },
  },
  {
    slug: 'private-ai-platform',
    name: 'Private AI Enterprise Platform',
    monogram: 'PAI',
    accent: '#a78bfa',
    status: 'development',
    stack: ['FastAPI', 'LangChain', 'RAG', 'pgvector', 'Docker', 'Ollama'],
    summary: {
      en: 'A self-hosted AI platform in development that lets an organisation use AI on its own infrastructure with its own documents.',
      fr: "Une plateforme d'IA auto-hébergée en développement permettant à une organisation d'utiliser l'IA sur sa propre infrastructure avec ses documents.",
      de: 'Eine selbst gehostete KI-Plattform in Entwicklung, die es Organisationen erlaubt, KI auf eigener Infrastruktur mit eigenen Dokumenten zu nutzen.',
    },
    overview: {
      en: 'The platform combines an authentication proxy, a model gateway, a retrieval layer and a usage writer in a containerized stack, so an organisation can offer AI features to several users while documents and prompts stay inside its network.',
      fr: "La plateforme combine un proxy d'authentification, une passerelle de modèles, une couche de retrieval et un service de suivi d'usage dans une stack conteneurisée, afin qu'une organisation puisse offrir des fonctions IA à plusieurs utilisateurs en gardant documents et prompts dans son réseau.",
      de: 'Die Plattform kombiniert einen Authentifizierungs-Proxy, ein Modell-Gateway, eine Retrieval-Schicht und einen Usage-Writer in einem containerisierten Stack, sodass eine Organisation KI-Funktionen für mehrere Nutzer anbieten kann, während Dokumente und Prompts im eigenen Netz bleiben.',
    },
    problem: {
      en: 'Companies want AI on internal knowledge but cannot send documents to an external provider. They need access control, per-user usage accounting and a retrieval layer for their own corpus — the parts a chat UI alone does not provide.',
      fr: "Les entreprises veulent de l'IA sur leurs connaissances internes sans envoyer leurs documents à un fournisseur externe. Il leur faut contrôle d'accès, suivi d'usage par utilisateur et une couche de retrieval sur leur corpus — ce qu'une simple interface de chat ne fournit pas.",
      de: 'Unternehmen wollen KI auf internem Wissen, dürfen Dokumente aber nicht an externe Anbieter geben. Sie brauchen Zugriffskontrolle, Nutzungsabrechnung pro Nutzer und eine Retrieval-Schicht für den eigenen Korpus — genau das, was eine Chat-Oberfläche allein nicht liefert.',
    },
    features: [
      { en: 'Multi-user access with an authentication proxy', fr: "Accès multi-utilisateurs avec proxy d'authentification", de: 'Mehrbenutzerzugriff über einen Authentifizierungs-Proxy' },
      { en: 'Central model gateway', fr: 'Passerelle de modèles centralisée', de: 'Zentrales Modell-Gateway' },
      { en: 'Document knowledge base with vector search', fr: 'Base de connaissances documentaire avec recherche vectorielle', de: 'Dokumenten-Wissensbasis mit Vektorsuche' },
      { en: 'Per-user usage accounting', fr: "Suivi d'usage par utilisateur", de: 'Nutzungsabrechnung pro Nutzer' },
      { en: 'Fully self-hosted deployment', fr: 'Déploiement entièrement auto-hébergé', de: 'Vollständig selbst gehostetes Deployment' },
    ],
    architecture: [
      { en: 'FastAPI services: auth proxy, gateway, sentinel worker, usage writer', fr: "Services FastAPI : auth proxy, gateway, sentinel worker, usage writer", de: 'FastAPI-Dienste: Auth-Proxy, Gateway, Sentinel-Worker, Usage-Writer' },
      { en: 'pgvector for embeddings and retrieval', fr: 'pgvector pour les embeddings et le retrieval', de: 'pgvector für Embeddings und Retrieval' },
      { en: 'Docker network isolated from the public internet', fr: "Réseau Docker isolé d'Internet", de: 'Vom öffentlichen Internet isoliertes Docker-Netz' },
    ],
    contribution: {
      en: 'Service architecture, gateway integration, retrieval design and container orchestration.',
      fr: "Architecture des services, intégration de la passerelle, conception du retrieval et orchestration des conteneurs.",
      de: 'Service-Architektur, Gateway-Integration, Retrieval-Design und Container-Orchestrierung.',
    },
    note: {
      en: 'In development. Internal infrastructure project — no public demo or repository is offered.',
      fr: "En développement. Projet d'infrastructure interne — aucune démo ni dépôt public.",
      de: 'In Entwicklung. Internes Infrastrukturprojekt — keine öffentliche Demo und kein öffentliches Repository.',
    },
  },
  {
    slug: 'ai-security-assistant',
    name: 'AI Cybersecurity Assistant',
    monogram: 'SEC',
    accent: '#ef4444',
    status: 'prototype',
    stack: ['Python', 'LangGraph', 'Mistral', 'Linux', 'Log Analysis'],
    summary: {
      en: 'A prototype assistant for security monitoring that summarises logs and prepares incident notes.',
      fr: "Un prototype d'assistant de surveillance sécurité qui synthétise les logs et prépare des notes d'incident.",
      de: 'Ein Prototyp eines Sicherheitsassistenten, der Logs zusammenfasst und Incident-Notizen vorbereitet.',
    },
    overview: {
      en: 'The assistant reads security-relevant log output, groups related events and turns them into a readable summary with suggested next steps. It is an internal prototype used to evaluate how far a local model can support routine triage.',
      fr: "L'assistant lit les logs pertinents pour la sécurité, regroupe les événements liés et les transforme en synthèse lisible avec des étapes suivantes proposées. C'est un prototype interne servant à évaluer jusqu'où un modèle local peut soutenir le triage courant.",
      de: 'Der Assistent liest sicherheitsrelevante Log-Ausgaben, gruppiert zusammenhängende Ereignisse und erstellt eine lesbare Zusammenfassung mit Vorschlägen für nächste Schritte. Ein interner Prototyp, um zu prüfen, wie weit ein lokales Modell Routine-Triage unterstützen kann.',
    },
    problem: {
      en: 'Security logs are verbose and repetitive; the interesting event is buried in noise. A model that groups and summarises them shortens the path from alert to decision — as long as it is clear that the model proposes and the operator decides.',
      fr: "Les logs de sécurité sont verbeux et répétitifs ; l'événement intéressant se noie dans le bruit. Un modèle qui les regroupe et les synthétise raccourcit le chemin de l'alerte à la décision — à condition qu'il soit clair que le modèle propose et que l'opérateur décide.",
      de: 'Sicherheitslogs sind ausführlich und repetitiv; das relevante Ereignis geht im Rauschen unter. Ein Modell, das sie gruppiert und zusammenfasst, verkürzt den Weg vom Alarm zur Entscheidung — solange klar bleibt, dass das Modell vorschlägt und der Operator entscheidet.',
    },
    features: [
      { en: 'Log ingestion and grouping', fr: 'Ingestion et regroupement de logs', de: 'Log-Aufnahme und Gruppierung' },
      { en: 'Automated event summarisation', fr: "Synthèse automatisée des événements", de: 'Automatisierte Ereigniszusammenfassung' },
      { en: 'Incident note generation', fr: "Génération de notes d'incident", de: 'Erstellung von Incident-Notizen' },
      { en: 'Local inference to keep log data on-device', fr: "Inférence locale pour garder les logs sur la machine", de: 'Lokale Inferenz, damit Logdaten auf dem Gerät bleiben' },
    ],
    architecture: [
      { en: 'LangGraph flow: parse, cluster, summarise, draft', fr: 'Flux LangGraph : lecture, regroupement, synthèse, rédaction', de: 'LangGraph-Ablauf: Parsen, Clustern, Zusammenfassen, Entwerfen' },
      { en: 'Local model inference with Mistral', fr: 'Inférence locale avec Mistral', de: 'Lokale Inferenz mit Mistral' },
      { en: 'Python tooling around Linux log sources', fr: 'Outillage Python autour des sources de logs Linux', de: 'Python-Werkzeuge für Linux-Logquellen' },
    ],
    contribution: {
      en: 'Prototype design, prompt and tool pipeline, local evaluation.',
      fr: "Conception du prototype, pipeline de prompts et d'outils, évaluation locale.",
      de: 'Prototyp-Design, Prompt- und Tool-Pipeline, lokale Auswertung.',
    },
    note: {
      en: 'Prototype stage: it supports triage, it does not replace a SIEM or an analyst. No public demo.',
      fr: "Stade prototype : il assiste le triage, il ne remplace ni un SIEM ni un analyste. Pas de démo publique.",
      de: 'Prototyp-Status: unterstützt die Triage, ersetzt weder SIEM noch Analyst. Keine öffentliche Demo.',
    },
  },
  {
    slug: 'metaclean',
    name: 'MetaClean — Metadata Privacy Tool',
    monogram: 'MTC',
    accent: '#14b8a6',
    status: 'open-source',
    stack: ['Python', 'React', 'EXIF', 'PDF', 'Privacy'],
    repoUrl: 'https://github.com/akakpovi/Meta_Clean',
    summary: {
      en: 'An application that removes sensitive metadata from files before they are shared, processing everything locally.',
      fr: "Une application qui supprime les métadonnées sensibles des fichiers avant partage, avec un traitement entièrement local.",
      de: 'Eine Anwendung, die sensible Metadaten aus Dateien entfernt, bevor sie geteilt werden — vollständig lokal verarbeitet.',
    },
    overview: {
      en: 'Photos and PDFs carry author names, device identifiers, GPS coordinates and timestamps that are rarely meant to be published. MetaClean inspects those properties and strips them, with the file never leaving the machine.',
      fr: "Les photos et PDF transportent des noms d'auteur, identifiants d'appareil, coordonnées GPS et horodatages rarement destinés à la publication. MetaClean inspecte ces propriétés et les supprime, sans que le fichier quitte la machine.",
      de: 'Fotos und PDFs enthalten Autorennamen, Gerätekennungen, GPS-Koordinaten und Zeitstempel, die selten veröffentlicht werden sollen. MetaClean prüft diese Eigenschaften und entfernt sie, ohne dass die Datei den Rechner verlässt.',
    },
    problem: {
      en: 'Removing metadata is tedious and most online tools require uploading the file to a third party — which defeats the purpose when the metadata is the sensitive part. MetaClean keeps the whole operation local.',
      fr: "Supprimer les métadonnées est fastidieux et la plupart des outils en ligne exigent de téléverser le fichier chez un tiers — ce qui annule l'intérêt quand les métadonnées sont la partie sensible. MetaClean garde toute l'opération en local.",
      de: 'Das Entfernen von Metadaten ist mühsam, und die meisten Online-Tools verlangen einen Upload zu Dritten — was den Zweck verfehlt, wenn gerade die Metadaten sensibel sind. MetaClean hält den Vorgang vollständig lokal.',
    },
    features: [
      { en: 'Inspection of file metadata before sharing', fr: 'Inspection des métadonnées avant partage', de: 'Prüfung der Datei-Metadaten vor dem Teilen' },
      { en: 'Removal of EXIF and document properties', fr: 'Suppression des EXIF et propriétés de document', de: 'Entfernung von EXIF- und Dokumenteigenschaften' },
      { en: 'Local-only processing', fr: 'Traitement exclusivement local', de: 'Ausschließlich lokale Verarbeitung' },
      { en: 'Simple interface for non-technical users', fr: 'Interface simple pour utilisateurs non techniques', de: 'Einfache Oberfläche für nicht-technische Nutzer' },
    ],
    architecture: [
      { en: 'Python processing layer for image and document metadata', fr: 'Couche de traitement Python pour les métadonnées image et document', de: 'Python-Verarbeitungsschicht für Bild- und Dokumentmetadaten' },
      { en: 'React interface', fr: 'Interface React', de: 'React-Oberfläche' },
      { en: 'No upload step: files are handled on the local machine', fr: 'Aucun téléversement : les fichiers restent sur la machine', de: 'Kein Upload-Schritt: Dateien bleiben auf dem Rechner' },
    ],
    contribution: {
      en: 'Application design, metadata handling and interface.',
      fr: "Conception de l'application, traitement des métadonnées et interface.",
      de: 'Anwendungsdesign, Metadatenverarbeitung und Oberfläche.',
    },
    note: {
      en: 'Public source repository; no hosted demo is offered.',
      fr: 'Dépôt source public ; aucune démo hébergée.',
      de: 'Öffentliches Quell-Repository; keine gehostete Demo.',
    },
  },
];
