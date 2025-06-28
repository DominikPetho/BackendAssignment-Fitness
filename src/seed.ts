import { models, sequelize } from './db'
import { USER_ROLE, EXERCISE_DIFFICULTY } from './utils/enums'

const { User, Program, Exercise, ProgramWithExercise } = models

const seed = async () => {
	try {
		// Sync database
		await sequelize.sync({ force: true })

		// Create users
		const admin = await User.create({
			name: 'Admin',
			surname: 'User',
			nickName: 'admin',
			email: 'admin@example.com',
			age: 30,
			role: USER_ROLE.ADMIN,
			password: 'admin123'
		})

		const user1 = await User.create({
			name: 'John',
			surname: 'Doe',
			nickName: 'johndoe',
			email: 'john@example.com',
			age: 25,
			role: USER_ROLE.USER,
			password: 'user123'
		})

		const user2 = await User.create({
			name: 'Jane',
			surname: 'Smith',
			nickName: 'janesmith',
			email: 'jane@example.com',
			age: 28,
			role: USER_ROLE.USER,
			password: 'user123'
		})

		// Create programs
		const program1 = await Program.create({
			name: 'Beginner Workout',
			description: 'A simple workout for beginners'
		})

		const program2 = await Program.create({
			name: 'Advanced Workout',
			description: 'A challenging workout for experienced users'
		})

		// Create exercises
		const pushUps = await Exercise.create({
			name: 'Push-ups',
			difficulty: EXERCISE_DIFFICULTY.EASY
		})

		const squats = await Exercise.create({
			name: 'Squats',
			difficulty: EXERCISE_DIFFICULTY.EASY
		})

		const pullUps = await Exercise.create({
			name: 'Pull-ups',
			difficulty: EXERCISE_DIFFICULTY.HARD
		})

		const burpees = await Exercise.create({
			name: 'Burpees',
			difficulty: EXERCISE_DIFFICULTY.MEDIUM
		})

		// Create exercises without programs to demonstrate the new functionality
		const plank = await Exercise.create({
			name: 'Plank',
			difficulty: EXERCISE_DIFFICULTY.MEDIUM
		})

		const jumpingJacks = await Exercise.create({
			name: 'Jumping Jacks',
			difficulty: EXERCISE_DIFFICULTY.EASY
		})

		const mountainClimbers = await Exercise.create({
			name: 'Mountain Climbers',
			difficulty: EXERCISE_DIFFICULTY.MEDIUM
		})

		// Create program-exercise associations
		await ProgramWithExercise.create({
			programID: program1.id,
			exerciseID: pushUps.id
		})

		await ProgramWithExercise.create({
			programID: program1.id,
			exerciseID: squats.id
		})

		await ProgramWithExercise.create({
			programID: program2.id,
			exerciseID: pullUps.id
		})

		await ProgramWithExercise.create({
			programID: program2.id,
			exerciseID: burpees.id
		})

		// Add some exercises to multiple programs to demonstrate many-to-many
		await ProgramWithExercise.create({
			programID: program1.id,
			exerciseID: plank.id
		})

		await ProgramWithExercise.create({
			programID: program2.id,
			exerciseID: plank.id
		})

		console.log('Database seeded successfully!')
	} catch (error) {
		console.error('Error seeding database:', error)
	}
}

// Only close connection if this file is run directly
if (require.main === module) {
	seed().finally(() => sequelize.close())
} else {
	seed()
}
