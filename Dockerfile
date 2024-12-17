FROM node:22.12.0

# Add a new user "nodeapp"
RUN useradd nodeapp

# Create app directory
WORKDIR /home/nodeapp/

# Copy required artifacts
COPY --chown=nodeapp:nodeapp package.json ./package.json
COPY --chown=nodeapp:nodeapp package-lock.json ./package-lock.json

# Installing node modules
RUN npm install

# Copy code
COPY --chown=nodeapp:nodeapp tsconfig.json ./tsconfig.json
COPY --chown=nodeapp:nodeapp tsoa.json ./tsoa.json
COPY --chown=nodeapp:nodeapp swagger.json ./swagger.json
COPY --chown=nodeapp:nodeapp keys ./keys
COPY --chown=nodeapp:nodeapp src ./src
COPY --chown=nodeapp:nodeapp .env ./.env

# Building code
RUN npm run build

# Updating swagger
RUN npm run swagger

# Updating typedocs
RUN npm run doc

# Copy files for test
COPY --chown=nodeapp:nodeapp .env.test ./.env.test
COPY --chown=nodeapp:nodeapp jest.config.ts ./jest.config.ts

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

CMD [ "node", "--enable-source-maps", "dist/index.js" ]