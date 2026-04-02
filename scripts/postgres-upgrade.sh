#!/usr/bin/env bash
set -Eeuo pipefail

COMPOSE_FILE="docker-compose.deploy.yaml"
DB_SERVICE="summerjob-db"
WEB_SERVICE="summerjob-web"
DATA_VOLUME_ALIAS="postgres"

# Check correct scipt usage
TARGET_VERSION="${1:-}"
if [[ -z "$TARGET_VERSION" ]]; then
  echo "Usage: $0 <target_postgres_version>"
  echo "Example: $0 16"
  exit 1
fi

# Check if necessary files exist
if [[ ! -f "$COMPOSE_FILE" ]]; then
  echo "Compose file '$COMPOSE_FILE' not found"
  exit 1
fi
if [[ ! -f ".env" ]]; then
  echo ".env file not found"
  exit 1
fi

# Load envvars
source .env


# Check if necessary envvars exist
if [[ -z "$POSTGRES_USER" ]]; then
  echo "POSTGRES_USER not set"
  exit 1
fi
if [[ -z {$POSTGRES_PASSWORD} ]]; then
  echo "POSTGRES_PASSWORD not set"
  exit 1
fi
if [[ -z ${POSTGRES_DB} ]]; then
  echo "POSTGRES_DB not set"
  exit 1
fi


TIMESTAMP="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="./pg-upgrade-backups/$TIMESTAMP"
DUMP_FILE="$BACKUP_DIR/db.dump"
NEW_VOLUME="postgres_pg${TARGET_VERSION}_$TIMESTAMP"
TEMP_CONTAINER="summerjob-db-upgrade-$TIMESTAMP"

echo "Creating backup directory $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

echo "Checking current db container"
docker compose -f "$COMPOSE_FILE" ps "$DB_SERVICE" >/dev/null

# Stop web to prevent writes
echo "Stopping web"
docker compose -f "$COMPOSE_FILE" stop "$WEB_SERVICE"

echo "Dumping db"
docker compose -f "$COMPOSE_FILE" exec -T "$DB_SERVICE" \
  pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Fc > "$DUMP_FILE"

echo "Creating new volume $NEW_VOLUME"
docker volume create "$NEW_VOLUME" >/dev/null

# Start temp container
echo "Starting temporary postgres:$TARGET_VERSION container"
docker run -d \
  --name "$TEMP_CONTAINER" \
  -e POSTGRES_USER="$POSTGRES_USER" \
  -e POSTGRES_PASSWORD="$POSTGRES_PASSWORD" \
  -e POSTGRES_DB="$POSTGRES_DB" \
  -v "$NEW_VOLUME:/var/lib/postgresql/data" \
  postgres:"$TARGET_VERSION" >/dev/null

echo "Waiting for new postgres to be ready"
until docker exec "$TEMP_CONTAINER" pg_isready -U "$POSTGRES_USER" -d "$POSTGRES_DB" >/dev/null 2>&1; do
  echo "Not ready yet..."
  sleep 2
done
echo "Ready!"

# Restore db
echo "Restoring database"
cat "$DUMP_FILE" | docker exec -i "$TEMP_CONTAINER" pg_restore \
  -U "$POSTGRES_USER" \
  -d "$POSTGRES_DB" \
  --clean \
  --if-exists \
  --no-owner \
  --no-privileges

# Remove temp container
echo "Stopping and removing temporary container"
docker rm -f "$TEMP_CONTAINER" >/dev/null

# Print success message and next manual steps
echo
echo "---------------------------------------"
echo "Upgrade prepared successfully"
echo
echo "Backup file: $DUMP_FILE"
echo
echo "Next steps:"
echo "- Change postgres version in $COMPOSE_FILE to postgres:$TARGET_VERSION"
echo "- Change top-level volumes in $COMPOSE_FILE to:
volumes:
  $DATA_VOLUME_ALIAS:
    external: true
    name: $NEW_VOLUME
"
echo "- docker compose up -d $DB_SERVICE $WEB_SERVICE"
echo "- Test web app functionality"
echo
echo
echo "Rollback:"
echo "- Change $COMPOSE_FILE back to what it was before"
