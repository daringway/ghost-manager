#!/bin/bash -x

# Install Guidelines from https://ghost.org/docs/install/ubuntu/
# Leverages https://pm2.keymetrics.io/docs/usage/pm2-doc-single-page/

INSTALL_DIR=/var/www/ghost-serverless
RELEASE_VERSION=main
NODE_VERSION=14

if [[ $(id -u) != "0" ]]
then
  echo "ERROR: must run as root"
  exit 2
fi

START_TS=$(date +%s)

echo "ghost-serverless ts 0: starting"

# Add Repos
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
apt-get update

snap install --classic aws-cli
apt-get install -y jq fish

# change ubuntu to fish, yes really
sudo chsh -s /usr/bin/fish ubuntu

###### Download ghost serverless ######
git clone --single-branch https://github.com/daringway/ghost-serverless $INSTALL_DIR

echo "ghost-serverless ts $(( $(date +%s) - $START_TS )): core packages installed"

while ! aws sts get-caller-identity
do
  echo "Missing IAM Role or not attached , sleeping 15"
  sleep 15
done

echo "ghost-serverless ts $(( $(date +%s) - $START_TS )): AWS creds verified"

# Setup the .env
$INSTALL_DIR/update.sh
source $INSTALL_DIR/.env

hostname $( echo $CMS_HOSTNAME | tr . - )

# Want to setup the DNS record early so DNS has time to update
IP=$(curl http://169.254.169.254/latest/meta-data/public-ipv4)
TTL=120 # We set to 2 minutes because it takes that long for the rest of the setup
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{"Name":"'$CMS_HOSTNAME'","Type":"A","TTL":'$TTL',"ResourceRecords":[{"Value":"'$IP'"}]}}]}'

echo "ghost-serverless ts $(( $(date +%s) - $START_TS )): DNS updated"

# Install rest of needed software packages
curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y yarn  nginx nodejs
npm install ghost-cli@latest pm2@latest eslint ghost-static-site-generator -g

echo "ghost-serverless ts $(( $(date +%s) - $START_TS )): all packages installed"

# Setup firewall
ufw allow 'Nginx Full'

for DIR in $INSTALL_DIR/publisher $INSTALL_DIR/starter $INSTALL_DIR/stopper
do
  (cd $DIR; npm install)
done

echo "ghost-serverless ts $(( $(date +%s) - $START_TS )): ghost-serverless npm packages installed"

mkdir -p /var/www/ghost $INSTALL_DIR $WEB_DIR $BACKUP_DIR
chown -R ubuntu:ubuntu /var/www /home/ubuntu $INSTALL_DIR
chmod 775 /var/www/ghost

# TODO update nginx upload limit

# Wrap this in a webserver so you can see the status from the browser (Or at least give steps and not full logs)
su ubuntu -c $INSTALL_DIR/bin/site-restore

echo "ghost-serverless ts $(( $(date +%s) - $START_TS )): ghost site restored"

# Setup temp nginx to status service
# 1st restore site (not version)

# Setup ghost-serverless services
su ubuntu -c "cd $INSTALL_DIR; pm2 start ecosystem.config.js"

echo "ghost-serverless ts $(( $(date +%s) - $START_TS )): ghost-serverless started"
echo "ghost-serverless ts $(( $(date +%s) - $START_TS )): done"
