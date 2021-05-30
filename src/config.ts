export interface Configuration {
  prefix: string;
  color: string;
  questionTime: number;

  gameConfiguration: {
    baseCarsMaxPrice: number;
    queueExperienceDiversion: number;
    totalRaceHorsepower: number;
  };

  numberEmojis: string[];
}

const Configuration = {
  prefix: "/",
  color: "#48f52a",
  questionTime: 30 * 1000,

  gameConfiguration: {
    baseCarsMaxPrice: 50000,
    queueExperienceDiversion: 5000, // Set to 0 to turn off skillbased matchmaking
    totalRaceHorsepower: 10000,
  },

  numberEmojis: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"],
} as Configuration;

export default Configuration;
