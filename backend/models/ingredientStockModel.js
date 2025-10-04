const mongoose = require('mongoose');

const ingredientStockSchema = mongoose.Schema(
  {
    ingredient: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Ingredient',
    },
    outlet: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Outlet',
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    averageCostPrice: {
      // Harga beli rata-rata per unit
      type: Number,
      required: true,
      default: 0,
    },
  },
  { timestamps: true }
);

ingredientStockSchema.index({ ingredient: 1, outlet: 1 }, { unique: true });

module.exports = mongoose.model('IngredientStock', ingredientStockSchema);