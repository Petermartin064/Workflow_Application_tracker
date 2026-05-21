FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy project files
COPY . .

# Expose port
EXPOSE 5173

# Start the Vite development server and expose to network
CMD ["npm", "run", "dev", "--", "--host"]
