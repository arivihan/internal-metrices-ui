# syntax=docker/dockerfile:1.6
FROM 524814437057.dkr.ecr.ap-south-1.amazonaws.com/base-images:node-20 AS builder
WORKDIR /app

# Accept build arguments for Vite environment variables
ARG VITE_API_BASE_URL
ARG VITE_SIDEBAR_API_URL
ARG VITE_DASHBOARD_SERVICES_API_URL

# Set as environment variables for the build process
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_SIDEBAR_API_URL=$VITE_SIDEBAR_API_URL
ENV VITE_DASHBOARD_SERVICES_API_URL=$VITE_DASHBOARD_SERVICES_API_URL

COPY package*.json ./
RUN npm install -f
COPY . .
RUN npm run build

FROM 524814437057.dkr.ecr.ap-south-1.amazonaws.com/base-images:nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]