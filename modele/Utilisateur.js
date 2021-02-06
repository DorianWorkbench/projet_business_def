const mongoose = require('mongoose');

const utilisateurSchema = mongoose.Schema({
    nom:String,
    prenom:String,
    salon: [{type: mongoose.Schema.Types.ObjectId}]
})

utilisateurSchema.statics.getNewUtilisateur= function(){
    return new this;
}

module.exports={
    model:mongoose.model('Utilisateur', utilisateurSchema)
}