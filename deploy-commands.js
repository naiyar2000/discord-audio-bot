const { REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();
const fs = require('fs');

const commands = [
  new SlashCommandBuilder()
    .setName('play')
    .setDescription('Play a selected audio clip from dropdown'),

  new SlashCommandBuilder()
    .setName('controls')
    .setDescription('Show playback control buttons'),

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log('✅ Slash commands registered!');
  } catch (err) {
    console.error(err);
  }
})();
