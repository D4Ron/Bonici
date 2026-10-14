# Bonici — site web

Site de commande en ligne de Bonici Africa (Lomé, Aného). Remplace l'ancien site Angular + Django (`../Old-site`).

- **Next.js 16** (App Router, TypeScript), un seul projet pour le site public, l'API (server actions) et le back-office.
- **PostgreSQL 16** via **Prisma 6**.
- **Docker** : `compose.yaml` (production) + `compose.override.yaml` (développement).
- **Odoo** : chaque commande du site est créée dans Odoo comme bon de commande (`sale.order`). Facultatif.

## Démarrer en local

Prérequis : Docker Desktop.

```bash
cp .env.example .env        # puis changer les mots de passe
docker compose up --build   # site sur http://localhost:3000
```

Le service `migrate` applique les migrations, crée les restaurants, les catégories, les avis Google et le premier compte
administrateur (`ADMIN_EMAIL` / `ADMIN_PASSWORD`), et la carte de Bonici (`prisma/data/menu.ts`, transcrite des PDF du client)
si la base n'a encore aucun plat. Les modifications faites ensuite dans l'admin ne sont jamais écrasées.

Sans Docker pour l'application (plus rapide sous Windows), en gardant la base dans Docker :

```bash
docker compose up -d db     # Postgres exposé sur le port 5433
npm install
npx prisma migrate deploy
npm run db:seed
npm run dev
```

Back-office : `/admin`. Un gérant de restaurant (créé dans Admin → Utilisateurs) ne voit que les commandes et la carte de son restaurant.

## Production

```bash
docker compose -f compose.yaml --profile prod up -d --build
```

- `proxy` (Caddy) obtient le certificat HTTPS de `DOMAIN` automatiquement (ports 80/443).
- Pour tester la production **sur la machine de développement**, donnez-lui un autre nom de projet, sinon Docker
  recrée la base de dev sans son port 5433 et `npm run dev` perd la connexion :
  `docker compose -p bonici-prod -f compose.yaml up -d --build` (avec `APP_PORT=3100` si le port 3000 est pris).
- Volumes à sauvegarder : `db_data` (base) et `uploads` (photos, documents, CV).

Sauvegarde de la base :

```bash
docker compose exec db pg_dump -U bonici bonici > sauvegarde.sql
```

## Odoo

1. Dans Odoo : Préférences → Sécurité du compte → **Nouvelle clé API** (utilisateur ayant les droits Ventes).
2. Dans `.env` : `ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_API_KEY`, et l'ID d'un produit générique
   (`ODOO_FALLBACK_PRODUCT_ID`) et d'un produit « Frais de livraison » (`ODOO_DELIVERY_PRODUCT_ID`).
3. Redémarrer, puis vérifier Admin → **Odoo** (test de connexion).
4. Pour un suivi propre du stock et des ventes, renseigner sur chaque plat son **ID produit Odoo**.

Fonctionnement : à chaque commande, le site cherche le client par téléphone (ou le crée), crée le bon de commande
avec les lignes, remises et frais de livraison, et le confirme (`ODOO_CONFIRM_ORDERS`). Si Odoo ne répond pas, la commande
du client n'est jamais bloquée : elle est marquée « échec » et peut être renvoyée depuis l'admin ou avec
`docker compose run --rm migrate npm run odoo:sync`. Les renvois ne créent pas de doublon (référence `WEB-<n°>`).
Une annulation sur le site annule aussi le bon de commande dans Odoo.

Compatible Odoo 14 à 19 (API JSON-RPC externe), Community ou Enterprise, hébergé ou Odoo Online (offres payantes).
Une instance de test : `docker compose --profile odoo up -d odoo`, puis http://localhost:8069.
Vérification de bout en bout sur une commande existante (envoi, comparaison des totaux, annulation) :
`npx tsx --env-file-if-exists=.env scripts/odoo-check.ts <n° de commande>` — uniquement sur une base Odoo de test.

Les prix du site sont TTC : par défaut aucune taxe n'est ajoutée par Odoo (sinon la TVA s'ajouterait au total payé).
Pour déclarer la TVA, créez dans Odoo une taxe « incluse dans le prix » et indiquez son ID dans `ODOO_LINE_TAX_IDS`.
Si les totaux Odoo et site diffèrent, la commande n'est pas créée et l'erreur s'affiche dans l'admin.

## Tests

```bash
npm test          # règles de prix, statuts de commande, droits d'accès
npm run typecheck
```

## Organisation du code

```
prisma/            schéma, migrations, seed ; data/menu.ts = la carte (2 versions : B ajoute Red Bull)
src/lib/           logique métier : pricing.ts, order-status.ts, permissions.ts, odoo.ts, auth.ts, catalog.ts
src/app/(site)/    pages publiques
src/app/(auth)/    connexion, inscription, mot de passe oublié
src/app/admin/     back-office (_actions = server actions)
src/app/actions/   server actions publiques (commande, compte, candidature)
src/styles/legacy/ styles repris de l'ancien site (un fichier par composant, isolé par une classe .s-*)
src/components/    composants partagés, dont Icon.tsx (le site n'utilise pas d'emoji)
```

## Ce qui reste à fournir par Bonici

- L'**adresse exacte de Tam Tam** (coordonnées GPS) ; les 6 autres restaurants sont placés.
- Les **vraies photos** des plats : les photos actuelles sont génériques (Unsplash, voir `public/images/menu/CREDITS.md`).
- Confirmation des **tailles** : pizzas lues comme Moyenne / Grande, poisson comme Petit / Moyen / Grand.
- La description de la **Salade fermière** (le PDF reprend par erreur celle du chawarma).
- Les **horaires** de chaque restaurant (seule l'heure de fermeture, 23h, est connue).
- Le texte des **CGU** (page `/cgu`) et une relecture de `/confidentialite`.
- Un serveur **SMTP** pour les emails de mot de passe oublié (sans SMTP, le lien s'affiche dans les logs).
- L'accès **Odoo** (URL, base, clé API) s'ils l'utilisent.
