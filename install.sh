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

# Add yarn repo
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list

######Download and install Packages######
#sudo apt-get update
#sudo apt-get upgrade

curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
apt-get install -y nodejs nginx yarn jq fish # ec2-instance-connect
snap install --classic aws-cli

npm install pm2@latest eslint ghost-static-site-generator -g
npm install ghost-cli@latest -g

# Setup firewall
ufw allow 'Nginx Full'

while ! aws sts get-caller-identity
do
  echo "Missing credentials, sleeping 15"
  sleep 15
done

######Download and install Ghost######
git clone --single-branch https://github.com/daringway/ghost-serverless $INSTALL_DIR
$INSTALL_DIR/update.sh
for DIR in $INSTALL_DIR/publisher $INSTALL_DIR/starter $INSTALL_DIR/stopper
do
  (cd $DIR; npm install)
done

mkdir -p /var/www/ghost $INSTALL_DIR $WEB_DIR $BACKUP_DIR
chown -R ubuntu:ubuntu /var/www /home/ubuntu $INSTALL_DIR
chmod 775 /var/www/ghost

# TODO update hostname
# TODO update nginx upload limit

su ubuntu -c "cd $INSTALL_DIR; pm2 start ecosystem.config.js"

source $INSTALL_DIR/.env

IP=$(curl http://169.254.169.254/latest/meta-data/public-ipv4)
TTL=60
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{"Name":"'$CMS_HOSTNAME'","Type":"A","TTL":'$TTL',"ResourceRecords":[{"Value":"'$IP'"}]}}]}'

hostname $( echo $CMS_HOSTNAME | tr . - )

su ubuntu -c $INSTALL_DIR/bin/site-restore
