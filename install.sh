#!/bin/bash -x

INSTALL_DIR=/var/www/ghost-serverless
RELEASE_VERSION=main
NODE_VERSION=14

if [[ $(id -u) != "0" ]]
then
  echo "ERROR: must run as root"
  exit 2
fi

mkdir -p $INSTALL_DIR
git clone --single-branch https://github.com/daringway/ghost-serverless $INSTALL_DIR

mkdir -p $WEB_DIR $BACKUP_DIR

# Add yarn repo
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | sudo apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | sudo tee /etc/apt/sources.list.d/yarn.list

######Download and install Packages######
#sudo apt-get update
#sudo apt-get upgrade

curl -sL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo bash -
sudo apt-get install -y ec2-instance-connect nodejs nginx yarn jq fish
sudo snap install --classic aws-cli

# install ghost
sudo npm install ghost-cli@latest -g
sudo ghost setup linux-user systemd

# Setup firewall
sudo ufw allow 'Nginx Full'

######Download and install Ghost######
sudo mkdir -p /var/www/ghost
sudo chown -R ubuntu:ubuntu /var/www /home/ubuntu
sudo chmod 775 /var/www/ghost

# TODO update hostname
# TODO update nginx upload limit

for DIR in publisher starter stopper
do
  (cd $INSTALL_DIR/$DIR; npm install)
done

npm install pm2@latest eslint ghost-static-site-generator -g
pm2 startup systemd

env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 start ecosystem.config.js
pm2 save

INSTALL_DIR/bin/site-restore

#cd /var/www/ghost
#ghost install local
#ghost setup linux-user systemd
#sudo rm -r /var/www/ghost/config.development.json /var/www/ghost/content /var/www/ghost/current

# TODO run ghost install
# TODO configure ghost for mailgun https://ghost.org/docs/concepts/config/#setup-an-email-sending-account

while ! aws sts get-caller-identity
do
  echo "Missing credentials, sleeping 15"
  sleep 15
done

su ubuntu source $INSTALL_DIR/.env
source $INSTALL_DIR/.env

IP=$(curl http://169.254.169.254/latest/meta-data/public-ipv4)
TTL=60
aws route53 change-resource-record-sets --hosted-zone-id $ZONE_ID --change-batch '{"Changes":[{"Action":"UPSERT","ResourceRecordSet":{"Name":"'$CMS_HOSTNAME'","Type":"A","TTL":'$TTL',"ResourceRecords":[{"Value":"'$IP'"}]}}]}'
