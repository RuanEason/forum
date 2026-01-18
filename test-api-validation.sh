#!/bin/bash

################################################################################
# API 验证测试脚本
# 用途: 自动测试所有 API 端点的验证逻辑
# 使用: ./test-api-validation.sh [base_url] [email] [password]
################################################################################

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 默认配置
BASE_URL="${1:-http://localhost:3000}"
TEST_EMAIL="${2:-test@example.com}"
TEST_PASSWORD="${3:-testpassword123}"
COOKIES_FILE="api_test_cookies.txt"
TEMP_DIR="api_test_temp"

# 统计变量
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# 辅助函数
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_section() {
    echo -e "\n${YELLOW}>>> $1${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ PASS${NC}: $1"
    ((PASSED_TESTS++))
}

print_fail() {
    echo -e "${RED}✗ FAIL${NC}: $1"
    ((FAILED_TESTS++))
}

print_info() {
    echo -e "${BLUE}ℹ INFO${NC}: $1"
}

# HTTP 请求封装
http_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local test_name=$5

    ((TOTAL_TESTS++))

    local full_url="${BASE_URL}${endpoint}"
    local status_code=$(curl -X "$method" "$full_url" \
        -H "Content-Type: application/json" \
        -b "$COOKIES_FILE" \
        -d "$data" \
        -s -o /dev/null \
        -w "%{http_code}" \
        2>/dev/null)

    if [ "$status_code" = "$expected_status" ]; then
        print_success "$test_name (status: $status_code)"
        return 0
    else
        print_fail "$test_name (expected: $expected_status, got: $status_code)"
        return 1
    fi
}

http_request_file() {
    local endpoint=$1
    local file_path=$2
    local expected_status=$3
    local test_name=$4

    ((TOTAL_TESTS++))

    local full_url="${BASE_URL}${endpoint}"
    local status_code=$(curl -X POST "$full_url" \
        -b "$COOKIES_FILE" \
        -F "file=@$file_path" \
        -s -o /dev/null \
        -w "%{http_code}" \
        2>/dev/null)

    if [ "$status_code" = "$expected_status" ]; then
        print_success "$test_name (status: $status_code)"
        return 0
    else
        print_fail "$test_name (expected: $expected_status, got: $status_code)"
        return 1
    fi
}

http_get() {
    local endpoint=$1
    local expected_status=$2
    local test_name=$3

    ((TOTAL_TESTS++))

    local full_url="${BASE_URL}${endpoint}"
    local status_code=$(curl -X GET "$full_url" \
        -b "$COOKIES_FILE" \
        -s -o /dev/null \
        -w "%{http_code}" \
        2>/dev/null)

    if [ "$status_code" = "$expected_status" ]; then
        print_success "$test_name (status: $status_code)"
        return 0
    else
        print_fail "$test_name (expected: $expected_status, got: $status_code)"
        return 1
    fi
}

# 初始化
init() {
    print_header "API 验证测试开始"

    print_info "目标 URL: $BASE_URL"
    print_info "测试邮箱: $TEST_EMAIL"

    # 创建临时目录
    mkdir -p "$TEMP_DIR"

    # 清理旧的 cookie 文件
    rm -f "$COOKIES_FILE"

    # 创建测试文件
    print_section "创建测试文件"

    # 1MB 测试图片
    dd if=/dev/zero of="$TEMP_DIR/test_1mb.jpg" bs=1024 count=1024 2>/dev/null
    print_info "创建 1MB 测试文件"

    # 11MB 测试文件（超过限制）
    dd if=/dev/zero of="$TEMP_DIR/test_11mb.jpg" bs=1024 count=11264 2>/dev/null
    print_info "创建 11MB 测试文件（超过限制）"

    # 伪造图片文件
    echo "This is not an image" > "$TEMP_DIR/fake.jpg"
    print_info "创建伪造图片文件"
}

