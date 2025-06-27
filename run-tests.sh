#!/bin/bash

# 색상 정의
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}🧪 Accessibista E2E 테스트를 실행합니다...${NC}"

# 테스트 컨테이너만 실행
docker-compose run --rm test

echo -e "${GREEN}✅ 테스트 실행이 완료되었습니다.${NC}" 