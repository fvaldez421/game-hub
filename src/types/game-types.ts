export type Player = {
  id: string;
  username: string;
};

export type RoomPlayer = {
  socketId: string;
  joinedTS: number;
} & Player;

export type GamePlayer = {
  teamId: string;
  teamName: string;
} & RoomPlayer;

export type GameSocketPayload = {
  sentTs: number;
  data: any;
  [key: string]: any;
};
