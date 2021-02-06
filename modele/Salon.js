const mongoose = require('mongoose');

const salonSchema = mongoose.Schema({
    titre: String,
    utilisateur:[{type: mongoose.Schema.Types.ObjectId, ref:"Utilisateur"}],
    administrateur:{type: mongoose.Schema.Types.ObjectId, ref:"Utilisateur"},
    transaction:[{type: mongoose.Schema.Types.ObjectId, ref:"Transaction"}],
    montantTotal: {type:Number, default:0},
    remboursement: [{type: mongoose.Schema.Types.ObjectId, ref:"Remboursement"}],
    status: {type: String, default:"en cours"}
})

salonSchema.statics.getNewSalon = function(){
    return new this;
}

module.exports= {
    model: mongoose.model('Salon', salonSchema)
}