#!/bin/bash
# ==============================================================================
# NPCI Forum Platform - Services Startup Script
# ==============================================================================
# Starts all core microservices and containers across EC2 Nodes.
# ==============================================================================

set -e

echo "================================================================="
echo "       NPCI Forum AI Platform - Starting Services Stack         "
echo "================================================================="

# Ensure directories exist
sudo mkdir -p /data/db/postgres /data/db/uploads /data/vector /etc/prometheus /etc/grafana/provisioning/dashboards
sudo chmod -R 777 /data/db /data/vector 2>/dev/null || true

# 1. Start Node Exporter System Metrics
echo "[1/6] Starting Node Exporter (System Metrics Agent)..."
sudo docker run -d --name node-exporter -p 9100:9100 -v /:/host:ro,rslave --restart always prom/node-exporter:latest --path.rootfs=/host 2>/dev/null || true

# 2. Start PostgreSQL Database
echo "[2/6] Starting PostgreSQL Database..."
sudo docker run -d --name npci-postgres -p 5432:5432 \
  -e POSTGRES_DB=npci_forum \
  -e POSTGRES_USER=npci_user \
  -e POSTGRES_PASSWORD=npci_password \
  -v /data/db/postgres:/var/lib/postgresql/data \
  --restart always postgres:15-alpine 2>/dev/null || true

# 3. Start Python AI Backend Engine
echo "[3/6] Starting Python AI Backend Engine (FastAPI)..."
sudo docker run -d --name npci-backend -p 8000:8000 \
  -e SERVICE_NAME="NPCI Forum Python Backend Engine" \
  -v /data/db:/data/db \
  --restart always pravinnpci/npci-forum-python-backend:latest 2>/dev/null || true

# 4. Start Node.js Frontend Web App
echo "[4/6] Starting Node.js Frontend Web App (Express + React)..."
sudo docker run -d --name npci-app -p 3000:3000 \
  -e PYTHON_BACKEND_URL="http://localhost:8000" \
  -v /data/db:/data/db \
  --restart always pravinnpci/npci-forum-app:latest 2>/dev/null || true

# 5. Start Qdrant Vector DB & MCP Vector Server (if on monitoring node)
echo "[5/6] Starting Qdrant Vector DB and MCP Vector Engine..."
sudo docker run -d --name npci-vector-db -p 6333:6333 -v /data/vector:/qdrant/storage --restart always qdrant/qdrant:latest 2>/dev/null || true
sudo docker run -d --name npci-mcp -p 8001:8000 -e SERVICE_NAME="NPCI Forum MCP Vector Engine" -v /data/vector:/data/vector --restart always pravinnpci/npci-forum-mcp:latest 2>/dev/null || true

# 6. Start Prometheus & Grafana Monitoring
echo "[6/6] Starting Prometheus & Grafana Monitoring Dashboards..."
if [ -f /etc/prometheus/prometheus.yml ]; then
  sudo docker run -d --name prometheus -p 9090:9090 -v /etc/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml --restart always prom/prometheus:latest 2>/dev/null || true
fi
if [ -d /etc/grafana/provisioning ]; then
  sudo docker run -d --name grafana -p 3001:3000 -e 'GF_SECURITY_ADMIN_PASSWORD=admin' -e 'GF_USERS_ALLOW_SIGN_UP=false' -v /etc/grafana/provisioning:/etc/grafana/provisioning --restart always grafana/grafana:latest 2>/dev/null || true
fi

echo "================================================================="
echo "✔ ALL NPCI FORUM SERVICES STARTED SUCCESSFULLY!"
echo "Web App: http://localhost:3000"
echo "Python Backend Docs: http://localhost:8000/docs"
echo "Grafana Dashboards: http://localhost:3001 (Admin / admin)"
echo "Prometheus Metrics: http://localhost:9090"
echo "================================================================="
