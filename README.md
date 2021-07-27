# ghost-manager
Run ghost serverless.  Auto stop/start and static publishing. 


# How to switch branch after install
```shell script
git config remote.origin.fetch "+refs/heads/*:refs/remotes/origin/*"
git fetch origin
```


# Ghost Setup

You have to manually setup your ghost server. 

1) Install ghost 
    ```shell script
   # cd /var/www/ghost
   # ghost install 
    ```
2) Setup mail so ghost can email you account information.  You are on your own for now, good luck. 
3) Restart ghost to make sure it comes
    ```shell script
    # cd /var/www/ghost
    # ghost restart
    ``` 
4) Edit your -ssl.conf nginx file that exists in the /etc/nginx/sites-enabled below by adding the upstream stream and updating the proxy_pass
    ```
    upstream backend {
        server 127.0.0.1:2368;
        server 127.0.0.1:7777 backup;
    }
    server {
      *** REDACTED ***
        location / {
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header Host $http_host;
            proxy_pass http://backend;
    
        }
      *** REDACTED ***
    }
    ```  
5) WebHooks
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
6) Restart nginx
    ```shell script
    # sudo systemctl restart nginx
    ```
7) Backup your hard work
    ```shell script
    # /var/www/ghost-serverless/bin/site-backup
    ```
8) Do your first publish
    ```shell script
    # /var/www/ghost-serverless/bin/ghost-publish
    ```
9) Check your website (www.domain.com) not the (ghost.doamin.com)
