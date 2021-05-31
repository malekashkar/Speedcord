import { getModelForClass, prop } from "@typegoose/typegoose";

export type Status = "CREATED" | "STARTED";
export type Type = "CASUAL" | "COMPETITIVE" | "PRIVATE";

export class RacerState {
  @prop()
  racerId: string;

  @prop()
  racerDisplayName: string;

  @prop()
  racerExperience: number;

  @prop()
  carBaseSpeed: number;

  @prop()
  carName: string;

  @prop()
  messageId?: string;

  @prop({ default: 0 })
  horsepowerCompleted?: number;

  @prop({ default: 0 })
  ticksTaken?: number;
}

export class Game {
  @prop()
  createdAt: Date;

  @prop({ default: "CREATED" })
  status?: Status;

  @prop({ type: RacerState })
  userOne: RacerState;

  @prop({ type: RacerState })
  userTwo?: RacerState;
}

export const GameModel = getModelForClass(Game);
