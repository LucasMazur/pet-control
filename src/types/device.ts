export type DeviceType =
  | "feeder"
  | "waterer";

export type DeviceStatus =
  | "online"
  | "offline"
  | "pending";

export type Device = {
  /**
   * ID interno utilizado pelo aplicativo.
   */
  id: string;

  /**
   * ID do pet ao qual o dispositivo
   * está vinculado.
   */
  petId: string;

  /**
   * Nome dado pelo usuário.
   */
  name: string;

  /**
   * Tipo do dispositivo.
   */
  type: DeviceType;

  /**
   * Identificador gerado automaticamente
   * pelo sistema.
   *
   * Futuramente poderá ser associado ao
   * identificador físico do ESP32.
   */
  identifier: string;

  /**
   * Estado atual da conexão.
   */
  status: DeviceStatus;

  /**
   * Data de criação do dispositivo.
   */
  createdAt: string;
};