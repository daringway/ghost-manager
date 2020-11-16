#!/usr/bin/env bash

# TODO check that you have aws credentials
# TODO check that SSM_PREFIX tag

cd $(dirname $0)

while read LINE
do
  eval $LINE
done < <(./bin/aws-env-vars)

GHOST_DIR=${GHOST_DIR-/var/www/ghost}
PROJ_DIR=${PROJ_DIR-$(cd $(dirname ${0}); pwd)}
BACKUP_FILENAME=${BACKUP_FILENAME-ghost-backup.tbz2}
BACKUP_DIR=${BACKUP_DIR-${PROJ_DIR}/backups}

echo "
CLOUDFRONT_ID=${CLOUDFRONT_ID}
CMS_HOSTNAME=${CMS_HOSTNAME}
WEB_HOSTNAME=${WEB_HOSTNAME}
CMS_BUCKET=${CMS_BUCKET}
WEB_BUCKET=${WEB_BUCKET}
CMS_BUCKET_PREFIX=s3://${CMS_BUCKET}
WEB_BUCKET_PREFIX=s3://${WEB_BUCKET}
INACTIVE_SECONDS=${INACTIVE_SECONDS-300}
GHOST_DIR=$GHOST_DIR
BACKUP_DIR=$BACKUP_DIR
WEB_DIR=${WEB_DIR-${PROJ_DIR}/static_website}
BACKUP_FILENAME=${BACKUP_FILENAME}
LOG_DIR=${GHOST_DIR}/content/logs
BACKUP_FILE=${BACKUP_DIR}/${BACKUP_FILENAME}
" > .env

mkdir -p $WEB_DIR $BACKUP_DIR

# Install ghost publisher
if ! npm list -g --depth=0 pm2 >/dev/null
then
  for DIR in publisher starter stopper
  do
    (cd $DIR; npm install)
  done

  sudo npm install pm2@latest eslint ghost-static-site-generator -g
  pm2 startup systemd

  sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u ubuntu --hp /home/ubuntu
  pm2 start ecosystem.config.js
  pm2 save
fi

