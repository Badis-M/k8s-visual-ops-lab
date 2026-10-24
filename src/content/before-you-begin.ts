import type { L } from "./types";

export const beforeYouBegin = {
  title: {
    fr: "Niveau 0 — Avant de commencer",
    en: "Level 0 — Before you begin",
  },
  optional: { fr: "Facultatif", en: "Optional" },
  introduction: {
    fr: "Cette courte préparation vous aide à aborder les premiers cours sereinement. Aucun parcours supplémentaire à terminer : si ces bases vous sont familières, commencez directement au niveau 1.",
    en: "This short preparation helps you approach the first lessons with confidence. There is no additional learning path to complete: if these basics are familiar, start directly at level 1.",
  },
  skip: { fr: "Aller au niveau 1", en: "Go to level 1" },
  basicsTitle: { fr: "Les bases utiles", en: "Useful basics" },
  basics: [
    {
      title: { fr: "Linux", en: "Linux" },
      text: {
        fr: "Maîtriser les bases de Linux (permissions, processus et journaux) aide à comprendre l’environnement des conteneurs et à diagnostiquer une application.",
        en: "Being comfortable with Linux basics, including permissions, processes and logs, helps you understand container environments and diagnose application issues.",
      },
    },
    {
      title: { fr: "Terminal", en: "Terminal" },
      text: {
        fr: "Savoir se déplacer dans les dossiers, manipuler des fichiers et exécuter une commande permet de suivre les exercices et de retrouver ses manifests Kubernetes.",
        en: "Knowing how to navigate directories, manage files and run a command helps you follow the exercises and find your Kubernetes manifests on your machine.",
      },
    },
    {
      title: { fr: "Réseau", en: "Networking" },
      text: {
        fr: "Comprendre une adresse IP, un port, le DNS et une requête HTTP aide à suivre les échanges entre applications et à diagnostiquer un accès impossible.",
        en: "Understanding IP addresses, ports, DNS and an HTTP request helps you follow communication between applications and diagnose why a service cannot be reached.",
      },
    },
    {
      title: { fr: "Conteneurs", en: "Containers" },
      text: {
        fr: "Distinguer image, conteneur et registre, puis comprendre une correspondance de ports, aide à identifier ce que Kubernetes exécute et comment accéder à l’application.",
        en: "Distinguishing an image, a container and a registry, then understanding port mapping, helps you identify what Kubernetes runs and how to access the application.",
      },
    },
    {
      title: { fr: "YAML", en: "YAML" },
      text: {
        fr: "Lire l’indentation, les listes et les paires clé/valeur permet de modifier les manifests Kubernetes sans changer accidentellement leur structure.",
        en: "Reading indentation, lists and key/value pairs lets you edit Kubernetes manifests without accidentally changing their structure or placing a setting under the wrong field.",
      },
    },
  ],
  review: {
    fr: "Besoin d’apprendre ou de réviser ?",
    en: "Need to learn or refresh these basics?",
  },
  academyLink: { fr: "Réviser sur DevOps Academy", en: "Review on DevOps Academy" },
  machineTitle: { fr: "Préparer sa machine", en: "Prepare your machine" },
  browsing: {
    fr: "Consulter le site ne nécessite aucune installation. Pour exécuter les premiers labs sur votre machine, prévoyez :",
    en: "Browsing this site requires no installation. To run the first labs on your own machine, you will need:",
  },
  tools: [
    {
      title: { fr: "Un terminal adapté", en: "A suitable terminal" },
      text: {
        fr: "sur Linux ou macOS, ou Ubuntu sous WSL2 sur Windows.",
        en: "on Linux or macOS, or Ubuntu on WSL2 for Windows.",
      },
    },
    {
      title: { fr: "Docker", en: "Docker" },
      text: {
        fr: "le moteur de conteneurs utilisé par les instructions du cours.",
        en: "the container engine used by the course instructions.",
      },
    },
    {
      title: { fr: "kubectl", en: "kubectl" },
      text: {
        fr: "le client pour communiquer avec l’API Kubernetes.",
        en: "the command-line client for the Kubernetes API.",
      },
    },
    {
      title: { fr: "kind", en: "kind" },
      text: {
        fr: "l’outil pour créer le cluster local utilisé dans les exercices.",
        en: "the tool for creating the local cluster used in the exercises.",
      },
    },
  ],
  details: {
    fr: "Les commandes, versions, ressources matérielles et particularités de votre système sont détaillées dans les instructions existantes :",
    en: "Commands, versions, hardware requirements and operating-system specifics are covered in the existing instructions:",
  },
  prerequisitesLink: { fr: "Prérequis", en: "Prerequisites" },
  installationLink: { fr: "Installation pas à pas", en: "Step-by-step installation" },
} satisfies {
  title: L;
  optional: L;
  introduction: L;
  skip: L;
  basicsTitle: L;
  basics: { title: L; text: L }[];
  review: L;
  academyLink: L;
  machineTitle: L;
  browsing: L;
  tools: { title: L; text: L }[];
  details: L;
  prerequisitesLink: L;
  installationLink: L;
};
