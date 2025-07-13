import { clearDraft } from "@/redux/slices/postDraftSlice";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/axios";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { type AuthUser, type AuthFields, type SessionData } from "@/types";
import axios from "axios";

export function useSignupMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { userFields: AuthFields }>({
    mutationFn: ({ userFields }) => apiClient.post<void>("/auth/signup", { userFields }).then(res => res.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },

    onError: err => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useLoginMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { userFields: Pick<AuthFields, "email" | "password"> }>({
    mutationFn: ({ userFields }) => apiClient.post<void>("/auth/login", { userFields }).then(res => res.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },

    onError: err => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useGoogleAuthMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { access_token: string }>({
    mutationFn: ({ access_token }) => apiClient.post<void>("/auth/google", { access_token }).then(res => res.data),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },

    onError: err => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useLogoutMutation() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  return useMutation<void, Error>({
    mutationFn: () => apiClient.post<void>("/auth/logout").then(res => res.data),

    onSuccess: () => {
      queryClient.clear();
      toast.success("Logged out");
      dispatch(clearDraft());
      navigate("/login");
    },

    onError: err => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useRequestPasswordResetMutation() {
  return useMutation<void, Error, { email: AuthUser["email"] }>({
    mutationFn: ({ email }) => apiClient.post<void>("/auth/request-password-reset", { email }).then(res => res.data),

    onSuccess: () => toast.success("Reset link sent"),

    onError: err => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useConfirmPasswordResetMutation() {
  return useMutation<void, Error, { secret: string; newPassword: string }>({
    mutationFn: ({ secret, newPassword }) =>
      apiClient.post<void>("/auth/confirm-password-reset", { secret, newPassword }).then(res => res.data),

    onError: err => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useLogoutAllSessionsMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error>({
    mutationFn: () => apiClient.delete<void>("/auth/sessions").then(res => res.data),

    onSuccess: () => {
      queryClient.setQueryData<SessionData>(["sessions"], sessions => sessions && { ...sessions, otherSessions: [] });
    },

    onError: err => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useLogoutSessionMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { sessionId: string }>({
    mutationFn: ({ sessionId }) => apiClient.delete<void>(`/auth/sessions/${sessionId}`).then(res => res.data),

    onSuccess: (_data, { sessionId }) => {
      queryClient.setQueryData<SessionData>(
        ["sessions"],
        sessions =>
          sessions && { ...sessions, otherSessions: sessions.otherSessions.filter(session => session._id !== sessionId) }
      );
    },

    onError: err => {
      if (axios.isAxiosError(err)) {
        toast.error(err.response?.data.message ?? "Something went wrong");
      }
    },
  });
}
