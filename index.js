import 'dotenv/config';
import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  Client,
  EmbedBuilder,
  Events,
  GatewayIntentBits,
  ModalBuilder,
  Partials,
  PermissionsBitField,
  TextInputBuilder,
  TextInputStyle
} from 'discord.js';
import OpenAI from 'openai';

const PREFIX = process.env.PREFIX || '.';
const TOKEN = process.env.DISCORD_TOKEN;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!TOKEN) {
  console.error('Missing DISCORD_TOKEN in .env');
  process.exit(1);
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages
  ],
  partials: [Partials.Channel]
});

const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;
const pendingAnnouncements = new Map();

const COLORS = {
  crimson: 0xD20B2A,
  darkRed: 0x7A0718,
  charcoal: 0x15151A
};

function asset(name) {
  return new AttachmentBuilder(`./assets/${name}`);
}

function isManager(member) {
  return Boolean(member?.permissions?.has(PermissionsBitField.Flags.ManageGuild));
}

function inviteUrl() {
  const id = client.user?.id || 'YOUR_CLIENT_ID';
  const perms = 117760;
  return `https://discord.com/oauth2/authorize?client_id=${id}&permissions=${perms}&integration_type=0&scope=bot%20applications.commands`;
}

function infoEmbeds() {
  const top = new EmbedBuilder()
    .setColor(COLORS.crimson)
    .setTitle('CHAOS IMPERIUM')
    .setDescription(
      '**Order forged through discipline. Community strengthened through respect.**\n\n' +
      'Chaos Imperium is built for organized conversation, fair moderation, and a server culture where members can actually enjoy being here.'
    )
    .setImage('attachment://info-banner.png');

  const details = new EmbedBuilder()
    .setColor(COLORS.darkRed)
    .addFields(
      {
        name: '⚔️  IMPERIUM STANDARD',
        value: 'Respect members and staff. Jokes are welcome; harassment is not. When someone asks you to stop, stop.'
      },
      {
        name: '🛡️  SERVER DISCIPLINE',
        value: 'No spam, channel misuse, NSFW content, racial slurs, doxxing, raids, IP-grabbing links, mic/earrape spam, or unrelated advertising.'
      },
      {
        name: '📜  MODERATION AUTHORITY',
        value: 'Moderators may act on harmful behavior not explicitly listed when it threatens the server or its members. Serious violations may result in removal; bans may be appealed.'
      },
      {
        name: '🔥  PRINCIPLE',
        value: 'Use common sense, protect the community, and do not weaponize loopholes in the rules.'
      }
    )
    .setFooter({ text: 'CHAOS IMPERIUM • Discipline • Unity • Order' })
    .setThumbnail('attachment://chaos-imperium-logo.png');

  return [top, details];
}

function announcementTypeButtons(ownerId) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`announce:application:${ownerId}`)
      .setLabel('APPLICATION ANNOUNCEMENT')
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId(`announce:general:${ownerId}`)
      .setLabel('GENERAL ANNOUNCEMENT')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId(`announce:other:${ownerId}`)
      .setLabel('OTHER')
      .setStyle(ButtonStyle.Secondary)
  );
}

function buildAnnouncementEmbed(type, text, author) {
  const cleanType = type.toUpperCase().slice(0, 70);
  return new EmbedBuilder()
    .setColor(COLORS.crimson)
    .setAuthor({ name: 'CHAOS IMPERIUM' })
    .setTitle(`◈ ${cleanType}`)
    .setDescription(text)
    .setThumbnail('attachment://chaos-imperium-logo.png')
    .setFooter({ text: `Issued by ${author}` })
    .setTimestamp();
}

async function sendAnnouncement(channel, type, text, author) {
  const top = asset('blood-border-top.png');
  const bottom = asset('blood-border-bottom.png');
  const logo = asset('chaos-imperium-logo.png');

  await channel.send({ files: [top] });
  await channel.send({
    embeds: [buildAnnouncementEmbed(type, text, author)],
    files: [logo]
  });
  await channel.send({ files: [bottom] });
}

async function biblicalAI(message, prompt, longMode = false) {
  if (!openai) {
    await message.reply('The AI feature is not configured yet. Add `OPENAI_API_KEY` to your `.env` file.');
    return;
  }

  const lengthRule = longMode
    ? 'You may give a fuller response, usually 2-5 short paragraphs.'
    : 'Keep the answer concise, usually 1-4 sentences.';

  const system = `You are the Chaos Imperium Scripture-style assistant. Speak in a solemn, wise, biblical cadence inspired by old scripture, but do not falsely claim that your own words are Bible verses. ${lengthRule} Be respectful and clear. If quoting scripture, keep quotations brief and cite the book/chapter/verse when confident. Never fabricate a verse or citation. Do not imitate a specific modern copyrighted Bible translation word-for-word.`;

  const response = await openai.responses.create({
    model: 'gpt-5-mini',
    input: [
      { role: 'system', content: system },
      { role: 'user', content: prompt }
    ]
  });

  const text = response.output_text?.trim() || 'No answer was returned.';
  await message.reply({
    embeds: [
      new EmbedBuilder()
        .setColor(COLORS.darkRed)
        .setAuthor({ name: 'Chaos Imperium • Scripture Voice' })
        .setDescription(text)
        .setFooter({ text: longMode ? 'Extended response authorized' : 'Concise response' })
    ]
  });
}

