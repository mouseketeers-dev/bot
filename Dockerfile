# docker build --rm -t mouseketeers/bot .
# docker run --name test-bot --env DEBUG=mkt:* --env name=minqi -v %cd%/user:/usr/bot/user -v %cd%/src:/usr/bot/src -d mouseketeers/bot:latest
# https://medium.com/trendyol-tech/how-we-reduce-node-docker-image-size-in-3-steps-ff2762b51d5a
# https://stackoverflow.com/a/62383642/4159941 setcomp security
# https://github.com/Zenika/alpine-chrome/blob/master/Dockerfile
# https://stackoverflow.com/questions/51110793/bumping-package-json-version-without-invalidating-docker-cache

ARG NODE_VERSION=15.13
ARG OS=alpine

#### Stage OPENCV ######################################################################################################
FROM node:${NODE_VERSION}-${OS} AS opencv

ARG SRC_DIR=/tmp
ARG OPENCV_VERSION=4.5.1

RUN echo http://dl-cdn.alpinelinux.org/alpine/edge/testing >> /etc/apk/repositories \
    && echo http://dl-cdn.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories \
    && apk update 

# install build dependencies
RUN apk add --no-cache --virtual .build-deps \
	build-base \
	clang \
	clang-dev \
	git \
	cmake \
	wget \
	unzip \
	&& apk add --no-cache libpng-dev linux-headers python3

# download opencv source
RUN mkdir -p $SRC_DIR \
    && cd $SRC_DIR \
    && wget https://github.com/opencv/opencv/archive/$OPENCV_VERSION.zip \
    && unzip $OPENCV_VERSION.zip \
    && mv opencv-$OPENCV_VERSION opencv \
    && rm $OPENCV_VERSION.zip 

# build
RUN mkdir -p $SRC_DIR/opencv/build \
    && cd $SRC_DIR/opencv/build \
 	&& cmake -DCMAKE_BUILD_TYPE=RELEASE \
 	-DBUILD_LIST:STRING="ml,imgproc,imgcodecs" \
 	-DWITH_OPENCLAMDBLAS=OFF -DBUILD_JASPER=OFF -Dpackbits=OFF -DWITH_DIRECTX=OFF -DWITH_FFMPEG=OFF \
 	-Dthunder=OFF -DBUILD_opencv_js_bindings_generator=OFF -DWITH_PROTOBUF=OFF -DBUILD_opencv_dnn=OFF \
 	-DBUILD_ZLIB=OFF -DBUILD_opencv_java_bindings_generator=OFF -DWITH_OPENEXR=OFF -DBUILD_opencv_video=OFF \
 	-DWITH_IMGCODEC_SUNRASTER=OFF -DBUILD_opencv_photo=OFF -DWITH_JASPER=OFF -DWITH_GSTREAMER=OFF \
 	-DOPENCV_DNN_OPENCL=OFF -DBUILD_IPP_IW=OFF -DWITH_LAPACK=OFF -DBUILD_opencv_ts=OFF -DWITH_MSMF_DXVA=OFF \
 	-DWITH_OPENCL_D3D11_NV=OFF -DBUILD_PROTOBUF=OFF -Dmdi=OFF -DBUILD_opencv_python_bindings_generator=OFF \
 	-Dlzw=OFF -DWITH_QUIRC=OFF -DWITH_OPENJPEG=OFF -DBUILD_opencv_python_tests=OFF -DBUILD_opencv_features2d=OFF \
 	-DWITH_MSMF=OFF -Dccitt=OFF -DBUILD_OPENEXR=OFF -DBUILD_opencv_objdetect=OFF -DWITH_1394=OFF -DWITH_DSHOW=OFF \
 	-DWITH_ITT=OFF -DBUILD_opencv_apps=OFF -DWITH_WIN32UI=OFF -DWITH_IPP=OFF -Dlogluv=OFF -DWITH_IMGCODEC_PXM=OFF \
 	-DBUILD_opencv_objc_bindings_generator=OFF -DWITH_OPENCLAMDFFT=OFF -DBUILD_WEBP=OFF -DBUILD_PERF_TESTS=OFF \
 	-DBUILD_opencv_highgui=OFF -DWITH_IMGCODEC_PFM=OFF -DBUILD_JPEG=ON -DBUILD_OPENJPEG=OFF -Dnext=OFF \
 	-DBUILD_ITT=OFF -DBUILD_opencv_gapi=OFF -DBUILD_opencv_flann=OFF -DBUILD_JAVA=OFF -DWITH_WEBP=OFF \
 	-DWITH_JPEG=ON -DBUILD_opencv_stitching=OFF -DBUILD_TESTS=OFF \
 	-DWITH_TIFF=OFF -DWITH_OPENCL=OFF -DWITH_EIGEN=OFF -DBUILD_TIFF=OFF -DWITH_ADE=OFF -DWITH_VTK=OFF \
 	-DBUILD_opencv_calib3d=OFF -DBUILD_opencv_videoio=OFF -DWITH_IMGCODEC_HDR=OFF \
    .. \
    && make -j4 \
    && make install \
    && rm -rf ${SRC_DIR} \
    && apk del --purge .build-deps
   
#### Stage BASE ########################################################################################################
FROM node:${NODE_VERSION}-${OS} AS base

RUN apk update \
    && apk add chromium nss freetype freetype-dev harfbuzz ca-certificates ttf-freefont
    
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

RUN mkdir -p /usr/bot \
    && adduser -D bot \
    && chown -R bot:bot /usr/bot
    
COPY --from=opencv --chown=bot /usr/local/lib64 /usr/local/lib64
	
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

ENV LD_LIBRARY_PATH=/usr/local/lib64:$LD_LIBRARY_PATH
ENV BROWSER_MODE=headless

USER bot

CMD ["npm", "run", "bot"]
