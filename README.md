# ‧₊˚✩ ₊˚💻⊹♡ Static Site on a Linux Server

In this project I set up a basic Linux server, configured Nginx to serve a static website, and deployed the site with `rsync` using a `deploy.sh` script. I did it without a cloud provider. Instead of a cloud droplet, I created a Linux virtual machine on my own computer, which works the same way as a remote server.

## 📟 What I used

- **Windows** as my main computer
- **WSL2 (Ubuntu)** as my local workspace (SSH, rsync and the deploy script)
- **Multipass** to create the Ubuntu Linux server (virtual machine)
- **Nginx** as the web server
- **SSH keys** for secure access to the server
- **rsync** to upload the site

##  ⭑⚙️๋࣭ How I built it

### 1. Creating the server

I created an Ubuntu virtual machine with Multipass, from PowerShell:

```bash
multipass launch --name webserver --cpus 1 --memory 1G --disk 5G
multipass info webserver
```

`multipass info` shows the server's IP address, which I used to connect.

### 2. Connecting with SSH

I created an SSH key pair in WSL and copied the **public** key to the server's `~/.ssh/authorized_keys`. The private key never leaves my computer.

Because my key doesn't use the default file name, I created `~/.ssh/config` so SSH knows which key to use:

```
Host webserver
    HostName <server-ip>
    User ubuntu
    IdentityFile ~/.ssh/<my-key-name>
```

Now I connect with just:

```bash
ssh webserver
```

### 3. Installing Nginx

Inside the server:

```bash
sudo apt update
sudo apt install -y nginx
systemctl status nginx
```

### 4. Configuring Nginx for my site

I created the folder where the site lives and made my user its owner, so `rsync` can write to it:

```bash
sudo mkdir -p /var/www/my-site
sudo chown -R ubuntu:ubuntu /var/www/my-site
```

Then I created `/etc/nginx/sites-available/my-site`:

```nginx
server {
    listen 80 default_server;
    listen [::]:80 default_server;
    server_name _;

    root /var/www/my-site;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

The `root` line tells Nginx which folder to serve. I enabled the config, disabled the default site, tested it and reloaded Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/my-site /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Deploying with rsync

`deploy.sh` copies my local site to the server:

```bash
#!/usr/bin/env bash
set -euo pipefail

SERVER="webserver"
REMOTE_DIR="/var/www/my-site/"
LOCAL_DIR="./gdragon_interactive_site/"

rsync -avz --delete \
  --exclude '.git' \
  --exclude '.DS_Store' \
  "$LOCAL_DIR" "$SERVER:$REMOTE_DIR"

echo "Deployed."
```

A few things I learned about this script:

- The trailing `/` in `LOCAL_DIR` matters. It copies the **contents** of the folder, so `index.html` lands directly in the server folder.
- `--delete` removes files on the server that I deleted locally, so both sides always match.
- `rsync` only sends what changed, so later deploys are fast.

To update the site, I edit my files and run:

```bash
./deploy.sh
```

### 6. Viewing the site

Windows couldn't reach the virtual machine's network directly (a connection test from Windows to port 80 failed), while WSL could. To see the site in my browser, I used an SSH tunnel through WSL:

```bash
ssh -N -L 8080:localhost:80 webserver
```

Then I open `http://localhost:8080`.

```
Browser → localhost:8080 → SSH tunnel → port 80 on the server → Nginx
```
## ˖°📷༘ Static Site

<img width="1918" height="952" alt="image" src="https://github.com/user-attachments/assets/ab115657-c17f-4460-97e6-6214be69de51" />

This project is based on the [Static Site Server](https://roadmap.sh/projects/static-site-server) project from roadmap.sh.