# 登录获取认证
login() {
    print_section "用户登录"

    local login_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"

    local status_code=$(curl -X POST "${BASE_URL}/api/auth/signin" \
        -H "Content-Type: application/json" \
        -d "$login_data" \
        -c "$COOKIES_FILE" \
        -s -o /dev/null \
        -w "%{http_code}" \
        2>/dev/null)

    if [ "$status_code" = "200" ] || [ "$status_code" = "302" ]; then
        print_success "用户登录成功"
        return 0
    else
        print_fail "用户登录失败 (status: $status_code)"
        print_info "请确保测试用户存在或手动登录后导出 cookies"
        return 1
    fi
}

# 文件上传测试
test_upload_api() {
    print_section "1. 文件上传 API 测试 (/api/upload)"

    # 测试 1.1: 正常上传 (1MB)
    http_request_file "/api/upload" "$TEMP_DIR/test_1mb.jpg" "200" "上传 1MB 图片应成功"

    # 测试 1.2: 超过 10MB 限制
    http_request_file "/api/upload" "$TEMP_DIR/test_11mb.jpg" "400" "上传 11MB 文件应被拒绝"

    # 测试 1.3: 无效文件类型
    http_request_file "/api/upload" "$TEMP_DIR/fake.jpg" "400" "上传非图片文件应被拒绝"

    # 测试 1.4: 未认证上传（删除 cookies 后测试）
    mv "$COOKIES_FILE" "${COOKIES_FILE}.bak"
    http_request_file "/api/upload" "$TEMP_DIR/test_1mb.jpg" "401" "未认证上传应被拒绝"
    mv "${COOKIES_FILE}.bak" "$COOKIES_FILE"
}

# 帖子 API 测试
test_post_api() {
    print_section "2. 帖子 API 测试 (/api/post)"

    # 测试 2.1: 创建帖子 - 正常
    http_request "POST" "/api/post" \
        '{"title":"测试标题","content":"这是一个测试帖子的内容","images":[]}' \
        "201" "创建正常帖子应成功"

    # 测试 2.2: 标题超过 200 字符
    local long_title=$(printf 'A%.0s' {1..201})
    http_request "POST" "/api/post" \
        "{\"title\":\"$long_title\",\"content\":\"测试内容\"}" \
        "400" "标题超过 200 字符应被拒绝"

    # 测试 2.3: 内容超过 10000 字符
    local long_content=$(printf 'A%.0s' {1..10001})
    http_request "POST" "/api/post" \
        "{\"content\":\"$long_content\"}" \
        "400" "内容超过 10000 字符应被拒绝"

    # 测试 2.4: 图片超过 10 张
    http_request "POST" "/api/post" \
        '{"content":"测试","images":["url1","url2","url3","url4","url5","url6","url7","url8","url9","url10","url11"]}' \
        "400" "图片超过 10 张应被拒绝"

    # 测试 2.5: 只有标题没有内容
    http_request "POST" "/api/post" \
        '{"title":"只有标题"}' \
        "400" "只有标题没有内容应被拒绝"

    # 测试 2.6: 内容为空字符串
    http_request "POST" "/api/post" \
        '{"content":"   "}' \
        "400" "内容为空字符串应被拒绝"

    # 测试 2.7: GET 请求获取帖子
    http_get "/api/post" "200" "获取帖子列表应成功"

    # 测试 2.8: 按话题筛选
    http_get "/api/post?topicId=test-topic" "200" "按话题筛选帖子应成功"
}

