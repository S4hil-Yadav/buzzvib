export interface User {
  _id: string;
  username: string;
  fullname: string;
  profilePicture: {
    originalUrl: string;
    displayUrl: string;
  } | null;
  verified: { profile: boolean };
}

export interface ProfileUser extends User {
  privacy: {
    showLikes: boolean;
    account: { visibility: "public" | "private" };
  };
  profile: {
    location: string;
    website: string;
  };
  count: { followers: number; following: number; posts: number };
  bio: string | null;
}

export interface AuthUser extends ProfileUser {
  email: string;
  privacy: {
    showLikes: boolean;
    account: { visibility: "public" | "private"; searchable: boolean; taggable: boolean };
  };
  preferences: {
    darkMode: boolean;
    language: string;
  };
  verified: { profile: boolean; email: boolean };
}

export interface UserPage {
  users: User[];
  nextPageParam: { _id: string; createdAt: string } | null;
}
