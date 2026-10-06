export type DeviceApiStatus =
  | "provisioning"
  | "online"
  | "offline";

export type DiscoveredDevice = {
  identifier: string;
  firmware: string;
  hardware: string;
  status: DeviceApiStatus;
  ip: string;
};

export type DeviceStatus = {
  online: boolean;
  provisioning: boolean;
  wifiStatus: number;
  rssi: number;
  freeHeap: number;
};

export type ProvisionResult = {
  success: boolean;
  identifier?: string;
  status?: string;
  ip?: string;
  error?: string;
};

const DEFAULT_DEVICE_IP = "192.168.4.1";

const REQUEST_TIMEOUT = 5000;

// ============================================================
// FETCH COM TIMEOUT
// ============================================================

async function fetchWithTimeout(
  url: string,
  options?: RequestInit,
  timeout = REQUEST_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();

  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });

    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ============================================================
// NORMALIZA IP
// ============================================================

function normalizeBaseUrl(
  ip: string = DEFAULT_DEVICE_IP
): string {
  const cleanIp = ip
    .trim()
    .replace(/^https?:\/\//, "")
    .replace(/\/+$/, "");

  return `http://${cleanIp}`;
}

// ============================================================
// DESCOBRIR DISPOSITIVO
// ============================================================

export async function discoverDevice(
  ip = DEFAULT_DEVICE_IP
): Promise<DiscoveredDevice> {
  const baseUrl = normalizeBaseUrl(ip);

  const response = await fetchWithTimeout(
    `${baseUrl}/api/device`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Dispositivo respondeu com HTTP ${response.status}.`
    );
  }

  const data =
    (await response.json()) as DiscoveredDevice;

  if (!data.identifier) {
    throw new Error(
      "Resposta do dispositivo não contém identificador."
    );
  }

  return data;
}

// ============================================================
// STATUS
// ============================================================

export async function getDeviceStatus(
  ip = DEFAULT_DEVICE_IP
): Promise<DeviceStatus> {
  const baseUrl = normalizeBaseUrl(ip);

  const response = await fetchWithTimeout(
    `${baseUrl}/api/status`,
    {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao consultar status: HTTP ${response.status}.`
    );
  }

  return (await response.json()) as DeviceStatus;
}

// ============================================================
// PROVISIONAMENTO
// ============================================================

export async function provisionDevice(
  ssid: string,
  password: string,
  ip = DEFAULT_DEVICE_IP
): Promise<ProvisionResult> {
  const baseUrl = normalizeBaseUrl(ip);

  const body = new URLSearchParams();

  body.append("ssid", ssid);
  body.append("password", password);

  const response = await fetchWithTimeout(
    `${baseUrl}/api/provision`,
    {
      method: "POST",
      headers: {
        "Content-Type":
          "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: body.toString(),
    },
    20000
  );

  const data =
    (await response.json()) as ProvisionResult;

  if (!response.ok) {
    throw new Error(
      data.error ??
        `Erro no provisionamento: HTTP ${response.status}.`
    );
  }

  return data;
}

// ============================================================
// RESET
// ============================================================

export async function resetDevice(
  ip = DEFAULT_DEVICE_IP
): Promise<void> {
  const baseUrl = normalizeBaseUrl(ip);

  const response = await fetchWithTimeout(
    `${baseUrl}/api/reset`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error(
      `Erro ao resetar dispositivo: HTTP ${response.status}.`
    );
  }
}