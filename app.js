const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const { host, port, password } = require('./redis');

const Redis = require('ioredis');
const redis = new Redis();

const { uuidEmit } = require('uuid-timestamp');
const { exit } = require('process');

const RESPONSE_TIME = 5000;

redis.flushdb(); // Clear redis cache every "restart"

app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

io.on('connection', (client) => {

    client.on('join', function(number, message) {
        console.log(`${message} ${number}`);
        client.join(number);
    });

    client.on('messages', function(mode, number, message) { // inside every message event we set a timeout

        console.log(`Nova mensagem de ${number}: ${message}`);
        
        const message_id = uuidEmit();
        console.log(`Your message UUID v4 is: ${message_id}`);

        saveMessage(number, message, message_id);

        let timeout = mode === 'each' ? 0 : RESPONSE_TIME;

        setTimeout(() => {
            doReply(mode, number, message_id);
        }, timeout);
        
        io.to(number).emit('broad', '<span class="user">' + message + '</span>');

    });

});

async function saveMessage(number, message, message_id) {
    await redis.set(`reply_${number}`, message_id);
    //console.log(`reply_${number}: ${message_id}`);
    await redis.lpush(number, message_id + ':' + message);
}

async function doReply(mode, number, message_id) {

    let reply = await redis.get(`reply_${number}`);

    if (reply != 0) {
        if (mode === 'first' || mode === 'each') {
            getAndReplyFirst(number, message_id);
        } else {
            getAndReplyAll(number);
        }
    } else {
        console.log('NÃO responder');
    }

}

async function getAndReplyFirst(number, message_id) {

    console.log('ReplyFirst');

    console.log(`message_id: ${message_id}`);
    
    let message = await redis.lindex(number, -1); // get first message from list

    const [id, ...text] = message.split(':');

    console.log(`id: ${id}`);
    console.log(`text: ${text}`);

    if (id === message_id) {

        io.to(number).emit('broad', `
            <span class="reply">Você: <b>${text}</b></span>
            <span class="bot">Resposta da mensagem: <b>${text}</b></span>
        `);

        redis.del(number);
        redis.set(`reply_${number}`, 0);

    }
    
}

async function getAndReplyAll(number) {

    let count_messages = await redis.llen(number);
    //console.log(count_messages);

    if (count_messages > 0) {

        console.log('replyAll');

        let messages = await redis.lrange(number, 0, -1);
        redis.del(number);

        //console.log(messages);

        let reply = '<span class="reply">Você:</span>';

        for (let i = count_messages-1; i >= 0; i--) {
            //console.log(messages[i]);
            let [id, ...text] = messages[i].split(':');
            reply += `<span class="reply"><b>${text}</b></span>`;
        }

        io.to(number).emit('broad', `
            ${reply}
            <span class="bot">Resposta das mensagens: <b>RESPOSTA</b></span>
        `);

    }

}

server.listen(4200);