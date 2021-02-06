const mongoose = require('mongoose');


const remboursementSchema = mongoose.Schema({
    utilisateur:{type: mongoose.Schema.Types.ObjectId, ref:"Utilisateur"},
    salon:{type: mongoose.Schema.Types.ObjectId, ref:"Salon"},
    montant: Number
})

remboursementSchema.statics.getNewRemboursement = function(){
    return new this;
}

module.exports={
    model: mongoose.model('Remboursement', remboursementSchema)
}