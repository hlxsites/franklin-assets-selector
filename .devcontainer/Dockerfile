FROM mcr.microsoft.com/devcontainers/base:jammy

USER vscode

ARG NODE_VERSION

RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash && \
    export NVM_DIR="$HOME/.nvm" && \
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh" && \
    nvm install $NODE_VERSION && \
    nvm use $NODE_VERSION && \
    npm install -g npm@latest

ENV NODE_PATH $NVM_DIR/versions/node/$NODE_VERSION/lib/node_modules
ENV PATH      $NVM_DIR/versions/node/$NODE_VERSION/bin:$PATH

RUN export NVM_DIR="$HOME/.nvm" && \. "$NVM_DIR/nvm.sh" && \
    npm install -g @adobe/aio-cli
    
RUN export NVM_DIR="$HOME/.nvm" && \. "$NVM_DIR/nvm.sh" && \
    aio telemetry yes && \
    aio plugins:install @adobe/aio-cli-plugin-api-mesh 


