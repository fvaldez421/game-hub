export type Player = {
  id: string;
  username: string;
};

export type RoomPlayer = {
  joinedTS: number;
} & Player;

export type GameSocketPayload = {
  sentTs: number;
  data: any;
};
