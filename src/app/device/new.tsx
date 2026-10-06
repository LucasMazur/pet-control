import {
    useState,
} from "react";

import {
    Alert,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    View,
} from "react-native";

import {
    router,
    useLocalSearchParams,
} from "expo-router";

import {
    SafeAreaView,
} from "react-native-safe-area-context";

import { addDevice } from "../../storage/devices";

import {
    DeviceType,
} from "../../types/device";

export default function NewDeviceScreen() {
  const { petId } =
    useLocalSearchParams<{
      petId: string;
    }>();

  const [deviceType, setDeviceType] =
    useState<DeviceType | null>(null);

  const [name, setName] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  async function handleAddDevice() {
    if (!petId) {
      Alert.alert(
        "Erro",
        "Não foi possível identificar o pet."
      );

      return;
    }

    if (!deviceType) {
      Alert.alert(
        "Tipo de dispositivo",
        "Selecione o tipo de dispositivo."
      );

      return;
    }

    if (!name.trim()) {
      Alert.alert(
        "Nome",
        "Informe um nome para o dispositivo."
      );

      return;
    }

    try {
      setSaving(true);

      /*
       * Criamos o dispositivo sem definir
       * manualmente o identificador.
       *
       * A função addDevice() será responsável
       * por gerar o identificador automaticamente.
       */
      const newDevice = {
        id: Date.now().toString(),

        petId,

        name: name.trim(),

        type: deviceType,

        identifier: "",

        status: "pending" as const,

        createdAt:
          new Date().toISOString(),
      };

      await addDevice(newDevice);

      Alert.alert(
        "Dispositivo adicionado",
        "O dispositivo foi vinculado ao pet com sucesso.",
        [
          {
            text: "OK",
            onPress: () =>
              router.back(),
          },
        ]
      );
    } catch (error) {
      console.error(
        "Erro ao adicionar dispositivo:",
        error
      );

      Alert.alert(
        "Erro",
        "Não foi possível adicionar o dispositivo."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <ScrollView
        contentContainerStyle={
          styles.content
        }
        showsVerticalScrollIndicator={
          false
        }
      >
        {/* Cabeçalho */}

        <View style={styles.header}>
          <Pressable
            style={styles.backButton}
            onPress={() =>
              router.back()
            }
          >
            <Text
              style={styles.backIcon}
            >
              ‹
            </Text>
          </Pressable>

          <Text style={styles.title}>
            Adicionar dispositivo
          </Text>

          <View
            style={styles.headerSpacer}
          />
        </View>

        {/* Descrição */}

        <Text
          style={
            styles.description
          }
        >
          Escolha o tipo de dispositivo que
          deseja vincular a este pet.
        </Text>

        {/* Tipo de dispositivo */}

        <Text
          style={styles.sectionTitle}
        >
          Tipo de dispositivo
        </Text>

        <View
          style={styles.deviceOptions}
        >
          {/* Comedouro */}

          <Pressable
            style={[
              styles.deviceOption,
              deviceType ===
                "feeder" &&
                styles.deviceOptionSelected,
            ]}
            onPress={() =>
              setDeviceType(
                "feeder"
              )
            }
          >
            <View
              style={[
                styles.optionIcon,
                deviceType ===
                  "feeder" &&
                  styles.optionIconSelected,
              ]}
            >
              <Text
                style={
                  styles.optionEmoji
                }
              >
                🍽️
              </Text>
            </View>

            <View
              style={
                styles.optionInfo
              }
            >
              <Text
                style={
                  styles.optionTitle
                }
              >
                Comedouro
              </Text>

              <Text
                style={
                  styles.optionDescription
                }
              >
                Controle automático de
                alimentação.
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                deviceType ===
                  "feeder" &&
                  styles.radioSelected,
              ]}
            >
              {deviceType ===
                "feeder" && (
                <View
                  style={
                    styles.radioInner
                  }
                />
              )}
            </View>
          </Pressable>

          {/* Bebedouro */}

          <Pressable
            style={[
              styles.deviceOption,
              deviceType ===
                "waterer" &&
                styles.deviceOptionSelected,
            ]}
            onPress={() =>
              setDeviceType(
                "waterer"
              )
            }
          >
            <View
              style={[
                styles.optionIcon,
                styles.waterIcon,
                deviceType ===
                  "waterer" &&
                  styles.optionIconSelected,
              ]}
            >
              <Text
                style={
                  styles.optionEmoji
                }
              >
                💧
              </Text>
            </View>

            <View
              style={
                styles.optionInfo
              }
            >
              <Text
                style={
                  styles.optionTitle
                }
              >
                Bebedouro
              </Text>

              <Text
                style={
                  styles.optionDescription
                }
              >
                Monitoramento do nível e
                consumo de água.
              </Text>
            </View>

            <View
              style={[
                styles.radio,
                deviceType ===
                  "waterer" &&
                  styles.radioSelected,
              ]}
            >
              {deviceType ===
                "waterer" && (
                <View
                  style={
                    styles.radioInner
                  }
                />
              )}
            </View>
          </Pressable>
        </View>

        {/* Nome */}

        {deviceType && (
          <View
            style={styles.form}
          >
            <Text
              style={
                styles.sectionTitle
              }
            >
              Informações do dispositivo
            </Text>

            <Text
              style={styles.label}
            >
              Nome do dispositivo
            </Text>

            <TextInput
              style={styles.input}
              placeholder={
                deviceType ===
                "feeder"
                  ? "Ex.: Comedouro da Luna"
                  : "Ex.: Bebedouro da Luna"
              }
              placeholderTextColor="#999"
              value={name}
              onChangeText={
                setName
              }
              maxLength={40}
            />

            <Text
              style={
                styles.helperText
              }
            >
              O identificador do dispositivo
              será criado automaticamente pelo
              sistema.
            </Text>
          </View>
        )}

        {/* Botão */}

        <Pressable
          style={({ pressed }) => [
            styles.addButton,

            (!deviceType ||
              !name.trim()) &&
              styles.addButtonDisabled,

            pressed &&
              styles.addButtonPressed,
          ]}
          onPress={
            handleAddDevice
          }
          disabled={
            saving ||
            !deviceType ||
            !name.trim()
          }
        >
          <Text
            style={
              styles.addButtonText
            }
          >
            {saving
              ? "Adicionando..."
              : "Adicionar dispositivo"}
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
    paddingTop: 12,
    paddingBottom: 40,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent:
      "space-between",
    marginBottom: 20,
  },

  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor:
      "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
  },

  backIcon: {
    fontSize: 32,
    color: "#333",
    marginTop: -3,
  },

  title: {
    fontSize: 19,
    fontWeight: "700",
    color: "#222",
  },

  headerSpacer: {
    width: 42,
  },

  description: {
    fontSize: 14,
    color: "#777",
    lineHeight: 21,
    marginBottom: 28,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#222",
    marginBottom: 12,
  },

  deviceOptions: {
    gap: 12,
  },

  deviceOption: {
    backgroundColor:
      "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor:
      "transparent",
  },

  deviceOptionSelected: {
    borderColor: "#555",
  },

  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    backgroundColor:
      "#F0ECE5",
    justifyContent:
      "center",
    alignItems: "center",
    marginRight: 13,
  },

  waterIcon: {
    backgroundColor:
      "#E9F1F0",
  },

  optionIconSelected: {
    backgroundColor:
      "#E5E0D7",
  },

  optionEmoji: {
    fontSize: 27,
  },

  optionInfo: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#222",
    marginBottom: 4,
  },

  optionDescription: {
    fontSize: 11,
    color: "#888",
    lineHeight: 16,
  },

  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor:
      "#C8C5BF",
    justifyContent:
      "center",
    alignItems: "center",
    marginLeft: 8,
  },

  radioSelected: {
    borderColor: "#333",
  },

  radioInner: {
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor:
      "#333",
  },

  form: {
    marginTop: 30,
  },

  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#444",
    marginBottom: 7,
  },

  input: {
    height: 54,
    borderRadius: 16,
    backgroundColor:
      "#FFFFFF",
    paddingHorizontal: 16,
    fontSize: 14,
    color: "#222",
    borderWidth: 1,
    borderColor:
      "#E5E2DC",
  },

  helperText: {
    fontSize: 11,
    color: "#999",
    lineHeight: 17,
    marginTop: 8,
  },

  addButton: {
    height: 58,
    borderRadius: 18,
    backgroundColor:
      "#2F2F2F",
    justifyContent:
      "center",
    alignItems: "center",
    marginTop: 32,
  },

  addButtonDisabled: {
    backgroundColor:
      "#C8C5BF",
  },

  addButtonPressed: {
    opacity: 0.8,
  },

  addButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});