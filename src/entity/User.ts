import { model, Schema } from "mongoose";
import { IUser } from "../types";

const UserSchema = new Schema<IUser>({
	name: { type: String, required: true },
	age: { type: Number, required: true, min: 0, max: 150 },
}, { timestamps: true })

export const User = model<IUser>('User', UserSchema)