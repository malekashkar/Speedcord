import { Guild, TextChannel } from "discord.js";
import Event, { EventNameType } from ".";
import config from "../config";
import embeds from "../utils/embeds";

export default class EntranceMessage extends Event {
  eventName: EventNameType = "guildCreate";

  async handle(guild: Guild) {
    const timestampSortedChannels = guild.channels.cache
      .filter((channel) => channel.type === "text")
      .sort((a, b) => a.createdTimestamp - b.createdTimestamp);

    if (timestampSortedChannels.size) {
      const firstChannel = timestampSortedChannels.first() as TextChannel;
      firstChannel.send(
        embeds
          .normal(
            `👋 Shall I welcome myself to the server?`,
            `**Speedcord** is an interactive racing game where players can **race** each other, **upgrade** and **buy** new cars, and much more. You may place with __strangers, friends, or join tournaments__ (soon).\n\n**Short Tutorial**\n• Begin your journey by running the \`${config.prefix}play\` command.\n• If you need further help, run the \`${config.prefix}help\` commmand.\n• If you need support with the discord bot, join our [support server](https://discord.gg/jFv2aRbvnE).`
          )
          .setThumbnail(this.client.user.displayAvatarURL({ dynamic: true }))
      );
    }
  }
}
