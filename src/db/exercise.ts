/* eslint import/no-cycle: 0 */

import {
	Sequelize,
	DataTypes,
	Model
} from 'sequelize'
import { DatabaseModel } from '../types/db'
import { ProgramModel } from './program'

import { EXERCISE_DIFFICULTY } from '../utils/enums'

export class ExerciseModel extends DatabaseModel {
	id: number
	difficulty: EXERCISE_DIFFICULTY
	name: String
	programID: number

	program: ProgramModel
}

export default (sequelize: Sequelize) => {
	ExerciseModel.init({
		id: {
			type: DataTypes.BIGINT,
			primaryKey: true,
			allowNull: false,
			autoIncrement: true
		},
		difficulty: {
			type: DataTypes.ENUM(...Object.values(EXERCISE_DIFFICULTY))
		},
		name: {
			type: DataTypes.STRING(200),
		},
		programID: {
			type: DataTypes.BIGINT,
			allowNull: false,
			references: {
				model: 'programs',
				key: 'id'
			}
		}
	}, {
		paranoid: true,
		timestamps: true,
		sequelize,
		modelName: 'exercise'
	})

	ExerciseModel.associate = (models: any) => {
		ExerciseModel.belongsTo(models.Program, {
			foreignKey: {
				name: 'programID',
				allowNull: false
			},
			as: 'program'
		})
	}

	return ExerciseModel
}
