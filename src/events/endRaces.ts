import Event, { EventNameType } from ".";

export default class EndRaces extends Event {
  eventName: EventNameType = "ready";

  async handle() {
    setInterval(() => {
      for (const race of this.client.races) {
        if (race[1].ended) this.client.races.delete(race[0]);
      }
    }, 10 * 1000);
  }
}
