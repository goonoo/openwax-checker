#!/bin/bash

# Accessibista Docker 배포 스크립트
# Ubuntu 서버에서 실행

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 설정 변수
IMAGE_NAME="accessibista"
CONTAINER_NAME="accessibista-prod"
PORT="3000"
DOCKER_NETWORK="accessibista-network"

# Docker 설치 확인
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker가 설치되지 않았습니다."
        log_info "Docker 설치 명령어:"
        echo "curl -fsSL https://get.docker.com -o get-docker.sh"
        echo "sudo sh get-docker.sh"
        echo "sudo usermod -aG docker \$USER"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_warning "Docker Compose가 설치되지 않았습니다."
        log_info "Docker Compose 설치 명령어:"
        echo "sudo curl -L \"https://github.com/docker/compose/releases/latest/download/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
        echo "sudo chmod +x /usr/local/bin/docker-compose"
    fi
    
    log_success "Docker 환경 확인 완료"
}

# 네트워크 생성
create_network() {
    if ! docker network ls | grep -q $DOCKER_NETWORK; then
        log_info "Docker 네트워크 생성: $DOCKER_NETWORK"
        docker network create $DOCKER_NETWORK
    else
        log_info "Docker 네트워크가 이미 존재합니다: $DOCKER_NETWORK"
    fi
}

# 이미지 빌드
build_image() {
    log_info "Docker 이미지 빌드 시작..."
    docker build -t $IMAGE_NAME:latest .
    log_success "Docker 이미지 빌드 완료: $IMAGE_NAME:latest"
}

# 컨테이너 중지 및 제거
stop_container() {
    if docker ps -a | grep -q $CONTAINER_NAME; then
        log_info "기존 컨테이너 중지 및 제거: $CONTAINER_NAME"
        docker stop $CONTAINER_NAME || true
        docker rm $CONTAINER_NAME || true
    fi
}

# 컨테이너 실행
run_container() {
    log_info "컨테이너 실행: $CONTAINER_NAME"
    docker run -d \
        --name $CONTAINER_NAME \
        --network $DOCKER_NETWORK \
        -p $PORT:3000 \
        --restart unless-stopped \
        -e NODE_ENV=production \
        $IMAGE_NAME:latest
    
    log_success "컨테이너 실행 완료"
}

# Docker Compose로 실행
run_compose() {
    log_info "Docker Compose로 서비스 실행"
    docker-compose up -d
    log_success "Docker Compose 실행 완료"
}

# 헬스 체크
health_check() {
    log_info "서비스 헬스 체크..."
    sleep 10
    
    if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
        log_success "서비스가 정상적으로 동작하고 있습니다."
        log_info "서비스 URL: http://localhost:$PORT"
        log_info "분석 URL: http://localhost:$PORT/analyze?url=https://www.daum.net/"
    else
        log_error "서비스 헬스 체크 실패"
        docker logs $CONTAINER_NAME
        exit 1
    fi
}

# 로그 확인
show_logs() {
    log_info "컨테이너 로그 확인"
    docker logs -f $CONTAINER_NAME
}

# 서비스 상태 확인
show_status() {
    log_info "서비스 상태 확인"
    echo "=== Docker 컨테이너 상태 ==="
    docker ps -a | grep $CONTAINER_NAME || echo "컨테이너가 실행되지 않았습니다."
    
    echo -e "\n=== 서비스 헬스 체크 ==="
    if curl -f http://localhost:$PORT/health > /dev/null 2>&1; then
        log_success "서비스 정상 동작"
    else
        log_error "서비스 응답 없음"
    fi
    
    echo -e "\n=== 시스템 리소스 사용량 ==="
    docker stats $CONTAINER_NAME --no-stream || echo "컨테이너가 실행되지 않았습니다."
}

# 서비스 중지
stop_service() {
    log_info "서비스 중지"
    docker-compose down || docker stop $CONTAINER_NAME
    log_success "서비스 중지 완료"
}

# 서비스 재시작
restart_service() {
    log_info "서비스 재시작"
    stop_service
    sleep 2
    run_compose || run_container
    health_check
}

# 완전 정리
cleanup() {
    log_info "완전 정리 시작"
    docker-compose down --volumes --remove-orphans || true
    docker stop $CONTAINER_NAME || true
    docker rm $CONTAINER_NAME || true
    docker rmi $IMAGE_NAME:latest || true
    docker network rm $DOCKER_NETWORK || true
    log_success "정리 완료"
}

# 메인 함수
main() {
    case "${1:-deploy}" in
        "deploy")
            check_docker
            create_network
            build_image
            stop_container
            run_container
            health_check
            ;;
        "compose")
            check_docker
            create_network
            build_image
            run_compose
            health_check
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "stop")
            stop_service
            ;;
        "restart")
            restart_service
            ;;
        "cleanup")
            cleanup
            ;;
        "help")
            echo "사용법: $0 [명령어]"
            echo ""
            echo "명령어:"
            echo "  deploy    - Docker로 서비스 배포 (기본값)"
            echo "  compose   - Docker Compose로 서비스 배포"
            echo "  logs      - 컨테이너 로그 확인"
            echo "  status    - 서비스 상태 확인"
            echo "  stop      - 서비스 중지"
            echo "  restart   - 서비스 재시작"
            echo "  cleanup   - 완전 정리 (이미지, 컨테이너, 네트워크 삭제)"
            echo "  help      - 도움말 표시"
            ;;
        *)
            log_error "알 수 없는 명령어: $1"
            echo "사용법: $0 help"
            exit 1
            ;;
    esac
}

# 스크립트 실행
main "$@" 