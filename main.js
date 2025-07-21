const { Client, GatewayIntentBits } = require('discord.js');
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
} = require('@discordjs/voice');
const path = require('path');
const fs = require('fs');
const { env } = require('process');


const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const audioPlayer = createAudioPlayer();
let connection = null;

client.once('ready', () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (!message.guild || message.author.bot) return;

  const [command, arg] = message.content.trim().split(' ');

  if (command === '!list') {
    const clips = fs.readdirSync('./audio')
      .filter(file => file.endsWith('.mp3'))
      .map(file => `🎵 ${path.basename(file, '.mp3')}`)
      .join('\n');
    message.reply(`**Available clips:**\n${clips}`);
    return;
  }

  if (command === '!play') {
    if (!arg) return message.reply('🎵 Please specify a clip name. E.g., `!play hello`');

    const filePath = path.join(__dirname, 'audio', `${arg}.mp3`);
    if (!fs.existsSync(filePath)) return message.reply('❌ Clip not found.');

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) return message.reply('🚫 You must be in a voice channel.');

    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: message.guild.id,
      adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    });

    try {
      await entersState(connection, VoiceConnectionStatus.Ready, 5_000);
    } catch (err) {
      return message.reply('❌ Failed to connect to voice channel.');
    }

    const resource = createAudioResource(filePath);
    audioPlayer.play(resource);
    connection.subscribe(audioPlayer);

    audioPlayer.once(AudioPlayerStatus.Idle, () => {
      connection.destroy();
      connection = null;
    });

    message.reply(`▶️ Playing \`${arg}\``);
  }

  if (command === '!pause') {
    if (audioPlayer.pause()) {
      message.reply('⏸️ Playback paused.');
    } else {
      message.reply('⚠️ Nothing is currently playing.');
    }
  }

  if (command === '!resume') {
    if (audioPlayer.unpause()) {
      message.reply('▶️ Playback resumed.');
    } else {
      message.reply('⚠️ Cannot resume, nothing was paused.');
    }
  }

  if (command === '!stop') {
    audioPlayer.stop();
    if (connection) {
      connection.destroy();
      connection = null;
    }
    message.reply('⏹️ Playback stopped and bot disconnected.');
  }
});

const TOKEN = env.DISCORD_TOKEN; // Replace this with your token

client.login(TOKEN);
