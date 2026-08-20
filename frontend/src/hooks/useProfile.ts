import { useMutation } from "@tanstack/react-query"
import { usersApi } from "@/api/usersApi"
import type { UpdateUserRequest } from "@/types"

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (data: UpdateUserRequest) => usersApi.updateMe(data),
  })
}

export function useUploadAvatar() {
  return useMutation({
    mutationFn: (file: File) => usersApi.uploadAvatar(file),
  })
}
