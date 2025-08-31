# Use an official Node.js runtime as a parent image
FROM node:20

# Set the working directory in the container
WORKDIR /app

# Copy package.json and package-lock.json first (to leverage Docker cache)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Make port 6173 available to the world outside this container
EXPOSE 6173

# Command to run the app
CMD ["npm", "run", "dev", "--", "--host", "--port", "6173"]
