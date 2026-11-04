#!/usr/bin/env bash
# Build the render-server image and push it to ECR. Usage: AWS_REGION=eu-central-1 ./deploy/build-and-push.sh [tag]
set -euo pipefail
cd "$(dirname "$0")/.."
: "${AWS_REGION:?set AWS_REGION}"
TAG="${1:-$(git rev-parse --short HEAD)}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
REPO="$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowleaf-render"
aws ecr describe-repositories --repository-names flowleaf-render --region "$AWS_REGION" >/dev/null 2>&1 \
  || aws ecr create-repository --repository-name flowleaf-render --image-scanning-configuration scanOnPush=true --region "$AWS_REGION" >/dev/null
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
docker build --platform linux/amd64 -t "$REPO:$TAG" -t "$REPO:latest" .
docker push "$REPO:$TAG" && docker push "$REPO:latest"
echo "pushed $REPO:$TAG"
