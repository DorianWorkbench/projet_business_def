const express = require('express');
const router = express.Router();
const salon = require('../modele/Salon').model;
const util = require('../modele/Utilisateur').model;
const async = require('async');
const Transaction = require('../modele/Transaction').model;


router.route('/salon/addSalon')
    .post((req, res)=>{
        async.waterfall([
           function verifSalon(callback){
               salon.findOne({titre:req.body.salon.titre}).then((salon)=>{
                   if(!salon){
                       return callback(null);
                   }
                   return callback("salon-existe");
               })
           },
           function creationSalon(callback){
                const monSalon = salon.getNewSalon();

                monSalon.titre = req.body.salon.titre;
                monSalon.administrateur= req.body.utilisateur.id;
                monSalon.utilisateur.push(req.body.utilisateur.id);

                monSalon.save().then((salon)=>{
                    return callback(null, salon);
                })
            },
            function ajoutDuSalonPourUtil(salon, callback){
                util.findOne({_id:req.body.utilisateur.id}).then((utilisateur)=>{
                    utilisateur.salon.push(salon._id);
                    utilisateur.save().then((utili)=>{
                        return callback(null, salon, utili);
                    })
                }).catch((err)=>{
                    return callback(err);
                });
            },
            function ajoutTransacFakeSalon(salon, utilisateur, callback){
                var fakeTransaction = Transaction.getNewTransaction();

                fakeTransaction.intitule ="fake";
                fakeTransaction.montant = 0;
                fakeTransaction.utilisateur = utilisateur._id;
                fakeTransaction.salon = salon._id;

                fakeTransaction.save();

                salon.transaction.push(fakeTransaction._id);
                salon.save().then((salon)=>{
                    return callback(null, salon);
                });
            }
        ], function result(err, result){
            if(err){
                return res.json({success:false, err:err});
            }
            return res.json({success:true, result:result});
        });
    });



module.exports=router;