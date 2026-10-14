import AsyncStorage from "@react-native-async-storage/async-storage";

import type {
    Device,
    DeviceStatus,
    DeviceType,
} from "../types/device";

const DEVICES_STORAGE_KEY =
  "@pet_control:devices";

// ============================================================
// BUSCAR TODOS
// ============================================================

export async function getDevices(): Promise<Device[]> {
  const stored =
    await AsyncStorage.getItem(
      DEVICES_STORAGE_KEY
    );

  if (!stored) {
    return [];
  }

  try {
    return JSON.parse(stored) as Device[];
  } catch {
    return [];
  }
}

// ============================================================
// SALVAR TODOS
// ============================================================

export async function saveDevices(
  devices: Device[]
): Promise<void> {
  await AsyncStorage.setItem(
    DEVICES_STORAGE_KEY,
    JSON.stringify(devices)
  );
}

// ============================================================
// ADICIONAR
// ============================================================

export async function addDevice(
  data: {
    petId: string;
    name: string;
    type: DeviceType;
    identifier: string;
    ip: string;
    status?: DeviceStatus;
    firmware?: string;
    hardware?: string;
    rssi?: number;
  }
): Promise<Device> {
  const devices =
    await getDevices();

  const existing =
    devices.find(
      (device) =>
        device.identifier ===
        data.identifier
    );

  if (existing) {
    throw new Error(
      "Este dispositivo já está cadastrado."
    );
  }

  const device: Device = {
    id: `device-${Date.now()}`,

    petId: data.petId,

    name: data.name,

    type: data.type,

    identifier: data.identifier,

    ip: data.ip,

    status:
      data.status ?? "pending",

    firmware: data.firmware,

    hardware: data.hardware,

    rssi: data.rssi,

    createdAt:
      new Date().toISOString(),
  };

  devices.push(device);

  await saveDevices(devices);

  return device;
}

// ============================================================
// ATUALIZAR
// ============================================================

export async function updateDevice(
  id: string,
  updates: Partial<Device>
): Promise<Device | null> {
  const devices =
    await getDevices();

  const index =
    devices.findIndex(
      (device) =>
        device.id === id
    );

  if (index === -1) {
    return null;
  }

  const updatedDevice: Device = {
    ...devices[index],
    ...updates,
  };

  devices[index] =
    updatedDevice;

  await saveDevices(devices);

  return updatedDevice;
}

// ============================================================
// EXCLUIR
// ============================================================

export async function deleteDevice(
  id: string
): Promise<void> {
  const devices =
    await getDevices();

  const filtered =
    devices.filter(
      (device) =>
        device.id !== id
    );

  await saveDevices(filtered);
}

// ============================================================
// BUSCAR POR ID
// ============================================================

export async function getDeviceById(
  id: string
): Promise<Device | null> {
  const devices =
    await getDevices();

  return (
    devices.find(
      (device) =>
        device.id === id
    ) ?? null
  );
}

// ============================================================
// BUSCAR DISPOSITIVOS DO GATO
// ============================================================

export async function getDevicesByPetId(
  petId: string
): Promise<Device[]> {
  const devices =
    await getDevices();

  return devices.filter(
    (device) =>
      device.petId === petId
  );
}