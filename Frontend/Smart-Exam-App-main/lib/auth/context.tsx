"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { apiClient } from "@/lib/api-client"
import type { User, UserRole } from "@/lib/types"
import { toast } from "sonner"

interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  hasRole: (roles: UserRole | UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const mockUsers: Record<string, User> = {
  "ahmed.it.admin@examcore.com": {
    id: "1",
    email: "ahmed.it.admin@examcore.com",
    fullNameEn: "Ahmed Hassan",
    fullNameAr: "أحمد حسن",
    role: "Admin" as UserRole,
    isActive: true,
    createdDate: new Date().toISOString(),
  },
  "sara.it.instructor@examcore.com": {
    id: "2",
    email: "sara.it.instructor@examcore.com",
    fullNameEn: "Sara Ali",
    fullNameAr: "سارة علي",
    role: "Instructor" as UserRole,
    isActive: true,
    createdDate: new Date().toISOString(),
  },
  "ali.it.candidate@examcore.com": {
    id: "3",
    email: "ali.it.candidate@examcore.com",
    fullNameEn: "Ali Mohammed",
    fullNameAr: "علي محمد",
    role: "Candidate" as UserRole,
    isActive: true,
    createdDate: new Date().toISOString(),
  },
}

const MOCK_PASSWORD = "Demo@123456"

interface LoginApiResponse {
  success: boolean
  message: string
  data: {
    accessToken: string
    refreshToken: string
    expiration: string
    user: {
      id: string
      email: string
      displayName: string
      fullName: string
      isBlocked: boolean
      status: string
      emailConfirmed: boolean
      roles: string[]
      createdDate: string
    }
  }
  errors: string[]
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const token = localStorage.getItem("auth_token")
    const savedUser = localStorage.getItem("user")

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser))
      } catch {
        apiClient.clearToken()
        localStorage.removeItem("user")
      }
    }

    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)

    try {
      const response = await fetch("/api/proxy/Auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      })

      const result: LoginApiResponse = await response.json()

      console.log("[Auth] Login response:", result)

      if (result.success && result.data) {
        const mappedUser: User = {
          id: result.data.user.id,
          email: result.data.user.email,
          fullNameEn: result.data.user.fullName || result.data.user.displayName,
          fullNameAr: result.data.user.fullName || result.data.user.displayName,
          role: (result.data.user.roles[0] || "Candidate") as UserRole,
          isActive: !result.data.user.isBlocked,
          createdDate: result.data.user.createdDate,
        }

        apiClient.setToken(result.data.accessToken)
        setUser(mappedUser)
        localStorage.setItem("user", JSON.stringify(mappedUser))
        localStorage.setItem("refreshToken", result.data.refreshToken)

        console.log("[Auth] Login successful, token stored")
        toast.success("Login successful")
        setIsLoading(false)
        return true
      }

      // API returned error
      const errorMsg = result.errors?.join(", ") || result.message || "Login failed"
      throw new Error(errorMsg)
    } catch (error) {
      console.error("[Auth] Login error:", error)
      toast.error(error instanceof Error ? error.message : "Login failed")
      setIsLoading(false)
      return false
    }
  }

  const logout = () => {
    apiClient.clearToken()
    localStorage.removeItem("user")
    localStorage.removeItem("refreshToken")
    setUser(null)
    toast.success("Logged out successfully")
  }

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.role)
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
