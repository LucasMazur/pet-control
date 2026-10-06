import { Pet } from "../types/pet";

export const initialPets: Pet[] = [
  {
    id: "1",
    name: "Luna",
    species: "Gato",
    breed: "SRD",
    sex: "Fêmea",
    color: "Cinza",
    age: 4,
    weight: 4.2,

    food: {
      type: "Ração Gastrointestinal",
      dailyAmount: 60,
      mealsPerDay: 3,
    },

    feederOnline: true,
    watererOnline: true,
  },

  {
    id: "2",
    name: "Thor",
    species: "Gato",
    breed: "SRD",
    sex: "Macho",
    color: "Preto e branco",
    age: 2,
    weight: 5.1,

    food: {
      type: "Ração Adultos",
      dailyAmount: 70,
      mealsPerDay: 2,
    },

    feederOnline: true,
    watererOnline: false,
  },
];