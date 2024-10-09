const fs = require('fs');
const chalk = require('chalk');
const moment = require('moment-timezone');
const { downloadContentFromMessage } = require('@whiskeysockets/baileys');

const config = JSON.parse(fs.readFileSync('./arquivos/config.json'));

const p = config.p; // Prefixo dos comandos
const dono = config.dono; // ID do dono
const nomeBot = config.nomeBot; // Nome do bot

const { StartBot, black, vermelho, amarelo } = require('./connection/connection.js');

async function StartZap() {
    let sock = await StartBot();

    sock.ev.process(async (events) => {
        if (events['messages.upsert']) {
            const newbase = events['messages.upsert'];
            for (const info of newbase.messages) {
                if (info.message && typeof info.message === 'object') {
                    const type = Object.keys(info.message)[0];

                    // Determina a mensagem e o corpo
                    const body =
                        (type === 'conversation' && info.message.conversation.startsWith(p)) ? info.message.conversation :
                        (type === 'extendedTextMessage' && info.message[type].text.startsWith(p)) ? info.message[type].text : '';
                    const budy =
                        (type === 'conversation') ? info.message.conversation :
                        (type === 'extendedTextMessage') ? info.message.extendedTextMessage.text : '';

                    const from = info.key.remoteJid;
const isGroup = from.endsWith('@g.us');
const sender = isGroup ? info.key.participant : from;
const comando = body.slice(1).trim().split(/ +/).shift().toLowerCase(); // Comando após o prefixo
const pushname = info.pushName ? info.pushName : nomeBot; // Nome do usuário
const args = body.trim().split(/ +/).splice(1); // Argumentos do comando
const q = args.join(' '); // Juntar os argumentos

const enviar = (message) => {
    sock.sendMessage(from, { text: message }, { quoted: info });
};

try {
    switch (comando) {
        // Adicione seus comandos aqui
        case 'e':
            enviar('Comando de exemplo recebido!');
            break;

        case 'l':
            enviar(`🚨🚨 OPORTUNIDADE 🚨🚨`);
            break;

        case 'ajuda':
            enviar(`🔍 Comandos disponíveis:
            1. *e* - Exibe uma mensagem de exemplo.
            2. *l* - Anuncia uma oportunidade.
            3. *ajuda* - Lista todos os comandos disponíveis.`);
            break;

        case 'sayhi':
            enviar(`👋 Olá, ${pushname}! Como posso ajudar você hoje?`);
            break;
        
        default:
            enviar(`❓ Comando não reconhecido. Use *ajuda* para ver a lista de comandos.`);
            break;
    }
} catch (e) {
    console.log(amarelo('\n', `[ 💥 ERROR DETECTADO 💥 ]`, '\n', vermelho(e)));
    sock.sendMessage(dono, { text: `Erro: ${e.message}`, quoted: info });

                    }
                }
            }
        }
    });
}

StartZap();