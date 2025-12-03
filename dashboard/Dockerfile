FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build args for Vite (needed at build time)
ARG VITE_GHOST_URL
ARG VITE_APP_URL
ARG VITE_GHOST_CONTENT_API_KEY
ARG VITE_BASE_PATH="/app/"

ENV VITE_GHOST_URL=$VITE_GHOST_URL
ENV VITE_APP_URL=$VITE_APP_URL
ENV VITE_GHOST_CONTENT_API_KEY=$VITE_GHOST_CONTENT_API_KEY
ENV VITE_BASE_PATH=$VITE_BASE_PATH

# Build the app
RUN npm run build

# Expose port (Metal edge defaults to 3000, container listens on $PORT)
EXPOSE 3000

# Start the server
CMD ["npm", "start"]
