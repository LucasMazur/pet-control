import AsyncStorage from "@react-native-async-storage/async-storage";

import {
    Device,
    DeviceType,
} from "../types/device";

const DEVICES_STORAGE_KEY =
  "@pet_control:devices";

/**
 * Gera uma sequência aleatória de caracteres
 * utilizada para criar identificadores únicos.
 */
function generateRandomCode(
  length: number = 8
): string {
  const characters =
    "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(
      Math.random() * characters.length
    );

    result += characters[randomIndex];
  }

  return result;
}

/**
 * Gera automaticamente o identificador
 * de um dispositivo.
 *
 * Exemplos:
 *
 * DEV-FDR-A7K92XPQ
 * DEV-WTR-M4P81QXZ
 */
export function generateDeviceIdentifier(
  type: DeviceType
): string {
  const prefix =
    type === "feeder"
      ? "DEV-FDR"
      : "DEV-WTR";

  return `${prefix}-${generateRandomCode(8)}`;
}

/**
 * Busca todos os dispositivos cadastrados.
 */
export async function getDevices(): Promise<
  Device[]
> {
  try {
    const data =
      await AsyncStorage.getItem(
        DEVICES_STORAGE_KEY
      );

    if (!data) {
      return [];
    }

    return JSON.parse(data);
  } catch (error) {
    console.error(
      "Erro ao carregar dispositivos:",
      error
    );

    return [];
  }
}

/**
 * Salva a lista completa de dispositivos.
 */
export async function saveDevices(
  devices: Device[]
): Promise<void> {
  try {
    await AsyncStorage.setItem(
      DEVICES_STORAGE_KEY,
      JSON.stringify(devices)
    );
  } catch (error) {
    console.error(
      "Erro ao salvar dispositivos:",
      error
    );
  }
}

/**
 * Adiciona um novo dispositivo.
 *
 * Caso o identificador não tenha sido informado,
 * o sistema gera automaticamente.
 */
export async function addDevice(
  device: Device
): Promise<void> {
  const devices = await getDevices();

  let identifier = device.identifier;

  /*
   * Se não houver identificador,
   * gera automaticamente.
   */
  if (!identifier) {
    identifier =
      generateDeviceIdentifier(
        device.type
      );
  }

  /*
   * Garante que o identificador gerado
   * não seja igual ao de outro dispositivo.
   */
  while (
    devices.some(
      (item) =>
        item.identifier === identifier
    )
  ) {
    identifier =
      generateDeviceIdentifier(
        device.type
      );
  }

  const deviceToSave: Device = {
    ...device,
    identifier,
  };

  devices.push(deviceToSave);

  await saveDevices(devices);
}

/**
 * Atualiza um dispositivo existente.
 */
export async function updateDevice(
  updatedDevice: Device
): Promise<void> {
  const devices = await getDevices();

  const updatedDevices = devices.map(
    (device) =>
      device.id === updatedDevice.id
        ? updatedDevice
        : device
  );

  await saveDevices(updatedDevices);
}

/**
 * Remove um dispositivo pelo ID.
 */
export async function deleteDevice(
  id: string
): Promise<void> {
  const devices = await getDevices();

  const updatedDevices =
    devices.filter(
      (device) => device.id !== id
    );

  await saveDevices(updatedDevices);
}

/**
 * Busca todos os dispositivos pertencentes
 * a um determinado pet.
 */
export async function getDevicesByPetId(
  petId: string
): Promise<Device[]> {
  const devices = await getDevices();

  return devices.filter(
    (device) => device.petId === petId
  );
}

/**
 * Busca um dispositivo específico pelo ID.
 */
export async function getDeviceById(
  id: string
): Promise<Device | null> {
  const devices = await getDevices();

  const device = devices.find(
    (item) => item.id === id
  );

  return device || null;
}