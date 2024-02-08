const express = require('express');
const app = express();
const port = 8080 // Port na kterém bude aplikace běžet

const path = require('path');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const session = require('express-session');
const fs = require('fs');

// Nastavení šablonovacího enginu EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware pro zpracování formulářů
app.use(express.urlencoded({ extended: true }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/css', express.static(path.join(__dirname, 'styles/css')));


// Připojení k databázi MySQL
const connection = mysql.createConnection({
  host: '192.168.1.161', // Název nebo IP adresa serveru databáze
  user: 'david.legia', // Uživatelské heslo
  password: 'Legiatordavidor', // Heslonps 
  database: 'checklist', // Název databáze
  port: 3001
});

connection.connect();

app.use(session({
  secret: 'Č48r4kad48r4k4',
  resave: false,
  saveUninitialized: true
  }));

//inserts new data into the database
app.post('/', (req, res) => {
  const task = req.body.task;
  const datetime = req.body.datetime; // This will capture the date and time input.
  const priority = req.body.priority;

  connection.query(
    'INSERT INTO tasks (tasks, deadline, priority) VALUES (?, ?, ?)', // Include datetime
    [task, datetime, priority], // Add datetime variable
    function (error) {
      if (error) throw error;
      res.redirect('/');
    }
  );
});


app.post('/update/:id', (req, res) => {
  const taskId = req.params.id;
  const isCompleted = req.query.completed === '1'; // Ensure it's '1'

  // Update the task status in the database
  connection.query(
    'UPDATE tasks SET is_completed = ? WHERE id = ?',
    [isCompleted, taskId],
    function (error) {
      if (error) {
        console.error(error);
        res.status(500).send('Error updating task status.');
      } else {
        res.status(200).send('Task status updated.');
      }
    }
  );
});

// Displays tasks in table rows
app.get('/', (req, res) => {

  if (req.session.username === undefined){                                    //
    res.redirect('/login')                                                    //
  }                                                                           //
  console.log('Ahoj, jsi přihlášen jako ' + req.session.username);  

  connection.query('SELECT * FROM tasks', function (error, results) {
    if (error) {
      console.error(error);
      return res.status(500).send('Error retrieving tasks.');
    }

    const tasks = results;
    const todoTasks = tasks.filter((task) => task.is_completed === 0);
    const doneTasks = tasks.filter((task) => task.is_completed === 1);

    res.render('main.ejs', { todoTasks, doneTasks });
  });
});

app.get('/register',(req, res) =>{                                                          //
  res.render("register.ejs")                                                                //
});                                                                                         //
                                                                                            //
app.post('/register',(req, res) =>{                                                         //
  const { prezdivka, heslo, hesloznovu } = req.body;                                        //
                                                                                            //  
                                                                                            //
  connection.query('INSERT INTO register (uzivatelskeJmeno, heslo)VALUES (?, ?)',           //
  [prezdivka, hesloznovu],                                                                  //
  (err, result, fields) => {                                                                //
    if (err) {                                                                              //
      console.error(err);                                                                   //
      return;                                                                               //
    }                                                                                       //
    console.log(result);                                                                    //
    
  });
  res.render("login.ejs");
  
});

app.get('/login', (req, res) =>{
  res.render('login.ejs')
});

app.post('/login', (req, res) => {
  const { prezdivka, heslo } = req.body;

  // Check if username and password match in the database
  connection.query('SELECT * FROM register WHERE uzivatelskeJmeno = ? AND BINARY heslo = ?', [prezdivka, heslo], (error, results, fields) => {
    console.log(prezdivka, heslo);
    if (error) {
      console.error(error);
      res.status(500).send('Chyba při přihlášení.'); // Error handling for database query
    } else {
      if (results.length > 0) {
        req.session.authenticated = true;
        req.session.username = prezdivka;
        res.cookie('username', prezdivka,);
        res.cookie('authenticated', true,);
        res.redirect('/'); // Redirect to main page after successful login
      } else {
        res.send('Nesprávné uživatelské jméno nebo heslo.'); // Incorrect username or password
      }
    }
  });
});

app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error(err);                                                                  //
      res.redirect('/');                                                                   //
    } else {                                                                               //
      res.redirect('/login');                                                              //     
    }                                                                                      //
  });                                                                                      //
});

