import { ClientEvents } from "discord.js";
import BaseManager from "../";

export type EventNameType = keyof ClientEvents;

export default abstract class Event {
  disabled = false;
  client: BaseManager;
  
  constructor(bot: BaseManager) {
    this.client = bot;
  }

  abstract eventName: EventNameType;
  abstract handle(...args: unknown[]): Promise<void>;
}
