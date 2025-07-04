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

	programs: ProgramModel[]
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
		}
	}, {
		timestamps: true,
		sequelize,
		modelName: 'exercise'
	})

	ExerciseModel.associate = (models: any) => {
		ExerciseModel.belongsToMany(models.Program, {
			through: models.ProgramWithExercise,
			foreignKey: 'exerciseID',
			otherKey: 'programID',
			as: 'programs'
		})

		ExerciseModel.hasMany(models.CompletedExercise, {
			foreignKey: {
				name: 'exerciseID',
				allowNull: false
			},
			as: 'completedExercises',
			onDelete: 'RESTRICT',
			onUpdate: 'CASCADE'
		})
	}

	return ExerciseModel
}
