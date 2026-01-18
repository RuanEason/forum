#!/bin/bash
# 任务完成通知脚本
# 使用 notify-send 发送桌面通知

NOTIFY_TITLE="${1:-Claude Code}"
NOTIFY_MESSAGE="${2:-任务已完成}"
NOTIFY_URGENCY="${3:-normal}" # low, normal, critical

# 检查 notify-send 是否可用
if command -v notify-send &> /dev/null; then
    notify-send "$NOTIFY_TITLE" "$NOTIFY_MESSAGE" -u "$NOTIFY_URGENCY" -i "dialog-information"
else
    echo "notify-send 不可用，跳过桌面通知"
    echo "[$NOTIFY_TITLE] $NOTIFY_MESSAGE"
fi
