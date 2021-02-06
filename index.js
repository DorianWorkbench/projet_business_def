const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');

mongoose.connect('mongodb://admin:test@localhost:27017/business?authSource=admin', 
    {useNewUrlParser: true, useUnifiedTopology: true}).then(()=>{
        console.log('connecté');
    }).catch((err)=>{
        console.log("erreur");
        console.log(err);
    });
    
app.use(bodyParser.json());

app.use(require('./controller/salonRoutes'));
app.use(require('./controller/utilisateurRoutes'));
app.use(require('./controller/transactionRoutes'));
app.use(require('./controller/remboursementRoutes'));

app.listen(3000, ()=>{
    console.log("SERVER ON");
});