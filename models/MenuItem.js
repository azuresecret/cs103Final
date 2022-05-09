'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const Mixed = Schema.Types.Mixed;

var ItemSchema = Schema( {
  itemId: Number,
  name: String,
  price: Number,
  ingredients: String,
});

module.exports = mongoose.model( 'Item', ItemSchema );
