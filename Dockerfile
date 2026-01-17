# syntax=docker/dockerfile:1.6
FROM 524814437057.dkr.ecr.ap-south-1.amazonaws.com/base-images:node-20 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install -f
COPY . .
RUN npm run build

FROM 524814437057.dkr.ecr.ap-south-1.amazonaws.com/base-images:nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]