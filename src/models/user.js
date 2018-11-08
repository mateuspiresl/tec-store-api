import crypto from 'crypto';
import Sequelize from 'sequelize';
import { secret } from '../config/general';
import sequelize from '../database';

function encryptPassword(password) {
  return crypto.createHmac('sha1', secret).update(password).digest('hex');
}

export const roles = {
  admin: 'admin',
  client: 'client',
};

export function validatePassword(user, password) {
  return user.password === encryptPassword(password);
}

export default sequelize.define('user', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: { type: Sequelize.STRING, allowNull: false },
  username: {
    type: Sequelize.STRING,
    unique: 'compositeIndex',
    allowNull: false,
  },
  password: {
    type: Sequelize.STRING,
    set(val) {
      this.setDataValue('password', encryptPassword(val));
    },
  },
  role: {
    type: Sequelize.ENUM(Object.keys(roles)),
    defaultValue: roles.client,
    allowNull: false,
  },
});
