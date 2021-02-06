const express = require("express");
const util = require("../modele/Utilisateur").model;
const salon = require("../modele/Salon").model;
const transaction = require("../modele/Transaction").model;

const router = express.Router();
const async = require("async");

router.route("/transaction/add")
    .post((req, res)=>{
        async.waterfall([
            function verifChamp(callback){
                if(!req.body.utilisateur.id){
                    return callback("idUtilisateur-not-set");
                }else if(!req.body.salon.id){
                    return callback("idSalon-not-set");
                }
                else if(!req.body.transaction.intitule){
                    return callback("intitule-not-set");
                }
                else if(!req.body.transaction.montant){
                    return callback("montant-not-set");
                }
                return callback(null);
            },
            function verifUtilExist(callback){
                util.findOne({_id: req.body.utilisateur.id}).then((util)=>{
                    if(!util){
                        return callback("utilisateur-not-exist");
                    }
                    return callback(null, util._id);
                }).catch((err)=>{
                    return callback(err);
                })
            },
            function verifSalonExist(idUtil, callback){
                salon.findOne({_id:req.body.salon.id}).then((salon)=>{
                    if(!salon){
                        return callback("salon-not-exist");
                    }
                    return callback(null, idUtil, salon);
                })
            },
            function addTransaction(idUtil, salon, callback){
                
                const transactionUtil = transaction.getNewTransaction();
                
                transactionUtil.intitule = req.body.transaction.intitule;
                transactionUtil.montant = req.body.transaction.montant;
                transactionUtil.utilisateur = idUtil;
                transactionUtil.salon = salon._id;

                transactionUtil.save().then((transaction)=>{
                    return callback(null, transaction, salon);
                }).catch((err)=>{
                    return callback(err);
                })
            }, function addTransactionSalon(transaction, salon, callback){
                
                salon.transaction.push(transaction._id);
                salon.montantTotal+=transaction.montant;
                
                salon.save().then(()=>{
                    return callback(null, transaction);
                }).catch((err)=>{
                    return callback(err);
                })
            }
        ], function result(err, result){
            if(err){
                return res.json({success:false, err:err});
            }
            return res.json({success: true, result:result});
        });
    });

router.route("/transaction/delete")
    .delete((req, res)=>{
        async.waterfall([
            function verifChamp(callback){
                if(!req.body.utilisateur.id){
                    return callback("idUtilisateur-not-set");
                }else if(!req.body.salon.id){
                    return callback("idSalon-not-set");
                }else if(!req.body.transaction.id){
                    return callback("idTransaction-not-set");
                }
                return callback(null);
            },
            function verifUtilExist(callback){
                util.findOne({_id:req.body.utilisateur.id}).then((util)=>{
                    if(!util){
                        return callback("util-not-exist")
                    }
                    return callback(null);
                })
            },
            function verifUtilExisteDansSalon(callback){
                salon.findOne({_id:req.body.salon.id, utilisateur:req.body.utilisateur.id}).then((salon)=>{
                    if(!salon){
                        return callback("utilisateur-not-in-salon");
                    }
                    return callback(null, salon);
                })
            },
            function verifTransactionUser(salon, callback){
                transaction.findOne({_id:req.body.transaction.id, utilisateur:req.body.utilisateur.id}).then((transaction)=>{
                    if(!transaction){
                        return callback("transaction-not-exist");
                    }
                    return callback(null, transaction, salon);
                })
            },
            function verifTransactionSalon(transaction, salon, callback){
                var test = false;

                for (const transac of salon.transaction) {
                    
                    if(transac.toString() === transaction._id.toString()){
                        console.log("true");
                        test = true;
                    }
                }
                if(test === true){
                    return callback(null, transaction, salon);
                }else if( test === false){
                    return callback("transaction-inexistante");
                }
            },
            function verifStatusSalon(transaction, salon, callback){
                if(salon.status === "decompte"){
                    return callback("salon-decompte");
                }else{
                    return callback(null, transaction, salon);
                }
            },
            function removeTransactionSalon(transaction, salon, callback){

                salon.transaction.splice((salon.transaction.findIndex((element)=>element.toString() === transaction._id.toString())), 1);
                
                salon.save().then((salon)=>{
                    return callback(null, salon, transaction);
                })
            },
            function reduireMontantTotalSalon(salon, transaction, callback){
                salon.montantTotal = salon.montantTotal - transaction.montant;

                salon.save().then((salon)=>{
                    return callback(null, salon);
                })
            },
            function removeTransaction(salon, callback){
                transaction.remove({_id:req.body.transaction.id}).then(()=>{
                    return callback(null, salon.transaction);
                }).catch((err)=>{
                    return callback(err);
                })
            }
            
        ], function result(err, result){
            if(err){
                return res.json({success: false, err:err});
            }
            return res.json({success:true, result: result});
        });
    })

module.exports = router;