client.once(Events.ClientReady, readyClient => {
  console.log(`Chaos Imperium online as ${readyClient.user.tag}`);
  console.log(`Invite: ${inviteUrl()}`);
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot || !message.content.startsWith(PREFIX)) return;

  const body = message.content.slice(PREFIX.length).trim();
  if (!body) return;
  const [commandRaw, ...args] = body.split(/\s+/);
  const command = commandRaw.toLowerCase();

  try {
    if (command === 'info') {
      const banner = asset('info-banner.png');
      const logo = asset('chaos-imperium-logo.png');
      await message.channel.send({ embeds: infoEmbeds(), files: [banner, logo] });
      return;
    }

    if (command === 'announce') {
      if (!message.member?.permissions?.has(PermissionsBitField.Flags.ManageMessages)) {
        await message.reply('You need **Manage Messages** to use announcements.');
        return;
      }

      const text = args.join(' ').trim();
      if (!text) {
        await message.reply(`Usage: \`${PREFIX}announce [message]\``);
        return;
      }

      pendingAnnouncements.set(message.author.id, {
        text,
        channelId: message.channel.id,
        guildId: message.guildId,
        createdAt: Date.now()
      });

      const picker = new EmbedBuilder()
        .setColor(COLORS.crimson)
        .setTitle('Choose announcement type')
        .setDescription('Your message is ready. Select how Chaos Imperium should present it.');

      await message.reply({ embeds: [picker], components: [announcementTypeButtons(message.author.id)] });
      return;
    }

    if (command === 'ask' || command === 'ai') {
      const prompt = args.join(' ').trim();
      if (!prompt) {
        await message.reply(`Usage: \`${PREFIX}ask [question]\``);
        return;
      }
      await biblicalAI(message, prompt, false);
      return;
    }

    if (command === 'asklong' || command === 'ailong') {
      if (!isManager(message.member)) {
        await message.reply('Extended AI answers require **Manage Server** permission or higher.');
        return;
      }
      const prompt = args.join(' ').trim();
      if (!prompt) {
        await message.reply(`Usage: \`${PREFIX}asklong [question]\``);
        return;
      }
      await biblicalAI(message, prompt, true);
      return;
    }

    if (command === 'invite') {
      await message.reply(`**Invite Chaos Imperium:**\n${inviteUrl()}`);
    }
  } catch (err) {
    console.error(err);
    await message.reply('Something went wrong while executing that command.').catch(() => {});
  }
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isButton() && interaction.customId.startsWith('announce:')) {
      const [, type, ownerId] = interaction.customId.split(':');
      if (interaction.user.id !== ownerId) {
        await interaction.reply({ content: 'Only the person who created this announcement can use these buttons.', ephemeral: true });
        return;
      }

      const pending = pendingAnnouncements.get(ownerId);
      if (!pending) {
        await interaction.reply({ content: 'That announcement expired. Run `.announce` again.', ephemeral: true });
        return;
      }

      if (type === 'other') {
        const modal = new ModalBuilder()
          .setCustomId(`announceModal:${ownerId}`)
          .setTitle('Custom Announcement Type');

        const input = new TextInputBuilder()
          .setCustomId('customType')
          .setLabel('Announcement type')
          .setPlaceholder('EVENT ANNOUNCEMENT, SECURITY ALERT, UPDATE...')
          .setStyle(TextInputStyle.Short)
          .setMaxLength(70)
          .setRequired(true);

        modal.addComponents(new ActionRowBuilder().addComponents(input));
        await interaction.showModal(modal);
        return;
      }

      const label = type === 'application' ? 'APPLICATION ANNOUNCEMENT' : 'GENERAL ANNOUNCEMENT';
      const channel = await client.channels.fetch(pending.channelId);
      await sendAnnouncement(channel, label, pending.text, interaction.user.username);
      pendingAnnouncements.delete(ownerId);
      await interaction.update({ content: 'Announcement sent.', embeds: [], components: [] });
      return;
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('announceModal:')) {
      const [, ownerId] = interaction.customId.split(':');
      if (interaction.user.id !== ownerId) {
        await interaction.reply({ content: 'This modal is not yours.', ephemeral: true });
        return;
      }

      const pending = pendingAnnouncements.get(ownerId);
      if (!pending) {
        await interaction.reply({ content: 'That announcement expired. Run `.announce` again.', ephemeral: true });
        return;
      }

      const customType = interaction.fields.getTextInputValue('customType').trim();
      const channel = await client.channels.fetch(pending.channelId);
      await sendAnnouncement(channel, customType, pending.text, interaction.user.username);
      pendingAnnouncements.delete(ownerId);
      await interaction.reply({ content: 'Custom announcement sent.', ephemeral: true });
    }
  } catch (err) {
    console.error(err);
    if (interaction.isRepliable()) {
      const payload = { content: 'Something went wrong while handling that interaction.', ephemeral: true };
      if (interaction.replied || interaction.deferred) await interaction.followUp(payload).catch(() => {});
      else await interaction.reply(payload).catch(() => {});
    }
  }
});

client.login(TOKEN);
