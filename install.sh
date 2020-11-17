#!/bin/bash -x

INSTALL_DIR=/var/www/ghost-serverless
RELEASE_VERSION=main
NODE_VERSION=14

mkdir -p $INSTALL_DIR
git clone --single-branch https://github.com/daringway/ghost-serverless?ref=master $INSTALL_DIR

$INSTALL_DIR/update.sh
source $INSTALL_DIR/.env

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
  (cd $DIR; npm install)
done

sudo npm install pm2@latest eslint ghost-static-site-generator -g
pm2 startup systemd

sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
pm2 start ecosystem.config.js
pm2 save



#cd /var/www/ghost
#ghost install local
#ghost setup linux-user systemd
#sudo rm -r /var/www/ghost/config.development.json /var/www/ghost/content /var/www/ghost/current

# TODO run ghost install
# TODO configure ghost for mailgun https://ghost.org/docs/concepts/config/#setup-an-email-sending-account
