const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
    first_name: { type: String, require: true, maxLength: 100 },
    family_name: { type: String, require: true, maxLength: 100 },
    date_of_birth: { type: Date },
    date_of_death: { type: Date }
});

AuthorSchema.virtual('name').get(function(){
    // We don't use an arrow function as we'll need the this object
    if(this.first_name && this.family_name){
        return `${this.first_name} ${this.family_name}`;
    }
    return "";
});

AuthorSchema.virtual('url').get(function(){
    return `/catalog/author/${this._id}`;
});

module.exports = mongoose.model("Author",AuthorSchema);