FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY docs ./docs
EXPOSE 4000
CMD ["npm", "start"]
