async function loadGroupA() {
  const response = await fetch("groups.json");
  const data = await response.json();
  return data["A"];
}

function processTeamData(teamName, isoCode, fibaRank) {
  // console.log(`Team: ${teamName}, ISO: ${isoCode}, FIBA Rank: ${fibaRank}`);
}

// Pozivanje funkcije za svaki tim iz grupe "A"
loadGroupA().then((teams) => {
  teams.forEach((team) => {
    processTeamData(team.Team, team.ISOCode, team.FIBARanking);
  });
});

// Funkcija za izračunavanje verovatnoće pobede tima 1 nad timom 2
function calculateWinProbability(rankTeam1, rankTeam2) {
  const probabilityTeam1Wins = rankTeam2 / (rankTeam1 + rankTeam2);
  return probabilityTeam1Wins;
}

// Funkcija za generisanje bodova na osnovu rangova
function generateScore(winnerRank, loserRank) {
  // Osnovni poeni za pobednički tim
  const winnerScore = Math.floor(Math.random() * 21) + 80; // Generiši bodove između 80 i 100 za pobednički tim

  // Razlika u poenima zavisi od razlike u rangovima
  const pointDifference =
    Math.floor((loserRank - winnerRank) / 2) + Math.floor(Math.random() * 10); // Nasumična komponenta

  // Bodovi za gubitnički tim
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
    // Tim 1 pobeđuje
    const scores = generateScore(team1.FIBARanking, team2.FIBARanking);
    return {
      winner: team1,
      loser: team2,
      winnerScore: scores.winnerScore,
      loserScore: scores.loserScore,
      result: `${team1.Team}: ${scores.winnerScore} - ${team2.Team}: ${scores.loserScore}`,
    };
  } else {
    // Tim 2 pobeđuje
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

// Funkcija za simulaciju utakmica između timova iz prosleđene grupe
function simulateGroupMatches(teams) {
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      const team1 = teams[i];
      const team2 = teams[j];

      // Simuliraj utakmicu
      const result = simulateMatch(team1, team2);
      console.log(result.result); // Ispiši rezultat utakmice sa poenima
    }
  }
}

async function loadGroup(groupName) {
  const response = await fetch("groups.json");
  const data = await response.json();
  return data[groupName];
}

// Primer korišćenja sa grupom A
loadGroup("A").then((teams) => {
  simulateGroupMatches(teams);
});

// Funkcija za simulaciju grupne faze i prikaz po kolima
function simulateGroupStage(teams) {
  let results = []; // Čuva rezultate svih utakmica po kolima
  let standings = {}; // Čuva broj bodova po timovima

  // Inicijalizacija bodova za svaki tim
  teams.forEach((team) => {
    standings[team.Team] = {
      points: 0,
      scoredPoints: 0,
      concededPoints: 0,
      matches: [],
    };
  });

  // Simulacija po kolima (ukupno 3 kola po grupi)
  const matchups = [
    // Kolo 1
    [
      [0, 1],
      [2, 3],
    ],
    // Kolo 2
    [
      [0, 2],
      [1, 3],
    ],
    // Kolo 3
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

      const result = simulateMatch(team1, team2); // Simuliraj utakmicu
      console.log(result.result);

      // Update bodova
      standings[result.winner.Team].points += 2;
      standings[result.loser.Team].points += 1;

      // Update koševa
      standings[result.winner.Team].scoredPoints += result.winnerScore;
      standings[result.winner.Team].concededPoints += result.loserScore;
      standings[result.loser.Team].scoredPoints += result.loserScore;
      standings[result.loser.Team].concededPoints += result.winnerScore;

      // Čuvanje meča
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
      // Sortiramo prvo po bodovima, zatim po koš razlici, zatim po postignutim koševima
      const pointDiffA = a.scoredPoints - a.concededPoints;
      const pointDiffB = b.scoredPoints - b.concededPoints;

      if (a.points !== b.points) return b.points - a.points;
      if (pointDiffA !== pointDiffB) return pointDiffB - pointDiffA;
      return b.scoredPoints - a.scoredPoints;
    })
    .map(([team]) => team);
}

// Funkcija za celokupnu simulaciju grupne faze i rangiranja
async function simulateTournament() {
  const groups = ["A", "B", "C"];
  let finalStandings = [];

  // Simulacija po grupama
  for (let groupName of groups) {
    console.log(`\n=== Simulacija za grupu ${groupName} ===`);
    const teams = await loadGroup(groupName);
    const standings = simulateGroupStage(teams);

    // Rangiranje timova u grupi
    const rankedTeams = rankTeams(standings);

    // Prikaz rangiranja
    console.log(`\n--- Rangiranje za grupu ${groupName} ---`);
    rankedTeams.forEach((team, index) => {
      const teamData = standings[team];
      console.log(
        `${index + 1}. ${team} - Bodovi: ${teamData.points}, Koševi: ${
          teamData.scoredPoints
        }:${teamData.concededPoints}`
      );
    });

    // Dodaj u finalnu tabelu rangiranja
    finalStandings.push(
      ...rankedTeams.map((team, i) => ({ team, rank: i + 1, group: groupName }))
    );
  }

  // Rangiranje timova za prolaz dalje
  const firstPlaceTeams = finalStandings.filter((t) => t.rank === 1);
  const secondPlaceTeams = finalStandings.filter((t) => t.rank === 2);
  const thirdPlaceTeams = finalStandings.filter((t) => t.rank === 3);

  // Biramo top 8 timova
  const topTeams = [...firstPlaceTeams, ...secondPlaceTeams, ...thirdPlaceTeams]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, 8);

  // Prikaz top 8 timova
  console.log(`\n--- Timovi koji su prošli dalje ---`);
  topTeams.forEach((team, index) => {
    console.log(`${index + 1}. ${team.team} (Grupa ${team.group})`);
  });
}

// Pokreni turnir
simulateTournament();

// // Funkcija za simulaciju utakmice
// function simulateMatch(team1, team2) {
//   const probabilityTeam1Wins = calculateWinProbability(
//     team1.FIBARanking,
//     team2.FIBARanking
//   );
//   const randomValue = Math.random();

//   if (randomValue < probabilityTeam1Wins) {
//     return { winner: team1, loser: team2 };
//   } else {
//     return { winner: team2, loser: team1 };
//   }
// }

// // Funkcija za simulaciju utakmica između timova iz grupe
// loadGroupA().then((teams) => {
//   for (let i = 0; i < teams.length; i++) {
//     for (let j = i + 1; j < teams.length; j++) {
//       const team1 = teams[i];
//       const team2 = teams[j];

//       // Simuliraj utakmicu
//       const result = simulateMatch(team1, team2);
//       console.log(`${result.winner.Team} pobedio ${result.loser.Team}`);
//     }
//   }
// });
