export interface DeletePostCleanupJobPayload {
  postId: string;
}

export interface DeleteUserCleanupJobPayload {
  userId: string;
}

export interface NotifyFollowersJobPayload {
  authorId: string;
  postId: string;
}
