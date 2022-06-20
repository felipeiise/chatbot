# ChatBot

> Test for chatbot locking mechanism

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
