const mongoose = require("mongoose")
const Schema = mongoose.Schema
mongoose.Promise = global.Promise

const themeSchema = new Schema(
  {
    title: {
      type: String,
      unique: true,
      required: "Please supply a name theme",
    },
    questions: {
      type: Object,
      required: "Please supply questions",
    },
  },
  { timestamps: true, toJSON: { virtuals: true } }
)

module.exports = mongoose.model("Theme", themeSchema)
