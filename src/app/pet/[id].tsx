import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { getDevicesByPetId } from "../../storage/devices";
import { getPets } from "../../storage/pets";

import { Device } from "../../types/device";
import { Pet } from "../../types/pet";

export default function PetDetailsScreen() {
  const { id } = useLocalSearchParams<{
    id: string;
  }>();

  const [pet, setPet] = useState<Pet | null>(null);

  const [devices, setDevices] = useState<Device[]>(
    []
  );

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        // Carrega os pets salvos no AsyncStorage
        const storedPets = await getPets();

        // Procura o pet pelo ID recebido pela rota
        const foundPet = storedPets.find(
          (item) => item.id === id
        );

        if (!foundPet) {
          console.error(
            "Pet não encontrado. ID:",
            id
          );

          setPet(null);
          setDevices([]);

          return;
        }

        setPet(foundPet);

        // Carrega os dispositivos relacionados
        // ao pet
        const petDevices =
          await getDevicesByPetId(foundPet.id);

        setDevices(petDevices);
      } catch (error) {
        console.error(
          "Erro ao carregar dados do pet:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [id]);

  /*
   * Tela de carregamento
   */
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingScreen}>
          <ActivityIndicator size="large" />

          <Text style={styles.loadingScreenText}>
            Carregando informações...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * Caso o pet não exista
   */
  if (!pet) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            Pet não encontrado
          </Text>

          <Text style={styles.errorText}>
            Não foi possível encontrar esse pet
            nos dados salvos.
          </Text>

          <Pressable
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>
              Voltar
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  /*
   * Ícone do dispositivo
   */
  function getDeviceIcon(
    type: Device["type"]
  ) {
    if (type === "feeder") {
      return "🍽️";
    }

    if (type === "waterer") {
      return "💧";
    }

    return "📱";
  }

  /*
   * Nome do tipo de dispositivo
   */
  function getDeviceTypeName(
    type: Device["type"]
  ) {
    if (type === "feeder") {
      return "Comedouro";
    }

    if (type === "waterer") {
      return "Bebedouro";
    }

    return "Dispositivo";
  }

  /*
   * Texto do status
   */
  function getStatusText(
    status: Device["status"]
  ) {
    if (status === "online") {
      return "Online";
    }

    if (status === "offline") {
      return "Offline";
    }

    return "Aguardando conexão";
  }

  /*
   * Estilo do status
   */
  function getStatusStyle(
    status: Device["status"]
  ) {
    if (status === "online") {
      return styles.statusOnline;
    }

    if (status === "offline") {
      return styles.statusOffline;
    }

    return styles.statusPending;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Cabeçalho */}

        <View style={styles.header}>
          <Pressable
            style={styles.backButtonCircle}
            onPress={() => router.back()}
          >
            <Text style={styles.backIcon}>
              ‹
            </Text>
          </Pressable>

          <Text style={styles.headerTitle}>
            {pet.name}
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Informações principais do pet */}

        <View style={styles.petHeader}>
          <View style={styles.petAvatar}>
            <Text style={styles.petEmoji}>
              🐱
            </Text>
          </View>

          <View style={styles.petInfo}>
            <Text style={styles.petName}>
              {pet.name}
            </Text>

            <Text style={styles.petDetails}>
              {pet.age} anos •{" "}
              {pet.weight.toFixed(1)} kg
            </Text>

            <Text style={styles.petBreed}>
              {pet.breed ||
                "Raça não informada"}
            </Text>
          </View>
        </View>

        {/* Dispositivos */}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>
              Dispositivos
            </Text>

            <Text style={styles.sectionSubtitle}>
              Equipamentos vinculados a{" "}
              {pet.name}
            </Text>
          </View>
        </View>

        {/* Carregando dispositivos */}

        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" />

            <Text style={styles.loadingText}>
              Carregando dispositivos...
            </Text>
          </View>
        )}

        {/* Lista de dispositivos */}

        {!loading &&
          devices.length > 0 && (
            <View style={styles.deviceList}>
              {devices.map((device) => (
                <Pressable
                  key={device.id}
                  style={({ pressed }) => [
                    styles.deviceCard,
                    pressed &&
                      styles.deviceCardPressed,
                  ]}
                  onPress={() => {
                    console.log(
                      "Dispositivo selecionado:",
                      device.id
                    );
                  }}
                >
                  <View style={styles.deviceIcon}>
                    <Text style={styles.deviceEmoji}>
                      {getDeviceIcon(
                        device.type
                      )}
                    </Text>
                  </View>

                  <View style={styles.deviceInfo}>
                    <Text
                      style={styles.deviceName}
                    >
                      {device.name}
                    </Text>

                    <Text
                      style={styles.deviceType}
                    >
                      {getDeviceTypeName(
                        device.type
                      )}
                    </Text>

                    <View
                      style={
                        styles.deviceStatusRow
                      }
                    >
                      <View
                        style={[
                          styles.statusDot,
                          getStatusStyle(
                            device.status
                          ),
                        ]}
                      />

                      <Text
                        style={
                          styles.deviceStatus
                        }
                      >
                        {getStatusText(
                          device.status
                        )}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.arrow}>
                    ›
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

        {/* Nenhum dispositivo */}

        {!loading &&
          devices.length === 0 && (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Text style={styles.emptyEmoji}>
                  📡
                </Text>
              </View>

              <Text style={styles.emptyTitle}>
                Nenhum dispositivo
              </Text>

              <Text style={styles.emptyText}>
                Adicione um comedouro ou
                bebedouro para começar a
                controlar os equipamentos
                deste pet.
              </Text>
            </View>
          )}

        {/* Adicionar dispositivo */}

        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed &&
              styles.addButtonPressed,
          ]}
          onPress={() =>
            router.push({
              pathname: "/device/new",
              params: {
                petId: pet.id,
              },
            })
          }
        >
          <View style={styles.plusCircle}>
            <Text style={styles.plus}>
              +
            </Text>
          </View>

          <Text style={styles.addButtonText}>
            Adicionar novo dispositivo
          </Text>
        </Pressable>

        {/* Informações do pet */}

        <View style={styles.infoSection}>
          <Text style={styles.sectionTitle}>
            Informações do pet
          </Text>

          <View style={styles.infoCard}>
            <InfoRow
              label="Nome"
              value={pet.name}
            />

            <InfoRow
              label="Idade"
              value={`${pet.age} anos`}
            />

            <InfoRow
              label="Peso"
              value={`${pet.weight.toFixed(
                1
              )} kg`}
            />

            <InfoRow
              label="Raça"
              value={
                pet.breed ||
                "Não informado"
              }
            />

            {pet.sex && (
              <InfoRow
                label="Sexo"
                value={pet.sex}
              />
            )}

            {pet.color && (
              <InfoRow
                label="Cor / Pelagem"
                value={pet.color}
              />
            )}

            {pet.foodType && (
              <InfoRow
                label="Alimentação"
                value={pet.foodType}
              />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/*
 * Linha de informação do pet
 */

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>
        {label}
      </Text>

      <Text style={styles.infoValue}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F7F7F5",
  },

  content: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },

  backButtonCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  backIcon: {
    fontSize: 32,
    color: "#333",
    marginTop: -3,
  },

  headerTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#222",
  },

  headerSpacer: {
    width: 42,
  },

  petHeader: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
  },

  petAvatar: {
    width: 82,
    height: 82,
    borderRadius: 25,
    backgroundColor: "#EEEAE3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },

  petEmoji: {
    fontSize: 43,
  },

  petInfo: {
    flex: 1,
  },

  petName: {
    fontSize: 23,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },

  petDetails: {
    fontSize: 14,
    color: "#777",
    marginBottom: 5,
  },

  petBreed: {
    fontSize: 13,
    color: "#999",
  },

  sectionHeader: {
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#222",
  },

  sectionSubtitle: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },

  loadingScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },

  loadingScreenText: {
    marginTop: 12,
    fontSize: 14,
    color: "#888",
  },

  loadingContainer: {
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 10,
  },

  loadingText: {
    fontSize: 13,
    color: "#888",
  },

  deviceList: {
    gap: 12,
  },

  deviceCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  deviceCardPressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },

  deviceIcon: {
    width: 58,
    height: 58,
    borderRadius: 19,
    backgroundColor: "#F0ECE5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },

  deviceEmoji: {
    fontSize: 28,
  },

  deviceInfo: {
    flex: 1,
  },

  deviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 3,
  },

  deviceType: {
    fontSize: 12,
    color: "#888",
    marginBottom: 7,
  },

  deviceStatusRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 6,
  },

  statusOnline: {
    backgroundColor: "#55A66A",
  },

  statusOffline: {
    backgroundColor: "#C96A5A",
  },

  statusPending: {
    backgroundColor: "#C89D4B",
  },

  deviceStatus: {
    fontSize: 11,
    color: "#777",
  },

  arrow: {
    fontSize: 28,
    color: "#B0B0B0",
    marginLeft: 8,
  },

  emptyContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 25,
    paddingVertical: 28,
    alignItems: "center",
  },

  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#F0ECE5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  emptyEmoji: {
    fontSize: 27,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333",
    marginBottom: 6,
  },

  emptyText: {
    fontSize: 12,
    lineHeight: 18,
    color: "#888",
    textAlign: "center",
  },

  addButton: {
    marginTop: 14,
    height: 60,
    borderRadius: 19,
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
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },

  infoSection: {
    marginTop: 32,
  },

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    paddingHorizontal: 18,
    marginTop: 12,
  },

  infoRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F0EEEA",
  },

  infoLabel: {
    fontSize: 13,
    color: "#888",
  },

  infoValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#333",
    maxWidth: "60%",
    textAlign: "right",
  },

  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#333",
    marginBottom: 10,
  },

  errorText: {
    fontSize: 14,
    color: "#888",
    textAlign: "center",
    marginBottom: 20,
  },

  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#2F2F2F",
  },

  backButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});