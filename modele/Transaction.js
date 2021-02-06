const mongoose = require('mongoose');


const transactionSchema = mongoose.Schema({
    intitule:String,
    montant:Number,
    utilisateur:{type: mongoose.Schema.Types.ObjectId, ref:"Utilisateur"},
    salon:{type: mongoose.Schema.Types.ObjectId, ref:"Salon"},
    dateTransaction: {type:Date, default:Date.now},
})

transactionSchema.statics.getNewTransaction = function(){
    return new this;
}

module.exports={
    model:mongoose.model('Transaction', transactionSchema)
}