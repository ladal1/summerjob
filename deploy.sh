if [ "$EUID" -eq 0 ]
  then echo "It's not recommended to run this script as root, do you still want to continue? [y/n]"

  read -r -p "Are you sure? [y/N] " response
  if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]
  then
      echo "Ok, running as root, this might cause some problems."
  else
      exit 1
  fi
  exit
fi

echo "🚀 Starting deployment"
# Checking system predispositions
source .env
mkdir -p web-storage
mkdir -p backup

# Make database dump/backup
echo "📚 Creating database backup"
filename=/dump_$(date +"%Y-%m-%d_%H_%M_%S").gz
docker exec -t summerjob-db echo "summerjob-db:5432:$POSTGRES_DB:$POSTGRES_USER:$POSTGRES_PASSWORD" > ~/.pgpass
docker exec -t summerjob-db bash -c "pg_dumpall -c -U $POSTGRES_USER | gzip > $filename"
docker cp summerjob-db:/$filename backup/$filename

# Apply database migrations
echo "Applying database migrations"
docker compose run --rm summerjob-web npx prisma migrate deploy

# Download new docker manifest
echo "🔖 Downloading new docker compose manifest"
mv docker-compose.yaml docker-compose.yaml.old
curl https://raw.githubusercontent.com/ladal1/summerjob/main/docker-compose.deploy.yaml -O -s
mv docker-compose.deploy.yaml docker-compose.yaml

# Download updated containers
echo "🎉 Pulling containers"
docker compose pull

# Start containers
echo "🚀 Starting containers"
docker compose up -d