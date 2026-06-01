#!/bin/bash
set -e

echo "========================================="
echo "  CodeSleuth Production Deployment"
echo "  Domain: www.codesleuth.ai"
echo "========================================="
echo ""

PROJECT_DIR="/home/pope/sites/CodeSleuth"
NGINX_CONF_DIR="/etc/nginx/sites-available"
NGINX_ENABLED_DIR="/etc/nginx/sites-enabled"

# ─── Step 1: Install system packages ───────────────────────────
echo "Step 1: Installing nginx, certbot..."
sudo apt update -qq
sudo apt install -y nginx certbot python3-certbot-nginx
echo "✓ nginx and certbot installed"

# ─── Step 2: Install PM2 globally ──────────────────────────────
echo ""
echo "Step 2: Installing PM2..."
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi
echo "✓ PM2 installed: $(pm2 -v)"

# ─── Step 3: Create certbot webroot ────────────────────────────
echo ""
echo "Step 3: Setting up certbot webroot..."
sudo mkdir -p /var/www/certbot
echo "✓ Webroot created"

# ─── Step 4: Deploy HTTP-only nginx config for cert generation ─
echo ""
echo "Step 4: Deploying temporary HTTP nginx config..."
sudo cp "$PROJECT_DIR/nginx/codesleuth-http-only.conf" "$NGINX_CONF_DIR/codesleuth.conf"
sudo ln -sf "$NGINX_CONF_DIR/codesleuth.conf" "$NGINX_ENABLED_DIR/codesleuth.conf"
# Remove default site if it exists and conflicts
sudo rm -f "$NGINX_ENABLED_DIR/default"
sudo nginx -t
sudo systemctl restart nginx
echo "✓ HTTP nginx config active"

# ─── Step 5: Start the app with PM2 ───────────────────────────
echo ""
echo "Step 5: Starting CodeSleuth with PM2..."
cd "$PROJECT_DIR"
pm2 delete codesleuth 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
echo "✓ App running on port 3100"

# ─── Step 6: Wait for app to be ready ─────────────────────────
echo ""
echo "Step 6: Waiting for app to start..."
sleep 3
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3100 | grep -q "200\|302"; then
    echo "✓ App responding on port 3100"
else
    echo "⚠ App may still be starting up, continuing..."
fi

# ─── Step 7: Generate SSL certificates ────────────────────────
echo ""
echo "Step 7: Generating SSL certificates with Let's Encrypt..."
echo "IMPORTANT: Make sure DNS for codesleuth.ai and www.codesleuth.ai"
echo "           points to this server's IP: $(curl -s ifconfig.me)"
echo ""
read -p "Press Enter when DNS is configured (or Ctrl+C to abort)..."

sudo certbot --nginx -d codesleuth.ai -d www.codesleuth.ai \
    --non-interactive --agree-tos \
    --email admin@codesleuth.ai \
    --redirect

echo "✓ SSL certificates generated"

# ─── Step 8: Deploy full SSL nginx config ──────────────────────
echo ""
echo "Step 8: Deploying production SSL nginx config..."
sudo cp "$PROJECT_DIR/nginx/codesleuth.conf" "$NGINX_CONF_DIR/codesleuth.conf"
sudo nginx -t
sudo systemctl reload nginx
echo "✓ Production nginx config active"

# ─── Step 9: Set PM2 to start on boot ─────────────────────────
echo ""
echo "Step 9: Setting up PM2 startup..."
pm2 startup systemd -u pope --hp /home/pope 2>/dev/null || \
    echo "Run the command PM2 suggests above with sudo"
pm2 save
echo "✓ PM2 startup configured"

# ─── Step 10: Set up auto-renewal ─────────────────────────────
echo ""
echo "Step 10: Setting up SSL auto-renewal..."
sudo systemctl enable certbot.timer 2>/dev/null || \
    (sudo crontab -l 2>/dev/null | grep -v certbot; echo "0 3 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | sudo crontab -
echo "✓ Auto-renewal configured"

echo ""
echo "========================================="
echo "  ✅ DEPLOYMENT COMPLETE"
echo "========================================="
echo "  Site: https://www.codesleuth.ai"
echo "  PM2:  pm2 status / pm2 logs codesleuth"
echo "  Nginx: sudo nginx -t && sudo systemctl reload nginx"
echo "========================================="
