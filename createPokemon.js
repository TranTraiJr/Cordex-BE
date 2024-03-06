const fs = require("fs");
const csv = require("csvtojson");

const createPokemon = async () => {
  let newData = await csv().fromFile("pokemon.csv");
  let dataPokemon = JSON.parse(fs.readFileSync("db.json"));
  const fileList = fs.readdirSync("./public/images");
  const newFileList = fileList.map((pokemon) =>
    pokemon.toString().slice(0, -4)
  );
  console.log(newData);
  newData = newData.map((pokemon, index) => {
    return {
      id: index + 1,
      name: pokemon.Name,
      types: [
        pokemon.Type1.toLowerCase(),
        ...(pokemon.Type2 ? [pokemon.Type2.toLowerCase()] : []),
      ],
      url: `https://cordex-be.onrender.com/images/${pokemon.Name}.png`,
    };
  });

  dataPokemon.totalPokemons = newData.length;
  dataPokemon.data = newData;
  fs.writeFileSync("db.json", JSON.stringify(dataPokemon));
};

createPokemon();

// function getFiles(dir) {
// Get an array of all files and directories in the passed directory using fs.readdirSync
//   const fileList = fs.readdirSync("./images");
//   const newFileList = fileList.map((pokemon) =>
//     pokemon.toString().slice(0, -4)
//   );
//   console.log(newFileList);
// }

// getFiles("./images");
