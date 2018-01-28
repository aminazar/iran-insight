FROM node:8-alpine

# Modify these variables depending on your application:
# * `TZ` Timezone for the app.
# * `BABEL_DISABLE_CACHE` If you use Babel, Babel cache won't be useful with
#    Docker as containers do not keep their state - generating a cache on
#   container start increases the start time.
ENV TZ=Asia/Tehran \
    BABEL_DISABLE_CACHE=1

# Install the required packages. Find any additional packages from [the Alpine
# package explorer](https://pkgs.alpinelinux.org/packages).
RUN apk update && \
    apk add tzdata curl bash ca-certificates rsync supervisor nginx \
            python python-dev py-pip build-base libpng-dev autoconf automake nasm libtool && \
    # Set the timezone based on the `TZ` variable above.
    cp /usr/share/zoneinfo/${TZ} /etc/localtime && \
    echo "${TZ}" > /etc/timezone && \
    # Setup permissions for directories and files that will be written to at runtime.
    # These need to be group-writeable for the default Docker image's user.
    # To do this, the folders are created, their group is set to the root
    # group, and the correct group permissions are added.
    mkdir -p /usr/src/app /.config /run/nginx /var/lib/nginx/logs && \
    chgrp -R 0        /var/log /var/run /var/tmp /run/nginx /var/lib/nginx && \
    chmod -R g=u,a+rx /var/log /var/run /var/tmp /run/nginx /var/lib/nginx && \
    # Clean up the package cache. This reduces the size of the Docker image.
    rm -rf /var/cache/apk/*

# By default all ports are closed in the container. Here the nginx port is opened.
# Other ports that need to be opened can be added here (only ports above 1024), separated by spaces.
EXPOSE 3000
# Set the current directory for the Docker image.
WORKDIR /usr/src/app

# Copy the required configuration files into the Docker image. Don't copy the
# application files yet as they prevent `npm install` from being cached by
# Docker's layer caching mechanism.
COPY package.json ./

# Run npm install.
RUN npm install

# Copy the application files. Initially copy them to a temp directory so their
# permissions can be updated and then copy them to the target directory. This
# reduces the size of the Docker image.
COPY . /tmp/app
RUN chgrp -R 0 /tmp/app /.config && \
    chmod -R g=u /tmp/app /.config && \
    cp -a /tmp/app/. /usr/src/app && \
    rm -rf /tmp/app  && \
    # Create the dump.rdb file if not exist and set permission
    touch  /usr/src/app/dump.rdb && \
    chgrp -R 0   /usr/src/app/dump.rdb && \
    chmod -R g=u /usr/src/app/dump.rdb
    
# Specify the command to run when the container starts.
CMD ["npm" , "start"]

# Specify the default user for the Docker image to run as.
USER 1001
