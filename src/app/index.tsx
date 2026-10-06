import { router } from "expo-router";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { initialPets } from "../data/pets";
import { getPets, savePets } from "../storage/pets";
import { Pet } from "../types/pet";

export default function HomeScreen() {
  const [pets, setPets] = useState<Pet[]>([]);

  useEffect(() => {
    loadPets();
  }, []);

  async function loadPets() {
    const storedPets = await getPets();

    if (storedPets.length === 0) {
      await savePets(initialPets);
      setPets(initialPets);
      return;
    }

    setPets(storedPets);
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Olá! 👋</Text>
            <Text style={styles.title}>Seus pets</Text>
          </View>

          <View style={styles.logo}>
            <Text style={styles.logoText}>🐾</Text>
          </View>
        </View>

        {/* Lista de pets */}
        <View style={styles.petList}>
          {pets.map((pet) => (
            <Pressable
              key={pet.id}
              style={({ pressed }) => [
                styles.petCard,
                pressed && styles.petCardPressed,
              ]}
              onPress={() => {
                console.log("CLICOU NO PET:", pet.id);

                router.push({
                  pathname: "/pet/[id]",
                  params: { id: pet.id },
                });
              }}
            >
              {/* Avatar */}
              <View style={styles.petAvatar}>
                <Text style={styles.petEmoji}>🐱</Text>
              </View>

              {/* Informações */}
              <View style={styles.petInfo}>
                <Text style={styles.petName}>{pet.name}</Text>

                <Text style={styles.petDetails}>
                  {pet.age} anos • {pet.weight.toFixed(1)} kg
                </Text>

                <View style={styles.statusContainer}>
                  <View style={styles.statusItem}>
                    <View
                      style={[
                        styles.statusDot,
                        pet.feederOnline
                          ? styles.online
                          : styles.offline,
                      ]}
                    />

                    <Text style={styles.statusText}>
                      Comedouro
                    </Text>
                  </View>

                  <View style={styles.statusItem}>
                    <View
                      style={[
                        styles.statusDot,
                        pet.watererOnline
                          ? styles.online
                          : styles.offline,
                      ]}
                    />

                    <Text style={styles.statusText}>
                      Bebedouro
                    </Text>
                  </View>
                </View>
              </View>

              {/* Seta */}
              <Text style={styles.arrow}>›</Text>
            </Pressable>
          ))}
        </View>

        {/* Botão adicionar */}
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.addButtonPressed,
          ]}
          onPress={() => router.push("/pet/new")}
        >
          <View style={styles.plusCircle}>
            <Text style={styles.plus}>+</Text>
          </View>

          <Text style={styles.addButtonText}>
            Adicionar pet
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F5",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 28,
  },

  greeting: {
    fontSize: 16,
    color: "#777",
    marginBottom: 4,
  },

  title: {
    fontSize: 30,
    fontWeight: "700",
    color: "#202020",
  },

  logo: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#E8E1D5",
    justifyContent: "center",
    alignItems: "center",
  },

  logoText: {
    fontSize: 23,
  },

  petList: {
    gap: 14,
  },

  petCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,

    elevation: 2,
  },

  petCardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },

  petAvatar: {
    width: 74,
    height: 74,
    borderRadius: 22,
    backgroundColor: "#EEEAE3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  petEmoji: {
    fontSize: 40,
  },

  petInfo: {
    flex: 1,
  },

  petName: {
    fontSize: 21,
    fontWeight: "700",
    color: "#222",
    marginBottom: 3,
  },

  petDetails: {
    fontSize: 14,
    color: "#777",
    marginBottom: 12,
  },

  statusContainer: {
    gap: 6,
  },

  statusItem: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 7,
  },

  online: {
    backgroundColor: "#55A66A",
  },

  offline: {
    backgroundColor: "#C96A5A",
  },

  statusText: {
    fontSize: 12,
    color: "#666",
  },

  arrow: {
    fontSize: 30,
    color: "#B0B0B0",
    marginLeft: 8,
  },

  addButton: {
    marginTop: 22,
    height: 62,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#DDD8CF",
    borderStyle: "dashed",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  addButtonPressed: {
    opacity: 0.6,
  },

  plusCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#2F2F2F",
    justifyContent: "center",
    alignItems: "center",
  },

  plus: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "300",
    lineHeight: 25,
  },

  addButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
});