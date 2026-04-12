# 每日打卡应用

一个简洁优雅的每日打卡记录应用，支持自定义事项、打卡记录和数据统计。

## 功能特性

- ✅ 自定义打卡事项（添加、删除、修改、拖拽排序）
- ✅ 可交互打卡，支持备注
- ✅ 支持补打卡
- ✅ 日历视图查看每日完成情况
- ✅ 趋势图分析打卡数据
- ✅ 任务完成排行统计
- ✅ PWA支持（可添加到桌面）
- ✅ 手机端适配

## 技术栈

- React 18
- Vite
- Supabase（数据库和认证）
- Recharts（图表）

## 部署步骤

### 1. 上传到GitHub

1. 在GitHub创建新仓库（如：checkin-app）
2. 下载本项目所有文件
3. 推送到GitHub仓库

### 2. Vercel部署

1. 访问 https://vercel.com
2. 点击 "Add New..." → "Project"
3. 选择你的GitHub仓库
4. 点击 "Deploy"
5. 等待部署完成

### 3. 访问应用

部署完成后，Vercel会给你一个永久访问链接，如：
`https://checkin-app-xxx.vercel.app`

## 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 环境变量

如果需要修改Supabase配置，编辑 `src/supabase.js` 文件中的：
- `supabaseUrl`
- `supabaseAnonKey`