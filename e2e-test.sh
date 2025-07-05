#!/bin/bash

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}🚀 Accessibista 테스트 실행을 시작합니다...${NC}"

# 기존 컨테이너 정리
echo -e "${YELLOW}📦 기존 컨테이너를 정리합니다...${NC}"
docker-compose down

# 애플리케이션 빌드 및 실행
echo -e "${YELLOW}🔨 애플리케이션을 빌드하고 실행합니다...${NC}"
docker-compose up -d accessibista

# 애플리케이션이 준비될 때까지 대기
echo -e "${YELLOW}⏳ 애플리케이션이 준비될 때까지 대기합니다...${NC}"
sleep 10

# 헬스체크
echo -e "${YELLOW}🏥 애플리케이션 헬스체크를 수행합니다...${NC}"
for i in {1..30}; do
    if curl -f http://localhost:3000/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ 애플리케이션이 준비되었습니다!${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}❌ 애플리케이션이 준비되지 않았습니다.${NC}"
        docker-compose logs accessibista
        exit 1
    fi
    echo -e "${YELLOW}⏳ 대기 중... ($i/30)${NC}"
    sleep 2
done

# 테스트 실행
echo -e "${YELLOW}🧪 테스트를 실행합니다...${NC}"
docker-compose run --rm test

# 테스트 결과 확인
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 테스트가 성공적으로 완료되었습니다!${NC}"
else
    echo -e "${RED}❌ 일부 테스트가 실패했습니다.${NC}"
fi

# 컨테이너 정리
echo -e "${YELLOW}🧹 컨테이너를 정리합니다...${NC}"
docker-compose down

exit $TEST_EXIT_CODE 