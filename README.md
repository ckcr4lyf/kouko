# Kouko

Kouko is an HTTP based bittorrent tracker written in Typescript / node.

It supports announces and scrapes, uses Redis as a store for the peers, and express for the HTTP server.

This project is currently in development, bugs expected. Feel free to open issues.

# Setup

Make sure you have node.js installed on your machine, and have an instance of redis running locally on port 6379 (TODO: Allow config)

Then you may clone the repository, and run
```sh
npm install
```

This should install all the dependencies. You can then build the tracker by running

```sh
npm run build
```

This will compile the typescript code into the final JavaScript.

# Configuration

You will need a `.env` file in the root, to specify the IP and port to bind to. And example config is:

```
IP=127.0.0.1
PORT=6969
```

This would listen on localhost at port 6969.

# Running the tracker

You can start the tracker with 

```sh
npm run start
```

