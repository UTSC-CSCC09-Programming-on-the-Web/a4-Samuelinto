FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package.json ./
RUN npm install

# Copy app source
COPY . .

# Expose the port your app listens on
EXPOSE 3000

# Start the app
CMD ["node", "app.js"]