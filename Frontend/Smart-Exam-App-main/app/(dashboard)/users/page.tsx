"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useI18n, getLocalizedField } from "@/lib/i18n/context"
import type { User } from "@/lib/types"
import { getUsers, getUserById, updateUser, deleteUser, getDepartmentsList } from "@/lib/api/admin"
import type { DepartmentListItem } from "@/lib/api/admin"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/ui/status-badge"
import {
  Plus,
  Search,
  MoreHorizontal,
  Eye,
  Pencil,
  Trash2,
  KeyRound,
  Users,
  UserCheck,
  UserX,
  Shield,
} from "lucide-react"
import { toast } from "sonner"
import { LoadingSpinner } from "@/components/ui/loading-spinner"

export default function UsersPage() {
  const { language } = useI18n()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [departmentFilter, setDepartmentFilter] = useState<string>("all")
  const [departments, setDepartments] = useState<DepartmentListItem[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)

  useEffect(() => {
    loadUsers()
  }, [roleFilter, statusFilter, departmentFilter])

  useEffect(() => {
    getDepartmentsList().then(setDepartments).catch(() => setDepartments([]))
  }, [])

  async function loadUsers() {
    setLoading(true)
    try {
      const res = await getUsers({
        search: search || undefined,
        role: roleFilter === "all" ? undefined : roleFilter,
        isActive: statusFilter === "all" ? undefined : statusFilter === "active",
        departmentId: departmentFilter === "all" ? undefined : Number(departmentFilter),
        page: 1,
        pageSize: 100,
      })
      setUsers(res.items)
    } catch (e) {
      console.error("Failed to load users", e)
      toast.error("Failed to load users")
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const t = setTimeout(() => loadUsers(), 300)
    return () => clearTimeout(t)
  }, [search])

  // Hide Candidate (separate page) and SuperDev from this list
  const filteredUsers = users.filter((user) => {
    if (user.role === "Candidate" || user.role === "SuperDev") return false
    const name = getLocalizedField(user, "fullName", language).toLowerCase()
    const matchesSearch =
      !search || name.includes(search.toLowerCase()) || user.email.toLowerCase().includes(search.toLowerCase())
    const matchesRole = roleFilter === "all" || user.role === roleFilter
    const matchesStatus = statusFilter === "all" || (statusFilter === "active" ? user.isActive : !user.isActive)
    return matchesSearch && matchesRole && matchesStatus
  })

  async function handleDeleteUser() {
    if (!userToDelete) return
    try {
      await deleteUser(userToDelete.id)
      toast.success("User deleted successfully")
      setDeleteDialogOpen(false)
      setUserToDelete(null)
      loadUsers()
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete user")
    }
  }

  function handleResetPassword(user: User) {
    toast.success(`Password reset. Temporary password: TempPass123!`)
  }

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "SuperAdmin":
      case "Admin":
        return "default"
      case "Instructor":
        return "secondary"
      case "ProctorReviewer":
        return "outline"
      case "Auditor":
        return "outline"
      default:
        return "secondary"
    }
  }

  const stats = {
    total: filteredUsers.length,
    active: filteredUsers.filter((u) => u.isActive).length,
    inactive: filteredUsers.filter((u) => !u.isActive).length,
    admins: filteredUsers.filter((u) => u.role === "Admin" || u.role === "SuperAdmin").length,
  }

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
          <h1 className="text-2xl font-bold tracking-tight">
            {language === "ar" ? "إدارة المستخدمين" : "User Management"}
          </h1>
          <p className="text-muted-foreground">
            {language === "ar" ? "إدارة حسابات المستخدمين والأدوار" : "Manage user accounts and roles"}
          </p>
        </div>
        <Button onClick={() => router.push("/users/create")}>
          <Plus className="mr-2 h-4 w-4" />
          {language === "ar" ? "إضافة مستخدم" : "Add User"}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === "ar" ? "إجمالي المستخدمين" : "Total Users"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{language === "ar" ? "نشط" : "Active"}</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{language === "ar" ? "غير نشط" : "Inactive"}</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">{language === "ar" ? "المسؤولون" : "Administrators"}</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{language === "ar" ? "المستخدمون" : "Users"}</CardTitle>
          <CardDescription>
            {language === "ar" ? "قائمة جميع المستخدمين المسجلين" : "List of all registered users"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-col gap-4 sm:flex-row">
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
                <SelectItem value="Admin">{language === "ar" ? "مسؤول" : "Admin"}</SelectItem>
                <SelectItem value="Instructor">{language === "ar" ? "مدرس" : "Instructor"}</SelectItem>
                <SelectItem value="Examiner">{language === "ar" ? "ممتحن" : "Examiner"}</SelectItem>
                <SelectItem value="Proctor">{language === "ar" ? "مراقب" : "Proctor"}</SelectItem>
                <SelectItem value="ProctorReviewer">{language === "ar" ? "مراجع" : "Proctor Reviewer"}</SelectItem>
                <SelectItem value="Auditor">{language === "ar" ? "مدقق" : "Auditor"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder={language === "ar" ? "الحالة" : "Status"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{language === "ar" ? "جميع الحالات" : "All Status"}</SelectItem>
                <SelectItem value="active">{language === "ar" ? "نشط" : "Active"}</SelectItem>
                <SelectItem value="inactive">{language === "ar" ? "غير نشط" : "Inactive"}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
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

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ar" ? "المستخدم" : "User"}</TableHead>
                  <TableHead>{language === "ar" ? "البريد الإلكتروني" : "Email"}</TableHead>
                  <TableHead>{language === "ar" ? "الدور" : "Role"}</TableHead>
                  <TableHead>{language === "ar" ? "القسم" : "Department"}</TableHead>
                  <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                  <TableHead>{language === "ar" ? "تاريخ الإنشاء" : "Created"}</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      {language === "ar" ? "لا يوجد مستخدمون" : "No users found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-medium">
                            {getLocalizedField(user, "fullName", language).charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{getLocalizedField(user, "fullName", language)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={getRoleBadgeVariant(user.role)}>{user.role}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {language === "ar"
                          ? (user.departmentNameAr || "—")
                          : (user.departmentNameEn || "—")}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={user.isActive ? "Active" : "Inactive"} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(user.createdDate).toLocaleDateString(language === "ar" ? "ar-SA" : "en-US")}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/users/${user.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              {language === "ar" ? "عرض" : "View"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => router.push(`/users/${user.id}/edit`)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              {language === "ar" ? "تعديل" : "Edit"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleResetPassword(user)}>
                              <KeyRound className="mr-2 h-4 w-4" />
                              {language === "ar" ? "إعادة تعيين كلمة المرور" : "Reset Password"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setUserToDelete(user)
                                setDeleteDialogOpen(true)
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              {language === "ar" ? "حذف" : "Delete"}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{language === "ar" ? "حذف المستخدم" : "Delete User"}</AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ar"
                ? `هل أنت متأكد من حذف "${userToDelete?.fullNameEn}"؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to delete "${userToDelete?.fullNameEn}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === "ar" ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive text-destructive-foreground">
              {language === "ar" ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
