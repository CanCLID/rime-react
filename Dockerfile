FROM emscripten/emsdk AS emsdk
FROM node:22-bookworm AS builder

ARG ENABLE_LOGGING=ON
ENV ENABLE_LOGGING=$ENABLE_LOGGING

RUN apt update
RUN apt upgrade -y
RUN apt install -y \
	cmake \
	ninja-build \
	libboost-dev \
	libboost-regex-dev \
	libyaml-cpp-dev \
	libleveldb-dev \
	libmarisa-dev \
	libopencc-dev

COPY --from=emsdk /emsdk /emsdk
ENV PATH="$PATH:/emsdk/upstream/emscripten"

COPY / /rime-react
WORKDIR /rime-react

RUN npm ci
RUN npm run boost
RUN npm run native
RUN npm run lib
RUN npm run wasm
RUN npm run build
