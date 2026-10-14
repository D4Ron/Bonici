# Déploiement du site Bonici

Guide pour mettre en ligne le site sur **bonici.africa** et le maintenir. Durée d'une première installation : environ 30 minutes.

## 1. Vue d'ensemble

Le site tourne entièrement dans Docker, sur un seul serveur :

| Service | Rôle | Exposé sur Internet |
|---|---|---|
| `proxy` (Caddy) | HTTPS automatique (Let's Encrypt), redirige vers l'application | Oui : ports 80 et 443 |
| `app` (Next.js) | Le site public et l'administration (`/admin`) | Non (127.0.0.1:3000 seulement) |
| `db` (PostgreSQL 16) | Base de données | Non |
| `migrate` | Au démarrage : applique les migrations, crée les restaurants, la carte, les avis et le compte admin, puis s'arrête | — |

Données à conserver (volumes Docker) : `db_data` (base) et `uploads` (photos ajoutées dans l'admin, documents d'appels d'offre, CV).

## 2. Prérequis

- Un serveur Linux (VPS) **Ubuntu 22.04 ou 24.04**, 2 Go de RAM minimum (4 Go conseillés), 20 Go de disque.
- Un accès SSH avec un utilisateur `sudo`.
- L'accès à la zone DNS du domaine **bonici.africa**.
- Facultatif : un compte SMTP (emails « mot de passe oublié »), un accès Odoo.

## 3. Préparer le serveur

```bash
# Docker et le plugin compose
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER   # puis se déconnecter / reconnecter

# Pare-feu : SSH et web uniquement
sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

## 4. DNS

Chez le registrar du domaine, faire pointer le domaine vers l'IP publique du serveur **avant** le premier démarrage
(Caddy en a besoin pour obtenir le certificat HTTPS) :

| Type | Nom | Valeur |
|---|---|---|
| A | `bonici.africa` (ou `@`) | IP du serveur |
| A | `www` | IP du serveur |

Vérifier depuis le serveur : `dig +short bonici.africa` doit renvoyer son IP. La propagation peut prendre de quelques minutes à quelques heures.

> L'ancien site est servi sur ce même domaine. Le basculement se fait au moment où le DNS change : préparer le nouveau serveur
> complètement (étapes 5 à 7 avec un sous-domaine de test si besoin, ex. `nouveau.bonici.africa`), puis changer le DNS.
> L'ancienne base n'a pas à être migrée : elle ne contenait aucun plat ni avis (vérifié en octobre 2026).

## 5. Installer le site

```bash
git clone https://github.com/D4Ron/Bonici.git bonici
cd bonici
cp .env.example .env
nano .env
```

Dans `.env`, remplir au minimum :

| Variable | Valeur |
|---|---|
| `POSTGRES_PASSWORD` | Mot de passe long et aléatoire : `openssl rand -base64 24` |
| `DATABASE_URL` | Ignorée en production (Docker la construit), la laisser telle quelle |
| `SITE_URL` | `https://bonici.africa` |
| `DOMAIN` | `bonici.africa` |
| `ADMIN_EMAIL` | Email du premier administrateur |
| `ADMIN_PASSWORD` | Mot de passe provisoire (8 caractères min.), à changer après la première connexion |
| `SMTP_*`, `MAIL_FROM` | Facultatif ; sans SMTP, les liens « mot de passe oublié » s'affichent dans les logs |
| `CONTACT_EMAIL` | Facultatif ; email affiché sur la page Contact et dans le pied de page |
| `ODOO_*` | Facultatif, voir section 9 |

Protéger le fichier : `chmod 600 .env`. Ne jamais le committer (il est déjà exclu par `.gitignore`).

## 6. Premier démarrage

```bash
docker compose -f compose.yaml --profile prod up -d --build
```

> **Important** : toujours préciser `-f compose.yaml` en production. Sans cela, Docker ajoute `compose.override.yaml`
> (configuration de développement : rechargement à chaud, base exposée).

La première construction prend 5 à 15 minutes. Suivre l'avancement :

```bash
docker compose -f compose.yaml logs -f migrate   # doit finir par « Seed done: 7 branches, 53 dishes… »
docker compose -f compose.yaml logs -f proxy     # « certificate obtained successfully »
docker compose -f compose.yaml ps                # app : Up (healthy)
```

## 7. Vérifications après mise en ligne

1. `https://bonici.africa` s'ouvre avec le cadenas HTTPS ; `https://www.bonici.africa` redirige vers le domaine principal.
2. `https://bonici.africa/api/health` répond `{"ok":true}`.
3. Menus : les 7 restaurants apparaissent ; ajouter un plat (avec choix de taille pour une pizza), passer une commande test.
4. `https://bonici.africa/admin` : se connecter avec `ADMIN_EMAIL` / `ADMIN_PASSWORD`, retrouver la commande test, la passer en « Annulée ».
5. **Changer le mot de passe admin** : Admin → Utilisateurs → votre compte → nouveau mot de passe. Puis créer un compte
   « Gérant » par restaurant (chaque gérant ne voit que les commandes et la carte de son restaurant).

## 8. Mises à jour du site

```bash
cd ~/bonici
git pull
docker compose -f compose.yaml --profile prod up -d --build
```

Les migrations de base de données s'appliquent automatiquement. Les données saisies dans l'admin (carte, prix, photos) ne sont
jamais écrasées par une mise à jour.

**Revenir à la version précédente** si une mise à jour pose problème :

```bash
git log --oneline -5              # repérer le commit précédent
git checkout <commit>
docker compose -f compose.yaml --profile prod up -d --build
```

(Attention : une migration de base déjà appliquée n'est pas annulée ; faire une sauvegarde avant chaque mise à jour.)

## 9. Odoo (facultatif)

Chaque commande du site peut être créée automatiquement dans Odoo comme bon de commande (module Ventes).

1. Dans Odoo : Préférences → Sécurité du compte → **Nouvelle clé API**.
2. Créer deux produits : un produit générique « Plat (site web) » et « Frais de livraison ». Noter leurs ID.
3. Dans `.env` : `ODOO_URL`, `ODOO_DB`, `ODOO_USERNAME`, `ODOO_API_KEY`, `ODOO_FALLBACK_PRODUCT_ID`, `ODOO_DELIVERY_PRODUCT_ID`.
4. Redémarrer : `docker compose -f compose.yaml --profile prod up -d`.
5. Vérifier dans Admin → **Odoo** : la connexion doit être « Connecté ».

Les prix du site sont TTC : Odoo n'ajoute aucune taxe par défaut (`ODOO_LINE_TAX_IDS` vide). Si la comptabilité doit faire
apparaître la TVA, créer dans Odoo une taxe « incluse dans le prix » et mettre son ID dans `ODOO_LINE_TAX_IDS`.
Si Odoo est indisponible, les commandes continuent de fonctionner ; les renvoyer depuis Admin → Odoo → « Synchroniser maintenant ».

## 10. Sauvegardes

À faire **au minimum chaque jour**, et avant chaque mise à jour.

```bash
mkdir -p ~/sauvegardes
# Base de données
docker compose -f compose.yaml exec -T db pg_dump -U bonici bonici | gzip > ~/sauvegardes/bonici-$(date +%F).sql.gz
# Fichiers envoyés (photos, documents, CV)
docker run --rm -v bonici_uploads:/data -v ~/sauvegardes:/out alpine tar czf /out/uploads-$(date +%F).tar.gz -C /data .
```

Automatiser avec `crontab -e` (tous les jours à 3 h, conservation 14 jours) :

```cron
0 3 * * * cd ~/bonici && docker compose -f compose.yaml exec -T db pg_dump -U bonici bonici | gzip > ~/sauvegardes/bonici-$(date +\%F).sql.gz && find ~/sauvegardes -mtime +14 -delete
```

Copier régulièrement `~/sauvegardes` hors du serveur (autre machine, stockage cloud).

> Le nom exact du volume dépend du dossier du projet (`<dossier>_uploads`) : le vérifier avec `docker volume ls`.

**Restaurer** la base :

```bash
gunzip -c ~/sauvegardes/bonici-AAAA-MM-JJ.sql.gz | docker compose -f compose.yaml exec -T db psql -U bonici -d bonici
```

## 11. Exploitation courante

| Besoin | Commande |
|---|---|
| Voir l'état | `docker compose -f compose.yaml ps` |
| Logs du site | `docker compose -f compose.yaml logs -f --tail=100 app` |
| Redémarrer le site | `docker compose -f compose.yaml restart app` |
| Renvoyer les commandes vers Odoo | `docker compose -f compose.yaml run --rm migrate npm run odoo:sync` |
| Espace disque Docker | `docker system df` ; nettoyer les anciennes images : `docker image prune` |

## 12. Dépannage

| Symptôme | Cause probable / solution |
|---|---|
| Pas de HTTPS, erreur de certificat | Le DNS ne pointe pas encore vers le serveur, ou les ports 80/443 sont fermés. Vérifier `dig`, `ufw status`, puis `docker compose -f compose.yaml restart proxy`. |
| Page « Un problème est survenu » | La base est indisponible : `docker compose -f compose.yaml ps db`, puis `logs app`. |
| `migrate` en erreur, le site ne démarre pas | `docker compose -f compose.yaml logs migrate` ; souvent un `.env` incomplet (mot de passe de base). |
| Pas d'email « mot de passe oublié » | SMTP non configuré : le lien est dans `logs app`. |
| Commandes en « échec » dans Admin → Odoo | Le message d'erreur s'affiche sur la commande ; corriger (clé API, ID produit) puis « Synchroniser maintenant ». |

## 13. Avant l'ouverture au public

- [ ] Adresse exacte de **Bonici Tam Tam** : Admin → Restaurants → Tam Tam → latitude / longitude.
- [ ] Horaires de chaque restaurant (actuellement « Jusqu'à 23h »).
- [ ] Confirmer les tailles : pizzas Moyenne / Grande, poisson Petit / Moyen / Grand.
- [ ] Description de la Salade fermière.
- [ ] Texte des **CGU** (page `/cgu`) et relecture de `/confidentialite`.
- [ ] Remplacer progressivement les photos génériques par de vraies photos des plats (Admin → Plats).
- [ ] SMTP configuré et testé (« Mot de passe oublié »).
- [ ] Sauvegarde automatique en place (section 10).
