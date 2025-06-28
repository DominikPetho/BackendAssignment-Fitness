/* eslint import/no-cycle: 0 */

import path from 'path'
import fs from 'fs'
import { Sequelize } from 'sequelize'

import defineExercise from './exercise'
import defineProgram from './program'
import defineUser from './user'
import defineCompletedExercise from './completedExercise'
import defineProgramWithExercise from './programExercise'

const sequelize: Sequelize = new Sequelize(process.env.DATABASE_URL, {
	logging: false
})

sequelize.authenticate().catch((e: any) => console.error(`Unable to connect to the database${e}.`))

const modelsBuilder = (instance: Sequelize) => ({
	// Import models to sequelize
	Exercise: defineExercise(instance),
	Program: defineProgram(instance),
	User: defineUser(instance),
	CompletedExercise: defineCompletedExercise(instance),
	ProgramWithExercise: defineProgramWithExercise(instance),
})

const models = modelsBuilder(sequelize)

// check if every model is imported
const modelsFiles = fs.readdirSync(__dirname)
// -1 because index.ts can not be counted
if (Object.keys(models).length !== (modelsFiles.length - 1)) {
	throw new Error('You probably forgot import database model!')
}

Object.values(models).forEach((value: any) => {
	if (value.associate) {
		value.associate(models)
	}
})

export { models, modelsBuilder, sequelize }
