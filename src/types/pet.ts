export type Pet = {
  id: string;

  name: string;
  species: string;
  breed: string;
  sex: string;
  color: string;

  age: number;
  weight: number;

  food: {
    type: string;
    dailyAmount: number;
    mealsPerDay: number;
  };

  feederOnline: boolean;
  watererOnline: boolean;
};