import mongoose from "mongoose";

export function enrichRawIds(objectIds: (string | mongoose.Types.ObjectId)[]) {
  const uniqueIds = Array.from(new Set(objectIds.filter(id => mongoose.Types.ObjectId.isValid(id)).map(id => id.toString())));
  return uniqueIds.map(idStr => new mongoose.Types.ObjectId(idStr)).sort((a, b) => a.toString().localeCompare(b.toString()));
}
