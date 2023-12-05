import sequelize from "../../config/database";
import createUserModel from "../user";
import { initChat, Chat } from "./chat";
import { initRoom, Room } from "./room";
import { initRoomParticipant, RoomParticipant } from "./roomParticipant";

const User = createUserModel(sequelize);

initChat(sequelize);
initRoom(sequelize);
initRoomParticipant(sequelize);

export const defineRelations = () => {
  Room.hasMany(Chat, {
    sourceKey: "id",
    foreignKey: "roomId",
    as: "chats",
  });

  Chat.belongsTo(Room, {
    targetKey: "id",
    foreignKey: "roomId",
    as: "room",
  });

  Room.belongsToMany(User, {
    through: RoomParticipant,
    foreignKey: "roomId",
    as: "users",
  });

  User.belongsToMany(Room, {
    through: RoomParticipant,
    foreignKey: "userId",
    as: "rooms",
  });

  Chat.belongsTo(User, {
    targetKey: "id",
    foreignKey: "userId",
    as: "user",
  });

  Room.hasMany(RoomParticipant, {
    sourceKey: "id",
    foreignKey: "roomId",
    as: "participants",
  });

  RoomParticipant.belongsTo(Room, {
    targetKey: "id",
    foreignKey: "roomId",
    as: "room",
  });
};
