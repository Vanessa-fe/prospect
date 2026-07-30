# Prospect CRM

CRM mobile-first destiné aux indépendants et petites entreprises pour gérer prospects, clients, interactions, rendez-vous et paiements.

## Stack technique

- **Framework** : Next.js 14 (App Router)
- **Langage** : TypeScript (strict mode)
- **Styling** : Tailwind CSS
- **UI Components** : shadcn/ui
- **Base de données** : PostgreSQL (Supabase)
- **Authentification** : Supabase Auth
- **Formulaires** : React Hook Form + Zod
- **Tables** : TanStack Table
- **Graphiques** : Recharts
- **Icônes** : Lucide Icons

## Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase

## Installation

1. Cloner le repository

```bash
git clone <repository-url>
cd prospect
```

2. Installer les dépendances

```bash
npm install
```

3. Configurer les variables d'environnement

```bash
cp .env.local.example .env.local
```

Compléter les variables dans `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Configurer Supabase

### Option A : Utiliser Supabase local (développement)

```bash
# Installer Supabase CLI
npm install -g supabase

# Démarrer Supabase localement
supabase start

# Appliquer les migrations
supabase db reset
```

### Option B : Utiliser un projet Supabase cloud

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Récupérer les clés API dans Project Settings > API
3. Exécuter les migrations dans l'éditeur SQL :
   - `supabase/migrations/00001_initial_schema.sql`
   - `supabase/migrations/00002_rls_policies.sql`
   - `supabase/migrations/00003_seed_default_data.sql`

5. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000) dans votre navigateur.

## Scripts disponibles

- `npm run dev` : Lancer le serveur de développement
- `npm run build` : Construire l'application pour la production
- `npm run start` : Lancer l'application en production
- `npm run lint` : Lancer ESLint
- `npm run typecheck` : Vérifier les types TypeScript
- `npm run supabase:generate-types` : Générer les types TypeScript depuis Supabase

## Structure du projet

```
prospect/
├── src/
│   ├── app/              # Pages et routes (App Router)
│   ├── components/       # Composants React
│   ├── lib/
│   │   ├── supabase/     # Configuration Supabase
│   │   ├── actions/      # Server Actions
│   │   ├── queries/      # Data fetching
│   │   ├── validations/  # Schémas Zod
│   │   └── utils/        # Utilitaires
│   └── types/            # Types TypeScript
├── supabase/
│   └── migrations/       # Migrations SQL
└── public/               # Fichiers statiques
```

## Fonctionnalités principales (MVP)

### Authentification
- Inscription / Connexion
- Récupération de mot de passe
- Onboarding premier utilisateur

### Gestion des contacts
- CRUD complet
- Détection de doublons (téléphone)
- Détection d'activité inhabituelle
- Gestion des canaux (WhatsApp, SMS, Telegram, etc.)
- Niveaux de risque (normal, à surveiller, insistant, bloqué)
- Statuts personnalisables
- Sources personnalisables

### Interactions
- Enregistrement manuel des interactions
- Timeline chronologique
- Types : message, appel, note, relance

### Rendez-vous
- Création et gestion
- Vue liste et calendrier
- Statuts (prévu, confirmé, terminé, annulé, absent)
- Rappels

### Paiements
- Enregistrement des montants
- Gestion des acomptes
- Association optionnelle avec rendez-vous
- Tracking du chiffre d'affaires

### Relances
- Création de rappels
- Priorisation
- Suivi des relances en retard

### Dashboard
- Statistiques globales
- Graphiques (répartition par statut/source)
- Derniers contacts
- Prochains rendez-vous
- Relances en retard

### Import/Export
- Import CSV avec mapping de colonnes
- Export CSV (contacts, rendez-vous, paiements)

### Personnalisation
- 6 thèmes disponibles (Minimal, Pink Candy, Dark Violet, Sage, Ocean, Sunset)
- Mode clair / sombre
- Statuts et sources personnalisables

## Sécurité

- Row Level Security (RLS) activé sur toutes les tables
- Isolation complète des données par utilisateur
- Validation côté client (Zod) et côté serveur
- Authentification gérée par Supabase Auth

## Roadmap

Les fonctionnalités suivantes sont hors périmètre du MVP mais prévues pour les versions ultérieures :

- Application mobile native (React Native)
- Intégration WhatsApp Business API
- Intégration Telegram Bot
- Lecture automatique des SMS
- Synchronisation Google Calendar
- Intelligence artificielle (suggestions, détection automatique)
- Abonnements Stripe
- Gestion d'équipe
- Notifications push
- Export PDF/XLSX
- Automatisations avancées

## Déploiement

Le projet est configuré pour être déployé sur Vercel.

1. Pusher le code sur GitHub
2. Connecter le repository à Vercel
3. Configurer les variables d'environnement
4. Déployer

## Contribution

Ce projet suit une architecture stricte et typée. Avant de contribuer :

1. Lire la documentation complète dans `/docs`
2. Respecter le TypeScript strict mode
3. Utiliser les validations Zod
4. Tester les politiques RLS
5. Maintenir le fichier TASKS.md à jour

## Licence

Propriétaire - Tous droits réservés
