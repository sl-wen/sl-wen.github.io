# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine AS base

# 安装依赖阶段
FROM base AS deps
# 检查https://github.com/nodejs/docker-node/tree/b4117f9333da4138b03a546ec926ef50a31506c3#nodealpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# 复制package文件
COPY package.json package-lock.json* ./

# 设置环境变量以确保Sharp正确安装
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
ENV npm_config_platform=linux
ENV npm_config_arch=x64

# 安装依赖并重建Sharp
RUN npm ci --only=production && \
    npm rebuild sharp --platform=linux --arch=x64

# 构建阶段
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置环境变量
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1
ENV npm_config_platform=linux
ENV npm_config_arch=x64

# 构建应用
RUN npm run build

# 生产阶段
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV SHARP_IGNORE_GLOBAL_LIBVIPS=1

# 创建非root用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制构建产物
COPY --from=builder /app/public ./public

# 设置正确的权限
RUN mkdir .next
RUN chown nextjs:nodejs .next

# 复制必要的文件
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 启动应用
CMD ["node", "server.js"]