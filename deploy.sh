#!/bin/bash

# RSA Signature Demo - Kubernetes Deployment Script
set -e

# Configuration
IMAGE_NAME="rsa-signature-demo"
IMAGE_TAG="latest"
REGISTRY="docker.io/kumarshubham16"  # DockerHub registry
NAMESPACE="rsa-signature-demo"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi
    
    if ! command -v kustomize &> /dev/null; then
        print_warning "kustomize is not installed, installing..."
        curl -s "https://raw.githubusercontent.com/kubernetes-sigs/kustomize/master/hack/install_kustomize.sh" | bash
        sudo mv kustomize /usr/local/bin/
    fi
    
    print_status "Prerequisites check completed"
}

# Build Docker image
build_image() {
    print_status "Building Docker image..."
    
    # Build the image
    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
    
    # Tag for registry
    docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
    
    print_status "Docker image built successfully"
}

# Push Docker image
push_image() {
    print_status "Pushing Docker image to registry..."
    
    docker push ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
    
    print_status "Docker image pushed successfully"
}

# Deploy to Kubernetes
deploy_to_k8s() {
    print_status "Deploying to Kubernetes..."
    
    # Create namespace if it doesn't exist
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    # Update image in kustomization
    kustomize edit set image ${REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}
    
    # Apply all resources
    kustomize build k8s/ | kubectl apply -f -
    
    print_status "Deployment completed"
}

# Wait for deployment to be ready
wait_for_deployment() {
    print_status "Waiting for deployment to be ready..."
    
    kubectl wait --for=condition=available --timeout=300s deployment/rsa-signature-demo -n ${NAMESPACE}
    
    print_status "Deployment is ready"
}

# Check deployment status
check_status() {
    print_status "Checking deployment status..."
    
    echo "=== Pod Status ==="
    kubectl get pods -n ${NAMESPACE}
    
    echo -e "\n=== Service Status ==="
    kubectl get svc -n ${NAMESPACE}
    
    echo -e "\n=== Ingress Status ==="
    kubectl get ingress -n ${NAMESPACE}
    
    echo -e "\n=== HPA Status ==="
    kubectl get hpa -n ${NAMESPACE}
}

# Rollback deployment
rollback() {
    print_warning "Rolling back deployment..."
    
    kubectl rollout undo deployment/rsa-signature-demo -n ${NAMESPACE}
    kubectl rollout status deployment/rsa-signature-demo -n ${NAMESPACE}
    
    print_status "Rollback completed"
}

# Clean up
cleanup() {
    print_status "Cleaning up..."
    
    # Remove old images
    docker image prune -f
    
    print_status "Cleanup completed"
}

# Main deployment function
main() {
    print_status "Starting RSA Signature Demo deployment..."
    
    check_prerequisites
    build_image
    push_image
    deploy_to_k8s
    wait_for_deployment
    check_status
    cleanup
    
    print_status "Deployment completed successfully!"
    print_status "Access your application at: https://rsa-signature-demo.yourdomain.com"
}

# Parse command line arguments
case "$1" in
    "build")
        check_prerequisites
        build_image
        ;;
    "push")
        push_image
        ;;
    "deploy")
        deploy_to_k8s
        wait_for_deployment
        check_status
        ;;
    "status")
        check_status
        ;;
    "rollback")
        rollback
        ;;
    "cleanup")
        cleanup
        ;;
    *)
        main
        ;;
esac
