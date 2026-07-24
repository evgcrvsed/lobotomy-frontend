# Стадия 1: сборка React-приложения
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# ID приложения VK ID (вшивается в сборку)
ARG VITE_VK_APP_ID
ENV VITE_VK_APP_ID=$VITE_VK_APP_ID
RUN npm run build

# Стадия 2: nginx отдаёт статику и проксирует API на бэкенд
FROM nginx:alpine
# Как шаблон: entrypoint nginx подставит ${ALLOWED_IP} из переменной окружения.
# Собственные переменные nginx ($host, $remote_addr, ...) не трогаются —
# entrypoint подставляет только реально заданные env-переменные.
COPY nginx.conf /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
