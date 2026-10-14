import {
  useCallback,
  useState,
} from "react";

import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  SafeAreaView,
} from "react-native-safe-area-context";

import {
  router,
  useFocusEffect,
  useLocalSearchParams,
} from "expo-router";

import {
  deletePet,
  getPets,
} from "../../storage/pets";

import {
  getDevicesByPetId,
} from "../../storage/devices";

import type {
  Pet,
} from "../../types/pet";

import type {
  Device,
} from "../../types/device";

export default function PetDetailsScreen() {
  const params =
    useLocalSearchParams<{
      id?: string;
    }>();

  const petId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const [pet, setPet] =
    useState<Pet | null>(null);

  const [devices, setDevices] =
    useState<Device[]>([]);

  const [loading, setLoading] =
    useState(true);

  // ==========================================================
  // CARREGAR DADOS
  // ==========================================================

  const loadData =
    useCallback(
      async () => {
        try {
          setLoading(true);

          if (!petId) {
            return;
          }

          const pets =
            await getPets();

          const foundPet =
            pets.find(
              (item) =>
                item.id === petId
            );

          setPet(
            foundPet ?? null
          );

          const petDevices =
            await getDevicesByPetId(
              petId
            );

          setDevices(
            petDevices
          );
        } catch (error) {
          console.log(
            "Erro ao carregar pet:",
            error
          );
        } finally {
          setLoading(false);
        }
      },
      [petId]
    );

    async function handleDeletePet() {
    if (!pet) {
      return;
    }

    Alert.alert(
      "Excluir pet",
      `Tem certeza de que deseja excluir ${pet.name}? Essa ação não pode ser desfeita.`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deletePet(pet.id);

              Alert.alert(
                "Pet excluído",
                `${pet.name} foi excluído com sucesso.`,
                [
                  {
                    text: "Continuar",
                    onPress: () => router.replace("/"),
                  },
                ]
              );
            } catch (error) {
              console.error("Erro ao excluir pet:", error);

              Alert.alert(
                "Erro",
                "Não foi possível excluir o pet. Tente novamente."
              );
            }
          },
        },
      ]
    );
  }

  // ==========================================================
  // RECARREGAR SEMPRE QUE A TELA RECEBER FOCO
  // ==========================================================

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // ==========================================================
  // ABRIR DISPOSITIVO
  // ==========================================================

  function handleDevicePress(
    device: Device
  ) {
    console.log(
      "Dispositivo selecionado:",
      device.id
    );

    router.push({
      pathname:
        "/device/[id]",
      params: {
        id: device.id,
      },
    });
  }

  // ==========================================================
  // ADICIONAR DISPOSITIVO
  // ==========================================================

  function handleAddDevice() {
    if (!petId) {
      Alert.alert(
        "Erro",
        "Não foi possível identificar o gato."
      );

      return;
    }

    router.push({
      pathname:
        "/device/new",
      params: {
        petId,
      },
    });
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={styles.center}
        >
          <ActivityIndicator
            size="large"
          />
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // PET NÃO ENCONTRADO
  // ==========================================================

  if (!pet) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={styles.center}
        >
          <Text
            style={styles.errorTitle}
          >
            Gato não encontrado
          </Text>

          <Pressable
            style={styles.button}
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.buttonText
              }
            >
              Voltar
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // TELA
  // ==========================================================

  return (
    <SafeAreaView
      style={styles.safeArea}
    >
      <ScrollView
        contentContainerStyle={
          styles.container
        }
      >
        <Pressable
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={styles.backText}
          >
            ← Voltar
          </Text>
        </Pressable>

        {/* ================================================== */}
        {/* CABEÇALHO DO PET */}
        {/* ================================================== */}

        <View
          style={styles.petHeader}
        >
          <View
            style={styles.petAvatar}
          >
            <Text
              style={
                styles.petAvatarText
              }
            >
              🐱
            </Text>
          </View>

          <View
            style={styles.petHeaderInfo}
          >
            <Text
              style={styles.petName}
            >
              {pet.name}
            </Text>

            {pet.breed && (
              <Text
                style={
                  styles.petBreed
                }
              >
                {pet.breed}
              </Text>
            )}

            {pet.weight && (
              <Text
                style={
                  styles.petWeight
                }
              >
                {pet.weight} kg
              </Text>
            )}
          </View>
        </View>

        {/* ================================================== */}
        {/* INFORMAÇÕES */}
        {/* ================================================== */}

        <View style={styles.card}>
          <Text
            style={styles.sectionTitle}
          >
            Informações
          </Text>

          <InfoRow
            label="Nome"
            value={pet.name}
          />

          {pet.breed && (
            <InfoRow
              label="Raça"
              value={pet.breed}
            />
          )}

          {pet.weight && (
            <InfoRow
              label="Peso"
              value={`${pet.weight} kg`}
            />
          )}
        </View>

        <View style={styles.petActions}>
          <Pressable
            style={styles.deleteButton}
            onPress={handleDeletePet}
          >
            <Text style={styles.deleteButtonText}>
              Excluir pet
            </Text>
          </Pressable>
        </View>

        {/* ================================================== */}
        {/* DISPOSITIVOS */}
        {/* ================================================== */}

        <View style={styles.card}>
          <View
            style={styles.sectionHeader}
          >
            <View>
              <Text
                style={styles.sectionTitle}
              >
                Dispositivos
              </Text>

              <Text
                style={styles.sectionSubtitle}
              >
                Equipamentos associados a{" "}
                {pet.name}
              </Text>
            </View>

            <Pressable
              style={
                styles.addSmallButton
              }
              onPress={
                handleAddDevice
              }
            >
              <Text
                style={
                  styles.addSmallButtonText
                }
              >
                +
              </Text>
            </Pressable>
          </View>

          {devices.length === 0 ? (
            <View
              style={styles.emptyState}
            >
              <Text
                style={styles.emptyIcon}
              >
                ⚙️
              </Text>

              <Text
                style={styles.emptyTitle}
              >
                Nenhum dispositivo
              </Text>

              <Text
                style={
                  styles.emptyDescription
                }
              >
                Adicione um comedouro ou
                bebedouro para este gato.
              </Text>

              <Pressable
                style={styles.button}
                onPress={
                  handleAddDevice
                }
              >
                <Text
                  style={
                    styles.buttonText
                  }
                >
                  Adicionar dispositivo
                </Text>
              </Pressable>
            </View>
          ) : (
            <View
              style={
                styles.devicesContainer
              }
            >
              {devices.map(
                (device) => (
                  <Pressable
                    key={device.id}
                    style={({ pressed }) => [
                      styles.deviceCard,
                      pressed &&
                        styles.deviceCardPressed,
                    ]}
                    onPress={() =>
                      handleDevicePress(
                        device
                      )
                    }
                  >
                    <View
                      style={
                        styles.deviceIcon
                      }
                    >
                      <Text
                        style={
                          styles.deviceIconText
                        }
                      >
                        {device.type ===
                        "feeder"
                          ? "🍽️"
                          : "💧"}
                      </Text>
                    </View>

                    <View
                      style={
                        styles.deviceInfo
                      }
                    >
                      <Text
                        style={
                          styles.deviceName
                        }
                      >
                        {device.name}
                      </Text>

                      <Text
                        style={
                          styles.deviceType
                        }
                      >
                        {device.type ===
                        "feeder"
                          ? "Comedouro"
                          : "Bebedouro"}
                      </Text>

                      <Text
                        style={
                          styles.deviceIdentifier
                        }
                      >
                        {device.identifier}
                      </Text>

                      <View
                        style={
                          styles.deviceStatusRow
                        }
                      >
                        <View
                          style={[
                            styles.statusDot,
                            device.status ===
                              "online"
                              ? styles.statusOnline
                              : device.status ===
                                "pending"
                              ? styles.statusPending
                              : styles.statusOffline,
                          ]}
                        />

                        <Text
                          style={
                            styles.deviceStatusText
                          }
                        >
                          {device.status ===
                          "online"
                            ? "Online"
                            : device.status ===
                              "pending"
                            ? "Pendente"
                            : "Offline"}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={
                        styles.chevron
                      }
                    >
                      ›
                    </Text>
                  </Pressable>
                )
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ============================================================
// INFO ROW
// ============================================================

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View
      style={styles.infoRow}
    >
      <Text
        style={styles.infoLabel}
      >
        {label}
      </Text>

      <Text
        style={styles.infoValue}
      >
        {value}
      </Text>
    </View>
  );
}

// ============================================================
// ESTILOS
// ============================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },

  container: {
    padding: 20,
    paddingBottom: 40,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  backText: {
    fontSize: 16,
    color: "#555555",
    marginBottom: 20,
  },

  petHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  petAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
    elevation: 2,
  },

  petAvatarText: {
    fontSize: 36,
  },

  petHeaderInfo: {
    flex: 1,
  },

  petName: {
    fontSize: 28,
    fontWeight: "700",
    color: "#222222",
  },

  petBreed: {
    fontSize: 15,
    color: "#666666",
    marginTop: 4,
  },

  petWeight: {
    fontSize: 14,
    color: "#777777",
    marginTop: 3,
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
  },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
  },

  sectionSubtitle: {
    fontSize: 13,
    color: "#777777",
    marginTop: 4,
  },

  addSmallButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#222222",
    alignItems: "center",
    justifyContent: "center",
  },

  addSmallButtonText: {
    color: "#ffffff",
    fontSize: 26,
    lineHeight: 28,
    fontWeight: "400",
  },

  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingVertical: 10,
  },

  infoLabel: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 3,
  },

  infoValue: {
    fontSize: 15,
    color: "#222222",
  },

  devicesContainer: {
    gap: 10,
  },

  deviceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fafafa",
    borderWidth: 1,
    borderColor: "#eeeeee",
    borderRadius: 14,
    padding: 14,
  },

  deviceCardPressed: {
    opacity: 0.65,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  deviceIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  deviceIconText: {
    fontSize: 26,
  },

  deviceInfo: {
    flex: 1,
  },

  deviceName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222222",
  },

  deviceType: {
    fontSize: 13,
    color: "#666666",
    marginTop: 2,
  },

  deviceIdentifier: {
    fontSize: 11,
    color: "#999999",
    marginTop: 4,
  },

  deviceStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 7,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },

  statusOnline: {
    backgroundColor: "#28a745",
  },

  statusOffline: {
    backgroundColor: "#dc3545",
  },

  statusPending: {
    backgroundColor: "#d99a00",
  },

  deviceStatusText: {
    fontSize: 12,
    color: "#666666",
  },

  chevron: {
    fontSize: 30,
    color: "#aaaaaa",
    marginLeft: 8,
  },

  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },

  emptyIcon: {
    fontSize: 34,
    marginBottom: 8,
  },

  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
  },

  emptyDescription: {
    fontSize: 13,
    color: "#777777",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 6,
    marginBottom: 16,
  },

  button: {
    backgroundColor: "#222222",
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 13,
  },

  buttonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "600",
  },

  errorTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 16,
  },
  petActions: {
  marginTop: 16,
  marginBottom: 24,
},

deleteButton: {
  minHeight: 48,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: "#C96A5A",
  alignItems: "center",
  justifyContent: "center",
  paddingHorizontal: 16,
},

deleteButtonText: {
  color: "#C96A5A",
  fontSize: 15,
  fontWeight: "700",
},
});