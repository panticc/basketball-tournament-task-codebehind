const fs = require("fs").promises;

async function loadGroup(groupName) {
  try {
    const data = await fs.readFile("groups.json", "utf8");
    const jsonData = JSON.parse(data);
    return jsonData[groupName];
  } catch (error) {
    console.error("Error loading JSON:", error);
  }
}

// Funkcija za izračunavanje verovatnoće pobede tima 1 nad timom 2
function calculateWinProbability(rankTeam1, rankTeam2) {
  const probabilityTeam1Wins = rankTeam2 / (rankTeam1 + rankTeam2);
  return probabilityTeam1Wins;
}

// Funkcija za generisanje bodova na osnovu rangova
function generateScore(winnerRank, loserRank) {
  const winnerScore = Math.floor(Math.random() * 21) + 80;
  const pointDifference =
    Math.floor((loserRank - winnerRank) / 2) + Math.floor(Math.random() * 10);
  const loserScore = winnerScore - pointDifference;
  return { winnerScore, loserScore };
}

// Funkcija za simulaciju utakmice
function simulateMatch(team1, team2) {
  const probabilityTeam1Wins = calculateWinProbability(
    team1.FIBARanking,
    team2.FIBARanking
  );
  const randomValue = Math.random();

  if (randomValue < probabilityTeam1Wins) {
    const scores = generateScore(team1.FIBARanking, team2.FIBARanking);
    return {
      winner: team1,
      loser: team2,
      winnerScore: scores.winnerScore,
      loserScore: scores.loserScore,
      result: `${team1.Team}: ${scores.winnerScore} - ${team2.Team}: ${scores.loserScore}`,
    };
  } else {
    const scores = generateScore(team2.FIBARanking, team1.FIBARanking);
    return {
      winner: team2,
      loser: team1,
      winnerScore: scores.winnerScore,
      loserScore: scores.loserScore,
      result: `${team2.Team}: ${scores.winnerScore} - ${team1.Team}: ${scores.loserScore}`,
    };
  }
}

// Funkcija za simulaciju grupne faze i prikaz po kolima
function simulateGroupStage(teams) {
  let results = [];
  let standings = {};

  teams.forEach((team) => {
    standings[team.Team] = {
      points: 0,
      scoredPoints: 0,
      concededPoints: 0,
      matches: [],
    };
  });

  const matchups = [
    [
      [0, 1],
      [2, 3],
    ],
    [
      [0, 2],
      [1, 3],
    ],
    [
      [0, 3],
      [1, 2],
    ],
  ];

  matchups.forEach((round, roundIndex) => {
    console.log(`--- Kolo ${roundIndex + 1} ---`);
    let roundResults = [];

    round.forEach((match) => {
      const team1 = teams[match[0]];
      const team2 = teams[match[1]];

      const result = simulateMatch(team1, team2);
      console.log(result.result);

      standings[result.winner.Team].points += 2;
      standings[result.loser.Team].points += 1;

      standings[result.winner.Team].scoredPoints += result.winnerScore;
      standings[result.winner.Team].concededPoints += result.loserScore;
      standings[result.loser.Team].scoredPoints += result.loserScore;
      standings[result.loser.Team].concededPoints += result.winnerScore;

      standings[result.winner.Team].matches.push({
        opponent: result.loser.Team,
        won: true,
        score: `${result.winnerScore}:${result.loserScore}`,
      });
      standings[result.loser.Team].matches.push({
        opponent: result.winner.Team,
        won: false,
        score: `${result.loserScore}:${result.winnerScore}`,
      });

      roundResults.push(result);
    });

    results.push(roundResults);
  });

  return standings;
}

// Funkcija za rangiranje timova u grupi
function rankTeams(standings) {
  return Object.entries(standings)
    .sort(([, a], [, b]) => {
      const pointDiffA = a.scoredPoints - a.concededPoints;
      const pointDiffB = b.scoredPoints - b.concededPoints;

      if (a.points !== b.points) return b.points - a.points;
      if (pointDiffA !== pointDiffB) return pointDiffB - pointDiffA;
      return b.scoredPoints - a.scoredPoints;
    })
    .map(([team]) => team);
}

// Funkcija za kreiranje šešira
function createQuarterFinals(topTeams) {
  const hats = {
    D: [topTeams[0], topTeams[1]], // rang 1 i 2
    E: [topTeams[2], topTeams[3]], // rang 3 i 4
    F: [topTeams[4], topTeams[5]], // rang 5 i 6
    G: [topTeams[6], topTeams[7]], // rang 7 i 8
  };

  console.log("\nŠeširi:");
  Object.entries(hats).forEach(([hat, teams]) => {
    console.log(`    Šešir ${hat}`);
    teams.forEach((team) => console.log(`        ${team.team}`));
  });
}

// Funkcija za celokupnu simulaciju grupne faze i rangiranja
async function simulateTournament() {
  const groups = ["A", "B", "C"];
  let finalStandings = [];

  for (let groupName of groups) {
    console.log(`\n=== Simulacija za grupu ${groupName} ===`);
    const teams = await loadGroup(groupName);
    const standings = simulateGroupStage(teams);

    const rankedTeams = rankTeams(standings);

    console.log(`\n--- Rangiranje za grupu ${groupName} ---`);
    rankedTeams.forEach((team, index) => {
      const teamData = standings[team];
      console.log(
        `${index + 1}. ${team} - Bodovi: ${teamData.points}, Koševi: ${
          teamData.scoredPoints
        }:${teamData.concededPoints}`
      );
    });

    finalStandings.push(
      ...rankedTeams.map((team, i) => ({ team, rank: i + 1, group: groupName }))
    );
  }

  const firstPlaceTeams = finalStandings.filter((t) => t.rank === 1);
  const secondPlaceTeams = finalStandings.filter((t) => t.rank === 2);
  const thirdPlaceTeams = finalStandings.filter((t) => t.rank === 3);

  const topTeams = [...firstPlaceTeams, ...secondPlaceTeams, ...thirdPlaceTeams]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 8);

  console.log(`\n--- Timovi koji su prošli dalje ---`);
  topTeams.forEach((team, index) => {
    console.log(`${index + 1}. ${team.team} (Grupa ${team.group})`);
  });

  const semiFinalPairs = createQuarterFinals(topTeams);
}

// Pokreni turnir
simulateTournament();
