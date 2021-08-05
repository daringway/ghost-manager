#!/bin/bash -x

INSTALL_DIR=/var/www/ghost-serverless

START_TS=$(date +%s)

# Setup firewall
# ufw allow 'Nginx Full'
# TODO update nginx upload limit


for DIR in $(ls -d $INSTALL_DIR/services/*)
do
  (cd $DIR; npm install)
done

# Setup ghost-serverless services
su ubuntu -c "cd $INSTALL_DIR; pm2 start ecosystem.config.js"

echo "ghost-serverless ts $(( $(date +%s) - $START_TS )): ghost-serverless installed"
