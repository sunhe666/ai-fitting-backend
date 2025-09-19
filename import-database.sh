#!/bin/bash
# 数据库导入脚本

echo "🗄️ AI试衣项目数据库导入脚本"
echo "================================"

# 检查MySQL是否可用
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL命令未找到，请检查MySQL是否已安装"
    echo "💡 如果使用phpStudy，请确保MySQL已启动并配置环境变量"
    exit 1
fi

# 数据库配置
DB_HOST="localhost"
DB_PORT="3306"
DB_USER="root"
DB_PASSWORD="root"
DB_NAME="ai_tryClothes"
SQL_FILE="database/init-phpstudy.sql"

echo "📋 数据库配置:"
echo "   主机: $DB_HOST:$DB_PORT"
echo "   用户: $DB_USER"
echo "   数据库: $DB_NAME"
echo "   SQL文件: $SQL_FILE"
echo ""

# 检查SQL文件是否存在
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL文件不存在: $SQL_FILE"
    exit 1
fi

# 测试MySQL连接
echo "⏳ 测试MySQL连接..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ MySQL连接成功"
else
    echo "❌ MySQL连接失败"
    echo "💡 请检查:"
    echo "   1. phpStudy是否已启动"
    echo "   2. MySQL服务是否运行"
    echo "   3. 用户名密码是否正确"
    echo ""
    echo "🔧 手动执行命令:"
    echo "   mysql -h$DB_HOST -P$DB_PORT -u$DB_USER -p$DB_PASSWORD < $SQL_FILE"
    exit 1
fi

# 导入数据库
echo ""
echo "⏳ 开始导入数据库..."
mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" < "$SQL_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 数据库导入成功！"
    echo ""
    echo "📊 验证数据库结构:"
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "
        USE $DB_NAME;
        SELECT 
            TABLE_NAME as '表名', 
            TABLE_COMMENT as '说明'
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_SCHEMA = '$DB_NAME' 
        ORDER BY TABLE_NAME;
    "
    echo ""
    echo "🎉 数据库 $DB_NAME 已准备就绪！"
    echo "🚀 现在可以启动应用: npm run dev"
else
    echo "❌ 数据库导入失败"
    echo "💡 请检查SQL文件语法或手动导入"
fi
