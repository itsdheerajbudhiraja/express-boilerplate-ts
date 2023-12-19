FROM node:18.16.0

# Add a new user "nodeapp"
RUN useradd nodeapp

# Create app directory
WORKDIR /home/nodeapp/

# Copy required artifacts
COPY package.json ./package.json
COPY package-lock.json ./package-lock.json

# Installing node modules
RUN npm install

# Copy code
COPY tsconfig.json ./tsconfig.json
COPY tsoa.json ./tsoa.json
COPY swagger.json ./swagger.json
COPY keys ./keys
COPY src ./src
COPY .env ./.env

# Building code
RUN npm run build

# Updating swagger
RUN npm run swagger

# Copy files for test
COPY .env.test ./.env.test
COPY jest.config.ts ./jest.config.ts

# Running test cases
RUN npm test

# Removing redundant files
RUN rm -rf src/ dist/__tests__/ .env.test jest.config.ts tsoa.json tsconfig.json

# changing directory ownership from root to nodeapp user
RUN chown -R nodeapp:nodeapp /home/nodeapp/

# Change to non-root privilege
USER nodeapp

# Preventing swagger from comments being ovveridden because we deleted src folder
ENV UPDATE_SWAGGER_ON_START=false

CMD [ "npm", "run", "prod" ]