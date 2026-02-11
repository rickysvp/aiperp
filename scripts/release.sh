#!/bin/bash

# AIperp.fun 版本发布脚本
# 使用方法: ./scripts/release.sh [patch|minor|major] "版本描述"

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 获取当前版本
CURRENT_VERSION=$(cat package.json | grep '"version"' | sed 's/.*"version": "\(.*\)".*/\1/')
echo -e "${BLUE}当前版本: $CURRENT_VERSION${NC}"

# 解析版本升级类型
VERSION_TYPE=${1:-patch}
DESCRIPTION=${2:-"版本更新"}

# 计算新版本
IFS='.' read -r -a VERSION_PARTS <<< "$CURRENT_VERSION"
MAJOR=${VERSION_PARTS[0]}
MINOR=${VERSION_PARTS[1]}
PATCH=${VERSION_PARTS[2]}

case $VERSION_TYPE in
  major)
    MAJOR=$((MAJOR + 1))
    MINOR=0
    PATCH=0
    ;;
  minor)
    MINOR=$((MINOR + 1))
    PATCH=0
    ;;
  patch)
    PATCH=$((PATCH + 1))
    ;;
  *)
    echo -e "${RED}错误: 版本类型必须是 patch, minor, 或 major${NC}"
    exit 1
    ;;
esac

NEW_VERSION="$MAJOR.$MINOR.$PATCH"
echo -e "${GREEN}新版本: $NEW_VERSION${NC}"

# 确认发布
echo -e "${YELLOW}是否继续发布? (y/n)${NC}"
read -r CONFIRM
if [ "$CONFIRM" != "y" ]; then
  echo -e "${RED}发布已取消${NC}"
  exit 0
fi

# 更新 package.json
echo -e "${BLUE}更新 package.json...${NC}"
sed -i.bak "s/\"version\": \"$CURRENT_VERSION\"/\"version\": \"$NEW_VERSION\"/" package.json
rm package.json.bak

# 更新 VersionInfo.tsx
echo -e "${BLUE}更新 VersionInfo.tsx...${NC}"
sed -i.bak "s/const version = 'v$CURRENT_VERSION'/const version = 'v$NEW_VERSION'/" components/VersionInfo.tsx
rm components/VersionInfo.tsx.bak

# 更新 VERSION.md
echo -e "${BLUE}更新 VERSION.md...${NC}"
TODAY=$(date +%Y-%m-%d)

# 在文件顶部插入新版本信息
NEW_VERSION_BLOCK="## 当前版本
**v$NEW_VERSION** - $TODAY

## 版本历史

### v$NEW_VERSION ($TODAY)
#### 更新内容
- $DESCRIPTION

#### 链接
- 🌐 外网: https://aiperp.fun
- 🔗 内网: http://localhost:3000

---
"

# 使用临时文件
TEMP_FILE=$(mktemp)
echo "$NEW_VERSION_BLOCK" > "$TEMP_FILE"
tail -n +4 VERSION.md >> "$TEMP_FILE"
mv "$TEMP_FILE" VERSION.md

# Git 操作
echo -e "${BLUE}提交更改...${NC}"
git add package.json components/VersionInfo.tsx VERSION.md
git commit -m "release: v$NEW_VERSION - $DESCRIPTION"

echo -e "${BLUE}创建标签...${NC}"
git tag -a "v$NEW_VERSION" -m "🚀 Release v$NEW_VERSION - $DESCRIPTION"

echo -e "${BLUE}推送到 GitHub...${NC}"
git push origin main
git push origin "v$NEW_VERSION"

echo -e "${GREEN}✅ 版本 v$NEW_VERSION 发布成功!${NC}"
echo -e "${BLUE}GitHub 标签: https://github.com/rickysvp/aiperp/releases/tag/v$NEW_VERSION${NC}"

# 显示回滚命令
echo -e "\n${YELLOW}如果需要回滚, 使用以下命令:${NC}"
echo -e "${BLUE}git reset --hard v$CURRENT_VERSION${NC}"
echo -e "${BLUE}git push -f origin main${NC}"
