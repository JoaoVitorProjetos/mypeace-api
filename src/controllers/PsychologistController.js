

exports.module = class PsychologistController{

    //-----------------------------Register----------------------------------

    async register(req, res){
        console.log('ower')
            
        const {name, cpf, registerNumber, phone, email, password, confirmpassword} = req.body

        //Validations

        if(!name || !email || !password || !confirmpassword || !phone || !cpf || !registerNumber){
            return res.status(422).json({ msg: "something is null..."})
        }

        if(password != confirmpassword){
            return res.status(422).json({ msg: "the passwords doesn't match"  })
        }

        const psychologistExists = await Psychologist.findOne({ email: email })

        if(psychologistExists){
            return res.status(422).json({ msg: "this email is already in use" })
        }

        const salt = await bcrypt.genSalt(12)
        const passwordHash = await bcrypt.hash(password, salt)

        const psychologist = new Psychologist({
            name, 
            cpf, 
            registerNumber, 
            phone, 
            email, 
            password: passwordHash
        })

        try{

            await psychologist.save()

            res.status(201).json({ msg: "Psychologist registered"})

        } catch(err){

            console.log(err)

            res.status(500).json({ msg: "Server error, contact the support"})
        }
}    
}
