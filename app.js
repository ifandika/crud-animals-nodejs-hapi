'use strict';

const Hapi = require('@hapi/hapi');
const Inert = require('@hapi/inert');
const Path = require('path');
const mysql = require('mysql2');

const database = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Mifandika',
  database: 'examples'
});

database.connect((err) => {
  if (err) {
    console.error('Database connection failed: ' + err.stack);
    return;
  }
  console.log('Connected to MySQL database');
});

const init = async () => {
  const server = Hapi.server({
    port: 5000,
    host: 'localhost',
  });

  await server.register(Inert);

  server.route(
    [
      {
        method: 'GET',
        path: '/',
        handler: function (request, h) {
          return h.file('public/index.html');
        }
      },
      {
        method: 'GET',
        path: '/animals',
        handler: function (request, h) {
          return new Promise((resolve, reject) => {
            database.query('SELECT animals.ID, animals.Image, animals.Name, animals.Mamals, animals.Habitats FROM examples.animals', (err, results) => {
              if (err) {
                reject(err);
              }
              console.log(results);
              resolve(results);
            });
          });
        }
      },
      {
        method: 'POST',
        path: '/animals',
        handler: function (request, h) {
          const { ID, Image, Name, Mamals, Habitats } = request.payload;
          const animal = {
            ID: ID,
            Image: Image,
            Name: Name,
            Mamals: Mamals,
            Habitats: Habitats
          };
          new Promise((resolve, reject) => {
            database.query(
              'INSERT INTO examples.animals (ID, Image, Name, Mamals, Habitats) VALUES (?, ?, ?, ?, ?)',
              [ID, Image, Name, Mamals, Habitats],
              (err, result) => {
                if (err) {
                  reject(err);
                }
                resolve(h.response({ message: 'User created', result: result}).code(201));
              }
            );
          });
          return h.response(JSON.stringify(animal)).code(200);
        }
      },
      {
        method: 'PUT',
        path: '/animals/{id}',
        handler: (request, h) => {
          const userId = request.params.id;
          const { ID, Image, Name, Mamals, Habitats } = request.payload;
          
          return new Promise((resolve, reject) => {
            database.query(
              'UPDATE examples.animals SET Image = ?, Name = ?, Mamals = ?, Habitats = ? WHERE ID = ?',
              [ID, Image, Name, Mamals, Habitats, userId],
              (err, result) => {
                if (err) {
                  reject(err);
                }
                if (result.affectedRows === 0) {
                  resolve(h.response({ message: 'Animal not found' }).code(404));
                }
                resolve(h.response({ message: 'Animal updated' }).code(200));
              }
            );
          });
        },
      },
      {
        method: 'DELETE',
        path: '/animals/{id}',
        handler: (request, h) => {
          const ID = request.params.id;
          
          return new Promise((resolve, reject) => {
            database.query('DELETE FROM examples.animals WHERE ID = ?', [ID], (err, result) => {
              if (err) {
                reject(err);
              }
              if (result.affectedRows === 0) {
                resolve(h.response({ message: 'Animal not found' }).code(404));
              }
              resolve(h.response({ message: 'Animal deleted' }).code(200));
            });
          });
        },
      }
    ]
  );

  await server.start();
  console.log(`Server running on %s`, server.info.uri);
};

process.on('unhandledRejection', (err) => {
  console.log(err);
  process.exit(1);
});

init();
// curl --header "Content-Type: application/json" --request POST --data '{"username":"xyz","password":"xyz"}' http://localhost:5000/