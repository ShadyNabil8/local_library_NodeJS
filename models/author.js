const mongoose = require('mongoose')
const { DateTime } = require('luxon');

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
    first_name: { type: String, require: true, maxLength: 100 },
    family_name: { type: String, require: true, maxLength: 100 },
    date_of_birth: { type: Date, required: false },
    date_of_death: { type: Date, required: false }
});

AuthorSchema.virtual('name').get(function () {
    // We don't use an arrow function as we'll need the this object
    if (this.first_name && this.family_name) {
        return `${this.first_name} ${this.family_name}`;
    }
    return "";
});

AuthorSchema.virtual('url').get(function () {
    return `/catalog/author/${this._id}`;
});

AuthorSchema.virtual('date_of_birth_formatted').get(function () {
    // format 'YYYY-MM-DD'
    return this.date_of_birth ? DateTime.fromJSDate(this.date_of_birth).toISODate() : '';
});

AuthorSchema.virtual('date_of_death_formatted').get(function () {
    // format 'YYYY-MM-DD'
    return this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toISODate() : '';
});
module.exports = mongoose.model("Author", AuthorSchema);