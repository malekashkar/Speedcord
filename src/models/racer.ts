import { getModelForClass, Prop, prop } from "@typegoose/typegoose";

export class Racer {
  @prop({ unique: true })
  userId: string;

  @prop({ unique: true })
  username: string;

  @prop()
  displayName: string;

  @prop({ default: 0 })
  credits?: number;

  @prop()
  selectedCarId?: number;

  @prop({ default: 0 })
  experience?: number;

  get level() {
    return this.experience / 1000;
  }
}

export const RacerModel = getModelForClass(Racer);
