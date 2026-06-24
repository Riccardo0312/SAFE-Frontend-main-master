import { Sensor } from "../models/sensors";

class TeamRepository {
  addTeam(teams: string[], teamName: string): string[] {
    const normalizedTeamName = teamName.trim();

    if (!normalizedTeamName) {
      return teams;
    }

    const alreadyExists = teams.some(
      (team) => team.toLowerCase() === normalizedTeamName.toLowerCase()
    );

    if (alreadyExists) {
      return teams;
    }

    return [...teams, normalizedTeamName];
  }

  removeTeam(teams: string[], teamName: string): string[] {
    return teams.filter((team) => team !== teamName);
  }

  assignSensorToTeam(
    sensors: Sensor[],
    sensorId: string,
    teamName: string
  ): Sensor[] {
    return sensors.map((sensor) =>
      sensor.id === sensorId ? { ...sensor, team: teamName } : sensor
    );
  }

  removeSensorFromTeam(sensors: Sensor[], sensorId: string): Sensor[] {
    return sensors.map((sensor) =>
      sensor.id === sensorId ? { ...sensor, team: "" } : sensor
    );
  }

  clearTeamFromSensors(sensors: Sensor[], teamName: string): Sensor[] {
    return sensors.map((sensor) =>
      sensor.team === teamName ? { ...sensor, team: "" } : sensor
    );
  }
}

export const teamRepository = new TeamRepository();