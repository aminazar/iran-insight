FROM node:8-alpine
# add user
RUN addgroup -g 997 -S app \
&& adduser -G app -u 998 -D -S app
# Working directory for application
RUN mkdir /iran_insight
ADD . /iran_insight
# write access to public documents folder
RUN chown -R app:app /iran_insight/public
USER app
WORKDIR /iran_insight
RUN npm i
# Binds to port 3000
EXPOSE 3000
# Creates a mount point
VOLUME [ "/usr/src/app" ]
CMD ["npm", "start"]
