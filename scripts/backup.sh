#!/usr/bin/env bash
# Sauvegarde de production : base de données + fichiers envoyés (photos, documents, CV),
# avec conservation limitée. Prévu pour cron :
#   0 3 * * * /home/<utilisateur>/bonici/scripts/backup.sh >> /home/<utilisateur>/sauvegardes/backup.log 2>&1
# Variables facultatives : BACKUP_DIR (défaut ~/sauvegardes), KEEP_DAYS (défaut 14).
set -euo pipefail

cd "$(dirname "$0")/.."
DEST="${BACKUP_DIR:-$HOME/sauvegardes}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%F)"
# Docker Compose préfixe les volumes par le nom du dossier du projet (ex. bonici_uploads).
VOLUME="$(basename "$PWD" | tr '[:upper:]' '[:lower:]')_uploads"
mkdir -p "$DEST"

# Base : pg_dump dans le conteneur, avec l'utilisateur et la base qu'il connaît déjà.
docker compose -f compose.yaml exec -T db sh -c 'pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB"' \
  | gzip > "$DEST/bonici-$STAMP.sql.gz"

# Fichiers envoyés : archive du volume, monté en lecture seule.
docker run --rm -v "$VOLUME":/data:ro -v "$DEST":/out alpine \
  tar czf "/out/uploads-$STAMP.tar.gz" -C /data .

find "$DEST" \( -name 'bonici-*.sql.gz' -o -name 'uploads-*.tar.gz' \) -mtime +"$KEEP_DAYS" -delete
echo "$(date '+%F %T') sauvegarde OK dans $DEST"
