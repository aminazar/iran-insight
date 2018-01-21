FROM node:8-alpine
# Working directory for application
RUN mkdir /iran_insight
ADD . /iran_insight
WORKDIR /iran_insight
RUN npm i
# Binds to port 3000
EXPOSE 3000
# Creates a mount point
VOLUME [ "/usr/src/app" ]
CMD ["npm", "start"]