app.post('/delete/:id', (req, res) => {
  const taskId = req.params.id;

  // Smazat záznam z obou tabulek (To-Do Task a Done Task)
  connection.query(
    'DELETE FROM tasks WHERE id = ?',
    [taskId],
    function (error) {
      if (error) {
        console.error(error);
        res.status(500).send('Error deleting the task in the database');
      } else {
        res.status(200).send('Task deleted successfully');
      }
    }
  );
});


app.get('/tasks', (req, res) => {
  connection.query('SELECT * FROM tasks', function (error, results) {
    if (error) {
      console.error(error);
      res.status(500).json({ error: 'Error retrieving tasks.' });
    } else {
      res.status(200).json(results);
    }
  });
});

  //--------------------------------------------------------AUTO MANUÁLNÍ ZMĚNA DESIGN STRÁNKY--------------------------------------------------------

  //--------------------------------------------------------KONEC MANUÁLNÍ ZMĚNA DESIGN STRÁNKY--------------------------------------------------------
  //----------------------------------------------------------OBRÁZEK------------------------------------------------------------------------
  
  // Přidat endpoint pro načítání dat o kruhu
  // Přidat endpoint pro načítání dat o kruhu
  app.get('/picture', (req, res) => {
    // Předpokládá se, že používáte MySQL
    const query = 'SELECT radius, length, radius2 FROM kruh WHERE idkruh = 1'; // Upravte podle své tabulky
    connection.query(query, (error, results) => {
      if (error) {
        console.error('Chyba při dotazu na data o kruhu:', error);
        return res.status(500).json({ error: 'Chyba při dotazu na data o kruhu' });
      }
      
      if (results.length === 0) {
        console.error('V tabulce nebyla nalezena žádná data.');
        return res.status(404).json({ error: 'V tabulce nebyla nalezena žádná data' });
      }
      
      // Přímo vkládání dat do šablony
      res.render('picture.ejs', {
        radius: results[0].radius,
        length: results[0].length,
        radius2: results[0].radius2
      });
    });
  });
  app.get('/test', (req, res) => {
      res.render('test.ejs');
    });
  
//----------------------------------------------------------KONEC OBRÁZKU-----------------------------------------------------------------
//-----------------VYTVOŘ ROUTU
// app.get('/createfile', (req, res) => {
//   const obsahTextovehoSouboru = 'Obsah textového souboru';
//   fs.writeFile('test.txt', obsahTextovehoSouboru, (err) => {
//     if (err) {
//       res.status(500).send('Chyba při vytváření souboru');
//     } else {
//       res.download('test.txt');
//     }
    
//   });
// });
//-------------------KONEC 


// function logError(error) {
//   const errorMessage = `${new Date().toISOString()} - ${error.stack}\n`;

//   fs.appendFile('error.log', errorMessage, (err) => {
//       if (err) {
//           console.error('Chyba při zápisu do error.log:', err);
//       }
//   });
// }

app.use((err, req, res, next) => {
  // Zápis chyby do souboru error.log
  logError(err);

  // Odeslání odpovědi klientovi s informací o chybě
  res.status(500).send('Nastala chyba při zpracování požadavku.');
});

// Middleware pro parsování url-encoded dat

// Vaše stávající routy a middleware zde...

// Funkce pro zápis chyby do souboru error.log
function logError(error) {
  const errorMessage = `${new Date().toISOString()} - ${error.stack}\n`;

  fs.appendFile('error.log', errorMessage, (err) => {
      if (err) {
          console.error('Chyba při zápisu do error.log:', err);
      }
  });
}
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
})