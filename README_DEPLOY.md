# Ubuntu 서버 Docker 배포 가이드

## 📋 사전 요구사항

### 1. Ubuntu 서버 준비

- Ubuntu 20.04 LTS 이상
- 최소 2GB RAM
- 최소 10GB 디스크 공간

### 2. Docker 설치

```bash
# Docker 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 새 터미널 세션에서 그룹 변경사항 적용
newgrp docker

# Docker 설치 확인
docker --version
```

### 3. Docker Compose 설치 (선택사항)

```bash
# Docker Compose 설치
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 설치 확인
docker-compose --version
```

## 🚀 배포 방법

### 방법 1: 자동 배포 스크립트 사용 (권장)

```bash
# 1. 프로젝트 클론 또는 업로드
git clone <your-repo-url>
cd accessibista

# 2. 배포 스크립트 실행 권한 부여
chmod +x deploy.sh

# 3. 서비스 배포
./deploy.sh deploy

# 또는 Docker Compose로 배포
./deploy.sh compose
```

### 방법 2: 수동 배포

```bash
# 1. Docker 네트워크 생성
docker network create accessibista-network

# 2. 이미지 빌드
docker build -t accessibista:latest .

# 3. 컨테이너 실행
docker run -d \
  --name accessibista-prod \
  --network accessibista-network \
  -p 3000:3000 \
  --restart unless-stopped \
  -e NODE_ENV=production \
  accessibista:latest
```

### 방법 3: Docker Compose 사용

```bash
# docker-compose.yml 파일이 있는 상태에서
docker-compose up -d
```

## 📊 서비스 관리 명령어

### 배포 스크립트 사용

```bash
# 서비스 상태 확인
./deploy.sh status

# 로그 확인
./deploy.sh logs

# 서비스 재시작
./deploy.sh restart

# 서비스 중지
./deploy.sh stop

# 완전 정리 (이미지, 컨테이너, 네트워크 삭제)
./deploy.sh cleanup

# 도움말
./deploy.sh help
```

### Docker 명령어 직접 사용

```bash
# 컨테이너 상태 확인
docker ps -a

# 로그 확인
docker logs accessibista-prod

# 실시간 로그 확인
docker logs -f accessibista-prod

# 컨테이너 재시작
docker restart accessibista-prod

# 컨테이너 중지
docker stop accessibista-prod

# 컨테이너 시작
docker start accessibista-prod

# 컨테이너 제거
docker rm accessibista-prod

# 이미지 제거
docker rmi accessibista:latest
```

## 🔍 서비스 확인

### 1. 헬스 체크

```bash
curl http://localhost:3000/health
```

### 2. 웹 접근성 분석 테스트

```bash
curl "http://localhost:3000/analyze?url=https://www.daum.net/"
```

### 3. 브라우저에서 확인

- 메인 페이지: `http://your-server-ip:3000`
- 분석 페이지: `http://your-server-ip:3000/analyze?url=https://www.daum.net/`

## 🔧 설정 및 최적화

### 1. 포트 변경

`deploy.sh` 파일에서 `PORT` 변수를 수정:

```bash
PORT="8080"  # 원하는 포트로 변경
```

### 2. 환경 변수 설정

```bash
docker run -d \
  --name accessibista-prod \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e PUPPETEER_TIMEOUT=30000 \
  accessibista:latest
```

### 3. 리소스 제한 설정

```bash
docker run -d \
  --name accessibista-prod \
  -p 3000:3000 \
  --memory="2g" \
  --cpus="1.0" \
  accessibista:latest
```

## 🛠️ 문제 해결

### 1. 포트 충돌

```bash
# 포트 사용 확인
sudo netstat -tlnp | grep :3000

# 다른 포트로 실행
docker run -d -p 8080:3000 --name accessibista-prod accessibista:latest
```

### 2. 권한 문제

```bash
# Docker 그룹에 사용자 추가
sudo usermod -aG docker $USER

# 새 터미널 세션 시작
newgrp docker
```

### 3. 디스크 공간 부족

```bash
# 사용하지 않는 Docker 리소스 정리
docker system prune -a

# 이미지 정리
docker image prune -a
```

### 4. 메모리 부족

```bash
# 컨테이너 리소스 사용량 확인
docker stats accessibista-prod

# 메모리 제한 설정
docker run -d --memory="1g" --name accessibista-prod accessibista:latest
```

## 📈 모니터링

### 1. 시스템 리소스 모니터링

```bash
# 실시간 리소스 사용량
docker stats accessibista-prod

# 컨테이너 정보
docker inspect accessibista-prod
```

### 2. 로그 모니터링

```bash
# 실시간 로그
docker logs -f accessibista-prod

# 특정 시간 이후 로그
docker logs --since="2024-01-01T00:00:00" accessibista-prod
```

### 3. 헬스 체크 자동화

```bash
# crontab에 헬스 체크 추가
echo "*/5 * * * * curl -f http://localhost:3000/health || docker restart accessibista-prod" | crontab -
```

## 🔒 보안 고려사항

### 1. 방화벽 설정

```bash
# UFW 방화벽 활성화
sudo ufw enable

# 필요한 포트만 허용
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 3000/tcp  # Accessibista 서비스
```

### 2. Docker 보안

```bash
# Docker 데몬 보안 설정
sudo nano /etc/docker/daemon.json

# 내용 추가
{
  "userns-remap": "default",
  "no-new-privileges": true
}
```

### 3. 컨테이너 보안

```bash
# 읽기 전용 루트 파일시스템
docker run -d \
  --read-only \
  --tmpfs /tmp \
  --name accessibista-prod \
  accessibista:latest
```

## 📝 로그 관리

### 1. 로그 로테이션 설정

```bash
# Docker 로그 드라이버 설정
docker run -d \
  --log-driver=json-file \
  --log-opt max-size=10m \
  --log-opt max-file=3 \
  --name accessibista-prod \
  accessibista:latest
```

### 2. 로그 백업

```bash
# 로그 백업 스크립트
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
docker logs accessibista-prod > /var/log/accessibista_$DATE.log
gzip /var/log/accessibista_$DATE.log
```

## 🚀 프로덕션 배포 체크리스트

- [ ] Docker 및 Docker Compose 설치 완료
- [ ] 방화벽 설정 완료
- [ ] 서비스 배포 및 테스트 완료
- [ ] 헬스 체크 정상 동작 확인
- [ ] 로그 모니터링 설정 완료
- [ ] 백업 정책 수립 완료
- [ ] 보안 설정 완료
- [ ] 성능 최적화 완료

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. Docker 로그: `docker logs accessibista-prod`
2. 시스템 로그: `journalctl -u docker`
3. 네트워크 연결: `curl -v http://localhost:3000/health`
4. 리소스 사용량: `docker stats accessibista-prod`
