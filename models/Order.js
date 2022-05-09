'use strict';
const mongoose = require( 'mongoose' );
const Schema = mongoose.Schema;
const Mixed = Schema.Types.Mixed;

var orderSchema = Schema( {
  userName: String, // the admin user name that the order belongs to .
  timeStamp: Mixed,
  customerPhone: String,
  completed: Boolean,
  orderContent: [{ itemId: Number, quantity: Number, itemName: String }],
  orderTotal: Number,
});

module.exports = mongoose.model( 'Order', orderSchema );
