const express = require("express");
const app = express();

const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initiateDbAndServer = async () => {
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  app.listen(5000, () => {
    console.log("This Server is Running at http://localhost:5000/");
  });
};

initiateDbAndServer();

const convertStateObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

const convertDistrictObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

const convertState = (dbObject) => {
  return {
    stateName: dbObject.state_name,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `
    SELECT * 
    FROM state;`;
  const stateDetails = await db.all(getStatesQuery);
  response.send(stateDetails.map((eachState) => convertStateObject(eachState)));
});

//API2

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStatesQuery = `
    SELECT * 
    FROM state
    WHERE 
    state_id = ${stateId};`;
  const stateDetails = await db.get(getStatesQuery);
  response.send(convertStateObject(stateDetails));
});

//API3

app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const addDistrictQuery = `
  INSERT INTO 
  district (district_name, state_id, cases, cured, active, deaths)
  VALUES ('${districtName}', ${stateId}, ${cases}, ${cured}, ${active}, ${deaths});`;

  await db.run(addDistrictQuery);
  response.send("District Successfully Added");
});

//API4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getStatesQuery = `
    SELECT * 
    FROM district
    WHERE 
    district_id = ${districtId};`;
  const districtDetails = await db.get(getStatesQuery);
  response.send(convertDistrictObject(districtDetails));
});

//API5

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const removeDistrictQuery = `
    DELETE 
    FROM district
    WHERE 
    district_id = ${districtId};`;

  await db.run(removeDistrictQuery);
  response.send("District Removed");
});

//API6

app.put("/districts/:districtId", async (request, response) => {
  const districtDetails = request.body;
  const { districtId } = request.params;

  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;

  const updateDistrictQuery = `
    UPDATE district
    SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE
    district_id = ${districtId};`;

  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;

  const getStateStatsQuery = `
    SELECT SUM(cases) AS totalCases,
    SUM(cured) AS totalCured,
    SUM(active) AS totalActive,
    SUM(deaths) AS totalDeaths
    FROM district
    WHERE 
    state_id = ${stateId};`;

  const stateStats = await db.get(getStateStatsQuery);
  response.send(stateStats);
});

//API8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;

  const getStateNameQuery = `
    SELECT state_name
    FROM district INNER JOIN state
    WHERE 
    district_id = ${districtId};`;

  const stateName = await db.get(getStateNameQuery);
  response.send(convertState(stateName));
});

module.exports = app;
