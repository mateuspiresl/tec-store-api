import Sequelize from 'sequelize';
import sequelize from '../database';

export default sequelize.define('product', {
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
  price: {
    type: Sequelize.DECIMAL(10, 2),
    allowNull: false,
  },
  categoryId: {
    type: Sequelize.INTEGER,
    allowNull: false,
  },
});
