import mongoose, { ValidatorProps } from "mongoose";
import { validatePhoneNumber } from "../utils/validatePhoneNumber.js";
const Schema = mongoose.Schema;

const UserSchema = mongoose.model(
	"UserSchema",
	new Schema(
		{
			_id: {
				type: String,
				required: [true, "_id is required for user"]
			},
			name: {
				type: String,
				required: [true, "Name is required for user"]
			},
			email: {
				type: String,
				required: [true, "Email is required for user"]
			},
			mobile: {
				type: String,
				required: [true, "Mobile no is required for user"],
				validate: {
					validator: validatePhoneNumber,
					message: (props: ValidatorProps) => `${props.value} is not a valid phone no`
				}
			}
		},
		{ _id: false, id: false }
	)
);

export { UserSchema };
