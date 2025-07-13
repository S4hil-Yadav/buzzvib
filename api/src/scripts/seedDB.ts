import { faker } from "@faker-js/faker";
import mongoose from "mongoose";
import UserModel from "@/models/user.model.js";
import PostModel from "@/models/post.model.js";
import CommentModel from "@/models/comment.model.js";
import FollowModel from "@/models/follow.model.js";
import NotificationModel from "@/models/notification.model.js";
import LikeModel from "@/models/reaction.model.js";
import SaveModel from "@/models/save.model.js";
import SaveCollectionModel from "@/models/saveCollection.model.js";

// --- Constants ---
const TOTAL_USERS = 100;
const POSTS_PER_USER = 3;
const FOLLOW_PER_USER = 10;
const COMMENTS_PER_POST = 5;
const REACTIONS_PER_POST = 5;
const SAVE_COLLECTIONS_PER_USER = 2;

// --- Utility ---
const randomSubset = <T>(arr: T[], max: number) => faker.helpers.arrayElements(arr, Math.min(max, arr.length));

// --- Start ---
async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);

  // Wipe existing
  await Promise.all([
    UserModel.deleteMany({ _id: { $ne: new mongoose.Types.ObjectId("6855352a7f67c819b1a17f3f") } }),
    PostModel.deleteMany({}),
    CommentModel.deleteMany({}),
    FollowModel.deleteMany({}),
    NotificationModel.deleteMany({}),
    LikeModel.deleteMany({}),
    SaveModel.deleteMany({}),
    SaveCollectionModel.deleteMany({}),
  ]);

  console.log("Cleared all collections.");

  // --- Seed Users ---
  const users = [];
  for (let i = 0; i < TOTAL_USERS; i++) {
    users.push({
      email: faker.internet.email(),
      username: (
        faker.internet
          .username()
          .toLowerCase()
          .replace(/[^a-z0-9_]/gi, "") + i
      ).slice(0, 20),
      fullname: faker.person.fullName().split(" ").slice(0, 5).join(" ").slice(0, 30),
      profilePicture: faker.image.avatar(),
      password: "hashed_password_here", // Replace with actual hash if needed
      bio: faker.lorem.sentence(),
      count: { followers: 0, following: 0, posts: 0 },
      privacy: {
        showLikes: true,
        account: { visibility: "public", searchable: true, taggable: true },
      },
      profile: { location: faker.location.city(), website: faker.internet.url() },
      preferences: { darkMode: false, language: "en" },
      moderation: { isBanned: false, banReason: "" },
      verified: { profile: faker.datatype.boolean(), email: true },
    });
  }

  const createdUsers = await UserModel.insertMany(users);
  const userIds = createdUsers.map(u => u._id);

  console.log("Created users:", createdUsers.length);

  // --- Seed Follows ---
  const follows: any[] = [];

  for (const user of userIds) {
    const targets = randomSubset(
      userIds.filter(id => !id.equals(user)),
      FOLLOW_PER_USER
    );
    for (const target of targets) {
      follows.push({
        follower: user,
        following: target,
        status: "accepted",
        seenAt: null,
      });
    }
  }

  await FollowModel.insertMany(follows);
  console.log("Created follows:", follows.length);

  // --- Seed Posts ---
  const posts: any[] = [];
  for (const user of userIds) {
    for (let i = 0; i < POSTS_PER_USER; i++) {
      posts.push({
        author: user,
        title: faker.lorem.words(3),
        text: faker.lorem.paragraph(),
        media: [],
        hashtags: [],
        count: { reactions: { like: 0, dislike: 0 }, comments: 0 },
        deletedAt: null,
      });
    }
  }

  const createdPosts = await PostModel.insertMany(posts);
  const postIds = createdPosts.map(p => p._id);

  console.log("Created posts:", posts.length);

  // --- Seed Comments ---
  const comments: any[] = [];

  for (const post of postIds) {
    const postComments = randomSubset(userIds, COMMENTS_PER_POST).map(userId => ({
      commentor: userId,
      text: faker.lorem.sentence(),
      post,
      media: [],
      parent: null,
      count: { reactions: { like: 0, dislike: 0 }, replies: 0 },
      deletedAt: null,
    }));
    comments.push(...postComments);
  }

  await CommentModel.insertMany(comments);
  console.log("Created comments:", comments.length);

  // --- Seed Reactions ---
  const likes: any[] = [];

  for (const post of postIds) {
    const reactors = randomSubset(userIds, REACTIONS_PER_POST);
    for (const userId of reactors) {
      likes.push({
        user: userId,
        target: { _id: post, type: "Post" },
        type: faker.helpers.arrayElement(["like", "dislike"]),
      });
    }
  }

  await LikeModel.insertMany(likes);
  console.log("Created reactions:", likes.length);

  // --- Seed Save Collections + Saves ---
  const collections: any[] = [];
  const saves: any[] = [];

  for (const userId of userIds) {
    for (let i = 0; i < SAVE_COLLECTIONS_PER_USER; i++) {
      collections.push({
        user: userId,
        name: faker.word.noun() + i,
      });
    }
  }

  const createdCollections = await SaveCollectionModel.insertMany(collections);
  console.log("Created save collections:", createdCollections.length);

  for (const userId of userIds) {
    const savedPosts = randomSubset(postIds, 5);
    const userCollections = createdCollections.filter(c => c.user.equals(userId));
    for (const postId of savedPosts) {
      saves.push({
        user: userId,
        target: { _id: postId, type: "Post" },
        saveCollection: faker.helpers.arrayElement(userCollections)?._id ?? null,
      });
    }
  }

  await SaveModel.insertMany(saves);
  console.log("Created saves:", saves.length);

  // --- Done ---
  console.log("✅ Database seeding complete.");
  await mongoose.disconnect();
}

seed().catch(err => {
  console.error("❌ Seeding failed:", err);
  process.exit(1);
});
