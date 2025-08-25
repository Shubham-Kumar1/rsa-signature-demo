# RSA Signature Demo - Kubernetes Deployment Guide

This guide provides step-by-step instructions for deploying the RSA Signature Demo application to a Kubernetes cluster with optimal configuration for production use.

## 🏗️ Architecture Overview

The deployment includes:
- **Multi-stage Docker build** for optimized container images
- **Nginx reverse proxy** with security headers and caching
- **Kubernetes deployment** with 3 replicas for high availability
- **Horizontal Pod Autoscaler** for automatic scaling
- **Ingress controller** with SSL termination
- **Monitoring and alerting** with Prometheus
- **Load balancing** and health checks

## 📋 Prerequisites

### Required Tools
- Docker
- kubectl
- kustomize
- Access to a Kubernetes cluster
- Container registry (Docker Hub, GCR, ECR, etc.)

### Cluster Requirements
- Kubernetes 1.20+
- Ingress controller (nginx-ingress recommended)
- cert-manager (for SSL certificates)
- Prometheus operator (for monitoring)

## 🚀 Quick Deployment

### 1. Configure Environment

Update the deployment script with your registry:

```bash
# Edit deploy.sh and update REGISTRY variable
REGISTRY="your-registry.com"  # e.g., docker.io/yourusername
```

### 2. Build and Deploy

```bash
# Make the script executable
chmod +x deploy.sh

# Run full deployment
./deploy.sh
```

### 3. Verify Deployment

```bash
# Check deployment status
./deploy.sh status

# Or manually check
kubectl get all -n rsa-signature-demo
```

## 🔧 Manual Deployment Steps

### 1. Build Docker Image

```bash
# Build the image
docker build -t rsa-signature-demo:latest .

# Tag for your registry
docker tag rsa-signature-demo:latest your-registry.com/rsa-signature-demo:latest

# Push to registry
docker push your-registry.com/rsa-signature-demo:latest
```

### 2. Deploy to Kubernetes

```bash
# Create namespace
kubectl create namespace rsa-signature-demo

# Apply all resources
kubectl apply -f k8s/
```

### 3. Configure Ingress

Update the ingress hostname in `k8s/ingress.yaml`:

```yaml
spec:
  tls:
  - hosts:
    - rsa-signature-demo.yourdomain.com  # Change this
```

## 📊 Monitoring and Observability

### Prometheus Metrics

The application exposes metrics at `/health` endpoint:
- HTTP response time
- Request count
- Error rates

### Grafana Dashboard

Create a dashboard with these metrics:
- Pod CPU and Memory usage
- Request latency
- Error rates
- Pod availability

### Alerts

The deployment includes alerts for:
- Application downtime
- High CPU usage (>80%)
- High memory usage (>80%)

## 🔒 Security Features

### Container Security
- Non-root user execution
- Read-only filesystem
- Dropped capabilities
- Security context restrictions

### Network Security
- TLS termination at ingress
- Security headers (CSP, X-Frame-Options, etc.)
- Network policies (if enabled)

### Application Security
- Content Security Policy
- XSS protection
- CSRF protection headers

## 📈 Scaling Configuration

### Horizontal Pod Autoscaler
- **Min replicas**: 2
- **Max replicas**: 10
- **CPU threshold**: 70%
- **Memory threshold**: 80%

### Resource Limits
- **CPU request**: 50m
- **CPU limit**: 200m
- **Memory request**: 64Mi
- **Memory limit**: 128Mi

## 🔄 Update and Rollback

### Rolling Updates
```bash
# Update image
kubectl set image deployment/rsa-signature-demo rsa-signature-demo=your-registry.com/rsa-signature-demo:v1.1.0 -n rsa-signature-demo

# Monitor rollout
kubectl rollout status deployment/rsa-signature-demo -n rsa-signature-demo
```

### Rollback
```bash
# Rollback to previous version
kubectl rollout undo deployment/rsa-signature-demo -n rsa-signature-demo

# Or use the script
./deploy.sh rollback
```

## 🧹 Cleanup

### Remove Application
```bash
# Delete all resources
kubectl delete namespace rsa-signature-demo

# Or use kustomize
kustomize build k8s/ | kubectl delete -f -
```

### Clean Docker Images
```bash
# Remove old images
docker image prune -f
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Pod Not Starting
```bash
# Check pod events
kubectl describe pod -n rsa-signature-demo

# Check logs
kubectl logs -n rsa-signature-demo deployment/rsa-signature-demo
```

#### 2. Image Pull Errors
```bash
# Check image pull secrets
kubectl get secrets -n rsa-signature-demo

# Verify image exists in registry
docker pull your-registry.com/rsa-signature-demo:latest
```

#### 3. Ingress Not Working
```bash
# Check ingress controller
kubectl get pods -n ingress-nginx

# Check ingress status
kubectl describe ingress -n rsa-signature-demo
```

### Debug Commands

```bash
# Check all resources
kubectl get all -n rsa-signature-demo

# Check events
kubectl get events -n rsa-signature-demo --sort-by='.lastTimestamp'

# Port forward for local testing
kubectl port-forward svc/rsa-signature-demo-service 8080:80 -n rsa-signature-demo
```

## 📝 Configuration Files

### Environment Variables
- `NODE_ENV`: Production environment
- `APP_TITLE`: Application title
- `APP_DESCRIPTION`: Application description

### Nginx Configuration
- Gzip compression enabled
- Security headers configured
- Static asset caching (1 year)
- Health check endpoint

### Kubernetes Resources
- **Namespace**: `rsa-signature-demo`
- **Deployment**: 3 replicas with rolling updates
- **Service**: ClusterIP and LoadBalancer
- **Ingress**: SSL termination and routing
- **HPA**: Automatic scaling
- **PDB**: High availability during maintenance

## 🎯 Performance Optimization

### Caching Strategy
- Static assets cached for 1 year
- HTML files cached for 1 hour
- Gzip compression for all text content

### Resource Optimization
- Multi-stage Docker build
- Alpine Linux base image
- Optimized nginx configuration
- Efficient resource limits

### Monitoring
- Prometheus metrics collection
- Grafana dashboards
- Alerting rules
- Health check endpoints

## 🔗 Useful Links

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Nginx Ingress Controller](https://kubernetes.github.io/ingress-nginx/)
- [Prometheus Operator](https://prometheus-operator.dev/)
- [cert-manager](https://cert-manager.io/)

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review Kubernetes events and logs
3. Verify configuration files
4. Test with port-forwarding locally
