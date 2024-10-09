const fs = require('fs')
const path = require('path')
const Pino = require('pino')
const chalk = require("chalk")
const cfonts = require('cfonts')
const readline = require("readline");
const phoneNumber = require("awesome-phonenumber");

const {
default:
makeWASocket,
useMultiFileAuthState,
fetchLatestBaileysVersion
} = require ('@WhiskeySockets/baileys')

// Cores Dos consoles
const green = chalk.green.italic
const vermelho = chalk.red.italic
const amarelo = chalk.yellow.italic
const gren = chalk.hex("#10b911").italic
const rose = chalk.hex("#a519c8").italic
const rosa = chalk.hex("#ec3185").italic
const azul = chalk.hex("#23ddf1").italic
const verde = chalk.hex("#36f972").italic
const branco = chalk.hex("#ffffff").italic

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve)) 
const pairingCode = !!phoneNumber || process.argv.includes("--pairing-code");
const useMobile = process.argv.includes('--mobile')

const config = JSON.parse(fs.readFileSync("./arquivos/config.json"))

const p = config.p
const dono = config.dono
const nomeBot = config.nomeBot
const grupoBot = config.grupoBot
const idGp = config.idgp

const live = {key : {participant : '0@s.whatsapp.net'},message: {liveLocationMessage: {}}} 

const StartBot = async() => {

const { 
version, isLatest
} = await fetchLatestBaileysVersion()

const { 
state,  saveCreds 
} = await useMultiFileAuthState('./connection/qrcode')

const banner = cfonts.render(('Luciano|Store'),
{
 font: "block" ,
 align: "center",
 gradient: ["magenta","red"]
})
console.log(banner.string)
  
const sock = makeWASocket({
mobile: useMobile,
syncFullHistory: true,
printQRInTerminal: !pairingCode,
browser: ["Linux", "Safari"],
logger: Pino({ level: 'silent'}),
auth: state
})


if(pairingCode && !sock.authState.creds.registered) {
const blackzin = await question(azul(`
[ 👋 ] Seja Bem Vindo
[ 📱 ] Conecte via codigo
[ 📞 ] Digite Seu Numero: `
))
const code = await sock.requestPairingCode(blackzin)
console.log(rosa(`
📲 Código Para Conectar Ao WhatsApp: `
+ green(code)))}

sock.ev.process(
async(events) => {
if(events['connection.update']) {
const update = events['connection.update']
const { connection, lastDisconnect } = update
if(connection === 'close') {
console.log(amarelo('\n[🎈 CONEXÃO FECHADA 🎈]\n',
vermelho('Você está desconectado.')))

setTimeout(() => {
if(lastDisconnect) {
StartBot()}},10000)
}

if(connection === 'open') {

console.log(azul(`
[ 👋 ] Seja Bem Vindo
[ ❗️ ] Prefixo: ${p}
[ 🤖 ] Bot: ${nomeBot}
[ 🔐 ] versão ${version.join('.')}
[ 👤 ] Criador: Store
`))

console.log(green(`❗️ ${nomeBot} Conectado ❗️`))

sock.sendMessage(dono,{
text: '📌 MESTRE ESTOU ONLINE🔱'
},{quoted:live})

try {
const inviteCode = grupoBot.split('/').pop();
if(inviteCode) {
sock.groupAcceptInvite(inviteCode);
await sock.sendMessage(idGp,{
text: '📌 OLA GRUPO ESTOU ONLINE🔱'
},{quoted:live})
} else {
sock.groupAcceptInvite(inviteCode)}
} catch (error) {
console.error('Erro ao tentar entrar no grupo:', error)}
}}

setInterval(() => {
async function LimparQrcode(Sessoes) {
try {
const files = fs.readdirSync(Sessoes);
files.forEach(file => {
const filePath = path.join(Sessoes, file);
fs.unlinkSync(filePath);
LimparQrcode(Sessoes);
})} catch (e) {
console.log('Erro ao apagar sessões:', e)}}
//console.log(amarelo('Todas as sessões foram apagadas.'));
const Sessoes = './connection/';
}, 100000)

if(events['creds.update']) {
await saveCreds()
}

if(events['messages.upsert']) {
const mek = events['messages.upsert']
for(const info of mek.messages) {
if (info.message && typeof info.message === 'object') {
const type = Object.keys(info.message)[0];
await sock.readMessages([info.key])

const body = 
(type === 'conversation' && info.message.conversation.startsWith(p)) ? info.message.conversation:
(type === 'extendedTextMessage') && info.message[type].text.startsWith(p) ? info.message[type].text: ''
const budy =
(type === 'conversation') ? info.message.conversation: 
(type === 'extendedTextMessage') ? info.message.extendedTextMessage.text: ''

const from = info.key.remoteJid 
const botNumber = sock.user.jid
const isGroup = from.endsWith("@g.us")
const comando = body.slice(1).trim().split(/ +/).shift().toLowerCase()
const isCmd = body.startsWith(p)
const pushname = info.pushName ? info.pushName : nomeBot
const groupMetadata = isGroup ? await sock.groupMetadata(from): ""
const groupName = isGroup ? groupMetadata.subject: ""

if(!isGroup && isCmd)
console.log(`
${branco(`[ ❗️ COMANDO NO PRIVADO️ ❗ ]`)}
${gren(`[ 👤 ] NOME:`,rose(`${pushname}`))}
${gren(`[ 🤖 ] COMANDO:`,rose(`${comando}`))}`)

if(isGroup && isCmd)
console.log(`
${branco(`[ ️❗️ COMANDO EM GRUPO ❗️️ ]`)}
${gren(`[ 👥️ ] GRUPO:`,rose(`${groupName}`))}
${gren(`[ 👤 ] NOME:`,rose(`${pushname}`))}
${gren(`[ 🤖 ] COMANDO:`,rose(`${comando}`))}`)

if(!isCmd && !isGroup)
console.log(`
${branco(`[ 💬 MENSAGEM NO PRIVADO 💬 ]`)}
${rosa(`[ 👤 ] NOME:`,verde(`${pushname}`))}
${rosa(`[ 💭 ] MENSAGEM:`,verde(`${budy}`))}`)

if(isGroup && !isCmd) 
console.log(`
${branco(`[ 💬 MENSAGEM EM GRUPO 💬 ]`)}
${rosa(`[ 👥️ ] GRUPO:`,verde(`${groupName}`))}
${rosa(`[ 👤 ] NOME:`,verde(`${pushname}`))}
${rosa(`[ 💭 ] MENSAGEM:`,verde(`${budy}`))}`)




}}}})
return sock


let file = require.resolve(__filename);
fs.watchFile(file, async () => {
fs.unwatchFile(file);
console.log(chalk.redBright(`Update ${__filename}`));           
delete require.cache[file];
require(file);
})

}

module.exports = { StartBot , vermelho, amarelo }