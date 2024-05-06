//-------------------------------SERVER------------------------------------

const express = require('express');
const app = express()
app.use(express.json())
require('dotenv').config()
app.use(express.urlencoded())
const bcrypt = require('bcrypt')


//----------------------------------DATABASE----------------------------------

const { MongoClient } = require('mongodb');
const dbUser = process.env.DB_USER
const dbPass = process.env.DB_PASS


const client = new MongoClient(`mongodb://mongo:${dbPass}@viaduct.proxy.rlwy.net:12488`);

client.connect().then(() => {
    console.log('db running...')
})

const db = client.db('test')

//--------------------------------PSYCHOLOGIST---------------------------------

const Psychologist = db.collection('pshycologists')

//-----------------------------Register----------------------------------

app.post('/auth/registration/psychologist', async(req, res) => {
        
    const {name, cpf, registerNumber, phone, email, password, confirmPassword} = req.body

    //Validations

    if(!name || !email || !password || !confirmPassword || !phone || !cpf || !registerNumber){
        return res.status(422).json({ msg: "something is null..."})
    }

    if(password != confirmPassword){
        return res.status(422).json({ msg: "the passwords doesn't match"  })
    }

    const psychologistExists = await Psychologist.findOne({ cpf: cpf })

    if(psychologistExists){
        return res.status(422).json({ msg: "this psychologist is already registered" })
    }

    const emailExistsPsychologists = await Psychologist.findOne({ email: email })
    const emailExistsPacients = await Pacient.findOne({ email: email })

    if(emailExistsPsychologists || emailExistsPacients){
        return res.status(422).json({ msg: "this email is already in use" })
    }

    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    try{

        
        Psychologist.insertOne({
            name, 
            cpf, 
            registerNumber, 
            phone, 
            email, 
            password: passwordHash
        })

        res.status(201).json({ msg: "Psychologist registered"})

    } catch(err){

        console.log(err)

        res.status(500).json({ msg: "Server error, contact the support"})
    }    
})


//-----------------------------Update----------------------------------



//------------------------------Delete---------------------------------



//--------------------------------PACIENT---------------------------------

const Pacient = db.collection('pacients')

//-----------------------------Register----------------------------------

app.post('/auth/registration/pacient', async(req, res) => {
        
    const {name, gender, email, phone} = req.body

    //Validations

    if(!name || !gender || !email || !phone ){
        return res.status(422).json({ msg: "something is null..."})
    }

    const emailExistsPsychologists = await Psychologist.findOne({ email: email })
    const emailExistsPacients = await Pacient.findOne({ email: email })

    if(emailExistsPsychologists || emailExistsPacients){
        return res.status(422).json({ msg: "this email is already in use" })
    }

    const password = Math.random().toString(36).substring(0, 7)

    const salt = await bcrypt.genSalt(12)
    const passwordHash = await bcrypt.hash(password, salt)

    try{
        Pacient.insertOne({
            name, 
            gender, 
            email, 
            phone,
            password: passwordHash
        })

        res.status(201).json({ msg: "Pacient registered", password: password})

    } catch(err){

        console.log(err)

        res.status(500).json({ msg: "Server error, contact the support"})
    }    
})


//-----------------------------Update----------------------------------



//------------------------------Delete---------------------------------



//------------------------------AUTHENTICATION---------------------------
const jwt = require('jsonwebtoken');

app.post('/auth/login', async (req, res) => {

    const {email, password} = req.body

    const psychologistInfo = await Psychologist.findOne({ email: email })
    const pacientInfo = await Pacient.findOne({ email: email })

    if(!psychologistInfo && !pacientInfo){
        return res.status(422).json({ msg: "user not found" })
    }

    try{
        if(psychologistInfo){
            
            const match = await bcrypt.compare(password, psychologistInfo.password);
            

            if(match){
                const token = jwt.sign(JSON.stringify(psychologistInfo), process.env.SECRET );
                res.json({ accessToken: token, type: 'psychologist', psychologistInfo });
            } else {
                res.json({ message: "Invalid Credentials" });
            }
        }else{
            const match = await bcrypt.compare(password, pacientInfo.password);
            

            if(match){
                const token = jwt.sign(JSON.stringify(pacientInfo), process.env.SECRET);
                res.json({ accessToken: token, type: 'pacient', pacientInfo });
            } else {
                res.json({ message: "Invalid Credentials" });
            }
        }
    } catch(e) {
        console.log(e)
    }
});

//--------------------------------AUTHORIZATION-----------------------------

function verifyJWT(req, res, next){
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ auth: false, message: 'No token provided.' });
    
    jwt.verify(token, process.env.SECRET, function(err, decoded) {
      if (err) return res.status(500).json({ auth: false, message: 'Failed to authenticate token.' });
      
      res.json(decoded)
      next();
    });
}

//---------------------------------SERVER--------------------------------
app.get('/', (req, res) => {
    res.send('Hey this is my API running 🥳')
  })

app.listen(3333, () => {
    console.log('Server running...')
})