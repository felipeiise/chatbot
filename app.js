const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const { HOST, PORT, REDIS_URL } = require('./config');

const Redis = require('ioredis');
const redis = new Redis(REDIS_URL);

const { uuidEmit } = require('uuid-timestamp');
const { exit } = require('process');

const RESPONSE_TIME = 5000;

redis.flushdb(); // Clear redis cache every "restart"

app.use(express.static(__dirname + '/node_modules'));
app.get('/', function(req, res,next) {
    res.sendFile(__dirname + '/index.html');
});

function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

io.on('connection', (client) => {

    client.on('join', function(number, message) {
        console.log(`${message} ${number}`);
        client.join(number);
    });

    client.on('messages', async function(mode, number, message) { // inside every message event we set a timeout

        io.to(number).emit('broad', '<span class="user">' + message + '</span>');

        //console.log(`Nova mensagem de ${number}: ${message}`);
        
        const message_id = uuidEmit();
        //console.log(`Your message UUID v4 is: ${message_id}`);

        if (mode === 'each') {

            timeout = 0;

            saveMessage(number, message, message_id);

            setTimeout(() => {
                doReply(mode, number, message_id);
            }, timeout);

        } else if (mode === 'first' || mode === 'all') {

            timeout = RESPONSE_TIME;

            saveMessage(number, message, message_id);

            setTimeout(() => {
                doReply(mode, number, message_id);
            }, timeout);

        } else if (mode === 'lock') {
            
            console.log('\nlock mode\n');

            timeout = randomInteger(2500, 5000);

            const isLocked = await getSetLock(number);

            if (isLocked === 'true') {
                console.log('Mensagem descartada até a primeira mensagem ser respondida');
            } else {
                saveMessage(number, message, message_id);
                console.log('Primeira mensagem');
                setTimeout(() => {
                    doReply(mode, number, message_id);
                }, timeout);
            }

        }

        console.log(timeout);

    });

});

async function getSetLock(number) {
    return await redis.getset(`lock_${number}`, true).then((result) => {
        console.log('getLock: ' + result);
        return result;
    });
}

async function setLock(number, status) {
    console.log('setLock');
    await redis.set(`lock_${number}`, status);
}

async function saveMessage(number, message, message_id) {
    await redis.set(`reply_${number}`, message_id);
    //console.log(`reply_${number}: ${message_id}`);
    await redis.lpush(number, message_id + ':' + message);
}

async function doReply(mode, number, message_id) {

    let reply = await redis.get(`reply_${number}`);

    let lock = await redis.get(`lock_${number}`);

    if (reply != 0) {
        if (mode === 'first' || mode === 'each') {
            getAndReplyFirst(number, message_id);
        } else if (mode === 'lock') {
            await getAndReplyLocked(number, message_id);
            await setLock(number, false);
        } else if (mode === 'all') {
            getAndReplyAll(number);
        }
    } else {
        console.log('NÃO responder');
    }

}

async function getAndReplyLocked(number, message_id) {
    console.log('ReplyLocked');
    console.log(`message_id: ${message_id}`);

    // recupero a primeira mensagem da lista de mensagens do usuário
    // deleto a lista nas linhas abaixo
    // e libero o chatbot para responder a primeira mensagem novamente
    let message = await redis.lindex(number, -1);

    const [id, ...text] = message.split(':');

    console.log(`id: ${id}`);
    console.log(`text: ${text}`);

    if (id === message_id) { //somente responde a primeira mensagem da lista acima

        io.to(number).emit('broad', `
            <span class="reply">Você: <b>${text}</b></span>
            <span class="bot">Resposta da mensagem: <b>${text}</b></span>
        `);

        redis.del(number); // descarta o restante das mensagens
        //await redis.set(`lock_${number}`, false);

    }
}

async function getAndReplyFirst(number, message_id) {

    console.log('ReplyFirst');

    console.log(`message_id: ${message_id}`);
    
    // recupero a primeira mensagem da lista de mensagens do usuário
    // deleto a lista nas linhas abaixo
    // e libero o chatbot para responder a primeira mensagem novamente
    let message = await redis.lindex(number, -1);

    const [id, ...text] = message.split(':');

    console.log(`id: ${id}`);
    console.log(`text: ${text}`);

    if (id === message_id) { //somente responde a primeira mensagem da lista acima

        io.to(number).emit('broad', `
            <span class="reply">Você: <b>${text}</b></span>
            <span class="bot">Resposta da mensagem: <b>${text}</b></span>
        `);

        redis.del(number); // descarta o restante das mensagens
        redis.set(`reply_${number}`, 0);

    }
    
}

async function getAndReplyAll(number) {

    let count_messages = await redis.llen(number);
    //console.log(count_messages);

    if (count_messages > 0) {

        console.log('replyAll');

        // recupero as mensagens do usuário e deleto a lista
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

server.listen(PORT, HOST);