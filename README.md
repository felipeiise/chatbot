# ChatBot

> Test for chatbot locking mechanism

## Prerequisites

This project requires NodeJS (version 8 or later) and NPM.
[Node](http://nodejs.org/) and [NPM](https://npmjs.org/) are really easy to install.
To make sure you have them available on your machine,
try running the following command.

The project also needs Redis server installed on local machine

```sh
$ npm -v && node -v
6.4.1
v8.16.0

$ redis-server --version
Redis server v=5.0.7 sha=00000000:0 malloc=jemalloc-5.2.1 bits=64 build=66bd629f924ac924
```

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

## Installation

Start with cloning this repo on your local machine:

```sh
$ git clone https://github.com/felipeiise/chatbot.git
$ cd chatbot
```

To install and set up the library, run:

```sh
$ npm install
```

## Usage

### Serving the app

```sh
$ npm start
```

### Testing in your browser to reply every message

```sh
http://localhost:4200/?number=user1&mode=each
```

### Testing in your browser to reply only first message after timeout

```sh
http://localhost:4200/?number=user1&mode=first
```
### Testing in your browser to reply all messages in a single response

```sh
http://localhost:4200/?number=user1&mode=all
```
