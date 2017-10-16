# NodeJS (With Express Framework) Seed Project
This app assumes a connection to postgres exists in development server.

* Change **initDb** in **config.json** to the database that already exists in your Postgres (e.g. 'postgres' in Windows, and your user name in Linux)
* If you use windows, in **package.json** change npm/test to:

    _jasmine&jasmine-node server_spec_

* If you do not have jasmine or jasmine-node, install them globally:

    _npm install -g jasmine
    npm install -g jasmine-node_

* run npm install:

    _npm install_

* at this point you should  be able to run the project:
_npm start_

* then you should be able to run tests:
    _npm test_