# Chaos Imperium Discord Bot

Custom Discord bot with:

- `.info` — custom Chaos Imperium server information card
- `.announce [message]` — announcement builder with buttons:
  - Application Announcement
  - General Announcement
  - Other → custom type modal
- Top and bottom red blood-border announcement graphics
- `.ask [question]` — short Scripture-style AI answer
- `.asklong [question]` — extended AI answer, restricted to Manage Server or higher
- `.invite` — generates the bot invite URL automatically from the bot's application ID

## Setup

1. Install Node.js 20+.
2. Duplicate `.env.example` as `.env`.
3. Put your Discord bot token and OpenAI API key in `.env`.
4. In the Discord Developer Portal, enable **Message Content Intent** for the bot.
5. Run:

```bash
npm install
npm start
```

## Invite URL

Once the bot starts, it prints a ready-to-use invite URL in Terminal. You can also use `.invite` in Discord.

The URL format is:

```text
https://discord.com/oauth2/authorize?client_id=YOUR_CLIENT_ID&permissions=117760&integration_type=0&scope=bot%20applications.commands
```

## Commands

```text
.info
.announce Your announcement text here
.ask What does patience mean?
.asklong Explain forgiveness in detail.
.invite
```

## Permissions

- `.announce` requires **Manage Messages**.
- `.asklong` requires **Manage Server** or higher.

## Notes

Discord embeds only support one accent color rather than a true gradient fill, so this bot uses custom red-gradient artwork and blood-border image assets to create the gradient visual style around the announcement.
