import { Client as DiscordClient, ClientOptions, Collection } from "discord.js";
import { config as dotenv } from "dotenv";

import mongoose from "mongoose";
import path from "path";
import fs from "fs";

import Event from "./events";
import Command from "./commands";
import Logger from "./utils/logger";
import { Games } from "./utils/game";

dotenv();

export default class Client extends DiscordClient {
  commands: Collection<string, Command> = new Collection();
  races: Games[] = [];

  constructor(options?: ClientOptions) {
    super({
      ...options,
      partials: ["USER", "REACTION", "MESSAGE"],
      ws: {
        intents: [
          "GUILDS",
          "GUILD_MESSAGES",
          "GUILD_MESSAGE_REACTIONS",
          "GUILD_VOICE_STATES",
        ],
      },
    });

    this.login(process.env.DISCORD_BOT_TOKEN);
    this.eventLoader();
    this.commandLoader();
    this.databaseLoader();

    this.on("ready", () =>
      Logger.info(`BOT`, `The bot ${this.user.tag} has started successfuly.`)
    );
  }

  private databaseLoader() {
    if (
      mongoose.connection.readyState !== mongoose.connection.states.connected &&
      mongoose.connection.readyState !== mongoose.connection.states.connecting
    ) {
      mongoose.connect(
        process.env.MONGO_URL,
        {
          useNewUrlParser: true,
          useUnifiedTopology: true,
          useCreateIndex: true,
          useFindAndModify: false,
        },
        (err) => {
          if (err) {
            Logger.error("DATABASE", `Failed to connect to DB:`);
            Logger.error("DATABASE", err.toString());
          } else {
            Logger.info("DATABASE", "Connected to DB!");
          }
        }
      );
      mongoose.connection.on("error", () => {
        this.databaseLoader();
      });
    }
  }

  private eventLoader(location = path.join(__dirname, "events")) {
    const directoryStats = fs.statSync(location);
    if (directoryStats.isDirectory()) {
      const eventFiles = fs.readdirSync(location);
      for (const eventFile of eventFiles) {
        const eventPath = path.join(location, eventFile);
        const eventFileStats = fs.statSync(eventPath);
        if (eventFileStats.isFile()) {
          if (path.parse(eventPath).name === "index") continue;
          if (/^.*\.(js|ts|jsx|tsx)$/i.test(eventFile)) {
            const tmpEvent = require(eventPath);
            const event =
              typeof tmpEvent !== "function" &&
              typeof tmpEvent.default === "function"
                ? tmpEvent.default
                : typeof tmpEvent === "function"
                ? tmpEvent
                : null;
            if (event) {
              try {
                const eventObj: Event = new event(this);
                if (eventObj && eventObj.eventName) {
                  this.addListener(eventObj.eventName, async (...args) => {
                    eventObj.handle.bind(eventObj)(...args, eventObj.eventName);
                  });
                }
              } catch (ignored) {}
            }
          }
        }
      }
    }
  }

  private commandLoader(location = path.join(__dirname, "commands")) {
    const directoryStats = fs.statSync(location);
    if (directoryStats.isDirectory()) {
      const commandFiles = fs.readdirSync(location);
      for (const commandFile of commandFiles) {
        const commandPath = path.join(location, commandFile);
        const commandFileStats = fs.statSync(commandPath);
        if (commandFileStats.isFile()) {
          if (path.parse(commandPath).name === "index") continue;
          if (/^.*\.(js|ts|jsx|tsx)$/i.test(commandFile)) {
            const tmpCommand = require(commandPath);
            const command =
              typeof tmpCommand !== "function" &&
              typeof tmpCommand.default === "function"
                ? tmpCommand.default
                : typeof tmpCommand === "function"
                ? tmpCommand
                : null;
            if (command) {
              try {
                const commandObj: Command = new command(this);
                if (commandObj && commandObj.cmdName) {
                  if (!this.commands) this.commands = new Collection();
                  if (this.commands.has(commandObj.cmdName)) {
                    throw `Duplicate command name ${commandObj.cmdName}`;
                  } else {
                    this.commands.set(
                      commandObj.cmdName.toLowerCase(),
                      commandObj
                    );
                  }
                }
              } catch (ignored) {}
            }
          }
        } else {
          this.commandLoader(commandPath);
        }
      }
    }
  }
}

new Client();
