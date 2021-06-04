export interface config {
  prefix: string;
  testingPrefix: string;

  color: string;
  questionTime: number;

  gameConfiguration: {
    baseCarsMaxPrice: number;
    queueExperienceDiversion: number;
    totalRaceHorsepower: number;

    creditsWinDefault: number;
    creditsLossDefault: number;

    experienceWinDefault: number;
    experienceLossDefault: number;

    creditsTieReward: number;
    experienceTieReward: number;
  };

  numberEmojis: string[];
}

export default {
  prefix: "/",
  testingPrefix: ".",

  color: "#48f52a",
  questionTime: 30 * 1000,

  gameConfiguration: {
    baseCarsMaxPrice: 50000,
    queueExperienceDiversion: 0, // Set to 0 to turn off skillbased matchmaking
    totalRaceHorsepower: 10000,

    creditsWinDefault: 1000,
    creditsLossDefault: 100,

    experienceWinDefault: 5000,
    experienceLossDefault: 1000,

    creditsTieReward: 100,
    experienceTieReward: 1000,
  },

  numberEmojis: ["1️⃣", "2️⃣", "3️⃣", "4️⃣", "5️⃣", "6️⃣", "7️⃣", "8️⃣", "9️⃣", "🔟"],
  gearShiftsEmojis: ["⬛", "🟫", "⬜", "🟪", "🟩", "🟥", "🟦", "🟧", "🟨"],
} as config;
