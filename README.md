# Bonici â€” site web

Site de commande en ligne de Bonici Africa (LomÃ©, AnÃ©ho). Remplace l'ancien site Angular + Django (`../Old-site`).

- **Next.js 16** (App Router, TypeScript), un seul projet pour le site public, l'API (server actions) et le back-office.
- **PostgreSQL 16** via **Prisma 6**.
- **Docker** : `compose.yaml` (production) + `compose.override.yaml` (dÃ©veloppement).
- **Odoo** : chaque commande du site est crÃ©Ã©e dans Odoo comme bon de commande (`sale.order`). Facultatif.

## DÃ©marrer en local

PrÃ©requis : Docker Desktop.

```bash
cp .env.example .env        # puis changer les mots de passe
docker compose up --build   # site sur http://localhost:3000
```

Le service `migrate` applique les migrations, crÃ©e les restaurants, les catÃ©gories, les avis Google et le premier compte
administrateur (`ADMIN_EMAIL` / `ADMIN_PASSWORD`), et la carte de Bonici (`prisma/data/menu.ts`, transcrite des PDF du client)
si la base n'a encore aucun plat. Les modifications faites ensuite dans l'admin ne sont jamais Ã©crasÃ©es.

Sans Docker pour l'application (plus rapide sous Windows), en gardant la base dans Docker :

```bash
docker compose up -d db     # Postgres exposÃ© sur le port 5433
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Back-office : `/admin`. Un gÃ©rant de restaurant (crÃ©Ã© dans Admin â†’ Utilisateurs) ne voit que les commandes et la carte de son restaurant.

## Production

Guide complet (serveur, DNS, sauvegardes, mises à jour) : [DEPLOYMENT.md](DEPLOYMENT.md).


```bash
docker compose -f compose.yaml --profile prod up -d --build
```

- `proxy` (Caddy) obtient le certificat HTTPS de `DOMAIN` automatiquement (ports 80/443).
- Pour tester la production **sur la machine de dÃ©veloppement**, donnez-lui un autre nom de projet, sinon Docker
  recrÃ©e la base de dev sans son port 5433 et `npm run dev` perd la connexion :
  `docker compose -p bonici-prod -f compose.yaml up -d --build` (avec `APP_PORT=3100` si le port 3000 est pris).
- Volumes Ã  sauvegarder : `db_data` (base) et `uploads` (photos, documents, CV).

Sauvegarde de la base :

```bash
docker compose exec db pg_dump -U bonici bonici > sauvegarde.sql
```

## Odoo

1. Dans Odoo : PrÃ©fÃ©rences â†’ SÃ©curitÃ© du compte â†’ **Nouvelle clÃ© API** (utilisateur ayant les droits Ventes).
2. Dans `.env` : `ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_API_KEY`, et l'ID d'un produit gÃ©nÃ©rique
   (`ODOO_FALLBACK_PRODUCT_ID`) et d'un produit Â« Frais de livraison Â» (`ODOO_DELIVERY_PRODUCT_ID`).
3. RedÃ©marrer, puis vÃ©rifier Admin â†’ **Odoo** (test de connexion).
4. Pour un suivi propre du stock et des ventes, renseigner sur chaque plat son **ID produit Odoo**.

Fonctionnement : Ã  chaque commande, le site cherche le client par tÃ©lÃ©phone (ou le crÃ©e), crÃ©e le bon de commande
avec les lignes, remises et frais de livraison, et le confirme (`ODOO_CONFIRM_ORDERS`). Si Odoo ne rÃ©pond pas, la commande
du client n'est jamais bloquÃ©e : elle est marquÃ©e Â« Ã©chec Â» et peut Ãªtre renvoyÃ©e depuis l'admin ou avec
`docker compose run --rm migrate npm run odoo:sync`. Les renvois ne crÃ©ent pas de doublon (rÃ©fÃ©rence `WEB-<nÂ°>`).
Une annulation sur le site annule aussi le bon de commande dans Odoo.

Compatible Odoo 14 Ã  19 (API JSON-RPC externe), Community ou Enterprise, hÃ©bergÃ© ou Odoo Online (offres payantes).
Une instance de test : `docker compose --profile odoo up -d odoo`, puis http://localhost:8069.
VÃ©rification de bout en bout sur une commande existante (envoi, comparaison des totaux, annulation) :
`npx tsx --env-file-if-exists=.env scripts/odoo-check.ts <nÂ° de commande>` â€” uniquement sur une base Odoo de test.

Les prix du site sont TTC : par dÃ©faut aucune taxe n'est ajoutÃ©e par Odoo (sinon la TVA s'ajouterait au total payÃ©).
Pour dÃ©clarer la TVA, crÃ©ez dans Odoo une taxe Â« incluse dans le prix Â» et indiquez son ID dans `ODOO_LINE_TAX_IDS`.
Si les totaux Odoo et site diffÃ¨rent, la commande n'est pas crÃ©Ã©e et l'erreur s'affiche dans l'admin.

## Tests

```bash
npm test          # rÃ¨gles de prix, statuts de commande, droits d'accÃ¨s
npm run typecheck
```

## Organisation du code

```
prisma/            schÃ©ma, migrations, seed ; data/menu.ts = la carte (2 versions : B ajoute Red Bull)
src/lib/           logique mÃ©tier : pricing.ts, order-status.ts, permissions.ts, odoo.ts, auth.ts, catalog.ts
src/app/(site)/    pages publiques
src/app/(auth)/    connexion, inscription, mot de passe oubliÃ©
src/app/admin/     back-office (_actions = server actions)
src/app/actions/   server actions publiques (commande, compte, candidature)
src/styles/legacy/ styles repris de l'ancien site (un fichier par composant, isolÃ© par une classe .s-*)
src/components/    composants partagÃ©s, dont Icon.tsx (le site n'utilise pas d'emoji)
```

## Ce qui reste Ã  fournir par Bonici

- L'**adresse exacte de Tam Tam** (coordonnÃ©es GPS) ; les 6 autres restaurants sont placÃ©s.
- Les **vraies photos** des plats : les photos actuelles sont gÃ©nÃ©riques (Unsplash, voir `public/images/menu/CREDITS.md`).
- Confirmation des **tailles** : pizzas lues comme Moyenne / Grande, poisson comme Petit / Moyen / Grand.
- La description de la **Salade fermiÃ¨re** (le PDF reprend par erreur celle du chawarma).
- Les **horaires** de chaque restaurant (seule l'heure de fermeture, 23h, est connue).
- Le texte des **CGU** (page `/cgu`) et une relecture de `/confidentialite`.
- Un serveur **SMTP** pour les emails de mot de passe oubliÃ© (sans SMTP, le lien s'affiche dans les logs).
- L'accÃ¨s **Odoo** (URL, base, clÃ© API) s'ils l'utilisent.
