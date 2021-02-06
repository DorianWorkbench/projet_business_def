const express = require('express');
const router = express.Router();
const async = require('async');

const util = require('../modele/Utilisateur').model;
const salon = require('../modele/Salon').model;
const Transaction = require('../modele/Transaction').model;

router.route('/utilisateur/addUtilisateur')
    .post((req, res)=>{
        async.waterfall([
            function verifChamps(callback){
                if(!req.body.nom){
                    return callback("nom-not-set");
                }else if(!req.body.prenom){
                    return callback("prenom-not-set");
                }
                return callback(null);
            },
            function utilisateurExiste(callback){
                util.findOne({nom:req.body.nom, prenom:req.body.prenom}).then((utilisateur)=>{
                    if(!utilisateur){
                        return callback(null);
                    }else{
                        return callback("utilisateur-existe");
                    }
                })
            },
            function ajoutUtilisateur(callback){
                const utilisateur = util.getNewUtilisateur();

                utilisateur.nom = req.body.nom;
                utilisateur.prenom = req.body.prenom;
        
                utilisateur.save().then((utilisateur)=>{
                    return callback(null, utilisateur);
                }).catch((err)=>{
                    return callback(err);
                });
            }
        ],function result(err, result){
            if(err){
                return res.json({success:false, err:err});
            }
            return res.json({success:true, result:result});
        });
    });

router.route('/utilisateur/rejoindreSalon')
    .post((req, res)=>{
        async.waterfall([
            function utilisateurExiste(callback){
                util.findOne({_id:req.body.utilisateur.id}).then((utilisateur)=>{
                    if(!utilisateur){
                        return callback("utilisateur-not-exist");
                    }
                    return callback(null, utilisateur);
                })
            },
            function rechercheSalonExiste(utilisateur, callback){
                salon.findOne({_id:req.body.salon.id}).then((salon)=>{
                    if(!salon){
                        return callback("salon-not-exist");
                    }
                    return callback(null, salon, utilisateur);
                })
            },
            function utilisateurDansSalon(salon, utilisateur, callback){
                var test = false;

                for (const utilSalon of salon.utilisateur) {
                    if(utilSalon.toString() === req.body.utilisateur.id){
                        test = true;
                    }    
                }
                if(test === true){
                    return callback("utilisteur-already-here");
                }
                else{
                    return callback(null, salon, utilisateur);
                }
            },
            function ajoutUtilisateurSalon(salon, utilisateur, callback){
                salon.utilisateur.push(req.body.utilisateur.id);
                
                utilisateur.salon.push(salon._id);
                utilisateur.save();

                // salon.save().then((salon)=>{
                //     return callback(null, salon, utilisateur);
                // }).catch((err)=>{
                //     return callback(err);
                // })
                return callback(null, salon, utilisateur);
            },
            function ajoutFakeTransaction(salon, utilisateur, callback){
                var transactionFake = Transaction.getNewTransaction();
                
                transactionFake.intitule = "fake";
                transactionFake.montant = 0;
                transactionFake.utilisateur = utilisateur._id;
                
                transactionFake.save();

                salon.transaction.push(transactionFake._id);

                salon.save().then((salon)=>{
                    return callback(null, salon);
                })
            }
        ], function result(err, result){
            if(err){
                return res.json({success:false, err:err});
            }
            return res.json({success:true, result:result});
        })
      
    });


module.exports = router;