import { Message } from "discord.js";
import Client from "..";

export type CooldownType = "COMMAND" | "ARGS";

export default abstract class Command {
  staffTeam: boolean = false;
  aliases?: string[] = [];
  disabled = false;

  client: Client;
  constructor(client: Client) {
    this.client = client;
  }

  abstract cmdName: string;
  abstract description: string;
  abstract run(_message: Message, _args: string[]): Promise<Message | void>;
}
