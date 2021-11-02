const express = require('express');
const config = require('config');
const mongoose = require('mongoose');

const app = express();

app.use(express.json({extended: true}));

app.use('/api/auth', require('./routes/auth.routes'));

const PORT = config.get('port') || 5000;

async  function start(){
    mongoose.connect(config.get('mongoUrl'), {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, error => {
            if(error){
                console.log('Server Error ', error.message);
                process.exit(1);
            }
            app.listen(PORT, () => console.log(`App has been started on port ${PORT}...`))
        }
    );
}

start();


