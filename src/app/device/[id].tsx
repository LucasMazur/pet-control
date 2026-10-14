import {
  useCallback,
  useEffect,
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
  useLocalSearchParams,
} from "expo-router";

import {
  deleteDevice,
  getDeviceById,
  updateDevice,
} from "../../storage/devices";

import {
  discoverDevice,
  getDeviceStatus,
  type DeviceStatus
} from "../../services/deviceApi";

import type { Device } from "../../types/device";

export default function DeviceDetailsScreen() {
  const params =
    useLocalSearchParams<{
      id?: string;
    }>();

  const deviceId =
    Array.isArray(params.id)
      ? params.id[0]
      : params.id;

  const [device, setDevice] =
    useState<Device | null>(null);

  const [status, setStatus] =
    useState<DeviceStatus | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [checking, setChecking] =
    useState(false);

  const [updating, setUpdating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  // ==========================================================
  // CARREGAR DISPOSITIVO
  // ==========================================================

  const loadDevice =
    useCallback(
      async () => {
        if (!deviceId) {
          setLoading(false);
          return;
        }

        try {
          setLoading(true);

          const found =
            await getDeviceById(
              deviceId
            );

          setDevice(found);
        } catch (err) {
          console.log(
            "Erro ao carregar dispositivo:",
            err
          );

          setDevice(null);
        } finally {
          setLoading(false);
        }
      },
      [deviceId]
    );

  // ==========================================================
  // TESTAR CONEXÃO
  // ==========================================================

  const checkConnection =
    useCallback(
      async (
        showAlert = true
      ) => {
        if (!device) {
          return;
        }

        if (!device.ip) {
          setError(
            "Este dispositivo não possui um IP cadastrado."
          );

          if (showAlert) {
            Alert.alert(
              "IP não encontrado",
              "O dispositivo foi cadastrado antes da atualização do sistema. Use \"Atualizar informações\" para tentar recuperar os dados."
            );
          }

          return;
        }

        try {
          setChecking(true);
          setError(null);

          const result =
            await getDeviceStatus(
              device.ip
            );

          setStatus(result);

          const updated =
            await updateDevice(
              device.id,
              {
                status:
                  result.online
                    ? "online"
                    : "offline",

                ip:
                  result.ip ||
                  device.ip,

                rssi:
                  result.rssi,
              }
            );

          if (updated) {
            setDevice(updated);
          }

          if (showAlert) {
            Alert.alert(
              "Conexão funcionando",
              `O ESP32-CAM respondeu corretamente.\n\nIP: ${
                result.ip
              }\nRSSI: ${
                result.rssi
              } dBm`
            );
          }
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Não foi possível conectar ao dispositivo.";

          setError(message);

          const updated =
            await updateDevice(
              device.id,
              {
                status: "offline",
              }
            );

          if (updated) {
            setDevice(updated);
          }

          if (showAlert) {
            Alert.alert(
              "Dispositivo offline",
              `Não foi possível acessar o ESP32-CAM em ${device.ip}.\n\nVerifique se o celular está na mesma rede Wi-Fi do dispositivo.`
            );
          }
        } finally {
          setChecking(false);
        }
      },
      [device]
    );

  // ==========================================================
  // ATUALIZAR INFORMAÇÕES
  // ==========================================================

  async function handleUpdateInformation() {
    if (!device) {
      return;
    }

    try {
      setUpdating(true);
      setError(null);

      /*
       * Primeiro tentamos usar o IP já salvo.
       *
       * Se não existir, usamos o IP padrão
       * de configuração do ESP32-CAM.
       */

      const ip =
        device.ip ||
        "192.168.0.25";

      const found =
        await discoverDevice(
          ip
        );

      /*
       * Atualiza os dados recebidos
       * pelo ESP32.
       */

      const updated =
        await updateDevice(
          device.id,
          {
            identifier:
              found.identifier,

            ip:
              found.ip,

            firmware:
              found.firmware,

            hardware:
              found.hardware,

            status:
              found.status ===
              "online"
                ? "online"
                : found.status ===
                  "provisioning"
                ? "pending"
                : "offline",
          }
        );

      if (updated) {
        setDevice(updated);
      }

      Alert.alert(
        "Informações atualizadas",
        `Dispositivo encontrado.\n\nIP: ${found.ip}\nFirmware: ${found.firmware}`
      );
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Não foi possível atualizar as informações.";

      setError(message);

      Alert.alert(
        "Não foi possível atualizar",
        `${message}\n\nVerifique se o celular está na mesma rede do ESP32-CAM.`
      );
    } finally {
      setUpdating(false);
    }
  }

  // ==========================================================
  // REMOVER
  // ==========================================================

  function handleDeleteDevice() {
    if (!device) {
      return;
    }

    Alert.alert(
      "Remover dispositivo?",
      `O dispositivo "${device.name}" será removido deste gato.\n\nIsso não apaga o dispositivo físico nem suas configurações de Wi-Fi.`,
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Remover",
          style: "destructive",
          onPress:
            async () => {
              try {
                await deleteDevice(
                  device.id
                );

                router.back();
              } catch (err) {
                Alert.alert(
                  "Erro",
                  "Não foi possível remover o dispositivo."
                );
              }
            },
        },
      ]
    );
  }

  // ==========================================================
  // INIT
  // ==========================================================

  useEffect(() => {
    loadDevice();
  }, [loadDevice]);

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
  // NÃO ENCONTRADO
  // ==========================================================

  if (!device) {
    return (
      <SafeAreaView
        style={styles.safeArea}
      >
        <View
          style={styles.center}
        >
          <Text
            style={styles.notFoundTitle}
          >
            Dispositivo não encontrado
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={
                styles.primaryButtonText
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
        {/* VOLTAR */}

        <Pressable
          onPress={() =>
            router.back()
          }
        >
          <Text
            style={styles.backButton}
          >
            ← Voltar
          </Text>
        </Pressable>

        {/* ================================================== */}
        {/* CABEÇALHO */}
        {/* ================================================== */}

        <View
          style={styles.header}
        >
          <View
            style={styles.deviceAvatar}
          >
            <Text
              style={
                styles.deviceAvatarText
              }
            >
              {device.type ===
              "feeder"
                ? "🍽️"
                : "💧"}
            </Text>
          </View>

          <View
            style={styles.headerInfo}
          >
            <Text
              style={styles.title}
            >
              {device.name}
            </Text>

            <Text
              style={styles.type}
            >
              {device.type ===
              "feeder"
                ? "Comedouro"
                : "Bebedouro"}
            </Text>
          </View>
        </View>

        {/* ================================================== */}
        {/* STATUS */}
        {/* ================================================== */}

        <View
          style={[
            styles.statusCard,
            device.status ===
              "online"
              ? styles.statusOnline
              : device.status ===
                "pending"
              ? styles.statusPending
              : styles.statusOffline,
          ]}
        >
          <View
            style={[
              styles.statusDot,
              device.status ===
                "online"
                ? styles.dotOnline
                : device.status ===
                  "pending"
                ? styles.dotPending
                : styles.dotOffline,
            ]}
          />

          <Text
            style={
              styles.statusText
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

        {/* ================================================== */}
        {/* IDENTIFICAÇÃO */}
        {/* ================================================== */}

        <View style={styles.card}>
          <Text
            style={styles.sectionTitle}
          >
            Identificação
          </Text>

          <InfoRow
            label="Identificador"
            value={
              device.identifier
            }
          />

          <InfoRow
            label="Hardware"
            value={
              device.hardware ??
              "—"
            }
          />

          <InfoRow
            label="Firmware"
            value={
              device.firmware ??
              "—"
            }
          />

          <InfoRow
            label="Tipo"
            value={
              device.type ===
              "feeder"
                ? "Comedouro"
                : "Bebedouro"
            }
          />
        </View>

        {/* ================================================== */}
        {/* REDE */}
        {/* ================================================== */}

        <View style={styles.card}>
          <Text
            style={styles.sectionTitle}
          >
            Rede
          </Text>

          <InfoRow
            label="IP"
            value={
              device.ip ||
              "Não informado"
            }
          />

          {status && (
            <>
              <InfoRow
                label="Modo Wi-Fi"
                value={
                  status.wifiMode
                }
              />

              <InfoRow
                label="Sinal"
                value={`${status.rssi} dBm`}
              />

              <InfoRow
                label="Memória livre"
                value={`${status.freeHeap} bytes`}
              />

              <InfoRow
                label="Uptime"
                value={`${status.uptime} s`}
              />
            </>
          )}

          {error && (
            <View
              style={
                styles.errorBox
              }
            >
              <Text
                style={
                  styles.errorText
                }
              >
                {error}
              </Text>
            </View>
          )}

          {/* TESTAR */}

          <Pressable
            style={[
              styles.primaryButton,
              checking &&
                styles.disabledButton,
            ]}
            onPress={() =>
              checkConnection()
            }
            disabled={checking}
          >
            {checking ? (
              <View
                style={
                  styles.loadingRow
                }
              >
                <ActivityIndicator
                  color="#ffffff"
                />

                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  Testando...
                </Text>
              </View>
            ) : (
              <Text
                style={
                  styles.primaryButtonText
                }
              >
                Testar conexão
              </Text>
            )}
          </Pressable>

          {/* ATUALIZAR */}

          <Pressable
            style={[
              styles.secondaryButton,
              updating &&
                styles.disabledButton,
            ]}
            onPress={
              handleUpdateInformation
            }
            disabled={updating}
          >
            {updating ? (
              <View
                style={
                  styles.loadingRow
                }
              >
                <ActivityIndicator />

                <Text
                  style={
                    styles.secondaryButtonText
                  }
                >
                  Atualizando...
                </Text>
              </View>
            ) : (
              <Text
                style={
                  styles.secondaryButtonText
                }
              >
                Atualizar informações
              </Text>
            )}
          </Pressable>
        </View>

        {/* ================================================== */}
        {/* MANUTENÇÃO */}
        {/* ================================================== */}

        <View style={styles.card}>
          <Text
            style={styles.sectionTitle}
          >
            Manutenção
          </Text>

          <Text
            style={styles.maintenanceText}
          >
            Remover o dispositivo daqui
            apenas desvincula o equipamento
            deste gato. As configurações
            gravadas no ESP32-CAM permanecem.
          </Text>

          <Pressable
            style={
              styles.deleteButton
            }
            onPress={
              handleDeleteDevice
            }
          >
            <Text
              style={
                styles.deleteButtonText
              }
            >
              Remover dispositivo
            </Text>
          </Pressable>
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
    paddingBottom: 50,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },

  backButton: {
    fontSize: 16,
    color: "#555555",
    marginBottom: 20,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  deviceAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    elevation: 2,
  },

  deviceAvatarText: {
    fontSize: 30,
  },

  headerInfo: {
    flex: 1,
  },

  title: {
    fontSize: 27,
    fontWeight: "700",
    color: "#222222",
  },

  type: {
    fontSize: 14,
    color: "#777777",
    marginTop: 4,
  },

  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },

  statusOnline: {
    backgroundColor: "#eaf7ed",
  },

  statusOffline: {
    backgroundColor: "#fbecec",
  },

  statusPending: {
    backgroundColor: "#fff8e6",
  },

  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 9,
  },

  dotOnline: {
    backgroundColor: "#28a745",
  },

  dotOffline: {
    backgroundColor: "#dc3545",
  },

  dotPending: {
    backgroundColor: "#d99a00",
  },

  statusText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#333333",
  },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 14,
  },

  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: "#eeeeee",
    paddingVertical: 11,
  },

  infoLabel: {
    fontSize: 12,
    color: "#888888",
    marginBottom: 3,
  },

  infoValue: {
    fontSize: 15,
    color: "#222222",
    fontWeight: "500",
  },

  errorBox: {
    backgroundColor: "#fff0f0",
    borderRadius: 10,
    padding: 12,
    marginTop: 14,
    marginBottom: 4,
  },

  errorText: {
    color: "#a33a3a",
    fontSize: 13,
    lineHeight: 19,
  },

  primaryButton: {
    backgroundColor: "#222222",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },

  primaryButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "700",
  },

  secondaryButton: {
    borderWidth: 1,
    borderColor: "#dddddd",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 10,
  },

  secondaryButtonText: {
    color: "#333333",
    fontSize: 15,
    fontWeight: "600",
  },

  disabledButton: {
    opacity: 0.6,
  },

  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  maintenanceText: {
    fontSize: 13,
    color: "#777777",
    lineHeight: 19,
    marginBottom: 14,
  },

  deleteButton: {
    borderWidth: 1,
    borderColor: "#dc3545",
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: "center",
  },

  deleteButtonText: {
    color: "#dc3545",
    fontSize: 15,
    fontWeight: "600",
  },

  notFoundTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#222222",
    marginBottom: 16,
    textAlign: "center",
  },
});