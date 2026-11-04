# Deploying the render server on AWS (ECS Fargate + S3), step by step

Exact commands for AWS CLI v2. Replace the variables in the first block; everything else is copy-paste.
Time: ~30 minutes the first time. Result: `https://render.example.com` serving the API in `../API.md`.

```bash
export AWS_REGION=eu-central-1            # pick the region closest to your users
export ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
export S3_BUCKET=flowleaf-renders-$ACCOUNT_ID
export RENDER_DOMAIN=render.example.com   # a domain you control (Route 53 or elsewhere)
export IMAGE_TAG=v1
```

## 1. Bucket for finished videos
```bash
aws s3api create-bucket --bucket $S3_BUCKET --region $AWS_REGION \
  --create-bucket-configuration LocationConstraint=$AWS_REGION
aws s3api put-public-access-block --bucket $S3_BUCKET \
  --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
# delete raw renders after 14 days (the Worker copies what it keeps into R2)
aws s3api put-bucket-lifecycle-configuration --bucket $S3_BUCKET --lifecycle-configuration \
  '{"Rules":[{"ID":"expire","Status":"Enabled","Filter":{"Prefix":"flowleaf-renders/"},"Expiration":{"Days":14}}]}'
```
Output links are presigned (7 days); no public bucket needed. (Alternative: Cloudflare R2 — set `S3_ENDPOINT_URL`
and `S3_REGION=auto`, use an R2 API token as `AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY`.)

## 2. Secrets
```bash
aws secretsmanager create-secret --name flowleaf/render-token --secret-string "$(openssl rand -hex 32)" --region $AWS_REGION
aws secretsmanager create-secret --name flowleaf/elevenlabs --secret-string "<your ElevenLabs key or 'none'>" --region $AWS_REGION
```
Put the same render token into the Worker: `wrangler secret put RENDER_SERVER_TOKEN`.
(No ElevenLabs key? Remove that entry from `ecs-task-definition.json` — renders use synth music + captions.)

## 3. IAM roles
```bash
cat > /tmp/trust.json <<'JSON'
{"Version":"2012-10-17","Statement":[{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]}
JSON
# execution role: pull image, write logs, read the two secrets
aws iam create-role --role-name flowleaf-render-execution --assume-role-policy-document file:///tmp/trust.json
aws iam attach-role-policy --role-name flowleaf-render-execution \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
aws iam put-role-policy --role-name flowleaf-render-execution --policy-name secrets --policy-document \
  "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"secretsmanager:GetSecretValue\",\"logs:CreateLogGroup\"],\"Resource\":\"*\"}]}"
# task role: the app itself writes to the bucket
aws iam create-role --role-name flowleaf-render-task --assume-role-policy-document file:///tmp/trust.json
aws iam put-role-policy --role-name flowleaf-render-task --policy-name s3 --policy-document \
  "{\"Version\":\"2012-10-17\",\"Statement\":[{\"Effect\":\"Allow\",\"Action\":[\"s3:PutObject\",\"s3:GetObject\"],\"Resource\":\"arn:aws:s3:::$S3_BUCKET/*\"}]}"
```

## 4. Image
```bash
cd render-server
AWS_REGION=$AWS_REGION ./deploy/build-and-push.sh $IMAGE_TAG       # creates the ECR repo on first run
```
Build on an x86_64 machine or pass `--platform linux/amd64` (the script does). If Docker Hub rate-limits you:
`docker build --build-arg BASE_IMAGE=public.ecr.aws/docker/library/python:3.12-slim ...`.

