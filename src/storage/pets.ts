import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pet } from "../types/pet";

const PETS_STORAGE_KEY = "@pet_control:pets";

export async function getPets(): Promise<Pet[]> {
  try {
    const data = await AsyncStorage.getItem(PETS_STORAGE_KEY);

    if (!data) {
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    console.error("Erro ao carregar pets:", error);
    return [];
  }
}

export async function savePets(pets: Pet[]): Promise<void> {
  try {
    await AsyncStorage.setItem(
      PETS_STORAGE_KEY,
      JSON.stringify(pets)
    );
  } catch (error) {
    console.error("Erro ao salvar pets:", error);
  }
}

export async function addPet(pet: Pet): Promise<void> {
  const pets = await getPets();

  pets.push(pet);

  await savePets(pets);
}

export async function updatePet(updatedPet: Pet): Promise<void> {
  const pets = await getPets();

  const updatedPets = pets.map((pet) =>
    pet.id === updatedPet.id ? updatedPet : pet
  );

  await savePets(updatedPets);
}

export async function deletePet(id: string): Promise<void> {
  const pets = await getPets();

  const updatedPets = pets.filter(
    (pet) => pet.id !== id
  );

  await savePets(updatedPets);
}