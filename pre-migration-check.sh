#!/bin/bash

################################################################################
# 数据库迁移前检查脚本
# 用途: 在执行数据库迁移前验证环境和配置
# 使用: ./pre-migration-check.sh
################################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 配置
PROJECT_DIR="/media/ruan/Files/forum"
REQUIRED_NODE_VERSION="18.17.0"
BACKUP_DIR="$PROJECT_DIR/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# 统计变量
CHECKS_TOTAL=0
CHECKS_PASSED=0
CHECKS_FAILED=0
CHECKS_WARNING=0

# 辅助函数
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_section() {
    echo -e "\n${YELLOW}▶ $1${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
    ((CHECKS_PASSED++))
    ((CHECKS_TOTAL++))
}

print_fail() {
    echo -e "${RED}✗${NC} $1"
    ((CHECKS_FAILED++))
    ((CHECKS_TOTAL++))
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((CHECKS_WARNING++))
    ((CHECKS_TOTAL++))
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# 检查命令是否存在
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# 检查 1: 项目目录结构
check_project_structure() {
    print_section "检查项目目录结构"

    local required_dirs=(
        "src"
        "prisma"
        "public"
        ".github/workflows"
    )

    local required_files=(
        "package.json"
        "package-lock.json"
        "next.config.ts"
        "tsconfig.json"
        "prisma/schema.prisma"
        ".env"
    )

    # 检查目录
    for dir in "${required_dirs[@]}"; do
        if [ -d "$PROJECT_DIR/$dir" ]; then
            print_success "目录存在: $dir/"
        else
            print_fail "目录缺失: $dir/"
        fi
    done

    # 检查文件
    for file in "${required_files[@]}"; do
        if [ -f "$PROJECT_DIR/$file" ]; then
            print_success "文件存在: $file"
        else
            print_fail "文件缺失: $file"
        fi
    done
}

# 检查 2: Node.js 版本
check_node_version() {
    print_section "检查 Node.js 版本"

    if ! command_exists node; then
        print_fail "Node.js 未安装"
        return 1
    fi

    local current_version=$(node -v | sed 's/v//' | cut -d'.' -f1,2)
    local required_min=$(echo $REQUIRED_NODE_VERSION | sed 's/v//' | cut -d'.' -f1,2)

    print_info "当前版本: $(node -v)"
    print_info "要求版本: >= $REQUIRED_NODE_VERSION"

    if [ "$(printf '%s\n' "$required_min" "$current_version" | sort -V | head -n1)" = "$required_min" ]; then
        print_success "Node.js 版本符合要求"
    else
        print_fail "Node.js 版本过低，请升级到 $REQUIRED_NODE_VERSION 或更高版本"
    fi

    # 检查 npm
    if command_exists npm; then
        print_success "npm 已安装: $(npm -v)"
    else
        print_fail "npm 未安装"
    fi
}

# 检查 3: Prisma 安装
check_prisma() {
    print_section "检查 Prisma 安装"

    cd "$PROJECT_DIR"

    # 检查 Prisma 是否在 package.json 中
    if grep -q '"prisma"' package.json; then
        print_success "Prisma 在 package.json 中"
    else
        print_fail "Prisma 未在 package.json 中找到"
    fi

    # 检查 @prisma/client
    if grep -q '"@prisma/client"' package.json; then
        print_success "@prisma/client 在 package.json 中"
    else
        print_fail "@prisma/client 未在 package.json 中找到"
    fi

    # 检查 npx prisma 是否可用
    if npx prisma --version >/dev/null 2>&1; then
        local prisma_version=$(npx prisma --version 2>/dev/null | head -n1)
        print_success "Prisma CLI 可用: $prisma_version"
    else
        print_warning "Prisma CLI 不可用，需要运行 npm install"
    fi
}

# 检查 4: 数据库连接
check_database_connection() {
    print_section "检查数据库连接"

    cd "$PROJECT_DIR"

    # 检查 DATABASE_URL 是否设置
    if [ ! -f ".env" ]; then
        print_fail ".env 文件不存在"
        return 1
    fi

    if grep -q "DATABASE_URL" .env; then
        print_success "DATABASE_URL 在 .env 中已设置"

        # 验证连接
        print_info "尝试连接数据库..."
        if npx prisma db pull --force >/dev/null 2>&1; then
            print_success "数据库连接成功"
        else
            print_fail "数据库连接失败，请检查 DATABASE_URL"
            print_info "运行以下命令测试连接: npx prisma db pull"
        fi
    else
        print_fail "DATABASE_URL 未在 .env 中设置"
    fi
}

# 检查 5: Git 状态
check_git_status() {
    print_section "检查 Git 状态"

    cd "$PROJECT_DIR"

    if ! command_exists git; then
        print_warning "Git 未安装，跳过 Git 检查"
        return
    fi

    # 检查是否在 Git 仓库中
    if git rev-parse --git-dir >/dev/null 2>&1; then
        print_success "当前在 Git 仓库中"

        # 检查当前分支
        local current_branch=$(git branch --show-current)
        print_info "当前分支: $current_branch"

        # 检查是否有未提交的更改
        if git diff --quiet 2>/dev/null && git diff --cached --quiet 2>/dev/null; then
            print_success "没有未提交的更改"
        else
            print_warning "存在未提交的更改"
            print_info "未提交的文件:"
            git status --short | head -n 5
        fi

        # 检查远程连接
        if git ls-remote >/dev/null 2>&1; then
            print_success "Git 远程仓库连接正常"
        else
            print_warning "无法连接到 Git 远程仓库"
        fi
    else
        print_warning "不是 Git 仓库"
    fi
}

# 检查 6: 磁盘空间
check_disk_space() {
    print_section "检查磁盘空间"

    local available=$(df -BG "$PROJECT_DIR" | awk 'NR==2 {print $4}' | sed 's/G//')
    local used_percent=$(df -BG "$PROJECT_DIR" | awk 'NR==2 {print $5}' | sed 's/%//')

    print_info "可用空间: ${available}GB"
    print_info "使用率: ${used_percent}%"

    if [ "$available" -gt 5 ]; then
        print_success "磁盘空间充足 (> 5GB)"
    else
        print_warning "磁盘空间不足 (< 5GB)，建议清理"
    fi

    if [ "$used_percent" -lt 80 ]; then
        print_success "磁盘使用率正常 (< 80%)"
    else
        print_warning "磁盘使用率较高 (> 80%)"
    fi
}

# 检查 7: 环境变量
check_environment_variables() {
    print_section "检查环境变量"

    cd "$PROJECT_DIR"

    if [ ! -f ".env" ]; then
        print_fail ".env 文件不存在"
        return 1
    fi

    local required_vars=(
        "DATABASE_URL"
        "NEXTAUTH_URL"
        "NEXTAUTH_SECRET"
    )

    for var in "${required_vars[@]}"; do
        if grep -q "^${var}=" .env || grep -q "^${var} =" .env; then
            # 隐藏敏感值
            local value=$(grep "^${var}=" .env | cut -d'=' -f2)
            if [ -n "$value" ]; then
                if [ "$var" = "DATABASE_URL" ] || [ "$var" = "NEXTAUTH_SECRET" ]; then
                    print_success "$var 已设置 (值已隐藏)"
                else
                    print_success "$var 已设置: $value"
                fi
            else
                print_warning "$var 已设置但值为空"
            fi
        else
            print_warning "$var 未设置"
        fi
    done
}

# 检查 8: 数据库备份
check_database_backup() {
    print_section "检查数据库备份"

    # 创建备份目录
    mkdir -p "$BACKUP_DIR"

    print_info "备份目录: $BACKUP_DIR"

    # 从 .env 中提取数据库连接信息
    if [ -f "$PROJECT_DIR/.env" ]; then
        local db_url=$(grep "^DATABASE_URL=" "$PROJECT_DIR/.env" | cut -d'=' -f2-)

        if [ -n "$db_url" ]; then
            print_info "检测到 DATABASE_URL，准备备份..."

            # 解析数据库连接信息
            # 格式: mysql://user:password@host:port/database
            local db_host=$(echo "$db_url" | sed -n 's/.*@\([^:]*\):.*/\1/p')
            local db_port=$(echo "$db_url" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
            local db_name=$(echo "$db_url" | sed -n 's/.*\/\([^?]*\).*/\1/p')
            local db_user=$(echo "$db_url" | sed -n 's/\/\/\([^:]*\):.*/\1/p')

            print_info "数据库: $db_name@$db_host:$db_port"

            # 检查 mysqldump 是否可用
            if command_exists mysqldump; then
                print_info "创建数据库备份..."

                local backup_file="$BACKUP_DIR/db_backup_${TIMESTAMP}.sql"

                # 提示用户输入密码
                echo -n "请输入 MySQL 密码: "
                read -s db_password
                echo

                if mysqldump -h "$db_host" -P "$db_port" -u "$db_user" -p"$db_password" "$db_name" > "$backup_file" 2>/dev/null; then
                    local backup_size=$(du -h "$backup_file" | cut -f1)
                    print_success "数据库备份创建成功: $backup_file ($backup_size)"

                    # 列出最近的备份
                    print_info "最近的备份:"
                    ls -lt "$BACKUP_DIR"/db_backup_*.sql 2>/dev/null | head -n 5 | awk '{print "  " $9 " (" $5 ")"}'
                else
                    print_fail "数据库备份失败，请检查连接信息和密码"
                fi
            else
                print_warning "mysqldump 不可用，跳过自动备份"
                print_info "请手动备份数据库"
            fi
        else
            print_warning "无法解析 DATABASE_URL"
        fi
    else
        print_warning ".env 文件不存在，跳过备份"
    fi
}

# 检查 9: Prisma Schema 语法
check_prisma_schema() {
    print_section "检查 Prisma Schema"

    cd "$PROJECT_DIR"

    if [ ! -f "prisma/schema.prisma" ]; then
        print_fail "prisma/schema.prisma 不存在"
        return 1
    fi

    print_success "prisma/schema.prisma 存在"

    # 尝试验证 schema
    print_info "验证 Prisma schema 语法..."
    if npx prisma validate >/dev/null 2>&1; then
        print_success "Prisma schema 语法正确"
    else
        print_fail "Prisma schema 语法错误"
        print_info "运行 'npx prisma validate' 查看详细错误"
    fi

    # 检查重要的模型和索引
    print_info "检查数据库模型和索引..."

    local required_models=("User" "Post" "Comment" "Topic" "Notification")

    for model in "${required_models[@]}"; do
        if grep -q "model $model" prisma/schema.prisma; then
            print_success "模型存在: $model"
        else
            print_warning "模型缺失: $model"
        fi
    done

    # 检查 Post 模型的索引
    if grep -A 20 "model Post" prisma/schema.prisma | grep -q "@@index"; then
        print_success "Post 模型包含索引"
    else
        print_warning "Post 模型缺少索引"
    fi

    # 检查 Comment 模型的索引
    if grep -A 20 "model Comment" prisma/schema.prisma | grep -q "@@index"; then
        print_success "Comment 模型包含索引"
    else
        print_warning "Comment 模型缺少索引"
    fi

    # 检查 Notification 模型的索引
    if grep -A 20 "model Notification" prisma/schema.prisma | grep -q "@@index"; then
        print_success "Notification 模型包含索引"
    else
        print_warning "Notification 模型缺少索引"
    fi
}

# 检查 10: PM2 配置
check_pm2() {
    print_section "检查 PM2 配置"

    if command_exists pm2; then
        print_success "PM2 已安装: $(pm2 -v)"

        # 检查 PM2 进程
        if pm2 list >/dev/null 2>&1; then
            print_info "PM2 进程列表:"
            pm2 list | head -n 10
        fi

        # 检查是否有 ecosystem.config.js
        if [ -f "$PROJECT_DIR/ecosystem.config.js" ]; then
            print_success "ecosystem.config.js 存在"
        else
            print_warning "ecosystem.config.js 不存在"
        fi
    else
        print_warning "PM2 未安装（仅在部署到生产环境时需要）"
    fi
}

# 生成检查报告
generate_report() {
    print_header "检查报告"

    echo -e "总检查项: ${BLUE}$CHECKS_TOTAL${NC}"
    echo -e "通过: ${GREEN}$CHECKS_PASSED${NC}"
    echo -e "失败: ${RED}$CHECKS_FAILED${NC}"
    echo -e "警告: ${YELLOW}$CHECKS_WARNING${NC}"

    local pass_rate=0
    if [ $CHECKS_TOTAL -gt 0 ]; then
        pass_rate=$((CHECKS_PASSED * 100 / CHECKS_TOTAL))
    fi

    echo -e "\n通过率: ${BLUE}${pass_rate}%${NC}"

    if [ $CHECKS_FAILED -eq 0 ]; then
        echo -e "\n${GREEN}✓ 所有检查通过，可以安全进行数据库迁移${NC}\n"
        return 0
    else
        echo -e "\n${RED}✗ 发现 $CHECKS_FAILED 个失败项，请在迁移前修复${NC}\n"

        if [ $CHECKS_FAILED -ge 3 ]; then
            echo -e "${RED}⚠️  失败项过多，强烈建议在修复后再进行迁移${NC}\n"
        fi

        return 1
    fi
}

# 打印后续步骤
print_next_steps() {
    print_header "后续步骤"

    echo -e "如果所有检查通过，您可以按以下步骤进行迁移：\n"
    echo -e "1. ${GREEN}开发环境测试${NC}:"
    echo -e "   cd $PROJECT_DIR"
    echo -e "   npx prisma generate"
    echo -e "   npx prisma db push"
    echo -e ""
    echo -e "2. ${GREEN}生产环境迁移${NC}:"
    echo -e "   ssh user@server"
    echo -e "   cd /www/wwwroot/forum"
    echo -e "   git pull origin main"
    echo -e "   npm install"
    echo -e "   npx prisma generate"
    echo -e "   npx prisma db push"
    echo -e "   npm run build"
    echo -e "   pm2 reload start"
    echo -e ""
    echo -e "3. ${GREEN}验证迁移结果${NC}:"
    echo -e "   mysql -h host -u user -p -e 'SHOW INDEX FROM Post;'"
    echo -e ""
    echo -e "如需回滚，使用备份文件："
    echo -e "   mysql -h host -u user -p database < $BACKUP_DIR/db_backup_${TIMESTAMP}.sql"
    echo ""
}

# 主函数
main() {
    print_header "数据库迁移前检查"

    print_info "项目目录: $PROJECT_DIR"
    print_info "检查时间: $(date '+%Y-%m-%d %H:%M:%S')"

    # 运行所有检查
    check_project_structure
    check_node_version
    check_prisma
    check_environment_variables
    check_database_connection
    check_prisma_schema
    check_git_status
    check_disk_space
    check_database_backup
    check_pm2

    # 生成报告
    generate_report
    local exit_code=$?

    # 打印后续步骤
    print_next_steps

    exit $exit_code
}

# 运行主函数
main "$@"
