FROM node:18-alpine

WORKDIR /app

# Copy dependency definition
COPY package*.json ./

# Install frontend dependencies
RUN npm install

# Copy application source code
COPY . .

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host"]
