
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import {
  provisionBleDevice,
  scanBleDevices,
  type BlePetDevice,
} from "../../services/deviceBle";
import { addDevice } from "../../storage/devices";

type DeviceType = "feeder" | "waterer";

export default function NewDeviceScreen() {
  const params = useLocalSearchParams<{ petId?: string | string[] }>();
  const petId = Array.isArray(params.petId)
    ? params.petId[0]
    : params.petId;

  const [devices, setDevices] = useState<BlePetDevice[]>([]);
  const [device, setDevice] = useState<BlePetDevice | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<DeviceType>("feeder");
  const [ssid, setSsid] = useState("");
  const [password, setPassword] = useState("");
  const [searching, setSearching] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [bleStatus, setBleStatus] = useState("");
  const [scanMessage, setScanMessage] = useState(
    "Toque no botão para procurar sua ESP32-CAM."
  );

  const stopScanRef = useRef<(() => void) | null>(null);
  const scanTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);
  const foundDeviceRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      stopScanRef.current?.();
      stopScanRef.current = null;

      if (scanTimerRef.current) {
        clearTimeout(scanTimerRef.current);
        scanTimerRef.current = null;
      }
    };
  }, []);

  async function handleDiscoverDevice() {
    if (searching || provisioning) return;

    setSearching(true);
    setDevices([]);
    setDevice(null);
    foundDeviceRef.current = false;
    setScanMessage("Procurando dispositivos Pet Control por Bluetooth...");

    try {
      const stop = await scanBleDevices(
        (found) => {
          if (!mountedRef.current) return;

          foundDeviceRef.current = true;

          setDevices((current) => {
            if (current.some((item) => item.device.id === found.device.id)) {
              return current;
            }

            return [...current, found];
          });

          setScanMessage("Selecione sua ESP32-CAM na lista.");
        },
        (error) => {
          if (!mountedRef.current) return;

          setScanMessage(error.message);
          setSearching(false);

          stopScanRef.current?.();
          stopScanRef.current = null;
        }
      );

      if (!mountedRef.current) {
        stop();
        return;
      }

      stopScanRef.current = stop;

      scanTimerRef.current = setTimeout(() => {
        stopScanRef.current?.();
        stopScanRef.current = null;
        scanTimerRef.current = null;

        if (!mountedRef.current) return;

        setSearching(false);

        if (!foundDeviceRef.current) {
          setScanMessage(
            "Busca concluída. Confira se a ESP32-CAM está ligada e no modo de configuração."
          );
        } else {
          setScanMessage("Busca concluída. Selecione o dispositivo encontrado.");
        }
      }, 12000);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar a busca Bluetooth.";

      if (mountedRef.current) {
        setSearching(false);
        setScanMessage(message);
        Alert.alert("Bluetooth indisponível", message);
      }
    }
  }

  function handleSelectDevice(found: BlePetDevice) {
    if (provisioning) return;

    setDevice(found);

    if (!name.trim()) {
      setName(type === "feeder" ? "Comedouro" : "Bebedouro");
    }

    setBleStatus("");
  }

  function handleSelectType(selectedType: DeviceType) {
    setType(selectedType);

    if (!name.trim() || name === "Comedouro" || name === "Bebedouro") {
      setName(selectedType === "feeder" ? "Comedouro" : "Bebedouro");
    }
  }

  async function handleProvision() {
    if (provisioning) return;

    if (!device) {
      Alert.alert(
        "Dispositivo",
        "Primeiro procure e selecione a ESP32-CAM."
      );
      return;
    }

    if (!petId) {
      Alert.alert(
        "Erro",
        "Não foi possível identificar o pet associado. Volte à tela do pet e tente novamente."
      );
      return;
    }

    if (!name.trim()) {
      Alert.alert("Nome", "Digite um nome para o dispositivo.");
      return;
    }

    if (!ssid.trim()) {
      Alert.alert("Wi-Fi", "Digite o nome da rede Wi-Fi.");
      return;
    }

    setProvisioning(true);
    setBleStatus("Conectando à ESP32-CAM...");

    stopScanRef.current?.();
    stopScanRef.current = null;

    if (scanTimerRef.current) {
      clearTimeout(scanTimerRef.current);
      scanTimerRef.current = null;
    }

    setSearching(false);

    try {
      const result = await provisionBleDevice(
        device.device,
        ssid.trim(),
        password,
        (status) => {
          if (mountedRef.current) {
            setBleStatus(status);
          }
        }
      );

      const ip = result.ip ?? "";

      await addDevice({
        petId,
        name: name.trim(),
        type,
        identifier: device.identifier,
        ip,
        status: ip ? "online" : "pending",
        hardware: "ESP32-CAM",
        rssi: device.rssi ?? undefined,
      });

      const message = ip
        ? `${name.trim()} foi configurado com sucesso!\n\nIP identificado automaticamente: ${ip}`
        : `${name.trim()} recebeu as configurações e confirmou o provisionamento, mas o IP não chegou pelo Bluetooth. Você poderá atualizar as informações depois.`;

      Alert.alert("Wi-Fi configurado!", message, [
        {
          text: "Continuar",
          onPress: () => router.replace(`/pet/${petId}`),
        },
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Não foi possível configurar o dispositivo.";

      Alert.alert("Falha no provisionamento", message);
    } finally {
      if (mountedRef.current) {
        setProvisioning(false);
        setBleStatus("");
      }
    }
  }

  
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => router.back()}
          disabled={provisioning}
          style={styles.backButtonContainer}
        >
          <Text style={styles.backButton}>← Voltar</Text>
        </Pressable>

        <Text style={styles.title}>Adicionar dispositivo</Text>

        <Text style={styles.subtitle}>
          Configure seu comedouro ou bebedouro Pet Control usando Bluetooth,
          sem precisar conectar o celular ao Wi-Fi da ESP32-CAM.
        </Text>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>
            1. Encontrar dispositivo
          </Text>

          <Text style={styles.description}>
            Ligue a ESP32-CAM e deixe-a no modo de configuração Bluetooth.
          </Text>

          <Pressable
            style={[
              styles.primaryButton,
              (searching || provisioning) && styles.disabledButton,
            ]}
            onPress={handleDiscoverDevice}
            disabled={searching || provisioning}
          >
            {searching ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color="#ffffff" />
                <Text style={styles.primaryButtonText}>
                  Procurando...
                </Text>
              </View>
            ) : (
              <Text style={styles.primaryButtonText}>
                Procurar via Bluetooth
              </Text>
            )}
          </Pressable>

          <Text style={styles.scanMessage}>{scanMessage}</Text>

          {devices.map((found) => {
            const selected = device?.device.id === found.device.id;

            return (
              <Pressable
                key={found.device.id}
                style={[
                  styles.deviceOption,
                  selected && styles.deviceOptionSelected,
                ]}
                onPress={() => handleSelectDevice(found)}
                disabled={provisioning}
              >
                <Text style={styles.foundTitle}>
                  {selected ? "✓ " : ""}
                  {found.name}
                </Text>

                <Text style={styles.deviceInfo}>
                  Sinal Bluetooth: {found.rssi ?? "—"} dBm
                </Text>

                <Text style={styles.deviceInfo}>
                  Toque para selecionar
                </Text>
              </Pressable>
            );
          })}

          {device && (
            <View style={styles.successBox}>
              <Text style={styles.foundTitle}>
                Dispositivo selecionado
              </Text>

              <Text style={styles.identifier}>
                {device.identifier}
              </Text>
            </View>
          )}
        </View>

        {device && (
          <>
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                2. Identificar dispositivo
              </Text>

              <Text style={styles.label}>Nome</Text>

              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder={
                  type === "feeder"
                    ? "Ex.: Comedouro da Luna"
                    : "Ex.: Bebedouro da sala"
                }
                placeholderTextColor="#999999"
                editable={!provisioning}
              />

              <Text style={styles.label}>Tipo</Text>

              <View style={styles.typeRow}>
                <Pressable
                  style={[
                    styles.typeButton,
                    type === "feeder" && styles.typeButtonSelected,
                  ]}
                  onPress={() => handleSelectType("feeder")}
                  disabled={provisioning}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === "feeder" &&
                        styles.typeButtonTextSelected,
                    ]}
                  >
                    🍽️ Comedouro
                  </Text>
                </Pressable>

                <Pressable
                  style={[
                    styles.typeButton,
                    type === "waterer" && styles.typeButtonSelected,
                  ]}
                  onPress={() => handleSelectType("waterer")}
                  disabled={provisioning}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      type === "waterer" &&
                        styles.typeButtonTextSelected,
                    ]}
                  >
                    💧 Bebedouro
                  </Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                3. Wi-Fi da residência
              </Text>

              <Text style={styles.description}>
                Informe a rede Wi-Fi de 2,4 GHz à qual a ESP32-CAM deverá se
                conectar.
              </Text>

              <Text style={styles.label}>Nome da rede (SSID)</Text>

              <TextInput
                style={styles.input}
                value={ssid}
                onChangeText={setSsid}
                placeholder="Nome da rede Wi-Fi"
                placeholderTextColor="#999999"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!provisioning}
              />

              <Text style={styles.label}>Senha</Text>

              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Senha do Wi-Fi"
                  placeholderTextColor="#999999"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!provisioning}
                />

                <Pressable
                  style={styles.passwordButton}
                  onPress={() => setShowPassword((value) => !value)}
                  disabled={provisioning}
                >
                  <Text style={styles.passwordButtonText}>
                    {showPassword ? "Ocultar" : "Mostrar"}
                  </Text>
                </Pressable>
              </View>

              <View style={styles.warningBox}>
                <Text style={styles.warningText}>
                  O celular continua conectado à sua rede normal. As
                  credenciais serão enviadas diretamente à ESP32-CAM pelo BLE.
                </Text>
              </View>

              {provisioning && (
                <View style={styles.progressBox}>
                  <ActivityIndicator color="#2563eb" />

                  <Text style={styles.progressText}>
                    {bleStatus || "Configurando dispositivo..."}
                  </Text>
                </View>
              )}

              <Pressable
                style={[
                  styles.provisionButton,
                  provisioning && styles.disabledButton,
                ]}
                onPress={handleProvision}
                disabled={provisioning}
              >
                {provisioning ? (
                  <ActivityIndicator color="#ffffff" />
                ) : (
                  <Text style={styles.provisionButtonText}>
                    Configurar dispositivo
                  </Text>
                )}
              </Pressable>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f7fb",
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  backButtonContainer: {
    alignSelf: "flex-start",
    marginBottom: 18,
    paddingVertical: 6,
  },
  backButton: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "600",
  },
  title: {
    color: "#172033",
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    color: "#64748b",
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 22,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sectionTitle: {
    color: "#172033",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 10,
  },
  description: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: "#2563eb",
    borderRadius: 10,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  disabledButton: {
    opacity: 0.6,
  },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  scanMessage: {
    color: "#475569",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 12,
    marginBottom: 4,
  },
  deviceOption: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    padding: 13,
    marginTop: 10,
    backgroundColor: "#ffffff",
  },
  deviceOptionSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  foundTitle: {
    color: "#172033",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  deviceInfo: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 3,
  },
  successBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: 10,
    backgroundColor: "#ecfdf5",
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  identifier: {
    color: "#047857",
    fontSize: 13,
    marginTop: 4,
  },
  label: {
    color: "#334155",
    fontSize: 14,
    fontWeight: "600",
    marginTop: 12,
    marginBottom: 7,
  },
  input: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: "#172033",
  },
  typeRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 2,
  },
  typeButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  typeButtonSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#2563eb",
  },
  typeButtonText: {
    color: "#475569",
    fontSize: 13,
    fontWeight: "600",
  },
  typeButtonTextSelected: {
    color: "#1d4ed8",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 10,
    backgroundColor: "#ffffff",
  },
  passwordInput: {
    flex: 1,
    minWidth: 0,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: "#172033",
    fontSize: 15,
  },
  passwordButton: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  passwordButtonText: {
    color: "#2563eb",
    fontWeight: "700",
    fontSize: 13,
  },
  warningBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 12,
    marginTop: 16,
  },
  warningText: {
    color: "#1e40af",
    fontSize: 13,
    lineHeight: 19,
  },
  progressBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    marginTop: 16,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  progressText: {
    flex: 1,
    color: "#334155",
    fontSize: 13,
    lineHeight: 19,
  },
  provisionButton: {
    backgroundColor: "#16a34a",
    borderRadius: 10,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 18,
  },
  provisionButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
});