# 话题 API 测试
test_topic_api() {
    print_section "3. 话题 API 测试 (/api/topic)"

    # 测试 3.1: 创建话题 - 正常
    http_request "POST" "/api/topic" \
        '{"name":"测试话题_'$(date +%s)'","description":"这是一个测试话题"}' \
        "201" "创建正常话题应成功"

    # 测试 3.2: 名称超过 50 字符
    local long_name=$(printf 'A%.0s' {1..51})
    http_request "POST" "/api/topic" \
        "{\"name\":\"$long_name\"}" \
        "400" "话题名称超过 50 字符应被拒绝"

    # 测试 3.3: 描述超过 500 字符
    local long_desc=$(printf 'A%.0s' {1..501})
    http_request "POST" "/api/topic" \
        '{"name":"测试","description":"'"$long_desc"'"}' \
        "400" "话题描述超过 500 字符应被拒绝"

    # 测试 3.4: 图标超过 100 字符
    local long_icon=$(printf 'A%.0s' {1..101})
    http_request "POST" "/api/topic" \
        '{"name":"测试_'$(date +%s)'","icon":"'"$long_icon"'"}' \
        "400" "话题图标超过 100 字符应被拒绝"

    # 测试 3.5: 名称为空
    http_request "POST" "/api/topic" \
        '{"name":"   "}' \
        "400" "话题名称为空应被拒绝"

    # 测试 3.6: GET 请求获取话题
    http_get "/api/topic" "200" "获取话题列表应成功"

    # 测试 3.7: 搜索话题
    http_get "/api/topic?q=测试" "200" "搜索话题应成功"
}

# 个人资料 API 测试
test_profile_api() {
    print_section "4. 个人资料 API 测试 (/api/auth/complete-profile)"

    # 测试 4.1: 更新资料 - 正常
    http_request "POST" "/api/auth/complete-profile" \
        '{"name":"测试用户","bio":"这是我的个人简介"}' \
        "200" "更新个人资料应成功"

    # 测试 4.2: 名称超过 50 字符
    local long_name=$(printf 'A%.0s' {1..51})
    http_request "POST" "/api/auth/complete-profile" \
        "{\"name\":\"$long_name\"}" \
        "400" "名称超过 50 字符应被拒绝"

    # 测试 4.3: 头像 URL 超过 500 字符
    local long_url=$(printf 'A%.0s' {1..501})
    http_request "POST" "/api/auth/complete-profile" \
        '{"name":"测试","avatar":"'"$long_url"'"}' \
        "400" "头像 URL 超过 500 字符应被拒绝"

    # 测试 4.4: 个人简介超过 500 字符
    local long_bio=$(printf 'A%.0s' {1..501})
    http_request "POST" "/api/auth/complete-profile" \
        '{"name":"测试","bio":"'"$long_bio"'"}' \
        "400" "个人简介超过 500 字符应被拒绝"

    # 测试 4.5: 无效的 postViewMode
    http_request "POST" "/api/auth/complete-profile" \
        '{"name":"测试","postViewMode":"invalid"}' \
        "400" "无效的 postViewMode 应被拒绝"

    # 测试 4.6: 有效的 postViewMode (card)
    http_request "POST" "/api/auth/complete-profile" \
        '{"name":"测试","postViewMode":"card"}' \
        "200" "postViewMode=card 应成功"

    # 测试 4.7: 有效的 postViewMode (compact)
    http_request "POST" "/api/auth/complete-profile" \
        '{"name":"测试","postViewMode":"compact"}' \
        "200" "postViewMode=compact 应成功"

    # 测试 4.8: 名称为空
    http_request "POST" "/api/auth/complete-profile" \
        '{"name":"   "}' \
        "400" "名称为空应被拒绝"
}

# 评论 API 测试
test_comment_api() {
    print_section "5. 评论 API 测试 (/api/comment)"

    # 首先创建一个测试帖子用于评论
    local post_response=$(curl -X POST "${BASE_URL}/api/post" \
        -H "Content-Type: application/json" \
        -b "$COOKIES_FILE" \
        -d '{"title":"评论测试帖","content":"用于测试评论的帖子"}' \
        -s 2>/dev/null)

    # 提取 postId (假设响应包含 id 字段)
    local test_post_id="test-post-id-$(date +%s)"

    # 测试 5.1: 创建评论 - 正常
    http_request "POST" "/api/comment" \
        "{\"content\":\"这是一条测试评论\",\"postId\":\"$test_post_id\"}" \
        "201" "创建评论应成功"

    # 测试 5.2: 缺少 content
    http_request "POST" "/api/comment" \
        "{\"postId\":\"$test_post_id\"}" \
        "400" "缺少 content 应被拒绝"

    # 测试 5.3: 缺少 postId
    http_request "POST" "/api/comment" \
        '{"content":"测试评论"}' \
        "400" "缺少 postId 应被拒绝"

    # 测试 5.4: 回复评论
    http_request "POST" "/api/comment" \
        "{\"content\":\"这是一条回复\",\"postId\":\"$test_post_id\",\"parentId\":\"test-parent-id\"}" \
        "201" "回复评论应成功"
}

