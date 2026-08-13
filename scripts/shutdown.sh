#!/bin/bash
# ==============================================================================
# NPCI Forum Platform - Graceful System Shutdown Script
# ==============================================================================
# IMPORTANT: DO NOT RUN THIS SCRIPT AUTOMATICALLY DURING BUILD.
# This script is provided for manual execution when you want to safely stop
# all microservices, Docker containers, and Kubernetes/K3s pods on AWS EC2 nodes
# without deleting persistent database volumes.
# ==============================================================================

set -e

echo "================================================================="
echo "       NPCI Forum AI Platform - Initiating Graceful Shutdown     "
echo "================================================================="

# 1. Stop Core App Containers (1st EC2 Node / Local)
echo "[1/4] Stopping Core Application Containers (Web App, Python AI Backend, PostgreSQL DB)..."
sudo docker stop npci-app npci-backend npci-postgres node-exporter 2>/dev/null || true
sudo docker rm npci-app npci-backend npci-postgres node-exporter 2>/dev/null || true
echo "✔ Core App Containers stopped and removed."

# 2. Stop Vector, MCP & Monitoring Containers (2nd EC2 Node / Local)
echo "[2/4] Stopping MCP Vector Server & Monitoring Stack (Qdrant, Prometheus, Grafana)..."
sudo docker stop npci-mcp npci-vector-db prometheus grafana node-exporter-2 2>/dev/null || true
sudo docker rm npci-mcp npci-vector-db prometheus grafana node-exporter-2 2>/dev/null || true
echo "✔ Vector & Monitoring Containers stopped and removed."

# 3. Stop K3s Kubernetes Cluster Service (if running)
echo "[3/4] Stopping K3s Kubernetes Service..."
if command -v systemctl >/dev/null 2>&1 && systemctl is-active --quiet k3s; then
    sudo systemctl stop k3s || true
    echo "✔ K3s service stopped."
else
    echo "ℹ K3s service is not running or not installed."
fi

# 4. Clean Docker cache without touching persistent storage volumes
echo "[4/4] Cleaning unused Docker networks and dangling images..."
sudo docker image prune -f 2>/dev/null || true
sudo docker network prune -f 2>/dev/null || true

echo "================================================================="
echo "✔ ALL NPCI FORUM SERVICES SHUT DOWN SUCCESSFULLY!"
echo "Persistent database data in /data/db and /data/vector remains safe."
echo "To restart services manually, run: ./scripts/startup.sh"
echo "================================================================="
