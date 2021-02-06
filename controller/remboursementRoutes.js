const express = require('express');
const router = express.Router();
const async = require('async');

const util = require('../modele/Utilisateur').model;
const salon = require('../modele/Salon').model;
const transac = require('../modele/Transaction').model;
const remboursement = require('../modele/Remboursement').model;

var recupListeTransacUtil = function(salon, listeUtilisateur, i, next){
    if(salon.utilisateur.length>i){
        transac.find({utilisateur:salon.utilisateur[i]}).then((transactions)=>{
            listeUtilisateur.push(transactions);
            i++;
            return recupListeTransacUtil(salon, listeUtilisateur, i, next);
        })
    }else{
        return next(null, listeUtilisateur, salon);
    }
}

var preparationRemb = function(listeDeRemboursement, moyenne, salon, sommeParUtilisateur, i, next){
    
    if(sommeParUtilisateur.length>i){

        if(sommeParUtilisateur[i].resultat<moyenne){
            var rembours = {
                montant: moyenne-sommeParUtilisateur[i].resultat,
                utilisateur: sommeParUtilisateur[i].utilisateur,
                salon: salon._id
            }
            i++;
            listeDeRemboursement.push(rembours);

            return preparationRemb(listeDeRemboursement, moyenne, salon, sommeParUtilisateur, i, next);
        }else{
            i++;
            return preparationRemb(listeDeRemboursement, moyenne, salon, sommeParUtilisateur, i, next);
        }
    }else{
        return next(null, listeDeRemboursement, salon);
    }
};

var ajoutRemboursement = function(listeDePersonneEnDessousDeLaMoyenne, salon, i, next){
    if(listeDePersonneEnDessousDeLaMoyenne.length>i){
        const rembours = remboursement.getNewRemboursement();

        rembours.utilisateur = listeDePersonneEnDessousDeLaMoyenne[i].utilisateur;
        rembours.montant = listeDePersonneEnDessousDeLaMoyenne[i].montant;
        rembours.salon = listeDePersonneEnDessousDeLaMoyenne[i].salon;   
        
        rembours.save().then((rembours)=>{
            salon.remboursement.push(rembours._id);
            i++;
            return ajoutRemboursement(listeDePersonneEnDessousDeLaMoyenne, salon, i, next);
        }).catch((err)=>{
            return next(err);
        }); 
    }else{
        return next(null, salon);
    }
}

router.route("/remboursement/remboursementSalon")
    .get((req, res)=>{
        async.waterfall([
            function verifChamp(callback){
                if(!req.body.salon.id){
                    return callback("idSalon-not-set");
                }
                return callback(null);
            },
            function recupSalon(callback){
                salon.findOne({_id:req.body.salon.id}).then((salon)=>{
                    if(!salon){
                        return callback("salon-not-exist");
                    }
                    return callback(null, salon);
                })
            },
            function recupTransacSalon(salon, callback){     
                var listeUtilisateur = [];
                return recupListeTransacUtil(salon, listeUtilisateur, 0, callback);
            },
            // A voir pour faire une fonction recursive
            function sommeTransacPersonne(listeUtilisateur, salon, callback){
                
                var sommeParUtilisateur = [];
                var utilisateur = '';

                for (const transactions of listeUtilisateur) {
                    var resultat = 0;

                    for (const transaction of transactions) {
                        resultat += transaction.montant;
                        utilisateur = transaction.utilisateur;
                    }
                    sommeParUtilisateur.push({
                        resultat:resultat,
                        utilisateur: utilisateur
                    });
                }
                // console.log(sommeParUtilisateur);
                return callback(null, sommeParUtilisateur, salon);
            },
            function sommeRemboursement(sommeParUtilisateur, salon, callback){
                var result = 0;

                for (const somme of sommeParUtilisateur) {
                    result+=somme.resultat;
                }
                return callback(null, result, salon, sommeParUtilisateur);
            },
            function calculMoyenne(result, salon, sommeParUtilisateur, callback){
                var moyenne = result/salon.utilisateur.length;
                return callback(null, moyenne, salon, sommeParUtilisateur);
            },
            function prepRemb(moyenne, salon, sommeParUtilisateur, callback){
                var listeDeRemboursement= [];

                return preparationRemb(listeDeRemboursement, moyenne, salon, sommeParUtilisateur, 0, callback);
            
            },function ajoutRemb(listeDePersonneEnDessousDeLaMoyenne, salon, callback){
                return ajoutRemboursement(listeDePersonneEnDessousDeLaMoyenne, salon, 0, callback);
            },
            function ajoutRembSalon(salon, callback){
                salon.save().then((salon)=>{
                    return callback(null, salon.remboursement);
                });
            }
        ], function result(err, result){
            if(err){
                return res.json({success:false, err:err});
            }
            return res.json({success: true, result:result});
        });
    })

module.exports = router;