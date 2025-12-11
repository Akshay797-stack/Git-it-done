FROM node:18-alpine

WORKDIR /app

# Install git if needed by the agent (though our agent just reads files)
RUN apk add --no-cache git

COPY package.json .
RUN npm install

COPY src ./src
COPY prompts ./prompts

# Create a 'cline' executable alias
RUN echo '#!/bin/sh' > /usr/local/bin/cline && \
    echo 'node /app/src/agent.js "$@"' >> /usr/local/bin/cline && \
    chmod +x /usr/local/bin/cline

ENTRYPOINT ["cline"]
