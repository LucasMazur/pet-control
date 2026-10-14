import AsyncStorage from "@react-native-async-storage/async-storage";
import { Pet } from "../types/pet";

const PETS_STORAGE_KEY = "@pet_control:pets";

export async function getPets(): Promise<Pet[]> {
  try {
    const data = await AsyncStorage.getItem(PETS_STORAGE_KEY);

    if (data === null) {
      return [];
    }

    const pets: Pet[] = JSON.parse(data);

    return Array.isArray(pets) ? pets : [];
  } catch (error) {
    console.error("Erro ao carregar pets:", error);
    return [];
  }
}

export async function hasSavedPetsList(): Promise<boolean> {
  try {
    const data = await AsyncStorage.getItem(PETS_STORAGE_KEY);
    return data !== null;
  } catch (error) {
    console.error("Erro ao verificar lista de pets:", error);
    return false;
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
    throw error;
  }
}

export async function addPet(pet: Pet): Promise<void> {
  const pets = await getPets();

  if (pets.some((item) => item.id === pet.id)) {
    throw new Error("Já existe um pet com este identificador.");
  }

  pets.push(pet);
  await savePets(pets);
}

export async function updatePet(updatedPet: Pet): Promise<void> {
  const pets = await getPets();
  const petExists = pets.some((pet) => pet.id === updatedPet.id);

  if (!petExists) {
    throw new Error("Pet não encontrado para atualização.");
  }

  const updatedPets = pets.map((pet) =>
    pet.id === updatedPet.id ? updatedPet : pet
  );

  await savePets(updatedPets);
}

export async function deletePet(id: string): Promise<void> {
  const pets = await getPets();
  const updatedPets = pets.filter((pet) => pet.id !== id);

  await savePets(updatedPets);
}