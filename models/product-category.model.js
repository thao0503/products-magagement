const mongoose = require("mongoose")
const slug = require('mongoose-slug-updater')
mongoose.plugin(slug)

const productCategorySchema = new mongoose.Schema({
    title: String,
    parent_id: {
        type: String,
        default: ""
    },
    description: String,
    thumbnail: String,
    status: String,
    position: Number,
    createdBy: {
        account_id: String,
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    updatedBy: [
        {
            account_id: String,
            updatedAt: Date
        }
    ],
    deleted: {
        type: Boolean,
        default: false
    },
    deletedAt: Date,
    deletedBy: {
        account_id: String,
        deletedAt: Date
    },
    slug: { 
        type: String, 
        slug: "title",
        unique: true 
    }
});

const ProductCategory = mongoose.model('ProductCategory', productCategorySchema, "products-category");

module.exports = ProductCategory;