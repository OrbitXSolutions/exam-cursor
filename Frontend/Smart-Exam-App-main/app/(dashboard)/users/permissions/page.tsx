"use client"

import { useState, useEffect, useCallback } from "react"
import { useI18n, getLocalizedField } from "@/lib/i18n/context"
import type { User } from "@/lib/types"
import {
  getUsers,
  getDepartmentsList,
  getRolesList,
  addUserToRole,
  removeUserFromRole,
  assignUserToDepartment,
  removeUserFromDepartment,
} from "@/lib/api/admin"
import type { DepartmentListItem, RoleListItem } from "@/lib/api/admin"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, ShieldCheck, Save, Loader2, Check, X, Filter } from "lucide-react"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

interface PendingChange {
  userId: string
  userName: string
  newRole?: string
  oldRole?: string
  newDeptId?: number | null
  oldDeptId?: number | null
}

export default function UserPermissionsPage() {
  const { language } = useI18n()
  const [users, setUsers] = useState<User[]>([])
  const [departments, setDepartments] = useState<DepartmentListItem[]>([])
  const [roles, setRoles] = useState<RoleListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [deptFilter, setDeptFilter] = useState<string>("all")
  const [pendingChanges, setPendingChanges] = useState<Map<string, PendingChange>>(new Map())
  const [saving, setSaving] = useState<string | null>(null) // userId being saved

  // Load initial data
  useEffect(() => {
    Promise.all([
      getDepartmentsList(),
      getRolesList(),
    ]).then(([depts, rls]) => {
      setDepartments(depts)
      setRoles(rls)
    })
  }, [])

  const loadUsers = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getUsers({
        search: search || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
        departmentId: deptFilter === "all" ? undefined : Number(deptFilter),
        page: 1,
        pageSize: 200,
      })
      // Hide Candidate (separate page) and SuperDev from permissions list
      const hidden = ["Candidate", "SuperDev"]
      setUsers(res.items.filter(u => !hidden.includes(u.role as string)))
    } catch {
      toast.error(language === "ar" ? "فشل تحميل المستخدمين" : "Failed to load users")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [search, roleFilter, deptFilter, language])

  useEffect(() => {
    loadUsers()
  }, [roleFilter, deptFilter])

  // Debounced search
  useEffect(() => {
    const t = setTimeout(() => loadUsers(), 400)
    return () => clearTimeout(t)
  }, [search])

  function handleRoleChange(user: User, newRole: string) {
    const currentRole = user.role
    if (newRole === currentRole) {
      // Remove pending change for role
      setPendingChanges((prev) => {
        const next = new Map(prev)
        const existing = next.get(user.id)
        if (existing) {
          delete existing.newRole
          delete existing.oldRole
          if (!existing.newRole && existing.newDeptId === undefined) next.delete(user.id)
        }
        return next
      })
      return
    }
    setPendingChanges((prev) => {
      const next = new Map(prev)
      const existing = next.get(user.id) || {
        userId: user.id,
        userName: getLocalizedField(user as any, "fullName", language),
      }
      existing.newRole = newRole
      existing.oldRole = currentRole
      next.set(user.id, existing)
      return next
    })
  }

  function handleDeptChange(user: User, newDeptStr: string) {
    const currentDeptId = user.departmentId
    const newDeptId = newDeptStr === "none" ? null : Number(newDeptStr)
    if (newDeptId === currentDeptId) {
      // Remove pending change for dept
      setPendingChanges((prev) => {
        const next = new Map(prev)
        const existing = next.get(user.id)
        if (existing) {
          delete existing.newDeptId
          delete existing.oldDeptId
          if (!existing.newRole && existing.newDeptId === undefined) next.delete(user.id)
        }
        return next
      })
      return
    }
    setPendingChanges((prev) => {
      const next = new Map(prev)
      const existing = next.get(user.id) || {
        userId: user.id,
        userName: getLocalizedField(user as any, "fullName", language),
      }
      existing.newDeptId = newDeptId
      existing.oldDeptId = currentDeptId
      next.set(user.id, existing)
      return next
    })
  }

  async function handleSaveUser(userId: string) {
    const change = pendingChanges.get(userId)
    if (!change) return

    setSaving(userId)
    try {
      // Save role change
      if (change.newRole && change.oldRole) {
        // Remove old role first, then add new
        await removeUserFromRole(userId, change.oldRole)
        await addUserToRole(userId, change.newRole)
      }

      // Save department change
      if (change.newDeptId !== undefined) {
        if (change.newDeptId === null) {
          // Remove from department
          await removeUserFromDepartment(userId)
        } else {
          // Assign to new department
          await assignUserToDepartment(userId, change.newDeptId)
        }
      }

      toast.success(
        language === "ar"
          ? `تم تحديث صلاحيات "${change.userName}" بنجاح`
          : `Permissions updated for "${change.userName}"`
      )

      // Remove from pending
      setPendingChanges((prev) => {
        const next = new Map(prev)
        next.delete(userId)
        return next
      })

      // Reload users to reflect changes
      await loadUsers()
    } catch (err) {
      toast.error(
        language === "ar"
          ? `فشل تحديث صلاحيات "${change.userName}"`
          : `Failed to update permissions for "${change.userName}"`
      )
    } finally {
      setSaving(null)
    }
  }

  function handleCancelChange(userId: string) {
    setPendingChanges((prev) => {
      const next = new Map(prev)
      next.delete(userId)
      return next
    })
  }

  function getEffectiveRole(user: User): string {
    const change = pendingChanges.get(user.id)
    return change?.newRole ?? user.role
  }

  function getEffectiveDeptId(user: User): string {
    const change = pendingChanges.get(user.id)
    if (change?.newDeptId !== undefined) {
      return change.newDeptId === null ? "none" : String(change.newDeptId)
    }
    return user.departmentId ? String(user.departmentId) : "none"
  }

  function hasChange(userId: string): boolean {
    return pendingChanges.has(userId)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SuperDev":
      case "Admin":
        return "default" as const
      case "Instructor":
        return "secondary" as const
      case "Examiner":
        return "outline" as const
      case "Proctor":
        return "outline" as const
      case "Candidate":
        return "secondary" as const
      default:
        return "secondary" as const
    }
  }

  const roleLabel = (role: string) => {
    if (language !== "ar") return role
    const map: Record<string, string> = {
      Admin: "مسؤول",
      Instructor: "مدرس",
      Candidate: "مرشح",
      Examiner: "ممتحن",
      Proctor: "مراقب",
      SuperDev: "مطور",
      ProctorReviewer: "مراجع المراقبة",
      Auditor: "مدقق",
      SuperAdmin: "مسؤول أعلى",
    }
    return map[role] || role
  }

  // Filter out SuperDev and Candidate from assignable roles
  const assignableRoles = roles.filter((r) => r.name !== "SuperDev" && r.name !== "Candidate")

  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <ShieldCheck className="h-6 w-6 text-primary" />
            {language === "ar" ? "صلاحيات المستخدمين" : "User Permissions"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar"
              ? "تعيين الأدوار والأقسام للمستخدمين - كل مستخدم له دور واحد وقسم واحد"
              : "Assign roles and departments to users — each user has one role and one department"}
          </p>
        </div>
        {pendingChanges.size > 0 && (
          <Badge variant="outline" className="text-amber-600 border-amber-300 bg-amber-50">
            {language === "ar"
              ? `${pendingChanges.size} تغييرات معلقة`
              : `${pendingChanges.size} pending change${pendingChanges.size > 1 ? "s" : ""}`}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            {language === "ar" ? "بحث وتصفية" : "Search & Filter"}
          </CardTitle>
          <CardDescription>
            {language === "ar"
              ? "ابحث عن المستخدمين بالاسم أو البريد الإلكتروني وقم بالتصفية حسب الدور أو القسم"
              : "Search users by name or email and filter by role or department"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={language === "ar" ? "البحث بالاسم أو البريد..." : "Search by name or email..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={language === "ar" ? "الدور" : "Role"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "جميع الأدوار" : "All Roles"}</SelectItem>
                {assignableRoles.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {roleLabel(r.name)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={deptFilter} onValueChange={setDeptFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder={language === "ar" ? "القسم" : "Department"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "جميع الأقسام" : "All Departments"}</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept.id} value={String(dept.id)}>
                    {dept.code ? `${dept.code} - ` : ""}{language === "ar" ? dept.nameAr : dept.nameEn}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Permissions Table */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "ar" ? "تعيين الصلاحيات" : "Permission Assignments"}</CardTitle>
          <CardDescription>
            {language === "ar"
              ? `${users.length} مستخدم — اختر الدور والقسم ثم اضغط حفظ`
              : `${users.length} users — select role and department, then click save`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">{language === "ar" ? "المستخدم" : "User"}</TableHead>
                  <TableHead className="w-[200px]">{language === "ar" ? "البريد الإلكتروني" : "Email"}</TableHead>
                  <TableHead className="w-[170px]">{language === "ar" ? "الدور الحالي" : "Current Role"}</TableHead>
                  <TableHead className="w-[200px]">{language === "ar" ? "الدور" : "Role"}</TableHead>
                  <TableHead className="w-[200px]">{language === "ar" ? "القسم" : "Department"}</TableHead>
                  <TableHead className="w-[100px] text-center">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      {language === "ar" ? "لا يوجد مستخدمون" : "No users found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => {
                    const changed = hasChange(user.id)
                    const isSaving = saving === user.id
                    return (
                      <TableRow
                        key={user.id}
                        className={changed ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}
                      >
                        {/* User Info */}
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-medium text-sm">
                              {getLocalizedField(user as any, "fullName", language).charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-sm">
                              {getLocalizedField(user as any, "fullName", language)}
                            </span>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>

                        {/* Current Role Badge */}
                        <TableCell>
                          <Badge variant={getRoleBadgeVariant(user.role)}>{roleLabel(user.role)}</Badge>
                        </TableCell>

                        {/* Role Selector */}
                        <TableCell>
                          <Select
                            value={getEffectiveRole(user)}
                            onValueChange={(val) => handleRoleChange(user, val)}
                            disabled={isSaving}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {assignableRoles.map((r) => (
                                <SelectItem key={r.id} value={r.name}>
                                  {roleLabel(r.name)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Department Selector */}
                        <TableCell>
                          <Select
                            value={getEffectiveDeptId(user)}
                            onValueChange={(val) => handleDeptChange(user, val)}
                            disabled={isSaving}
                          >
                            <SelectTrigger className="h-8 text-sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                {language === "ar" ? "— بدون قسم —" : "— No Department —"}
                              </SelectItem>
                              {departments.map((dept) => (
                                <SelectItem key={dept.id} value={String(dept.id)}>
                                  {dept.code ? `${dept.code} - ` : ""}{language === "ar" ? dept.nameAr : dept.nameEn}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>

                        {/* Actions */}
                        <TableCell>
                          {changed && (
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                size="sm"
                                variant="default"
                                className="h-7 px-2"
                                onClick={() => handleSaveUser(user.id)}
                                disabled={isSaving}
                              >
                                {isSaving ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Check className="h-3.5 w-3.5" />
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2"
                                onClick={() => handleCancelChange(user.id)}
                                disabled={isSaving}
                              >
                                <X className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
