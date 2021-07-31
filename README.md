# ghost-manager
Run ghost serverless.  Auto stop/start and static publishing. 


# How to switch branch after install
```shell script
git config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
git fetch origin
```


# Ghost Setup

You have to manually setup your ghost server. 

1) Install ghost (Todo, create init script)
    NOTE: Do not install nginx
    ```shell script
   # cd /var/www/ghost
   # sudo rm -rf *
   # ghost install 
    ```
2) Setup Lets Encrypt (move to init script)
```shell
mkdir -p system 
cd system
git clone https://github.com/acmesh-official/acme.sh.git letsencrypt
bash ./acme.sh --home .  --register-account -m EMAIL
bash ./acme.sh --home . --issue --dns dns_aws -d DNS_NAME
```
3) Setup mail so ghost can email you account information.  You are on your own for now, good luck. 

4) Setup Ghost
    ```shell
    ghost-serverless/bin/ghost-setup
    ```
5) Restart nginx
    ```shell script
    # `sudo systemctl restart nginx`
    ```
5) Restart ghost to make sure it comes
    ```shell script
    # cd /var/www/ghost
    # ghost restart
    ``` 
6) WebHooks
   - Live Mode (optional, required for spot)
     - From the ghost web admin (/ghost) page select Integrations 
     - At the bottom click "+Add custom integration"
     - Name it backups
     - At the bottom click "+ Add webhook"
        - Name: page
        - Event: Page Updated
        - Target URL: http://localhost:8888/
     - At the bottom click "+ Add webhook"
       - Name: post
       - Event: Post Updated
       - Target URL: http://localhost:8888/    - 
   - Static Mode Link to the static site publisher.  
       - From the ghost web admin (/ghost) page select Integrations 
       - At the bottom click "+Add custom integration"
       - Name it ghost-serverless
       - At the bottom click "+ Add webhook"
           - Name: publisher
           - Event: Global -> Site Changed (rebuild)
           - Target URL: http://localhost:8888/

7) Backup your hard work
    ```shell script
    # /var/www/ghost-serverless/bin/site-backup
    ```
9) Check your website (www.domain.com) not the (ghost.doamin.com)
