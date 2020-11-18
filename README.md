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
1) Setup mail so ghost can email you account information.  You are on your own for now, good luck. 
1) Restart ghost to make sure it comes
    ```shell script
    # cd /var/www/ghost
    # ghost restart
    ``` 
1) Edit your -ssl.conf nginx file that exists in the /etc/nginx/sites-enabled below by adding the upstream stream and updating the proxy_pass
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
1) Link to the static site publisher.  
    - From the ghost web admin (/ghost) page select Integrations 
    - At the bottom click "+Add custom integration"
    - Name it ghost-serverless
    - At the bottom click "+ Add webhook"
        - Name: publisher
        - Event: Global -> Site Changed (rebuild)
        - Target URL: http://localhost:8888/
1) Restart nginx
    ```shell script
    # sudo systemctl restart nginx
    ```
1) Backup your hard work
    ```shell script
    # /var/www/ghost-serverless/bin/site-backup
    ```
1) Do your first publish
    ```shell script
    # /var/www/ghost-serverless/bin/ghost-publish
    ```
1) Check your website (www.domain.com) not the (ghost.doamin.com)
    

