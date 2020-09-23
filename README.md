# Kouko

Kouko is an HTTP based bittorrent tracker written in Typescript / node.

It supports announces and scrapes, uses Redis as a store for the peers, and express for the HTTP server.

This project is currently in development, bugs expected. Feel free to open issues.

## Thanks

<center>

[<img src="https://user-images.githubusercontent.com/6680615/88460516-56eac500-cecf-11ea-8552-584eaaac5297.png" width="300">](https://clients.walkerservers.com/)

Massive Thanks to <a href="https://walkerservers.com/">WalkerServers</a> for sponsoring this project. Check them out for affordable, high performance dedicated servers!
</center>

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

