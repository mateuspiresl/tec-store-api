import Sequelize from 'sequelize';
import sequelize from '../database';

export default sequelize.define('category', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  name: {
    type: Sequelize.STRING,
    unique: 'compositeIndex',
    allowNull: false,
  },
});
