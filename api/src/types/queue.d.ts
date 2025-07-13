export interface CreatePostJobPayload {
  authorId: string;
  title: string | null;
  text: string | null;
  files: Express.Multer.File[];
}
export interface DeletePostJobPayload {
  postId: string;
}

export interface NotifyFollowersJobPayload {
  authorId: string;
  postId: string;
}
