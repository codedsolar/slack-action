FROM node:latest

ENV NODE_ENV="production"

WORKDIR /opt/action/
COPY . .
RUN NODE_ENV="development" yarn install \
  && rm -Rf ./node_modules/ \
  && yarn install --ignore-scripts \
  && yarn cache clean \
  && rm -Rf \
    ./readme/ \
    ./src/ \
    ./tsconfig.json

ENTRYPOINT ["node", "/opt/action/lib/index.js"]
