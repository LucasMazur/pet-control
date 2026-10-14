export type DeviceType = "feeder" | "waterer";

export type DeviceStatus =
  | "online"
  | "offline"
  | "pending";

export type Device = {
  id: string;
  petId: string;
  name: string;
  type: DeviceType;

  // Identificador físico do ESP32
  identifier: string;

  // IP utilizado quando o dispositivo
  // está conectado à rede da residência
  ip: string;

  status: DeviceStatus;

  // Informações opcionais da última comunicação
  firmware?: string;
  hardware?: string;
  rssi?: number;

  createdAt: string;
};