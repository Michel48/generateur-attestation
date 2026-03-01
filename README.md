# 🏆 Générateur d'Attestations — Loïc Rémy Trading Académie

Application Next.js de génération automatique d'attestations de formation PDF.

## ✦ Fonctionnalités

- Génération de certificats PDF A4 paysage
- Import Excel (.xlsx) ou CSV avec colonnes **Civilité** + **Nom Complet**
- Saisie manuelle (un nom par ligne)
- Téléchargement individuel ou ZIP complet
- Signature et logo intégrés
- Zéro serveur — 100% client-side

---

## 🚀 Déploiement GRATUIT sur Vercel (recommandé)

> Vercel est la plateforme officielle de Next.js. Hébergement gratuit, HTTPS, CDN mondial.

### Étape 1 — Préparer le code sur GitHub

1. Créez un compte sur [github.com](https://github.com)
2. Créez un nouveau dépôt : **New repository** → nommez-le `generateur-attestation`
3. Uploadez tous les fichiers de ce dossier dans le dépôt

### Étape 2 — Déployer sur Vercel

1. Créez un compte sur [vercel.com](https://vercel.com) (gratuit, connectez avec GitHub)
2. Cliquez **"Add New Project"**
3. Sélectionnez votre dépôt `generateur-attestation`
4. Laissez tous les paramètres par défaut (Vercel détecte Next.js automatiquement)
5. Cliquez **"Deploy"**

✅ Votre site sera en ligne à `https://generateur-attestation-xxxx.vercel.app`

---

## 💻 Lancer en local (développement)

```bash
# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
# → Ouvrez http://localhost:3000

# Build de production
npm run build
```

---

## 📄 Format du fichier Excel à importer

| Civilité (M. ou Mme) | Nom Complet              |
|----------------------|--------------------------|
| M.                   | HASSANE SOUCAIRADJOU     |
| Mme                  | AMINATA KONÉ             |
| M.                   | JEAN-BAPTISTE KOUAMÉ     |

> Le fichier modèle `modele_apprenants.xlsx` est disponible dans l'application.

---

## 📁 Structure du projet

```
Generateur_attestation/
├── app/
│   ├── layout.tsx          # Layout racine + Google Fonts
│   ├── page.tsx            # Page principale
│   └── globals.css         # Styles globaux
├── components/
│   └── Generator.tsx       # Composant principal (UI + logique)
├── lib/
│   ├── assets.ts           # Logo + Signature (base64 embarqués)
│   ├── drawCertificate.ts  # Moteur de rendu Canvas
│   ├── generatePDF.ts      # Export PDF avec jsPDF
│   └── useImages.ts        # Hook de chargement des images
├── public/
│   ├── logo.ico            # Logo Loïc Rémy Trading
│   ├── signature.png       # Signature
│   └── modele_apprenants.xlsx  # Template Excel à télécharger
└── package.json
```
