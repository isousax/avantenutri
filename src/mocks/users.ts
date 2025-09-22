import type { User } from "../types/auth";

// Credenciais de login
export const MOCK_CREDENTIALS = {
  patient: {
    email: "maria@example.com",
    password: "123456"
  },
  admin: {
    email: "andreinacawanne@gmail.com",
    password: "cawannre.04062025"
  }
} as const;

// Dados completos dos usuários
export const MOCK_USERS: Record<"admin" | "patient", User> = {
  admin: {
    id: "1",
    name: "Dra. Nutri Avante",
    email: MOCK_CREDENTIALS.admin.email,
    role: "admin",
    photoUrl: "https://ui-avatars.com/api/?name=Dra+Nutri&background=22c55e&color=fff"
  },
  patient: {
    id: "2",
    name: "Maria Silva",
    email: MOCK_CREDENTIALS.patient.email,
    role: "paciente",
    photoUrl: "https://ui-avatars.com/api/?name=Maria+Silva&background=22c55e&color=fff",
    phone: "(61) 98765-4321",
    birthDate: "1990-05-15",
    weight: 72.5,
    targetWeight: 70,
    calorieGoal: 2000,
    dailyWaterGoal: 8
  }
};