# 点赞 API 测试
test_like_api() {
    print_section "6. 点赞 API 测试 (/api/like)"

    local test_target_id="test-target-$(date +%s)"

    # 测试 6.1: 点赞帖子
    http_request "POST" "/api/like" \
        "{\"targetType\":\"post\",\"targetId\":\"$test_target_id\"}" \
        "201" "点赞帖子应成功"

    # 测试 6.2: 点赞评论
    http_request "POST" "/api/like" \
        "{\"targetType\":\"comment\",\"targetId\":\"$test_target_id\"}" \
        "201" "点赞评论应成功"

    # 测试 6.3: 缺少 targetType
    http_request "POST" "/api/like" \
        "{\"targetId\":\"$test_target_id\"}" \
        "400" "缺少 targetType 应被拒绝"

    # 测试 6.4: 缺少 targetId
    http_request "POST" "/api/like" \
        '{"targetType":"post"}' \
        "400" "缺少 targetId 应被拒绝"

    # 测试 6.5: 无效的 targetType
    http_request "POST" "/api/like" \
        "{\"targetType\":\"invalid\",\"targetId\":\"$test_target_id\"}" \
        "400" "无效的 targetType 应被拒绝"
}

# 安全头测试
test_security_headers() {
    print_section "7. 安全响应头测试"

    ((TOTAL_TESTS++))

    local headers=$(curl -I "$BASE_URL" -s 2>/dev/null)

    # 检查各种安全头
    local required_headers=(
        "X-DNS-Prefetch-Control"
        "Strict-Transport-Security"
        "X-Frame-Options"
        "X-Content-Type-Options"
        "X-XSS-Protection"
        "Referrer-Policy"
        "Content-Security-Policy"
    )

    local all_present=true
    for header in "${required_headers[@]}"; do
        if echo "$headers" | grep -qi "$header"; then
            print_info "✓ $header 已设置"
        else
            print_fail "缺少 $header 响应头"
            all_present=false
        fi
    done

    if [ "$all_present" = true ]; then
        print_success "所有安全响应头已正确设置"
        ((PASSED_TESTS++))
    fi
}

# 清理
cleanup() {
    print_section "清理测试文件"

    rm -rf "$TEMP_DIR"
    rm -f "$COOKIES_FILE"

    print_info "清理完成"
}

# 打印测试结果摘要
print_summary() {
    print_header "测试结果摘要"

    echo -e "总测试数: ${BLUE}$TOTAL_TESTS${NC}"
    echo -e "通过: ${GREEN}$PASSED_TESTS${NC}"
    echo -e "失败: ${RED}$FAILED_TESTS${NC}"

    local pass_rate=0
    if [ $TOTAL_TESTS -gt 0 ]; then
        pass_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    fi

    echo -e "通过率: ${BLUE}${pass_rate}%${NC}"

    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "\n${GREEN}🎉 所有测试通过！${NC}\n"
        return 0
    else
        echo -e "\n${RED}⚠️  有 $FAILED_TESTS 个测试失败，请检查上述错误${NC}\n"
        return 1
    fi
}

# 主函数
main() {
    init

    # 登录
    if ! login; then
        print_info "登录失败，跳过需要认证的测试..."
        print_info "您可以通过以下方式手动获取 cookies:"
        print_info "1. 在浏览器中登录"
        print_info "2. 导出 cookies 到 $COOKIES_FILE"
        print_info "3. 重新运行此脚本"
    fi

    # 运行所有测试
    test_upload_api
    test_post_api
    test_topic_api
    test_profile_api
    test_comment_api
    test_like_api
    test_security_headers

    # 清理
    cleanup

    # 打印结果
    print_summary
}

# 信号处理
trap cleanup EXIT INT TERM

# 运行主函数
main "$@"
