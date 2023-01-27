FROM node:18.13.0-alpine3.17 as build

ENV NODE_ENV="development"

WORKDIR /opt/slack-action/
COPY . .
RUN yarn install

FROM node:18.13.0-alpine3.17

ENV NODE_ENV="production"

WORKDIR /opt/slack-action/
COPY . .
COPY --from=build /opt/slack-action/lib/ /opt/slack-action/lib/
RUN yarn install --ignore-scripts \
  && yarn cache clean \
  && rm -Rf \
    ./readme/ \
    ./src/ \
    ./tsconfig.json

ENTRYPOINT ["node", "/opt/slack-action/lib/index.js"]