## 5. Cluster, task definition, service behind HTTPS
```bash
aws ecs create-cluster --cluster-name flowleaf --region $AWS_REGION
envsubst < deploy/ecs-task-definition.json > /tmp/taskdef.json
aws ecs register-task-definition --cli-input-json file:///tmp/taskdef.json --region $AWS_REGION
```
Networking (default VPC is fine to start):
```bash
VPC=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query 'Vpcs[0].VpcId' --output text)
SUBNETS=$(aws ec2 describe-subnets --filters Name=vpc-id,Values=$VPC --query 'Subnets[*].SubnetId' --output text | tr '\t' ',')
ALB_SG=$(aws ec2 create-security-group --group-name flowleaf-alb --description alb --vpc-id $VPC --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id $ALB_SG --protocol tcp --port 443 --cidr 0.0.0.0/0
TASK_SG=$(aws ec2 create-security-group --group-name flowleaf-render --description render --vpc-id $VPC --query GroupId --output text)
aws ec2 authorize-security-group-ingress --group-id $TASK_SG --protocol tcp --port 8080 --source-group $ALB_SG

CERT=$(aws acm request-certificate --domain-name $RENDER_DOMAIN --validation-method DNS --query CertificateArn --output text)
# -> add the CNAME shown by `aws acm describe-certificate --certificate-arn $CERT` to your DNS, wait for ISSUED

ALB=$(aws elbv2 create-load-balancer --name flowleaf-render --subnets ${SUBNETS//,/ } --security-groups $ALB_SG \
  --query 'LoadBalancers[0].LoadBalancerArn' --output text)
aws elbv2 modify-load-balancer-attributes --load-balancer-arn $ALB --attributes Key=idle_timeout.timeout_seconds,Value=120
TG=$(aws elbv2 create-target-group --name flowleaf-render --protocol HTTP --port 8080 --vpc-id $VPC --target-type ip \
  --health-check-path /health --query 'TargetGroups[0].TargetGroupArn' --output text)
aws elbv2 create-listener --load-balancer-arn $ALB --protocol HTTPS --port 443 --certificates CertificateArn=$CERT \
  --default-actions Type=forward,TargetGroupArn=$TG

aws ecs create-service --cluster flowleaf --service-name render --task-definition flowleaf-render \
  --desired-count 1 --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$TASK_SG],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=$TG,containerName=render,containerPort=8080 --region $AWS_REGION
```
Point `$RENDER_DOMAIN` (CNAME/alias) at the ALB DNS name (`aws elbv2 describe-load-balancers --names flowleaf-render`).

## 6. Wire the Worker and check
```bash
curl https://$RENDER_DOMAIN/health        # {"ok":true,...,"storage":"s3","auth":true}
# wrangler.jsonc vars: "RENDER_SERVER_URL": "https://render.example.com"  (secret RENDER_SERVER_TOKEN set in step 2)
```
Then render a quick draft from `/en/studio`.

## Updating
```bash
./deploy/build-and-push.sh v2 && sed -i 's/IMAGE_TAG=.*/IMAGE_TAG=v2/' ... # or: export IMAGE_TAG=v2
envsubst < deploy/ecs-task-definition.json > /tmp/taskdef.json && aws ecs register-task-definition --cli-input-json file:///tmp/taskdef.json
aws ecs update-service --cluster flowleaf --service render --task-definition flowleaf-render --force-new-deployment
```
Jobs are kept on the task's ephemeral disk (50 GiB) only while rendering; finished outputs live in S3, so replacing a
task is safe (a job that was mid-render is lost — the Worker marks it failed after 45 min and the student re-renders).

## Sizing & cost
- 4 vCPU / 8 GB renders a 30 s 1080×1920 video in ~35 s. One render at a time per task (`FLR_CONCURRENCY=1`).
- Fargate ≈ $0.04/vCPU-h + $0.0044/GB-h → a task running 24/7 ≈ $145/month; scale to zero off-hours with a
  scheduled `update-service --desired-count 0`, or use **EC2** (`c7a.xlarge`, Docker + `docker run --restart=always`)
  for ~$70/month with persistent disk and local storage.
- Per video ≈ 40 CPU-seconds ≈ $0.0005.

## Cheaper single-box option (EC2)
```bash
# on an Ubuntu c7a.xlarge with ports 80/443 open
sudo apt-get install -y docker.io caddy
docker run -d --restart=always --name render -p 127.0.0.1:8080:8080 -v /srv/flr:/data \
  -e RENDER_SERVER_TOKEN=... -e PUBLIC_BASE_URL=https://$RENDER_DOMAIN -e ELEVENLABS_API_KEY=... \
  $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/flowleaf-render:$IMAGE_TAG
echo "$RENDER_DOMAIN { reverse_proxy 127.0.0.1:8080 }" | sudo tee /etc/caddy/Caddyfile && sudo systemctl reload caddy
```
(Local storage + signed links work on EC2; `chown 10001 /srv/flr` so the non-root container user can write.)
