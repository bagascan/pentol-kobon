const mongoose = require('mongoose');

const ingredientSchema = mongoose.Schema(
  {
    user: {
      // Owner yang membuat definisi bahan baku ini
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    name: {
      type: String,
      required: true,
    },
    unit: {
      // Satuan bahan baku, misal: kg, gr, liter, pcs
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Ingredient', ingredientSchema);