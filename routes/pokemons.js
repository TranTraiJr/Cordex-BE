const express = require("express");
const router = express.Router();
const fs = require("fs");

const pokemonTypes = [
  "bug",
  "dragon",
  "dragon",
  "fire",
  "ghost",
  "ground",
  "normal",
  "psychic",
  "steel",
  "dark",
  "electric",
  "fighting",
  "flyingText",
  "grass",
  "ice",
  "poison",
  "rock",
  "water",
];

router.get("/", (req, res, next) => {
  //input validation
  const allowedFilter = ["page", "limit", "search", "type"];
  try {
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    //allow title,limit and page query string only
    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });
    //processing logic
    //Number of items skip for selection
    let offset = limit * (page - 1);

    //Read data from db.json then parse to JSobject
    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    console.log(data?.id, data?.name);
    //Filter data by title
    let result = [];

    if (filterKeys.length && filterKeys.includes("search")) {
      filterKeys.forEach((condition) => {
        result = result.length
          ? result.filter((pokemon) => pokemon.name === filterQuery[condition])
          : data.filter((pokemon) => pokemon.name === filterQuery[condition]);
      });
    } else if (filterKeys.includes("type")) {
      filterKeys.forEach((condition) => {
        result = result.length
          ? result.filter((pokemon) =>
              pokemon.types.includes(filterQuery[condition])
            )
          : data.filter((pokemon) =>
              pokemon.types.includes(filterQuery[condition])
            );
      });
    } else {
      result = data;
    }

    //then select number of result by offset
    result = result.slice(offset, offset + limit);
    //send response
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
  //processing logic
  //send response
});

router.get("/:pokemonId", function (req, res, next) {
  try {
    const { pokemonId } = req.params;
    const pokemonIdInt = parseInt(pokemonId);
    console.log("poke", pokemonId);

    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;
    console.log(data.length);
    const lastIndex = data.length - 1;
    let result = [];

    const targetIndex = data.findIndex(
      (pokemon) => pokemon["id"] === pokemonIdInt
    );

    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    } else {
      if (targetIndex === 0) {
        result = {
          pokemon: data[targetIndex],
          nextPokemon: data[targetIndex + 1],
          previousPokemon: data[lastIndex],
        };
      } else if (targetIndex === lastIndex) {
        result = {
          pokemon: data[targetIndex - 1],
          nextPokemon: data[targetIndex],
          previousPokemon: data[0],
        };
      } else {
        result = {
          pokemon: data[targetIndex],
          nextPokemon: data[targetIndex + 1],
          previousPokemon: data[targetIndex - 1],
        };
      }
    }
    res.status(200).send(result);
  } catch (error) {
    next(error);
  }
});

router.post("/", function (req, res, next) {
  try {
    const { id, name, types, url } = req.body;
    console.log(id, name, types, url);
    if (!id || !name || !types || !url) {
      const exception = new Error(`Missing Pokemon's information`);
      exception.statusCode = 400;
      throw exception;
    }

    if (types.length > 3) {
      const exception = new Error(`Pokemon have more than 2 types`);
      exception.statusCode = 400;
      throw exception;
    }

    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;

    let validTypes = true;
    types.forEach((type) => {
      if (!pokemonTypes.includes(type)) {
        validTypes = false;
      }
    });

    if (!validTypes) {
      const exception = new Error(`Pokemon's types invalid`);
      exception.statusCode = 400;
      throw exception;
    }

    const validName = data.filter((pokemon) => pokemon["name"] === name);
    const validId = data.filter((pokemon) => pokemon["id"] === id);
    if (validId.length) {
      const exception = new Error(`Pokemon's id invalid`);
      exception.statusCode = 400;
      throw exception;
    }
    if (validName.length) {
      const exception = new Error(`Pokemon's name invalid`);
      exception.statusCode = 400;
      throw exception;
    }

    const newPokemon = { id: parseInt(id), name, types, url };

    data.push(newPokemon);
    db.data = data;
    db = JSON.stringify(db);
    fs.writeFileSync("db.json", db);
    res.status(200).send(newPokemon);
  } catch (error) {
    next(error);
  }
});

router.delete("/:pokemonId", (req, res, next) => {
  try {
    const { pokemonId } = req.params;
    const pokemonIdInt = parseInt(pokemonId);
    console.log("poke", pokemonId);

    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;

    const targetIndex = data.findIndex(
      (pokemon) => pokemon["id"] === pokemonIdInt
    );

    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }

    db.data = data.filter((pokemon) => pokemon["id"] !== pokemonIdInt);
    db = JSON.stringify(db);
    fs.writeFileSync("db.json", db);
    res.status(200).send({});
  } catch (error) {
    next(error);
  }
});

router.put("/:pokemonId", (req, res, next) => {
  try {
    const allowUpdate = ["name", "types", "url"];
    const { pokemonId } = req.params;
    const pokemonIdInt = parseInt(pokemonId);
    console.log("poke", pokemonId);

    const updates = req.body;
    const updateKeys = Object.keys(updates);
    const notAllow = updateKeys.filter((el) => !allowUpdate.includes(el));
    if (notAllow.length) {
      const exception = new Error(`Update field not allow`);
      exception.statusCode = 401;
      throw exception;
    }

    let db = fs.readFileSync("db.json", "utf-8");
    db = JSON.parse(db);
    const { data } = db;

    const targetIndex = data.findIndex(
      (pokemon) => pokemon["id"] === pokemonIdInt
    );

    if (targetIndex < 0) {
      const exception = new Error(`Pokemon not found`);
      exception.statusCode = 404;
      throw exception;
    }

    const updatedPokemon = { ...db.data[targetIndex], ...updates };
    db.data[targetIndex] = updatedPokemon;

    db = JSON.stringify(db);
    fs.writeFileSync("db.json", db);

    res.status(200).send(updatedPokemon);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
