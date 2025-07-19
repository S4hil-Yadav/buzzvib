import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiClient } from "@/lib/axios";
import type { AuthUser, ProfileUser } from "@/types";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { persistor, type AppDispatch } from "@/redux/store.ts";

export function useUpdateProfileMutation(options?: { setUploadProgress?: React.Dispatch<React.SetStateAction<number>> }) {
  const location = useLocation();

  const queryClient = useQueryClient();
  const authUser = queryClient.getQueryData<AuthUser>(["authUser"])!;

  return useMutation<AuthUser, Error, { formData: FormData }>({
    mutationFn: ({ formData }) =>
      apiClient
        .patch<AuthUser>("/users/me/profile", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: e => {
            if (options?.setUploadProgress) {
              options.setUploadProgress(e.total ? Math.round((e.loaded * 100) / e.total) : 0);
            }
          },
        })
        .then(res => res.data),

    onSuccess: async newUser => {
      queryClient.setQueryData<AuthUser>(["authUser"], newUser);

      const oldPrefix = ["user", authUser.username];
      const queries = queryClient.getQueryCache().findAll({ queryKey: oldPrefix, exact: false });

      queries.forEach(query => {
        const newKey = ["user", newUser.username, ...query.queryKey.slice(oldPrefix.length)];
        queryClient.setQueryData(newKey, query.state.data);
      });

      const { fullname, username, profilePicture } = newUser;
      queryClient.setQueryData<ProfileUser>(
        ["user", newUser.username],
        prev => prev && { ...prev, fullname, username, profilePicture }
      );

      toast.success("Profile updated");

      if (location.state?.backgroundLocation?.pathname === `/profile/${authUser.username}`) {
        location.state.backgroundLocation.pathname = `/profile/${newUser.username}`;
      }

      queryClient.removeQueries({ queryKey: oldPrefix, exact: false });
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useChangeEmailMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { email: AuthUser["email"] }>({
    mutationFn: ({ email }) => apiClient.patch<void>("/users/me/email", { email }).then(res => res.data),

    onSuccess: (_, { email }) => {
      queryClient.setQueryData<AuthUser>(
        ["authUser"],
        authUser => authUser && { ...authUser, email, verified: { ...authUser.verified, email: false } }
      );
      toast.success("Email changed");
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useRequestEmailVerificationMutation() {
  return useMutation<void, Error>({
    mutationFn: () => apiClient.post<void>("/users/me/email-verification").then(res => res.data),

    onError: error => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useVerifyEmailOTPMutation() {
  const queryClient = useQueryClient();

  return useMutation<void, Error, { otp: string }>({
    mutationFn: ({ otp }) => apiClient.put<void>("/users/me/email-verification", { otp }).then(res => res.data),

    onSuccess: () => {
      toast.success("Email verified");
      queryClient.setQueryData<AuthUser>(
        ["authUser"],
        authUser => authUser && { ...authUser, verified: { ...authUser.verified, email: true } }
      );
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation<void, Error, { oldPassword: string; newPassword: string }>({
    mutationFn: ({ oldPassword, newPassword }) =>
      apiClient.patch<void>("/users/me/password", { oldPassword, newPassword }).then(res => res.data),

    onError: error => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data.message ?? "Something went wrong");
      }
    },

    onSuccess: () => toast.success("Password Changed"),
  });
}

export function useUpdatePrivacySettingsMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    void,
    Error,
    {
      visibility?: AuthUser["privacy"]["account"]["visibility"];
      showLikes?: boolean;
      taggable?: boolean;
      searchable?: boolean;
    }
  >({
    mutationFn: ({ visibility = null, showLikes = null, taggable = null, searchable = null }) =>
      apiClient.patch<void>("/users/me/privacy-settings", { visibility, showLikes, taggable, searchable }).then(res => res.data),

    onSuccess: (_, { visibility, showLikes, taggable, searchable }) => {
      queryClient.setQueryData<AuthUser>(
        ["authUser"],
        authUser =>
          authUser && {
            ...authUser,
            privacy: {
              ...authUser.privacy,
              showLikes: showLikes ?? authUser.privacy.showLikes,
              account: {
                ...authUser.privacy.account,
                visibility: visibility ?? authUser.privacy.account.visibility,
                searchable: searchable ?? authUser.privacy.account.searchable,
                taggable: taggable ?? authUser.privacy.account.taggable,
              },
            },
          }
      );
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data.message ?? "Something went wrong");
      }
    },
  });
}

export function useDeleteAccountMutation() {
  const queryClient = useQueryClient();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  return useMutation<void, Error, { password: string }>({
    mutationFn: ({ password }) => apiClient.delete<void>("/users/me", { data: { password } }).then(res => res.data),

    onSuccess: () => {
      queryClient.clear();
      localStorage.clear();
      dispatch({ type: "RESET_STORE" });
      persistor.purge();

      toast.success("Account deleted");
      navigate("/auth");
    },

    onError: error => {
      if (axios.isAxiosError(error)) {
        toast.error(error.response?.data.message ?? "Something went wrong");
      }
    },
  });
}
