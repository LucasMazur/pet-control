import { Buffer } from "buffer";
import { PermissionsAndroid, Platform } from "react-native";
import {
    Device as BleDevice,
    BleManager,
    State,
    type Subscription,
} from "react-native-ble-plx";

export const BLE_UUIDS = {
  service: "12345678-1234-1234-1234-1234567890AB",
  ssid: "12345678-1234-1234-1234-1234567890A1",
  password: "12345678-1234-1234-1234-1234567890A2",
  command: "12345678-1234-1234-1234-1234567890A3",
  status: "12345678-1234-1234-1234-1234567890A4",
};

export type BlePetDevice = {
  identifier: string;
  name: string;
  rssi: number | null;
  device: BleDevice;
};

export type BleProvisionResult = {
  ip: string | null;
};

const manager = new BleManager();

function encodeBase64(value: string): string {
  return Buffer.from(value, "utf8").toString("base64");
}

function decodeBase64(value: string | null | undefined): string {
  if (!value) return "";
  return Buffer.from(value, "base64").toString("utf8");
}

export async function requestBlePermissions(): Promise<void> {
  if (Platform.OS !== "android") return;

  if (Number(Platform.Version) >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);

    const scanGranted =
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
      PermissionsAndroid.RESULTS.GRANTED;

    const connectGranted =
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
      PermissionsAndroid.RESULTS.GRANTED;

    if (!scanGranted || !connectGranted) {
      throw new Error(
        "Permita as permissões de Bluetooth nas configurações do Android."
      );
    }
  } else {
    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error(
        "Permita o acesso à localização para procurar dispositivos Bluetooth."
      );
    }
  }
}

export async function ensureBleReady(): Promise<void> {
  const state = await manager.state();

  if (state === State.PoweredOn) return;

  if (state === State.PoweredOff) {
    throw new Error("Ative o Bluetooth do celular e tente novamente.");
  }

  throw new Error(
    `Bluetooth indisponível no momento (estado: ${state}).`
  );
}

export async function scanBleDevices(
  onFound: (device: BlePetDevice) => void,
  onError: (error: Error) => void
): Promise<() => void> {
  await requestBlePermissions();
  await ensureBleReady();

  const seen = new Set<string>();

  manager.startDeviceScan(
    null,
    { allowDuplicates: false },
    (error, device) => {
      if (error) {
        manager.stopDeviceScan();
        onError(new Error(error.message));
        return;
      }

      if (!device) return;

      const name = device.name ?? device.localName ?? "";

      if (!name.startsWith("PETCTRL-")) return;
      if (seen.has(device.id)) return;

      seen.add(device.id);

      onFound({
        identifier: name,
        name,
        rssi: device.rssi,
        device,
      });
    }
  );

  return () => manager.stopDeviceScan();
}

export async function provisionBleDevice(
  device: BleDevice,
  ssid: string,
  password: string,
  onStatus?: (status: string) => void,
  timeoutMs = 45000
): Promise<BleProvisionResult> {
  if (!ssid.trim()) {
    throw new Error("Informe o nome da rede Wi-Fi.");
  }

  await requestBlePermissions();
  await ensureBleReady();

  let connected: BleDevice | null = null;
  let statusSubscription: Subscription | undefined;
  let settled = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  let wifiConnected = false;
  let deviceIp: string | null = null;

  try {
    connected = await device.connect({ timeout: 15000 });
    await connected.discoverAllServicesAndCharacteristics();

    const characteristics =
      await connected.characteristicsForService(BLE_UUIDS.service);

    const required = [
      BLE_UUIDS.ssid,
      BLE_UUIDS.password,
      BLE_UUIDS.command,
      BLE_UUIDS.status,
    ];

    for (const uuid of required) {
      const exists = characteristics.some(
        (item) => item.uuid.toLowerCase() === uuid.toLowerCase()
      );

      if (!exists) {
        throw new Error(
          `A característica BLE ${uuid} não foi encontrada.`
        );
      }
    }

    const result = await new Promise<BleProvisionResult>(
      (resolve, reject) => {
        const finish = (error?: Error) => {
          if (settled) return;

          settled = true;

          if (timeout) {
            clearTimeout(timeout);
            timeout = undefined;
          }

          if (error) {
            reject(error);
          } else {
            resolve({ ip: deviceIp });
          }
        };

        timeout = setTimeout(() => {
          if (wifiConnected) {
            // A conexão Wi-Fi já foi confirmada.
            // O IP pode ainda não ter chegado por BLE.
            finish();
          } else {
            finish(
              new Error(
                "Tempo esgotado aguardando a confirmação da ESP32-CAM. Verifique o Wi-Fi e tente novamente."
              )
            );
          }
        }, timeoutMs);

        statusSubscription = connected!.monitorCharacteristicForService(
          BLE_UUIDS.service,
          BLE_UUIDS.status,
          (error, characteristic) => {
            if (error) {
              if (settled) return;

              // A ESP32 pode desligar o BLE depois de conectar ao Wi-Fi.
              if (wifiConnected) {
                finish();
              } else {
                finish(
                  new Error(
                    "A conexão Bluetooth foi interrompida antes de confirmar a conexão Wi-Fi."
                  )
                );
              }

              return;
            }

            const status = decodeBase64(
              characteristic?.value
            ).trim();

            if (!status) return;

            onStatus?.(status);

            if (status === "WIFI_CONNECTED") {
              wifiConnected = true;
              return;
            }

            if (status.startsWith("IP:")) {
              const receivedIp = status.slice(3).trim();

              // Aceita apenas um endereço IPv4 com formato válido.
              const ipv4Pattern =
                /^(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)$/;

              if (ipv4Pattern.test(receivedIp)) {
                deviceIp = receivedIp;
              }

              return;
            }

            if (status === "PROVISIONING_COMPLETE") {
              finish();
              return;
            }

            if (
              status.startsWith("ERROR_") ||
              status === "WIFI_CONNECTION_FAILED"
            ) {
              finish(new Error(`A ESP32-CAM informou: ${status}`));
            }
          }
        );

        void (async () => {
          try {
            await connected!.writeCharacteristicWithResponseForService(
              BLE_UUIDS.service,
              BLE_UUIDS.ssid,
              encodeBase64(ssid.trim())
            );

            await connected!.writeCharacteristicWithResponseForService(
              BLE_UUIDS.service,
              BLE_UUIDS.password,
              encodeBase64(password)
            );

            await connected!.writeCharacteristicWithResponseForService(
              BLE_UUIDS.service,
              BLE_UUIDS.command,
              encodeBase64("CONNECT")
            );
          } catch (error) {
            finish(
              error instanceof Error
                ? error
                : new Error("Falha ao enviar as configurações Wi-Fi.")
            );
          }
        })();
      }
    );

    return result;
  } finally {
    if (timeout) clearTimeout(timeout);

    statusSubscription?.remove();

    if (connected) {
      try {
        await connected.cancelConnection();
      } catch {
        // A ESP32-CAM pode já ter encerrado o BLE.
      }
    }
  }
}

export function disconnectBle(): void {
  manager.stopDeviceScan();
}