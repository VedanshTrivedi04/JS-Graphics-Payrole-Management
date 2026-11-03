const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://identixpay.onrender.com";
const API_URL = `${BASE_URL}/api/v1`;

export const getStoredToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("identix_token");
};

export const setStoredToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("identix_token", token);
  }
};

export const clearStoredToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("identix_token");
  }
};

const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearStoredToken();
      if (typeof window !== "undefined") {
        localStorage.removeItem("identix_biometric_token");
      }
    }
    const errorData = await response.json().catch(() => ({ detail: "Unknown server error" }));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }

  return response.json();
};

export const api = {
  auth: {
    login: async (identifier: string, password: string) => {
      return request("/auth/login", {
        method: "POST",
        body: JSON.stringify({ identifier, password }),
      });
    },
    getMe: async () => {
      return request("/auth/me");
    },
  },

  employees: {
    list: async () => request("/employees/"),
    create: async (data: any) =>
      request("/employees/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    get: async (id: number) => request(`/employees/${id}`),
    update: async (id: number, data: any) =>
      request(`/employees/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: async (id: number) =>
      request(`/employees/${id}`, {
        method: "DELETE",
      }),
  },

  attendance: {
    today: async () => request("/attendance/today"),
    history: async (employeeId?: number, fromDate?: string, toDate?: string) => {
      const params = new URLSearchParams();
      if (employeeId) params.append("employee_id", employeeId.toString());
      if (fromDate) params.append("from_date", fromDate);
      if (toDate) params.append("to_date", toDate);
      return request(`/attendance/history?${params.toString()}`);
    },
    manualAdjust: async (data: { employee_id: number; date: string; first_in?: string; last_out?: string; remarks?: string }) =>
      request("/attendance/manual-adjust", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    rawPunches: async (limit: number = 30) => request(`/attendance/raw-punches?limit=${limit}`),
  },

  advances: {
    list: async (employeeId?: number, fromDate?: string, toDate?: string) => {
      const params = new URLSearchParams();
      if (employeeId) params.append("employee_id", employeeId.toString());
      if (fromDate) params.append("from_date", fromDate);
      if (toDate) params.append("to_date", toDate);
      return request(`/advances/?${params.toString()}`);
    },
    create: async (data: { employee_id: number; amount: number; date: string; payment_type?: string; payment_mode?: string; reason?: string }) =>
      request("/advances/", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: async (id: number) =>
      request(`/advances/${id}`, {
        method: "DELETE",
      }),
  },

  payroll: {
    calculate: async (fromDate: string, toDate: string, employeeId?: number, customHourlyRate?: number) => {
      const params = new URLSearchParams({
        from_date: fromDate,
        to_date: toDate,
      });
      if (employeeId) params.append("employee_id", employeeId.toString());
      if (customHourlyRate) params.append("custom_hourly_rate", customHourlyRate.toString());
      return request(`/payroll/calculate?${params.toString()}`);
    },
    months: async (count: number = 6) =>
      request(`/payroll/months?months_count=${count}`),
    markPaid: async (data: { employee_id: number; from_date: string; to_date: string; payment_date: string; payment_reference?: string; notes?: string }) =>
      request("/payroll/mark-paid", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },

  reports: {
    getPdfDownloadUrl: (employeeId: number, fromDate: string, toDate: string, customHourlyRate?: number) => {
      const params = new URLSearchParams({
        employee_id: employeeId.toString(),
        from_date: fromDate,
        to_date: toDate,
      });
      if (customHourlyRate) params.append("custom_hourly_rate", customHourlyRate.toString());
      const token = getStoredToken();
      if (token) params.append("token", token);
      return `${API_URL}/reports/pdf?${params.toString()}`;
    },
    getCsvDownloadUrl: (fromDate: string, toDate: string, employeeId?: number) => {
      const params = new URLSearchParams({
        from_date: fromDate,
        to_date: toDate,
      });
      if (employeeId) params.append("employee_id", employeeId.toString());
      const token = getStoredToken();
      if (token) params.append("token", token);
      return `${API_URL}/reports/csv?${params.toString()}`;
    },
  },

  // ADMS Device Simulation (Hit direct device listener)
  device: {
    simulatePunch: async (pin: string, timestamp: string, punchType: number = 0) => {
      // Direct post to /iclock/cdata as if the hardware sent it
      const payload = `${pin}\t${timestamp}\t${punchType}\t1\t0\t0\n`;
      const res = await fetch(`${BASE_URL}/iclock/cdata?table=ATTLOG&SN=SIMULATOR-001`, {
        method: "POST",
        body: payload,
      });
      return res.text();
    },
  },
};
