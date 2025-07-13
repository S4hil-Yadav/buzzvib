export interface Reaction {
  _id: string;
  createdAt: Date;
  type: "like" | "dislike" | null;
}
