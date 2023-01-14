export enum CommonGameEvents {
  CreateRoom = 'create-room',
  RoomFailedToJoin = 'room:failed-to-join',
  RoomPlayerJoined = 'room:player-joined',
  RoomPlayerLeft = 'room:player-left',
  RoomHostAssigned = 'room:host-assigned',
  RoomTeamsUpdated = 'room:teams-updated',
  RoomMetadataUpdate = 'room:metadata-update',
  RoomTurnTeamUpdate = 'room:turn-team-update',
  RoomGameStateUpdate = 'room:game-state-update',
}

export enum TicTacToeEvents {
  OnBlockClicked = 'tic-tac-toe:block-clicked',
  OnMapStateUpdate = 'tic-tac-toe:map-state-update',
}
