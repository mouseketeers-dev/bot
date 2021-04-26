# docker build -t mouseketeers/bot .
# docker run --name test-bot --env DEBUG=mkt:* --env name=minqi -v %cd%/user:/usr/bot/user -v %cd%/src:/usr/bot/src -d mouseketeers/bot:latest
# https://medium.com/trendyol-tech/how-we-reduce-node-docker-image-size-in-3-steps-ff2762b51d5a
# https://stackoverflow.com/a/62383642/4159941 setcomp security
# https://github.com/Zenika/alpine-chrome/blob/master/Dockerfile
# https://stackoverflow.com/questions/51110793/bumping-package-json-version-without-invalidating-docker-cache

ARG NODE_VERSION=15.13
ARG OS=alpine

#### Stage BASE ########################################################################################################
FROM node:${NODE_VERSION}-${OS} AS base

RUN apk update \
    && apk add chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont
    
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN mkdir -p /usr/bot \
    && adduser -D bot \
    && chown -R bot:bot /usr/bot
	
WORKDIR /usr/bot

#### Stage BUILD #######################################################################################################
FROM base AS build

# install build dependencies
RUN apk add --no-cache --virtual .build-deps \
    python3 build-base clang clang-dev cmake \ 
    openssh-client git \
    && apk add --no-cache libpng-dev linux-headers
	
# https://vsupalov.com/build-docker-image-clone-private-repo-ssh-key/
RUN mkdir /root/.ssh/
COPY github_rsa /root/.ssh/id_rsa
RUN chmod 600 /root/.ssh/id_rsa

# make sure your domain is accepted
RUN touch /root/.ssh/known_hosts
RUN ssh-keyscan github.com >> /root/.ssh/known_hosts

COPY package.json ./

# Tell Puppeteer to skip installing Chrome. We'll be using the installed package.

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV KING_REWARD_SOLVER_ENABLE_REBUILD=1
RUN yarn add node-addon-api && yarn
RUN apk del .build-deps \
	&& rm -rf /var/cache/apk/* \
	&& rm -r /tmp/*

#### Stage RELEASE #####################################################################################################
FROM base AS RELEASE

COPY --from=build --chown=bot /usr/bot/package.json .
COPY --from=build --chown=bot /usr/bot/node_modules ./node_modules

ENV LD_LIBRARY_PATH=/usr/bot/node_modules/king-reward-solver/opencv-prebuilt/linux/lib:$LD_LIBRARY_PATH
ENV BROWSER_MODE=headless

USER bot

CMD ["npm", "run", "bot"]
